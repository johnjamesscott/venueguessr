import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getEmbedUrl } from '@/data/venues';

const DEFAULT_TIMEOUT_MS = 18_000;

export default function SequentialTourPreloader({ active, tourUrls, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const embedUrls = useMemo(
    () => (Array.isArray(tourUrls) ? tourUrls.map(getEmbedUrl).filter(Boolean) : []),
    [tourUrls],
  );
  const queueKey = embedUrls.join('|');
  const [currentIndex, setCurrentIndex] = useState(0);
  const completedIndexRef = useRef(-1);

  useEffect(() => {
    completedIndexRef.current = -1;
    setCurrentIndex(0);
  }, [queueKey]);

  const advance = useCallback(() => {
    setCurrentIndex((index) => {
      if (completedIndexRef.current === index) return index;
      completedIndexRef.current = index;
      return Math.min(index + 1, embedUrls.length);
    });
  }, [embedUrls.length]);

  useEffect(() => {
    if (!active || currentIndex >= embedUrls.length) return undefined;
    const timeoutId = window.setTimeout(advance, timeoutMs);
    return () => window.clearTimeout(timeoutId);
  }, [active, advance, currentIndex, embedUrls.length, timeoutMs]);

  if (!active || currentIndex >= embedUrls.length) return null;

  const currentUrl = embedUrls[currentIndex];
  return (
    <iframe
      key={`${currentIndex}-${currentUrl}`}
      src={currentUrl}
      title={`Preparing venue ${currentIndex + 1}`}
      aria-hidden="true"
      tabIndex={-1}
      allow="xr-spatial-tracking"
      onLoad={advance}
      onError={advance}
      style={{
        position: 'fixed',
        width: 1,
        height: 1,
        left: -10_000,
        top: 0,
        border: 0,
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
