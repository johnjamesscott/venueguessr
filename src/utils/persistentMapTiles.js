// Store only public PNG tiles, never API responses, tokens, or player details.
// A bounded browser cache survives refreshes; blocked/quota-limited storage is optional.
export function createPersistentTileStore(openCache, { now = Date.now, maxEntries = 128, ttlMs = 3_600_000 } = {}) {
  let writes = Promise.resolve();
  const keyFor = ({ z, x, y }) => `/__venueguessr_map_tiles_v1/${z}/${x}/${y}`;
  return {
    async read(coords) {
      try {
        const cache = await openCache();
        const key = keyFor(coords);
        const response = await cache.match(key);
        if (!response) return null;
        const expires = Number(response.headers.get('x-tile-expires'));
        if (!Number.isFinite(expires) || expires <= now()) {
          await cache.delete(key);
          return null;
        }
        return await response.blob();
      } catch { return null; }
    },
    write(coords, blob) {
      if (blob.size > 128 * 1024) return Promise.resolve(); // At most 16 MiB across 128 tiles.
      // Serialize eviction to keep the cache bounded when many tiles complete together.
      writes = writes.then(async () => {
        const cache = await openCache();
        const key = keyFor(coords);
        await cache.delete(key);
        await cache.put(key, new Response(blob, { headers: {
          'content-type': 'image/png', 'x-tile-expires': String(now() + ttlMs),
        } }));
        const keys = await cache.keys();
        for (const old of keys.slice(0, Math.max(0, keys.length - maxEntries))) await cache.delete(old);
      }).catch(() => {});
      return writes;
    },
  };
}
