import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AnalyticsDashboard() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (compId) => {
    setLoading(true);
    const [entries, leads, venues] = await Promise.all([
      compId ? base44.entities.LeaderboardEntry.filter({ competition_id: compId }) : base44.entities.LeaderboardEntry.list('-created_date', 500),
      compId ? base44.entities.Lead.filter({ competition_id: compId }) : base44.entities.Lead.list('-created_date', 500),
      base44.entities.Venue.list(),
    ]);

    const scores = entries.map(e => e.total_score || 0);
    const topScore = scores.length ? Math.max(...scores) : 0;
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const convRate = entries.length ? Math.round((leads.length / entries.length) * 100) : 0;

    // Daily activity (last 14 days)
    const days = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = { date: key.slice(5), games: 0, leads: 0 };
    }
    entries.forEach(e => {
      const d = e.created_date?.split('T')[0];
      if (days[d]) days[d].games++;
    });
    leads.forEach(l => {
      const d = l.created_date?.split('T')[0];
      if (days[d]) days[d].leads++;
    });

    setStats({
      totalGames: entries.length,
      uniqueEmails: new Set(entries.map(e => e.email).filter(Boolean)).size,
      totalLeads: leads.length,
      convRate,
      topScore,
      avgScore,
      activeVenues: venues.filter(v => v.active).length,
      dailyData: Object.values(days),
    });
    setLoading(false);
  };

  useEffect(() => {
    base44.entities.Competition.filter({ archived: false }).then(comps => {
      setCompetitions(comps);
      const active = comps.find(c => c.active);
      const id = active?.id || '';
      setSelectedComp(id);
      load(id);
    });
  }, []);

  const StatCard = ({ label, value, sub = null }) => (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <div className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-[#555] text-xs mt-1">{sub}</div>}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <select className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm" value={selectedComp} onChange={e => { setSelectedComp(e.target.value); load(e.target.value); }}>
          <option value="">All competitions</option>
          {competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? ' (Active)' : ''}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#2a2a2a] border-t-[#AF231C] rounded-full animate-spin" />
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Games Played" value={stats.totalGames.toLocaleString()} />
            <StatCard label="Unique Players" value={stats.uniqueEmails.toLocaleString()} />
            <StatCard label="Leads Collected" value={stats.totalLeads.toLocaleString()} />
            <StatCard label="Conversion Rate" value={`${stats.convRate}%`} sub="Leads / players" />
            <StatCard label="Top Score" value={stats.topScore.toLocaleString()} />
            <StatCard label="Average Score" value={stats.avgScore.toLocaleString()} />
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
            <h2 className="font-bold text-white mb-4 text-sm">Daily Activity — Last 14 Days</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.dailyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="games" name="Games" fill="#AF231C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leads" name="Leads" fill="#C76560" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
