import React, { useEffect, useRef, useState } from 'react';

export default function CountdownTimer({ seconds, onExpire, isActive }) {
  const intervalRef = useRef(null);
  const [timeLeft, setTimeLeft] = React.useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isActive) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isActive, onExpire]);

  const isUrgent = timeLeft <= 10;
  const progress = timeLeft / seconds;

  return (
    <div className={`absolute top-4 right-4 z-20 flex flex-col items-center ${isUrgent ? 'timer-urgent' : ''}`}>
      <div
        className="relative w-16 h-16 rounded-hb-md overflow-hidden"
        style={{ background: isUrgent ? '#AF231C' : 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Progress bar background */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
          style={{
            height: `${progress * 100}%`,
            background: isUrgent ? 'rgba(255,255,255,0.15)' : 'rgba(175,35,28,0.3)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <span className="text-white font-black text-xl leading-none">{timeLeft}</span>
          <span className="text-white/70 text-[9px] font-bold uppercase tracking-wider mt-0.5">secs</span>
        </div>
      </div>
    </div>
  );
}