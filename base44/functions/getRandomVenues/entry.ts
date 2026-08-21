import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';
import { waitUntil } from 'base44:runtime';

const SPARE_VENUES = 3;
const GAME_SESSION_TTL_MS = 30 * 60 * 1_000;

const clamp = (value, fallback, min, max, integer = false) => {
  if (value == null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const normalized = integer ? Math.round(number) : number;
  return Math.min(max, Math.max(min, normalized));
};

const getSettings = (competition) => ({
  icpMultiplier: clamp(competition?.icp_multiplier, 1.25, 1, 2),
  roundCount: clamp(competition?.round_count, 3, 1, 5, true),
  roundSeconds: clamp(competition?.round_seconds, 30, 15, 90, true),
  kioskIdleSeconds: clamp(competition?.kiosk_idle_seconds, 90, 30, 300, true),
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const demoMode = body?.demo === true;
    const boosted = body?.icp_boosted === true;

    const cleanupSessions = Promise.all([
      base44.asServiceRole.entities.GameSession.filter({ status: 'active' }, 'created_date', 50),
      base44.asServiceRole.entities.GameSession.filter({ status: 'completed' }, 'created_date', 50),
      base44.asServiceRole.entities.GameSession.filter({ status: 'expired' }, 'created_date', 50),
    ]).then(async (groups) => {
      const now = Date.now();
      const expiredIds = groups.flat()
        .filter((session) => {
          const expiresAt = Date.parse(session.expires_at || '');
          const createdAt = Date.parse(session.created_date || '');
          return Number.isFinite(expiresAt)
            ? now >= expiresAt
            : Number.isFinite(createdAt) && now - createdAt >= GAME_SESSION_TTL_MS;
        })
        .map((session) => session.id)
        .filter(Boolean);
      await Promise.allSettled(
        expiredIds.map((id) => base44.asServiceRole.entities.GameSession.delete(id)),
      );
    }).catch(() => {});
    waitUntil(cleanupSessions);

    const [venues, competitions] = await Promise.all([
      base44.asServiceRole.entities.Venue.filter({
        active: true,
        is_demo: demoMode,
      }),
      base44.asServiceRole.entities.Competition.filter({ active: true }),
    ]);
    const competition = competitions[0] || null;
    const settings = getSettings(competition);

    const playableVenues = (venues || []).filter((venue) => venue.health_status !== 'unhealthy');
    if (playableVenues.length === 0) {
      return Response.json({ error: 'No active venues found' }, { status: 404 });
    }

    // Fisher-Yates shuffle
    const shuffled = [...playableVenues];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (demoMode) {
      return Response.json({
        venues: shuffled.slice(0, 1),
        settings,
        competitionId: competition?.id || null,
      });
    }

    // Guarantee at least one non-London venue in the configured playable rounds.
    const LONDON_CITIES = new Set(['London', 'Rotherhithe', 'Wembley']);
    const outsideVenues = shuffled.filter(v => !LONDON_CITIES.has(v.city));
    const londonVenues = shuffled.filter(v => LONDON_CITIES.has(v.city));

    let primary;
    if (outsideVenues.length > 0) {
      const outside = outsideVenues[0];
      const rest = [...londonVenues, ...outsideVenues.slice(1)];
      primary = [outside, ...rest.slice(0, settings.roundCount - 1)]
        .sort(() => Math.random() - 0.5)
        .slice(0, settings.roundCount);
    } else {
      primary = shuffled.slice(0, settings.roundCount);
    }

    const selectedIds = new Set(primary.map((venue) => venue.id));
    const spares = shuffled
      .filter((venue) => !selectedIds.has(venue.id))
      .slice(0, SPARE_VENUES);

    const selectedVenues = [...primary, ...spares];
    const sessionToken = crypto.randomUUID();
    await base44.asServiceRole.entities.GameSession.create({
      token: sessionToken,
      competition_id: competition?.id || null,
      venue_ids: selectedVenues.map((venue) => venue.id),
      round_count: primary.length,
      icp_multiplier: settings.icpMultiplier,
      icp_boosted: boosted,
      status: 'active',
      expires_at: new Date(Date.now() + GAME_SESSION_TTL_MS).toISOString(),
    });

    return Response.json({
      venues: selectedVenues,
      settings,
      competitionId: competition?.id || null,
      gameSessionToken: sessionToken,
    });
  } catch (error) {
    console.error('getRandomVenues failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not load venues' }, { status: 500 });
  }
});
