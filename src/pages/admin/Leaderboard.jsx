import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Trash2, Search, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { base44 as b44 } from '@/api/base44Client';

function exportCSV(entries) {
  const rows = [['Name','Email','Score','Rounds','Avg Distance (km)','Date']];
  entries.forEach(e => rows.push([e.player_name, e.email, e.total_score, e.rounds_played, e.avg_distance_km, e.created_date?.slice(0,10)]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leaderboard.csv'; a.click();
}

export default function AdminLeaderboard() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedComp, setSelectedComp] = useState('');
  const [showReset, setShowReset] = useState(false);

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-created_date', 50),
  });
  const activeComp = competitions.find(c => c.active) || competitions[0];

  const compId = selectedComp || activeComp?.id;

  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey: ['leaderboard-admin', compId],
    queryFn: () => compId
      ? base44.entities.LeaderboardEntry.filter({ competition_id: compId })
      : base44.entities.LeaderboardEntry.list('-total_score', 200),
    refetchInterval: 15_000,
  });

  const sorted = [...entries].sort((a, b) => b.total_score - a.total_score);
  const filtered = sorted.filter(e => !search || e.player_name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase()));

  const del = useMutation({
    mutationFn: id => base44.entities.LeaderboardEntry.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaderboard-admin'] }),
  });

  const reset = useMutation({
    mutationFn: () => base44.functions.invoke('resetCompetition', { competition_id: compId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leaderboard-admin'] }); setShowReset(false); },
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="flex items-center gap-2 border border-hb-border text-white px-3 py-2 rounded-lg text-sm hover:bg-hb-surface-2">
              <RefreshCw size={15} /> Refresh
            </button>
            <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 border border-hb-border text-white px-3 py-2 rounded-lg text-sm hover:bg-hb-surface-2">
              <Download size={15} /> Export CSV
            </button>
            <button onClick={() => setShowReset(true)} className="flex items-center gap-2 border border-red-800 text-red-400 px-3 py-2 rounded-lg text-sm hover:bg-red-950">
              <AlertTriangle size={15} /> Reset
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <select className="bg-hb-surface border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
            value={selectedComp || activeComp?.id || ''} onChange={e => setSelectedComp(e.target.value)}>
            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? ' (active)' : ''}</option>)}
          </select>
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hb-text-muted" />
            <input className="w-full bg-hb-surface border border-hb-border rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
              placeholder="Search players…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <p className="text-hb-text-muted text-sm">{filtered.length} entries · Auto-refreshes every 15s</p>

        {isLoading ? <div className="text-hb-text-muted">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-hb-text-muted text-xs uppercase tracking-wider border-b border-hb-border">
                  {['Rank','Name','Email','Score','Rounds','Avg Dist','Date',''].map(h => (
                    <th key={h} className="text-left py-3 px-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id} className="border-b border-hb-border hover:bg-hb-surface-2 transition-colors">
                    <td className="py-3 px-2 text-hb-text-muted font-bold">#{i + 1}</td>
                    <td className="py-3 px-2 text-white font-semibold">{e.player_name}</td>
                    <td className="py-3 px-2 text-hb-text-muted">{e.email}</td>
                    <td className="py-3 px-2 text-hb-red font-bold">{(e.total_score || 0).toLocaleString()}</td>
                    <td className="py-3 px-2 text-hb-text-muted">{e.rounds_played}</td>
                    <td className="py-3 px-2 text-hb-text-muted">{e.avg_distance_km ? `${e.avg_distance_km} km` : '—'}</td>
                    <td className="py-3 px-2 text-hb-text-muted">{e.created_date?.slice(0,10)}</td>
                    <td className="py-3 px-2">
                      <button onClick={() => { if (confirm('Delete entry?')) del.mutate(e.id); }}
                        className="p-1.5 text-hb-text-muted hover:text-red-400 rounded">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-hb-text-muted text-sm py-4">No entries found.</p>}
          </div>
        )}
      </div>

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-hb-surface border border-hb-border rounded-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2"><AlertTriangle size={20} className="text-red-400" /> Reset Leaderboard</h2>
            <p className="text-hb-text-muted text-sm">This will permanently delete all leaderboard entries for this competition. Leads and historical data are preserved. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowReset(false)} className="px-4 py-2 text-sm border border-hb-border rounded-lg text-hb-text-muted hover:text-white">Cancel</button>
              <button onClick={() => reset.mutate()} disabled={reset.isPending} className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg font-semibold">
                {reset.isPending ? 'Resetting…' : 'Yes, Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}