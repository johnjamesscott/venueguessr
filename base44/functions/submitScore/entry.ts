import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { player_name, email, total_score, rounds_played, avg_distance_km } = body;

    // Get active competition
    const competitions = await base44.asServiceRole.entities.Competition.filter({ active: true });
    const competition = competitions[0] || null;

    const entry = await base44.asServiceRole.entities.LeaderboardEntry.create({
      player_name: player_name || 'Anonymous',
      email: email || '',
      total_score: total_score || 0,
      rounds_played: rounds_played || 0,
      avg_distance_km: avg_distance_km || 0,
      competition_id: competition?.id || null,
    });

    // Calculate position
    const allEntries = competition
      ? await base44.asServiceRole.entities.LeaderboardEntry.filter({ competition_id: competition.id })
      : await base44.asServiceRole.entities.LeaderboardEntry.list();

    const sorted = allEntries.sort((a, b) => (b.total_score || 0) - (a.total_score || 0));
    const position = sorted.findIndex(e => e.id === entry.id) + 1;

    return Response.json({ entry, position, competition });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});