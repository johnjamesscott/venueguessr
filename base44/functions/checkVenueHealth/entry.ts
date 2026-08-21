import { createClientFromRequest } from 'npm:@base44/sdk@0.8.43';

const REQUEST_TIMEOUT_MS = 8_000;
const MAX_VENUES = 200;
const CONCURRENCY = 4;

const getHealthUrl = (rawUrl) => {
  try {
    const url = new URL(String(rawUrl || ''));
    if (url.protocol !== 'https:') return null;

    if (url.hostname === 'tours.headbox.com') {
      const modelId = url.pathname.match(/^\/model\/([^/]+)/)?.[1];
      return modelId
        ? `https://my.matterport.com/api/v2/player/models/${encodeURIComponent(modelId)}/thumb/`
        : null;
    }

    if (url.hostname === 'my.matterport.com' && url.pathname.startsWith('/show')) {
      const modelId = url.searchParams.get('m');
      return modelId
        ? `https://my.matterport.com/api/v2/player/models/${encodeURIComponent(modelId)}/thumb/`
        : null;
    }
  } catch {
    return null;
  }
  return null;
};

const requestTour = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    await response.body?.cancel().catch(() => {});
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

const checkTour = async (venue) => {
  const startedAt = Date.now();
  const healthUrl = getHealthUrl(venue.matterport_url);
  if (!healthUrl) {
    return {
      status: 'unhealthy',
      milliseconds: 0,
      message: 'Unsupported or incomplete Matterport URL',
    };
  }

  try {
    const response = await requestTour(healthUrl);
    const milliseconds = Date.now() - startedAt;
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.startsWith('image/')) {
      return { status: 'healthy', milliseconds, message: 'Matterport model active' };
    }
    return {
      status: 'unhealthy',
      milliseconds,
      message: response.ok ? 'Matterport model preview unavailable' : `HTTP ${response.status}`,
    };
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    return {
      status: 'unhealthy',
      milliseconds: Date.now() - startedAt,
      message: timedOut ? 'Timed out after 8 seconds' : 'Tour request failed',
    };
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const venueId = typeof body?.venue_id === 'string' ? body.venue_id.trim() : '';
    const venues = venueId
      ? [await base44.asServiceRole.entities.Venue.get(venueId)]
      : await base44.asServiceRole.entities.Venue.filter({ active: true }, 'venue_name', MAX_VENUES);
    const results = new Array(venues.length);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < venues.length) {
        const index = nextIndex;
        nextIndex += 1;
        const venue = venues[index];
        const result = await checkTour(venue);
        const checkedAt = new Date().toISOString();
        await base44.asServiceRole.entities.Venue.update(venue.id, {
          health_status: result.status,
          last_health_check_at: checkedAt,
          last_health_check_ms: result.milliseconds,
          health_message: result.message,
        });
        results[index] = {
          venue_id: venue.id,
          venue_name: venue.venue_name,
          health_status: result.status,
          milliseconds: result.milliseconds,
          message: result.message,
        };
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, venues.length || 1) }, () => worker()),
    );

    return Response.json({
      checked: results.length,
      healthy: results.filter(result => result.health_status === 'healthy').length,
      unhealthy: results.filter(result => result.health_status === 'unhealthy').length,
      results,
    });
  } catch (error) {
    console.error('checkVenueHealth failed:', error?.message || 'Unknown error');
    return Response.json({ error: 'Could not check venue health' }, { status: 500 });
  }
});
