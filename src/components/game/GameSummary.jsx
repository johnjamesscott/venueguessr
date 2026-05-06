import React from 'react';
import { MapPin, RotateCcw } from 'lucide-react';
import { getRating } from '@/utils/scoring';
import Leaderboard from '@/components/game/Leaderboard';
import GameHeader from '@/components/game/GameHeader';

export default function GameSummary({ results, venues, totalScore, playerEmail, onPlayAgain }) {
  const avgMiles = results.length > 0
    ? (results.reduce((sum, r) => sum + (r.distance?.miles || 0), 0) / results.length).toFixed(1)
    : 0;

  const rating = getRating(totalScore / Math.max(results.length, 1));

  return (
    <div className="min-h-screen bg-hb-bg flex flex-col">
      <GameHeader />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 md:py-10 space-y-6">
        {/* Hero score */}
        <div className="text-center fade-in">
          <div className="inline-flex items-center gap-2 bg-hb-red/10 border border-hb-red/30 text-hb-red text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-hb-xl mb-4">
            <MapPin size={12} />
            Game Complete
          </div>
          <div className="text-hb-text-muted text-sm font-bold uppercase tracking-widest mb-1">Total Score</div>
          <div
            className="font-black text-6xl md:text-7xl leading-none"
            style={{ color: rating.color }}
          >
            {totalScore.toLocaleString()}
          </div>
          <div className="text-white/50 font-bold text-xl mt-1">points</div>
          <div className="text-sm font-bold uppercase tracking-wider mt-2" style={{ color: rating.color }}>
            {rating.label}
          </div>
          <p className="text-hb-text-muted text-sm mt-2">
            Avg distance: {avgMiles} miles across {results.length} rounds
          </p>
        </div>

        {/* All rounds breakdown */}
        <div className="bg-hb-surface rounded-hb-lg border border-hb-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-hb-border">
            <h2 className="text-white font-bold text-xs uppercase tracking-widest">Round Breakdown</h2>
          </div>
          <div className="divide-y divide-hb-border">
            {results.map((result, i) => {
              const venue = venues[i];
              const r = getRating(result.score || 0);
              return (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-hb-text-muted text-xs font-bold w-14">Rd {i + 1}</span>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{venue?.venueName}</p>
                      <p className="text-hb-text-muted text-xs">{venue?.city}, {venue?.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {result.distance ? (
                      <>
                        <p className="font-black text-sm" style={{ color: r.color }}>
                          {(result.score || 0).toLocaleString()} pts
                        </p>
                        <p className="text-hb-text-muted text-xs">{result.distance.miles} mi</p>
                      </>
                    ) : (
                      <p className="text-hb-text-muted text-xs italic">No guess</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <Leaderboard highlightEmail={playerEmail} />

        {/* Play again */}
        <button
          onClick={onPlayAgain}
          className="w-full flex items-center justify-center gap-2 bg-transparent border-2 border-white/20 hover:border-white/40 text-white font-bold uppercase tracking-widest text-sm py-4 rounded-hb-xl transition-colors duration-200"
        >
          <RotateCcw size={16} />
          Play Again
        </button>
      </div>
    </div>
  );
}