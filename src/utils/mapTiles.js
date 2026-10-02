import { base44 } from '@/api/base44Client';
import { createMapTileCache } from './mapTileCache';
import { createRequestQueue } from './networkQueue';
import { createPersistentTileStore } from './persistentMapTiles';

const queue = createRequestQueue(4);
const disk = createPersistentTileStore(() => window.caches.open('venueguessr-map-tiles-v1'));

export const mapTiles = createMapTileCache(async (coords) => {
  const stored = await disk.read(coords);
  if (stored) return stored;
  return queue(async () => {
    const { z, x, y } = coords;
    const response = await base44.functions.fetch(`/cartoTile?z=${z}&x=${x}&y=${y}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('image/png')) {
      throw new Error('Map tiles are unavailable');
    }
    const blob = await response.blob();
    void disk.write(coords, blob);
    return blob;
  });
});
