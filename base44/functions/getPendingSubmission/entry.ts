import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const SUBMISSION_TTL_MS = 24 * 60 * 60 * 1_000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const token = typeof body?.token === 'string' ? body.token.trim().slice(0, 100) : '';

    if (!token) {
      return Response.json({ error: 'token is required' }, { status: 400 });
    }

    const pending = await base44.asServiceRole.entities.PendingSubmission.filter({ token });
    const sub = pending[0];
    if (!sub) {
      return Response.json({ error: 'Score submission not found' }, { status: 404 });
    }

    const createdAt = Date.parse(sub.created_date || '');
    const expiresAt = Date.parse(sub.expires_at || '');
    const hasExpired = Number.isFinite(expiresAt)
      ? Date.now() >= expiresAt
      : Number.isFinite(createdAt) && Date.now() - createdAt > SUBMISSION_TTL_MS;
    if (sub.status === 'expired' || (sub.status === 'pending' && hasExpired)) {
      await base44.asServiceRole.entities.PendingSubmission.update(sub.id, { status: 'expired' });
      return Response.json({ error: 'This score submission has expired' }, { status: 410 });
    }

    let competitionName = '';
    if (sub.competition_id) {
      const comps = await base44.asServiceRole.entities.Competition.filter({ id: sub.competition_id });
      competitionName = comps[0]?.name || '';
    }

    return Response.json({
      token: sub.token,
      status: sub.status,
      total_score: sub.total_score,
      round_results: sub.round_results || [],
      avg_distance_km: sub.avg_distance_km,
      competition_name: competitionName,
      leaderboard_entry_id: sub.status === 'completed' ? sub.leaderboard_entry_id || null : null,
    });
  } catch (error) {
    console.error('getPendingSubmission failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not load the score submission' }, { status: 500 });
  }
});
