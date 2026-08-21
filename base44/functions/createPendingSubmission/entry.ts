import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import {
  calculateSubmittedRoundScore,
  MAX_ROUNDS,
  normalizeIcpMultiplier,
} from './scoreSubmission.js';
import {
  getExpiredSubmissionIds,
  getRateLimitDecision,
  getRequestFingerprint,
  SUBMISSION_TTL_MS,
} from './submissionSecurity.js';

const clampNumber = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
};

const cleanText = (value, maxLength) => (
  typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { competition_id, round_results, icp_boosted } = body;
    const boosted = icp_boosted === true;

    // Opportunistically remove abandoned anonymous tokens. Completed records,
    // leads and leaderboard entries are never touched by this cleanup.
    const cleanupPromise = Promise.all([
      base44.asServiceRole.entities.PendingSubmission.filter({ status: 'pending' }, 'created_date', 50),
      base44.asServiceRole.entities.PendingSubmission.filter({ status: 'expired' }, 'created_date', 50),
    ]).then(async ([pending, expired]) => {
      const expiredIds = getExpiredSubmissionIds([...pending, ...expired]);
      await Promise.allSettled(
        expiredIds.map(id => base44.asServiceRole.entities.PendingSubmission.delete(id)),
      );
    }).catch(() => {});

    const requestFingerprint = await getRequestFingerprint(req);
    if (requestFingerprint) {
      const recent = await base44.asServiceRole.entities.PendingSubmission.filter(
        { request_fingerprint: requestFingerprint },
        '-created_date',
        50,
      );
      const rateLimit = getRateLimitDecision(recent);
      if (rateLimit.limited) {
        await cleanupPromise;
        return Response.json(
          { error: 'Too many score submissions. Please wait and try again.' },
          { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
        );
      }
    }

    const competitions = await base44.asServiceRole.entities.Competition.filter({ active: true });
    const activeCompetition = competitions[0] || null;
    const roundCount = Math.min(
      MAX_ROUNDS,
      Math.max(1, Math.round(Number(activeCompetition?.round_count) || 3)),
    );
    const icpMultiplier = normalizeIcpMultiplier(activeCompetition?.icp_multiplier);

    const sanitizedRounds = Array.isArray(round_results)
      ? round_results.slice(0, roundCount).map((round) => ({
        venue_name: cleanText(round?.venue_name, 120) || 'Unknown Venue',
        city: cleanText(round?.city, 80),
        score: calculateSubmittedRoundScore(round?.score, boosted, icpMultiplier),
        distance_km: clampNumber(round?.distance_km, 0, 20_000),
      }))
      : [];

    if (sanitizedRounds.length === 0) {
      return Response.json({ error: 'At least one round result is required' }, { status: 400 });
    }

    const requestedCompetitionId = cleanText(competition_id, 100);
    const resolvedCompetitionId = activeCompetition?.id === requestedCompetitionId
      ? requestedCompetitionId
      : activeCompetition?.id || null;

    const totalScore = sanitizedRounds.reduce((sum, round) => sum + round.score, 0);
    const avgDistance = sanitizedRounds.reduce((sum, round) => sum + round.distance_km, 0)
      / sanitizedRounds.length;

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SUBMISSION_TTL_MS).toISOString();

    const rec = await base44.asServiceRole.entities.PendingSubmission.create({
      token,
      competition_id: resolvedCompetitionId,
      total_score: totalScore,
      round_results: sanitizedRounds,
      avg_distance_km: Math.round(avgDistance),
      status: 'pending',
      icp_boosted: boosted,
      email_sent: false,
      expires_at: expiresAt,
      ...(requestFingerprint ? { request_fingerprint: requestFingerprint } : {}),
    });

    await cleanupPromise;

    return Response.json({ token, id: rec.id });
  } catch (error) {
    console.error('createPendingSubmission failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not create the score submission' }, { status: 500 });
  }
});
