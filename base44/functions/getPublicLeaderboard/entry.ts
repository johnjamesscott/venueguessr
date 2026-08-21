import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const MAX_PUBLIC_ENTRIES = 20;

const clamp = (value, fallback, min, max, integer = false) => {
  if (value == null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const normalized = integer ? Math.round(number) : number;
  return Math.min(max, Math.max(min, normalized));
};

const publicSettings = (competition) => ({
  icpMultiplier: clamp(competition?.icp_multiplier, 1.25, 1, 2),
  roundCount: clamp(competition?.round_count, 3, 1, 5, true),
  roundSeconds: clamp(competition?.round_seconds, 30, 15, 90, true),
  kioskIdleSeconds: clamp(competition?.kiosk_idle_seconds, 90, 30, 300, true),
});

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
    const settings = publicSettings(competition);

    const publicEntries = entries.map((entry, index) => ({
      id: entry.id,
      position: index + 1,
      player_name: toPublicName(entry.player_name),
      total_score: Number(entry.total_score) || 0,
      rounds_played: Math.min(Number(entry.rounds_played) || 0, settings.roundCount),
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
        settings,
      },
      entries: publicEntries,
      prizes: publicPrizes,
    });
  } catch (error) {
    console.error('getPublicLeaderboard failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not load the leaderboard' }, { status: 500 });
  }
});
