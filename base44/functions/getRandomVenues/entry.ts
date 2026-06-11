import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const { count = 3 } = await req.json().catch(() => ({}));

  // Fetch all active, non-demo venues
  const allVenues = await base44.asServiceRole.entities.Venue.filter({ active: true, is_demo: false });

  if (allVenues.length === 0) {
    return Response.json({ error: 'No active venues available' }, { status: 404 });
  }

  // Shuffle
  const shuffled = allVenues.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  // Normalise URLs to Matterport embed format
  const EMBED_PARAMS = 'play=1&qs=1&dh=0&mls=2&gt=0&hr=0&measurements=0&mt=0&brand=0';
  const venues = selected.map(v => {
    let tourUrl = v.matterport_url;
    if (tourUrl && tourUrl.includes('my.matterport.com/show/')) {
      const base = tourUrl.split('?')[0];
      const existing = new URLSearchParams(tourUrl.includes('?') ? tourUrl.split('?')[1] : '');
      const ours = new URLSearchParams(EMBED_PARAMS);
      const m = existing.get('m');
      if (m) ours.set('m', m);
      tourUrl = `${base}?${ours.toString()}`;
    } else if (tourUrl && tourUrl.includes('tours.headbox.com/model/')) {
      const match = tourUrl.match(/\/model\/([^/?]+)/);
      if (match) tourUrl = `https://my.matterport.com/show/?m=${match[1]}&${EMBED_PARAMS}`;
    }
    return {
      id: v.id,
      venueName: v.venue_name,
      spaceName: v.space_name,
      city: v.city,
      country: v.country,
      lat: v.latitude,
      lng: v.longitude,
      tourUrl,
      headboxUrl: v.headbox_url,
      difficulty: v.difficulty,
    };
  });

  return Response.json({ venues });
});