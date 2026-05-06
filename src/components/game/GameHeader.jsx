import React from 'react';

export default function GameHeader({ currentRound, totalRounds }) {
  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-hb-surface border-b border-hb-border">
      <img
        src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b13872e8c6e1a7_HeadBox-Logo-White-.png"
        alt="HeadBox"
        className="h-7 md:h-8 object-contain"
      />
      <div className="flex items-center gap-2">
        <span className="text-hb-text-muted text-sm font-medium uppercase tracking-widest">Round</span>
        <span className="text-white font-bold text-lg">
          <span className="text-hb-red">{currentRound}</span>
          <span className="text-hb-text-muted">/{totalRounds}</span>
        </span>
      </div>
    </header>
  );
}