import React, { useEffect } from 'react';

export default function SplineGlobe({ size = 700 }) {
  useEffect(() => {
    if (document.querySelector('script[src*="spline-viewer"]')) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.12.97/build/spline-viewer.js';
    document.head.appendChild(script);
  }, []);

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      border: '2px solid rgba(175,35,28,0.6)',
      boxShadow: '0 0 40px 10px rgba(175,35,28,0.4), 0 0 100px 20px rgba(175,35,28,0.15)',
      pointerEvents: 'none',
      animation: 'glowPulse 3s ease-in-out infinite',
      flexShrink: 0,
    }}>
      <spline-viewer
        url="https://prod.spline.design/5Lju2NLw8YEapJXE/scene.splinecode"
        style={{ width: '100%', height: '100%', pointerEvents: 'none', display: 'block' }}
        loading="eager"
      />
    </div>
  );
}