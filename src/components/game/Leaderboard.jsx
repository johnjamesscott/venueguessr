import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, Medal } from 'lucide-react';

const FILTERS = [
  { label: 'Today', value: 'day' },
  { label: 'This Week', value: 'week' },
  { label: 'All Time', value: 'all' },
];

function getStartDate(filter) {
  const now = new Date();
  if (filter === 'day') {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (filter === 'week') {
    const day = now.getDay();
    now.setDate(now.getDate() - day);
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  return null;
}

const RANK_STYLES = [
  { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/30' },
  { bg: 'bg-orange-700/20', text: 'text-orange-400', border: 'border-orange-700/30' },
];

export default function Leaderboard({ highlightEmail }) {
  const [filter, setFilter] = useState('all');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    base44.entities.LeaderboardEntry.list('-total_score', 20)
      .then((data) => {
        const startDate = getStartDate(filter);
        const filtered = startDate
          ? data.filter(e => new Date(e.created_date) >= new Date(startDate))
          : data;
        // Re-sort after filter
        filtered.sort((a, b) => b.total_score - a.total_score);
        setEntries(filtered.slice(0, 10));
      })
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="bg-hb-surface rounded-hb-lg border border-hb-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-hb-border">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-400" />
          <h2 className="text-white font-bold text-sm uppercase tracking-widest">Leaderboard</h2>
        </div>
        <div className="flex items-center gap-1 bg-hb-surface-2 rounded-hb-md p-0.5">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors duration-150 ${
                filter === f.value
                  ? 'bg-hb-red text-white'
                  : 'text-hb-text-muted hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-hb-border">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
              <div className="w-7 h-7 rounded-full bg-hb-border" />
              <div className="flex-1 h-3 bg-hb-border rounded" />
              <div className="w-16 h-3 bg-hb-border rounded" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="px-5 py-8 text-center text-hb-text-muted text-sm">
            No entries yet — be the first!
          </div>
        ) : (
          entries.map((entry, i) => {
            const style = RANK_STYLES[i] || {};
            const isHighlighted = highlightEmail && entry.email === highlightEmail;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                  isHighlighted ? 'bg-hb-red/10' : 'hover:bg-hb-surface-2'
                }`}
              >
                {/* Rank badge */}
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
                  <p className="text-hb-text-muted text-xs">{entry.rounds_played} rounds</p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-white font-black text-sm">{entry.total_score.toLocaleString()}</p>
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