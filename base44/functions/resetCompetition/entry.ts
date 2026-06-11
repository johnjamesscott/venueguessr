import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const { competition_id } = await req.json();
  if (!competition_id) return Response.json({ error: 'competition_id required' }, { status: 400 });

  // Delete leaderboard entries for this competition only
  const entries = await base44.asServiceRole.entities.LeaderboardEntry.filter({ competition_id });
  let deleted = 0;
  for (const e of entries) {
    await base44.asServiceRole.entities.LeaderboardEntry.delete(e.id);
    deleted++;
  }

  return Response.json({ success: true, deleted_entries: deleted });
});