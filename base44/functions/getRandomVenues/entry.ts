import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const SPARE_VENUES = 3;

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

    const [venues, competitions] = await Promise.all([
      base44.asServiceRole.entities.Venue.filter({
        active: true,
        is_demo: demoMode,
      }),
      base44.asServiceRole.entities.Competition.filter({ active: true }),
    ]);
    const competition = competitions[0] || null;
    const settings = getSettings(competition);

    if (!venues || venues.length === 0) {
      return Response.json({ error: 'No active venues found' }, { status: 404 });
    }

    // Fisher-Yates shuffle
    const shuffled = [...venues];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    if (demoMode) {
      return Response.json({ venues: shuffled.slice(0, 1), settings, competitionId: competition?.id || null });
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

    return Response.json({ venues: [...primary, ...spares], settings, competitionId: competition?.id || null });
  } catch (error) {
    console.error('getRandomVenues failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not load venues' }, { status: 500 });
  }
});
