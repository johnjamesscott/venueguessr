import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const PRIMARY_ROUNDS = 3;
const SPARE_VENUES = 3;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const demoMode = body?.demo === true;

    const venues = await base44.asServiceRole.entities.Venue.filter({
      active: true,
      is_demo: demoMode,
    });

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
      return Response.json({ venues: shuffled.slice(0, 1) });
    }

    // Guarantee at least one non-London venue in the three playable rounds.
    const LONDON_CITIES = new Set(['London', 'Rotherhithe', 'Wembley']);
    const outsideVenues = shuffled.filter(v => !LONDON_CITIES.has(v.city));
    const londonVenues = shuffled.filter(v => LONDON_CITIES.has(v.city));

    let primary;
    if (outsideVenues.length > 0) {
      const outside = outsideVenues[0];
      const rest = [...londonVenues, ...outsideVenues.slice(1)];
      primary = [outside, ...rest.slice(0, PRIMARY_ROUNDS - 1)]
        .sort(() => Math.random() - 0.5)
        .slice(0, PRIMARY_ROUNDS);
    } else {
      primary = shuffled.slice(0, PRIMARY_ROUNDS);
    }

    const selectedIds = new Set(primary.map((venue) => venue.id));
    const spares = shuffled
      .filter((venue) => !selectedIds.has(venue.id))
      .slice(0, SPARE_VENUES);

    return Response.json({ venues: [...primary, ...spares] });
  } catch (error) {
    console.error('getRandomVenues failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not load venues' }, { status: 500 });
  }
});
