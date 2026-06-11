import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const venues = await base44.asServiceRole.entities.Venue.filter({ active: true, is_demo: false });

    if (!venues || venues.length === 0) {
      return Response.json({ error: 'No active venues found' }, { status: 404 });
    }

    // Fisher-Yates shuffle
    const shuffled = [...venues];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Guarantee at least 1 non-London venue if available
    const LONDON_CITIES = new Set(['London', 'Rotherhithe', 'Wembley']);
    const outsideVenues = shuffled.filter(v => !LONDON_CITIES.has(v.city));
    const londonVenues = shuffled.filter(v => LONDON_CITIES.has(v.city));

    let selected;
    if (outsideVenues.length > 0) {
      const outside = outsideVenues[0];
      const rest = [...londonVenues, ...outsideVenues.slice(1)];
      const pool = rest.slice(0, 2);
      selected = [outside, ...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    } else {
      selected = shuffled.slice(0, 3);
    }

    return Response.json({ venues: selected });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});