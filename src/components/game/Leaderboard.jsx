import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import { EMPTY_LEADERBOARD, usePublicLeaderboard } from '@/hooks/usePublicLeaderboard';

const RANK_STYLES = [
  { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/30' },
  { bg: 'bg-orange-700/20', text: 'text-orange-400', border: 'border-orange-700/30' },
];

export default function Leaderboard({ highlightEntryId = null, competitionId = null }) {
  const { data = EMPTY_LEADERBOARD, isLoading: loading, isError } = usePublicLeaderboard({ competitionId });
  const entries = data.entries.slice(0, 10);
  const roundCount = data.competition?.settings?.roundCount || 3;

  return (
    <div className="bg-hb-surface rounded-hb-lg border border-hb-border overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-hb-border">
        <Trophy size={16} className="text-yellow-400" />
        <h2 className="text-white font-bold text-sm">Event Leaderboard</h2>
      </div>

      <div className="divide-y divide-hb-border">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-hb-border" />
              <div className="flex-1 h-3 bg-hb-border rounded" />
              <div className="w-16 h-3 bg-hb-border rounded" />
            </div>
          ))
        ) : isError ? (
          <div className="px-5 py-8 text-center text-hb-text-muted text-sm">
            Scores temporarily unavailable.
          </div>
        ) : entries.length === 0 ? (
          <div className="px-5 py-8 text-center text-hb-text-muted text-sm">
            No entries yet — be the first!
          </div>
        ) : (
          entries.map((entry, i) => {
            const style = RANK_STYLES[i] || { bg: '', text: '', border: '' };
            const isHighlighted = highlightEntryId && entry.id === highlightEntryId;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                  isHighlighted ? 'bg-hb-red/10' : 'hover:bg-hb-surface-2'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border shrink-0 ${
                  i < 3 ? `${style.bg} ${style.text} ${style.border}` : 'bg-transparent text-hb-text-muted border-hb-border'
                }`}>
                  {i < 3 ? <Medal size={13} /> : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold truncate ${isHighlighted ? 'text-hb-red' : 'text-white'}`}>
                    {entry.player_name}
                    {isHighlighted && <span className="text-hb-red text-xs ml-1">(you)</span>}
                  </p>
                  <p className="text-hb-text-muted text-xs">
                    {Math.min(entry.rounds_played ?? 0, roundCount)} {entry.rounds_played === 1 ? 'round' : 'rounds'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-white font-black text-sm">{(entry.total_score ?? 0).toLocaleString()}</p>
                  <p className="text-hb-text-muted text-xs">pts</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
