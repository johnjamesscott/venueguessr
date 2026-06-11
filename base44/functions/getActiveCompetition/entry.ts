import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

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
    return Response.json({ error: error.message }, { status: 500 });
  }
});