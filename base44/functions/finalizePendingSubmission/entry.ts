import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import { waitUntil } from 'base44:runtime';

const SUBMISSION_TTL_MS = 24 * 60 * 60 * 1_000;
const MAX_ROUNDS = 5;
const LEADERBOARD_PAGE_SIZE = 500;

const PERSONAL_EMAIL_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'me.com', 'mac.com', 'live.com', 'msn.com', 'aol.com', 'protonmail.com',
  'yandex.com', 'zoho.com', 'gmx.com', 'mail.com',
]);

const cleanText = (value, maxLength) => (
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
);

const normalizeEmail = (value) => cleanText(value, 254).toLowerCase();

const isBusinessEmail = (email) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const domain = email.split('@')[1];
  return !PERSONAL_EMAIL_PROVIDERS.has(domain);
};

const toPublicName = (value) => {
  const parts = typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean) : [];
  if (parts.length === 0) return 'Anonymous';
  if (parts.length === 1) return parts[0].slice(0, 80);
  return `${parts[0].slice(0, 60)} ${parts.at(-1)[0].toUpperCase()}.`;
};

const getRankedEntries = async (base44, competitionId) => {
  const entries = [];
  let skip = 0;
  while (true) {
    const page = await base44.asServiceRole.entities.LeaderboardEntry.filter(
      { competition_id: competitionId },
      '-total_score',
      LEADERBOARD_PAGE_SIZE,
      skip,
    );
    entries.push(...page);
    if (page.length < LEADERBOARD_PAGE_SIZE) return entries;
    skip += page.length;
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const token = cleanText(body?.token, 100);
    const firstName = cleanText(body?.first_name, 80);
    const lastName = cleanText(body?.last_name, 80);
    const email = normalizeEmail(body?.email);
    const company = cleanText(body?.company, 120);

    if (!token || !firstName || !lastName || !email) {
      return Response.json({ error: 'Name, business email and score token are required' }, { status: 400 });
    }
    if (!isBusinessEmail(email)) {
      return Response.json({ error: 'Please use a valid business email address' }, { status: 400 });
    }

    const pending = await base44.asServiceRole.entities.PendingSubmission.filter({ token });
    const submission = pending[0];
    if (!submission) {
      return Response.json({ error: 'Score submission not found' }, { status: 404 });
    }
    if (submission.status === 'completed') {
      return Response.json({ error: 'Score already submitted' }, { status: 409 });
    }
    const createdAt = Date.parse(submission.created_date || '');
    const expiresAt = Date.parse(submission.expires_at || '');
    const hasExpired = Number.isFinite(expiresAt)
      ? Date.now() >= expiresAt
      : Number.isFinite(createdAt) && Date.now() - createdAt > SUBMISSION_TTL_MS;
    if (submission.status === 'expired' || hasExpired) {
      await base44.asServiceRole.entities.PendingSubmission.update(submission.id, { status: 'expired' });
      return Response.json({ error: 'This score submission has expired' }, { status: 410 });
    }

    // Persist each linked record ID as it is created. A retry resumes this
    // submission instead of creating duplicate leads or leaderboard entries.
    let lead = null;
    if (submission.lead_id) {
      lead = await base44.asServiceRole.entities.Lead.get(submission.lead_id).catch(() => null);
    }
    if (!lead) {
      lead = await base44.asServiceRole.entities.Lead.create({
        competition_id: submission.competition_id || null,
        first_name: firstName,
        last_name: lastName,
        email,
        company,
        score: Number(submission.total_score) || 0,
        consent: true,
        mailjet_synced: false,
        icp_boosted: submission.icp_boosted === true,
      });
      await base44.asServiceRole.entities.PendingSubmission.update(submission.id, { lead_id: lead.id });
    }

    let entry = null;
    if (submission.leaderboard_entry_id) {
      entry = await base44.asServiceRole.entities.LeaderboardEntry
        .get(submission.leaderboard_entry_id)
        .catch(() => null);
    }
    if (!entry) {
      entry = await base44.asServiceRole.entities.LeaderboardEntry.create({
        player_name: `${firstName} ${lastName}`,
        email,
        total_score: Number(submission.total_score) || 0,
        rounds_played: Math.min((submission.round_results || []).length, MAX_ROUNDS),
        avg_distance_km: Number(submission.avg_distance_km) || 0,
        competition_id: submission.competition_id || null,
        icp_boosted: submission.icp_boosted === true,
      });
      await base44.asServiceRole.entities.PendingSubmission.update(submission.id, {
        leaderboard_entry_id: entry.id,
      });
    }

    const competition = submission.competition_id
      ? await base44.asServiceRole.entities.Competition.get(submission.competition_id).catch(() => null)
      : null;
    const sortedEntries = submission.competition_id
      ? await getRankedEntries(base44, submission.competition_id)
      : [];
    const position = sortedEntries.findIndex((candidate) => candidate.id === entry.id) + 1;

    await base44.asServiceRole.entities.PendingSubmission.update(submission.id, {
      status: 'completed',
      lead_id: lead.id,
      leaderboard_entry_id: entry.id,
      // The one-way kiosk fingerprint is needed only for anonymous burst control.
      request_fingerprint: '',
    });

    // Provider calls run after the durable lead, score and completion state exist.
    waitUntil(base44.asServiceRole.functions.invoke('syncLeadToMailjet', { submission_token: token }));
    waitUntil(base44.asServiceRole.functions.invoke('sendPostGameEmail', { submission_token: token }));

    const leaderboard = sortedEntries.slice(0, 5).map((candidate) => ({
      id: candidate.id,
      player_name: toPublicName(candidate.player_name),
      total_score: Number(candidate.total_score) || 0,
    }));

    return Response.json({
      success: true,
      entry_id: entry.id,
      position: position || 0,
      total_entries: sortedEntries.length,
      competition_name: competition?.name || '',
      leaderboard,
    });
  } catch (error) {
    console.error('finalizePendingSubmission failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not save the score submission' }, { status: 500 });
  }
});
