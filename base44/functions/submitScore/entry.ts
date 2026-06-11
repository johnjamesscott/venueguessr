import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { player_name, email, total_score, rounds_played, avg_distance_km } = await req.json();

  // Find active competition
  const competitions = await base44.asServiceRole.entities.Competition.filter({ active: true });
  const competition = competitions[0] || null;

  // Save entry
  const entry = await base44.asServiceRole.entities.LeaderboardEntry.create({
    competition_id: competition?.id || null,
    player_name: player_name || 'Anonymous',
    email: email || '',
    total_score: total_score || 0,
    rounds_played: rounds_played || 0,
    avg_distance_km: avg_distance_km || 0,
  });

  // Calculate rank within this competition
  const allEntries = competition
    ? await base44.asServiceRole.entities.LeaderboardEntry.filter({ competition_id: competition.id })
    : await base44.asServiceRole.entities.LeaderboardEntry.list('-total_score', 500);

  const sorted = allEntries.sort((a, b) => b.total_score - a.total_score);
  const rank = sorted.findIndex(e => e.id === entry.id) + 1;

  return Response.json({ entry, rank, competition });
});