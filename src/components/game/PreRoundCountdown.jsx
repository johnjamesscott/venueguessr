import React, { useEffect, useState } from 'react';

export default function PreRoundCountdown({ onComplete }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-black/80 backdrop-blur-sm" style={{ justifyContent: 'flex-start', paddingTop: '10%' }}>
      <p className="text-hb-text-muted text-xs font-bold uppercase tracking-widest mb-4">Get ready…</p>
      <div
        key={count}
        className="text-white font-black leading-none"
        style={{
          fontSize: '120px',
          color: '#AF231C',
          textShadow: '0 0 40px rgba(175,35,28,0.6)',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {count}
      </div>
      <p className="text-hb-text-muted text-sm font-medium mt-6">Explore the space, then drop your pin</p>
    </div>
  );
}