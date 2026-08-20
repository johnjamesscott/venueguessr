import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: 'token is required' }, { status: 400 });
    }

    const pending = await base44.asServiceRole.entities.PendingSubmission.filter({ token });
    const sub = pending[0];
    if (!sub) {
      return Response.json({ error: 'not found' }, { status: 404 });
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
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});