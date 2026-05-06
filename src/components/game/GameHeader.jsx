import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function GameHeader({ currentRound, totalRounds, overlay = false }) {
  return (
    <header
      className="flex items-center justify-between px-4 md:px-8 py-3"
      style={overlay ? {
        background: 'linear-gradient(to bottom, rgba(18,18,18,0.85) 0%, rgba(18,18,18,0.4) 70%, transparent 100%)',
      } : {
        background: '#1a1a1a',
        borderBottom: '1px solid #2a2a2a',
      }}
    >
      <img
        src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b13872e8c6e1a7_HeadBox-Logo-White-.png"
        alt="HeadBox"
        className="h-7 md:h-8 object-contain"
      />

      <div className="flex items-center gap-3">
        {currentRound != null && totalRounds != null && (
          <div className="flex items-center gap-1.5">
            <span className="text-hb-text-muted text-sm font-medium uppercase tracking-widest">Round</span>
            <span className="text-white font-bold text-lg">
              <span className="text-hb-red">{currentRound}</span>
              <span className="text-hb-text-muted">/{totalRounds}</span>
            </span>
          </div>
        )}
        <a
          href="https://www.headbox.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 bg-hb-red hover:bg-hb-red-dark text-white font-bold text-xs uppercase tracking-widest px-3 py-2 rounded-hb-md transition-colors duration-200"
        >
          Plan your event <ExternalLink size={11} />
        </a>
      </div>
    </header>
  );
}