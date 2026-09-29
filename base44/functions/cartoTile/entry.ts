import { secrets } from 'base44:runtime';

// Only map coordinates are accepted: this must never become an arbitrary URL proxy.
export default async function cartoTile(req: Request) {
  if (req.method !== 'GET') return new Response(null, { status: 405 });
  const params = new URL(req.url).searchParams;
  const values = ['z', 'x', 'y'].map((name) => params.get(name));
  if (values.some((value) => value === null || !/^\d{1,6}$/.test(value))) {
    return Response.json({ error: 'Invalid tile coordinates' }, { status: 400 });
  }
  const [z, x, y] = values.map(Number);
  if (z > 18 || x >= 2 ** z || y >= 2 ** z) {
    return Response.json({ error: 'Invalid tile coordinates' }, { status: 400 });
  }
  const key = secrets.get('CARTO_Basemaps_API_key')?.trim();
  if (!key) return Response.json({ error: 'Map is not configured' }, { status: 503 });

  try {
    const url = new URL(`https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`);
    url.searchParams.set('key', key);
    const upstream = await fetch(url.toString(), { signal: AbortSignal.timeout(10000), redirect: 'manual' });
    if (!upstream.ok || !upstream.headers.get('content-type')?.includes('image/png')) {
      return Response.json({ error: 'Map tiles are unavailable', providerStatus: upstream.status }, { status: 502 });
    }
    // Never forward provider headers, errors, or URLs: they could contain the key.
    return new Response(upstream.body, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error) {
    return Response.json({ error: 'Map tiles are unavailable', reason: error instanceof TypeError ? 'request-failed' : 'provider-timeout' }, { status: 502 });
  }
}
