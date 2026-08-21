import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import { waitUntil } from 'base44:runtime';
import {
  calculateVerifiedRound,
  MAX_ROUNDS,
  normalizeGuess,
} from './scoreSubmission.js';
import {
  getExpiredSubmissionIds,
  getRateLimitDecision,
  getRequestFingerprint,
  SUBMISSION_TTL_MS,
} from './submissionSecurity.js';

const GAME_SESSION_TTL_MS = 30 * 60 * 1_000;

const cleanText = (value, maxLength) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

const isExpired = (record, fallbackTtlMs) => {
  const expiresAt = Date.parse(record?.expires_at || '');
  if (Number.isFinite(expiresAt)) return Date.now() >= expiresAt;
  const createdAt = Date.parse(record?.created_date || '');
  return Number.isFinite(createdAt) && Date.now() - createdAt >= fallbackTtlMs;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const gameSessionToken = cleanText(body?.game_session_token, 100);

    if (!gameSessionToken) {
      return Response.json({ error: 'A verified game session is required' }, { status: 400 });
    }

    const sessions = await base44.asServiceRole.entities.GameSession.filter(
      { token: gameSessionToken },
      '-created_date',
      1,
    );
    const session = sessions[0];

    if (!session) {
      return Response.json({ error: 'Game session not found' }, { status: 404 });
    }

    if (isExpired(session, GAME_SESSION_TTL_MS)) {
      if (session.status !== 'expired') {
        await base44.asServiceRole.entities.GameSession.update(session.id, { status: 'expired' });
      }
      return Response.json({ error: 'This game session has expired' }, { status: 410 });
    }

    let existingSubmission = null;
    if (session.pending_submission_id) {
      try {
        existingSubmission = await base44.asServiceRole.entities.PendingSubmission.get(
          session.pending_submission_id,
        );
      } catch {
        existingSubmission = null;
      }
    }
    if (!existingSubmission) {
      const matches = await base44.asServiceRole.entities.PendingSubmission.filter(
        { game_session_id: session.id },
        '-created_date',
        1,
      );
      existingSubmission = matches[0] || null;
    }
    if (existingSubmission) {
      return Response.json({ token: existingSubmission.token, id: existingSubmission.id });
    }
    if (session.status === 'completed') {
      return Response.json({ error: 'This game session has already been submitted' }, { status: 409 });
    }

    const submittedRounds = Array.isArray(body?.round_results) ? body.round_results : [];
    const roundCount = Math.min(
      MAX_ROUNDS,
      Math.max(1, Math.round(Number(session.round_count) || 3)),
    );
    if (submittedRounds.length !== roundCount) {
      return Response.json(
        { error: `Exactly ${roundCount} round results are required` },
        { status: 400 },
      );
    }

    const allowedVenueIds = new Set(Array.isArray(session.venue_ids) ? session.venue_ids : []);
    const usedVenueIds = new Set();
    const venueIds = submittedRounds.map(round => cleanText(round?.venue_id, 100));
    let invalidVenue = false;
    for (const venueId of venueIds) {
      if (!venueId || !allowedVenueIds.has(venueId) || usedVenueIds.has(venueId)) {
        invalidVenue = true;
        break;
      }
      usedVenueIds.add(venueId);
    }
    if (invalidVenue) {
      return Response.json({ error: 'Round venues do not match this game session' }, { status: 400 });
    }

    const venues = await Promise.all(
      venueIds.map(venueId => base44.asServiceRole.entities.Venue.get(venueId)),
    );
    const boosted = session.icp_boosted === true;
    const verifiedRounds = submittedRounds.map((round, index) => {
      const guess = normalizeGuess(round?.guess_lat, round?.guess_lng);
      const venue = venues[index];
      const verified = calculateVerifiedRound({
        guess,
        venue,
        boosted,
        multiplier: session.icp_multiplier,
      });
      return {
        venue_name: cleanText(venue?.venue_name, 120) || 'Unknown Venue',
        city: cleanText(venue?.city, 80),
        score: verified.score,
        distance_km: verified.distance_km,
        has_guess: Boolean(guess),
      };
    });

    const requestFingerprint = await getRequestFingerprint(req);
    if (requestFingerprint) {
      const recent = await base44.asServiceRole.entities.PendingSubmission.filter(
        { request_fingerprint: requestFingerprint },
        '-created_date',
        50,
      );
      const rateLimit = getRateLimitDecision(recent);
      if (rateLimit.limited) {
        return Response.json(
          { error: 'Too many score submissions. Please wait and try again.' },
          { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
        );
      }
    }

    const cleanupPromise = Promise.all([
      base44.asServiceRole.entities.PendingSubmission.filter({ status: 'pending' }, 'created_date', 50),
      base44.asServiceRole.entities.PendingSubmission.filter({ status: 'expired' }, 'created_date', 50),
    ]).then(async ([pending, expired]) => {
      const expiredIds = getExpiredSubmissionIds([...pending, ...expired]);
      await Promise.allSettled(
        expiredIds.map(id => base44.asServiceRole.entities.PendingSubmission.delete(id)),
      );
    }).catch(() => {});
    waitUntil(cleanupPromise);

    const totalScore = verifiedRounds.reduce((sum, round) => sum + round.score, 0);
    const guessedDistances = verifiedRounds
      .filter(round => round.has_guess)
      .map(round => round.distance_km);
    const avgDistance = guessedDistances.length > 0
      ? guessedDistances.reduce((sum, distance) => sum + distance, 0) / guessedDistances.length
      : 0;
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SUBMISSION_TTL_MS).toISOString();

    const rec = await base44.asServiceRole.entities.PendingSubmission.create({
      token,
      game_session_id: session.id,
      competition_id: session.competition_id || null,
      total_score: totalScore,
      round_results: verifiedRounds.map(({ has_guess: _hasGuess, ...round }) => round),
      avg_distance_km: Math.round(avgDistance),
      status: 'pending',
      icp_boosted: boosted,
      email_sent: false,
      expires_at: expiresAt,
      ...(requestFingerprint ? { request_fingerprint: requestFingerprint } : {}),
    });

    await base44.asServiceRole.entities.GameSession.update(session.id, {
      status: 'completed',
      pending_submission_id: rec.id,
    });

    return Response.json({ token, id: rec.id });
  } catch (error) {
    console.error('createPendingSubmission failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not create the score submission' }, { status: 500 });
  }
});
