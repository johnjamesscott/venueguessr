import React, { useEffect, useRef, useState } from 'react';
import { getEmbedUrl } from '@/data/venues';

export default function MatterportViewer({ tourUrl, nextTourUrl, onError, onLoaded, loadTimeoutMs = 12_000 }) {
  const embedUrl = getEmbedUrl(tourUrl);
  const nextEmbedUrl = getEmbedUrl(nextTourUrl);
  let trustedMessageOrigin = null;
  try {
    trustedMessageOrigin = embedUrl ? new URL(embedUrl, window.location.origin).origin : null;
  } catch (_) {
    // A malformed admin-entered URL is handled by the normal venue fallback.
  }
  const iframeRef = useRef(null);
  const errorReportedRef = useRef(false);
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const reportError = React.useCallback(() => {
    if (errorReportedRef.current) return;
    errorReportedRef.current = true;
    setErrored(true);
    onError?.();
  }, [onError]);

  // Reset error state when tourUrl changes
  useEffect(() => {
    setErrored(false);
    setLoaded(false);
    errorReportedRef.current = false;
  }, [tourUrl]);

  useEffect(() => {
    if (!embedUrl) {
      reportError();
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      if (!loaded) reportError();
    }, loadTimeoutMs);
    return () => window.clearTimeout(timeoutId);
  }, [embedUrl, loadTimeoutMs, loaded, reportError]);

  // Detect Matterport "model not available" via postMessage
  useEffect(() => {
    const handleMessage = (e) => {
      if (!trustedMessageOrigin || e.origin !== trustedMessageOrigin) return;
      try {
        const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // Matterport SDK sends model.error or similar when unavailable
        if (
          msg?.type === 'MATTERPORT_ERROR' ||
          msg?.name === 'model.error' ||
          (typeof e.data === 'string' && e.data.toLowerCase().includes('model not available'))
        ) {
          reportError();
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [reportError, trustedMessageOrigin]);

  // Fallback: poll iframe title for "Oops" text (fires once iframe loads)
  useEffect(() => {
    if (!embedUrl) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      try {
        const title = iframeRef.current?.contentDocument?.title || '';
        if (title.toLowerCase().includes('oops') || title.toLowerCase().includes('not available')) {
          clearInterval(interval);
          reportError();
        }
      } catch (_) {
        // cross-origin — ignore
      }
      if (attempts > 20) clearInterval(interval); // stop after ~10s
    }, 500);
    return () => clearInterval(interval);
  }, [embedUrl, reportError]);

  if (!embedUrl || errored) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-hb-surface-2">
        <p className="text-hb-text-muted text-sm">Loading next venue…</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-0"
        allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
        allowFullScreen
        title="Venue 3D Tour"
        onLoad={() => {
          setLoaded(true);
          onLoaded?.();
        }}
      />
      {/* Hidden preload iframe for next venue */}
      {nextEmbedUrl && (
        <iframe
          key={nextEmbedUrl}
          src={nextEmbedUrl}
          className="border-0"
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', left: -9999 }}
          allow="xr-spatial-tracking"
          title="Preload next venue"
        />
      )}
    </div>
  );
}
