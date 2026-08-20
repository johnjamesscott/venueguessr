import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const {
      competition_id,
      total_score,
      round_results,
      avg_distance_km,
      icp_boosted,
    } = body;

    const token = crypto.randomUUID();

    const rec = await base44.asServiceRole.entities.PendingSubmission.create({
      token,
      competition_id: competition_id || null,
      total_score: total_score || 0,
      round_results: round_results || [],
      avg_distance_km: avg_distance_km || 0,
      status: 'pending',
      icp_boosted: icp_boosted === true,
    });

    return Response.json({ token, id: rec.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});