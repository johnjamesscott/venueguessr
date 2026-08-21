import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Trash2, Download, RotateCcw, RefreshCw } from 'lucide-react';
import { downloadCsv } from '@/utils/csv';

export default function LeaderboardManager() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const load = async (compId) => {
    setLoading(true);
    const all = compId
      ? await base44.entities.LeaderboardEntry.filter({ competition_id: compId })
      : await base44.entities.LeaderboardEntry.list('-total_score', 200);
    setEntries(all.sort((a, b) => (b.total_score || 0) - (a.total_score || 0)));
    setLoading(false);
  };

  useEffect(() => {
    base44.entities.Competition.filter({ archived: false }).then(comps => {
      setCompetitions(comps);
      const active = comps.find(c => c.active);
      if (active) { setSelectedComp(active.id); load(active.id); }
      else load('');
    });
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => load(selectedComp), 15000);
    return () => clearInterval(intervalRef.current);
  }, [selectedComp]);

  const remove = async (entry) => {
    if (!confirm(`Delete entry for "${entry.player_name}"?`)) return;
    await base44.entities.LeaderboardEntry.delete(entry.id);
    load(selectedComp);
  };

  const reset = async () => {
    if (!selectedComp) return;
    if (!confirm('This will delete ALL entries for this competition. This cannot be undone. Continue?')) return;
    const response = await base44.functions.invoke('resetCompetition', { competition_id: selectedComp });
    load(selectedComp);
  };

  const exportCSV = () => {
    const rows = [['Position', 'Player', 'Email', 'Score', 'Rounds', 'Avg Distance (km)', 'Date']];
    filtered.forEach((e, i) => {
      rows.push([i + 1, e.player_name, e.email, e.total_score, e.rounds_played, e.avg_distance_km, e.created_date?.split('T')[0]]);
    });
    downloadCsv(`leaderboard-${selectedComp || 'all'}.csv`, rows);
  };

  const filtered = entries.filter(e => !search || e.player_name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Leaderboard</h1>
          <p className="text-[#666] text-xs mt-0.5">Auto-refreshes every 15s</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="flex items-center gap-2 text-sm border border-[#333] hover:bg-[#1e1e1e] text-[#aaa] px-3 py-2 rounded-lg transition-colors">
            <Download size={14} /> Export CSV
          </button>
          {selectedComp && (
            <button onClick={reset} className="flex items-center gap-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-2 rounded-lg transition-colors">
              <RotateCcw size={14} /> Reset
            </button>
          )}
          <button onClick={() => load(selectedComp)} className="flex items-center gap-2 text-sm border border-[#333] hover:bg-[#1e1e1e] text-[#aaa] px-3 py-2 rounded-lg transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm" value={selectedComp} onChange={e => { setSelectedComp(e.target.value); load(e.target.value); }}>
          <option value="">All competitions</option>
          {competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? ' (Active)' : ''}</option>)}
        </select>
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-2 text-white text-sm placeholder-[#555]" placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase tracking-wider">Player</th>
              <th className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Email</th>
              <th className="text-right px-4 py-3 text-[#666] font-semibold text-xs uppercase tracking-wider">Score</th>
              <th className="text-right px-4 py-3 text-[#666] font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Avg Dist</th>
              <th className="text-right px-4 py-3 text-[#666] font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-[#555]">{loading ? 'Loading...' : 'No entries found'}</td></tr>
            )}
            {filtered.map((entry, i) => (
              <tr key={entry.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#222] transition-colors">
                <td className="px-4 py-3 font-bold text-white">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </td>
                <td className="px-4 py-3 text-white font-medium">{entry.player_name}</td>
                <td className="px-4 py-3 text-[#888] hidden md:table-cell">{entry.email}</td>
                <td className="px-4 py-3 text-right font-bold text-[#AF231C]">{(entry.total_score || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-[#888] hidden md:table-cell">{entry.avg_distance_km ? `${entry.avg_distance_km} km` : '—'}</td>
                <td className="px-4 py-3 text-right text-[#666] text-xs hidden md:table-cell">{entry.created_date?.split('T')[0]}</td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(entry)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#666] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
