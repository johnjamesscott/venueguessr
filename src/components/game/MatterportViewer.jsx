import React, { useEffect, useRef, useState } from 'react';
import { getEmbedUrl } from '@/data/venues';

export default function MatterportViewer({ tourUrl, onError }) {
  const embedUrl = getEmbedUrl(tourUrl);
  const iframeRef = useRef(null);
  const [errored, setErrored] = useState(false);

  // Reset error state when tourUrl changes
  useEffect(() => {
    setErrored(false);
  }, [tourUrl]);

  // Detect Matterport "model not available" via postMessage
  useEffect(() => {
    const handleMessage = (e) => {
      try {
        const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // Matterport SDK sends model.error or similar when unavailable
        if (
          msg?.type === 'MATTERPORT_ERROR' ||
          msg?.name === 'model.error' ||
          (typeof e.data === 'string' && e.data.toLowerCase().includes('model not available'))
        ) {
          setErrored(true);
          onError?.();
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError]);

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
          setErrored(true);
          onError?.();
        }
      } catch (_) {
        // cross-origin — ignore
      }
      if (attempts > 20) clearInterval(interval); // stop after ~10s
    }, 500);
    return () => clearInterval(interval);
  }, [embedUrl, onError]);

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
      />
      {/* Blurred card overlay to hide Matterport venue name top-left */}
      <div
        className="absolute top-0 left-0 z-10 pointer-events-none"
        style={{
          width: '260px',
          height: '52px',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(18,18,18,0.75)',
          borderBottomRightRadius: '8px',
        }}
      />
    </div>
  );
}