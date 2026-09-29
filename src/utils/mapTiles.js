import { base44 } from '@/api/base44Client';
import { createMapTileCache } from './mapTileCache';

export const mapTiles = createMapTileCache(async ({ z, x, y }) => {
  const response = await base44.functions.fetch(`/cartoTile?z=${z}&x=${x}&y=${y}`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok || !response.headers.get('content-type')?.includes('image/png')) {
    throw new Error('Map tiles are unavailable');
  }
  return response.blob();
});
