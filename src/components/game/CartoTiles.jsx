import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { mapTiles } from '@/utils/mapTiles';

export default function CartoTiles() {
  const map = useMap();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const pending = new Map();
    const failedTiles = new Set();
    const Layer = L.GridLayer.extend({
      createTile(coords, done) {
        const tile = document.createElement('img');
        tile.alt = '';
        const controller = new AbortController();
        pending.set(tile, controller);
        const finish = (error = null) => {
          if (!pending.has(tile)) return;
          pending.delete(tile);
          if (error) failedTiles.add(tile);
          if (active) setFailed(failedTiles.size > 0);
          done(error, tile);
        };
        // Shared requests survive round changes; abort only this tile's rendering.
        mapTiles.get(coords).then((blob) => {
          if (!active || controller.signal.aborted) return;
          const objectUrl = URL.createObjectURL(blob);
          const release = () => URL.revokeObjectURL(objectUrl);
          controller.signal.addEventListener('abort', release, { once: true });
          tile.onload = () => { release(); finish(); };
          tile.onerror = () => { release(); finish(new Error('Map tile failed to load')); };
          tile.src = objectUrl;
        }).catch(() => {
          if (active && !controller.signal.aborted) finish(new Error('Map tile failed to load'));
        });
        return tile;
      },
    });
    const layer = new Layer();
    L.setOptions(layer, { minZoom: 1, maxZoom: 18, updateWhenIdle: true });
    layer.on('tileunload', ({ tile }) => {
      pending.get(tile)?.abort();
      pending.delete(tile);
      failedTiles.delete(tile);
      if (active) setFailed(failedTiles.size > 0);
    });
    layer.addTo(map);
    const attribution = L.control.attribution({ position: 'topright', prefix: false });
    attribution.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>');
    attribution.addTo(map);
    return () => {
      active = false;
      for (const controller of pending.values()) controller.abort();
      pending.clear();
      layer.remove();
      attribution.remove();
    };
  }, [map, attempt]);

  return failed ? (
    <div role="alert" className="absolute left-2 right-2 top-10 z-[1000] rounded bg-white p-3 text-center text-sm text-gray-900 shadow">
      Map couldn’t load. <button type="button" className="font-bold underline" onClick={(event) => {
        event.stopPropagation();
        setFailed(false);
        setAttempt((value) => value + 1);
      }}>Retry map</button>
    </div>
  ) : null;
}
