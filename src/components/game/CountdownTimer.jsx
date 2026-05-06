import React, { useEffect, useRef, useState } from 'react';

const SIZE = 120;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function CountdownTimer({ seconds, onExpire, isActive }) {
  const intervalRef = useRef(null);
  const [timeLeft, setTimeLeft] = React.useState(seconds);

  useEffect(() => { setTimeLeft(seconds); }, [seconds]);

  useEffect(() => {
    if (!isActive) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); onExpire(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isActive, onExpire]);

  const isUrgent = timeLeft <= 10;
  const progress = timeLeft / seconds;
  const dashOffset = CIRC * (1 - progress);
  const ringColor = isUrgent ? '#ef4444' : '#AF231C';

  return (
    <div className={`flex flex-col items-center ${isUrgent ? 'timer-urgent' : ''}`}>
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#e5e7eb" strokeWidth={STROKE} />
          {/* Progress */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black leading-none" style={{ fontSize: '32px', color: ringColor }}>{timeLeft}</span>
          <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-0.5">secs</span>
        </div>
      </div>
    </div>
  );
}