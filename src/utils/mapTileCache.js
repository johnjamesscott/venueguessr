// Map images only. This cache never contains credentials or player data.
export function createMapTileCache(load, { maxEntries = 128, maxBytes = 16 * 1024 * 1024, ttlMs = 60 * 60 * 1000, now = Date.now } = {}) {
  const ready = new Map();
  const pending = new Map();
  let bytes = 0;
  function remove(key) {
    bytes -= ready.get(key)?.blob.size || 0;
    ready.delete(key);
  }
  return {
    get(coords) {
      const key = `${coords.z}/${coords.x}/${coords.y}`;
      const cached = ready.get(key);
      if (cached && cached.expires > now()) {
        ready.delete(key);
        ready.set(key, cached);
        return Promise.resolve(cached.blob);
      }
      if (cached) remove(key);
      if (pending.has(key)) return pending.get(key);
      const request = Promise.resolve().then(() => load(coords)).then((blob) => {
        if (blob.size <= maxBytes) {
          ready.set(key, { blob, expires: now() + ttlMs });
          bytes += blob.size;
          while (ready.size > maxEntries || bytes > maxBytes) remove(ready.keys().next().value);
        }
        return blob;
      }).finally(() => pending.delete(key));
      pending.set(key, request);
      return request;
    },
  };
}

// Match Leaflet's Web Mercator tile grid, including horizontal world wrapping.
export function initialMapTiles({ lat, lng, zoom, width, height }) {
  const count = 2 ** zoom;
  const sin = Math.sin(Math.max(-85.05112878, Math.min(85.05112878, lat)) * Math.PI / 180);
  const cx = (lng + 180) / 360 * count;
  const cy = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * count;
  const tiles = new Map();
  const halfWidth = Math.min(Math.max(width, 256), 2048) / 512;
  const halfHeight = Math.min(Math.max(height, 256), 768) / 512;
  for (let y = Math.max(0, Math.floor(cy - halfHeight)); y <= Math.min(count - 1, Math.floor(cy + halfHeight)); y++) {
    for (let x = Math.floor(cx - halfWidth); x <= Math.floor(cx + halfWidth); x++) {
      const wrappedX = ((x % count) + count) % count;
      const key = `${wrappedX}/${y}`;
      const distance = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2;
      if (!tiles.has(key) || tiles.get(key).distance > distance) tiles.set(key, { x: wrappedX, y, z: zoom, distance });
    }
  }
  return [...tiles.values()].sort((a, b) => a.distance - b.distance).slice(0, 40).map(({ x, y, z }) => ({ x, y, z }));
}

export async function warmMapTiles(cache, tiles, shouldStop = () => false) {
  let next = 0;
  const worker = async () => {
    while (!shouldStop() && next < tiles.length) {
      const tile = tiles[next++];
      // A failed preload must not block gameplay or poison a later retry.
      try { await cache.get(tile); } catch { /* Retried when the map needs it. */ }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
}
