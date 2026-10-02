import React, { useEffect, useState } from 'react';
import MatterportViewer from './MatterportViewer';
import { tourLookaheadDelay } from '@/utils/networkQueue';

// Keep each prepared iframe in the same React slot when it becomes the active tour.
export default function TourDeck({ tourUrls, playing, retryKey, onError, onLoaded }) {
  const current = tourUrls[0];
  const next = tourUrls[1];
  const [prepared, setPrepared] = useState(null);
  const [lookahead, setLookahead] = useState(null);
  useEffect(() => {
    if (!current || prepared !== current || !next) return;
    const connection = /** @type {Navigator & { connection?: { saveData?: boolean, effectiveType?: string } }} */ (navigator).connection;
    const delay = tourLookaheadDelay(connection, navigator.onLine);
    if (delay === null) return;
    const timer = window.setTimeout(() => setLookahead(next), delay);
    return () => window.clearTimeout(timer);
  }, [current, next, prepared]);
  // The active frame always loads, even when speculative loading is disabled.
  const urls = [...new Set([current, next === lookahead ? next : null].filter(Boolean))];
  return <div style={{ position: 'fixed', top: 88, left: 0, right: 0, bottom: 0 }}>
    {urls.map((url, index) => {
      const active = playing && index === 0;
      return <div key={url} aria-hidden={!active} style={{ position: 'absolute', inset: 0, opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}>
        <MatterportViewer key={index === 0 ? retryKey : 0} tourUrl={url} active={active}
          onPrepared={() => { if (index === 0) setPrepared(url); }} onError={onError} onLoaded={onLoaded} />
      </div>;
    })}
  </div>;
}
