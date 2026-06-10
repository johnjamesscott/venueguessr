import React, { useEffect, useRef } from 'react';

export default function SplineGlobe() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (document.querySelector('script[src*="spline-viewer"]')) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.12.97/build/spline-viewer.js';
    document.head.appendChild(script);
  }, []);

  return (
    <div ref={containerRef} className="globe-wrapper" style={{
      width: 200,
      height: 200,
      borderRadius: '50%',
      overflow: 'hidden',
      border: '2px solid #AF231C',
      boxShadow: '0 0 24px 6px rgba(175,35,28,0.55), 0 0 60px 10px rgba(175,35,28,0.25)',
      pointerEvents: 'none',
      animation: 'glowPulse 3s ease-in-out infinite',
      flexShrink: 0,
      position: 'relative',
    }}>
      <spline-viewer
        url="https://prod.spline.design/5Lju2NLw8YEapJXE/scene.splinecode"
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'block',
        }}
        loading="eager"
      />
    </div>
  );
}