import { useEffect } from 'react';
import { initialMapTiles, warmMapTiles } from '@/utils/mapTileCache';
import { mapTiles } from '@/utils/mapTiles';

export function useMapPreload({ lat, lng, zoom, height, sideInset = 0 }) {
  useEffect(() => {
    let stopped = false;
    const timer = window.setTimeout(() => {
      const connection = /** @type {Navigator & { connection?: { saveData?: boolean, effectiveType?: string } }} */ (navigator).connection;
      if (!navigator.onLine || connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) return;
      // Warm the lazy map code as well as the starting tiles while on the splash screen.
      void import('@/components/game/GuessMap').catch(() => {});
      const tiles = initialMapTiles({ lat, lng, zoom, width: window.innerWidth - sideInset, height: height ?? window.innerHeight * 0.4 });
      void warmMapTiles(mapTiles, tiles, () => stopped);
    }, 700);
    return () => { stopped = true; window.clearTimeout(timer); };
  }, [lat, lng, zoom, height, sideInset]);
}
