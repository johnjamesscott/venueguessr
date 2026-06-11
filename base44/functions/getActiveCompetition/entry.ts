import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const competitions = await base44.asServiceRole.entities.Competition.filter({ active: true });
  const competition = competitions[0] || null;

  let prizes = [];
  if (competition) {
    prizes = await base44.asServiceRole.entities.Prize.filter({ competition_id: competition.id, active: true });
    prizes = prizes.sort((a, b) => a.position - b.position);
  }

  return Response.json({ competition, prizes });
});