import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const MAX_PUBLIC_ENTRIES = 20;

const toPublicName = (value) => {
  const parts = typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean) : [];
  if (parts.length === 0) return 'Anonymous';
  if (parts.length === 1) return parts[0].slice(0, 80);
  return `${parts[0].slice(0, 60)} ${parts.at(-1)[0].toUpperCase()}.`;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const requestedCompetitionId = typeof body?.competition_id === 'string'
      ? body.competition_id.trim()
      : '';

    const competitions = requestedCompetitionId
      ? await base44.asServiceRole.entities.Competition.filter({ id: requestedCompetitionId })
      : await base44.asServiceRole.entities.Competition.filter({ active: true });
    const competition = competitions[0] || null;

    if (!competition) {
      return Response.json({ competition: null, entries: [], prizes: [] });
    }

    const [entries, prizes] = await Promise.all([
      base44.asServiceRole.entities.LeaderboardEntry.filter(
        { competition_id: competition.id },
        '-total_score',
        MAX_PUBLIC_ENTRIES,
      ),
      base44.asServiceRole.entities.Prize.filter({
        competition_id: competition.id,
        active: true,
      }),
    ]);

    const publicEntries = entries.map((entry, index) => ({
      id: entry.id,
      position: index + 1,
      player_name: toPublicName(entry.player_name),
      total_score: Number(entry.total_score) || 0,
      rounds_played: Math.min(Number(entry.rounds_played) || 0, 3),
    }));

    const publicPrizes = prizes
      .map((prize) => ({
        position: Number(prize.position) || 0,
        prize_name: prize.prize_name || '',
      }))
      .sort((a, b) => a.position - b.position);

    return Response.json({
      competition: {
        id: competition.id,
        name: competition.name || '',
      },
      entries: publicEntries,
      prizes: publicPrizes,
    });
  } catch (error) {
    console.error('getPublicLeaderboard failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not load the leaderboard' }, { status: 500 });
  }
});
