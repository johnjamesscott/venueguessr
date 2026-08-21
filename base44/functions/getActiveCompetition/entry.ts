import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const competitions = await base44.asServiceRole.entities.Competition.filter({ active: true });
    const competition = competitions[0] || null;

    let prizes = [];
    if (competition) {
      prizes = await base44.asServiceRole.entities.Prize.filter({
        competition_id: competition.id,
        active: true,
      });
      prizes.sort((a, b) => (a.position || 0) - (b.position || 0));
    }

    return Response.json({ competition, prizes });
  } catch (error) {
    console.error('getActiveCompetition failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not load the active competition' }, { status: 500 });
  }
});
