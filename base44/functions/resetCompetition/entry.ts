import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { competition_id } = body;

    if (!competition_id) {
      return Response.json({ error: 'competition_id is required' }, { status: 400 });
    }

    // Delete all leaderboard entries for this competition
    const entries = await base44.asServiceRole.entities.LeaderboardEntry.filter({ competition_id });
    let deleted = 0;
    for (const entry of entries) {
      await base44.asServiceRole.entities.LeaderboardEntry.delete(entry.id);
      deleted++;
    }

    return Response.json({ success: true, deleted_entries: deleted });
  } catch (error) {
    console.error('resetCompetition failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not reset the competition' }, { status: 500 });
  }
});
