import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Trophy, TrendingUp, Target, BarChart2, MapPin } from 'lucide-react';

export default function Analytics() {
  const [selectedComp, setSelectedComp] = useState('');

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-created_date', 50),
  });
  const activeComp = competitions.find(c => c.active) || competitions[0];
  const compId = selectedComp || activeComp?.id;

  const { data: entries = [] } = useQuery({
    queryKey: ['analytics-entries', compId],
    queryFn: () => compId
      ? base44.entities.LeaderboardEntry.filter({ competition_id: compId })
      : base44.entities.LeaderboardEntry.list('-total_score', 1000),
    enabled: !!compId,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['analytics-leads', compId],
    queryFn: () => compId
      ? base44.entities.Lead.filter({ competition_id: compId })
      : base44.entities.Lead.list('-created_date', 1000),
    enabled: !!compId,
  });

  const totalGames = entries.length;
  const totalLeads = leads.length;
  const topScore = entries.length ? Math.max(...entries.map(e => e.total_score || 0)) : 0;
  const avgScore = entries.length ? Math.round(entries.reduce((s, e) => s + (e.total_score || 0), 0) / entries.length) : 0;
  const convRate = totalGames ? Math.round((totalLeads / totalGames) * 100) : 0;
  const uniqueEmails = new Set(entries.map(e => e.email).filter(Boolean)).size;

  // Daily activity chart (last 14 days)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const dailyData = last14.map(date => ({
    date: date.slice(5),
    games: entries.filter(e => e.created_date?.slice(0, 10) === date).length,
    leads: leads.filter(l => l.created_date?.slice(0, 10) === date).length,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <select className="bg-hb-surface border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
            value={selectedComp || activeComp?.id || ''} onChange={e => setSelectedComp(e.target.value)}>
            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? ' (active)' : ''}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Games Played" value={totalGames} icon={<BarChart2 size={20} />} />
          <StatCard label="Unique Players" value={uniqueEmails} icon={<Users size={20} />} />
          <StatCard label="Leads Collected" value={totalLeads} icon={<Target size={20} />} color="green" />
          <StatCard label="Conversion Rate" value={`${convRate}%`} icon={<TrendingUp size={20} />} color="blue" />
          <StatCard label="Top Score" value={topScore.toLocaleString()} icon={<Trophy size={20} />} color="yellow" />
          <StatCard label="Avg Score" value={avgScore.toLocaleString()} icon={<BarChart2 size={20} />} />
        </div>

        <div className="bg-hb-surface border border-hb-border rounded-xl p-5">
          <h2 className="text-white font-bold mb-4">Daily Activity (last 14 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8 }} />
              <Bar dataKey="games" name="Games" fill="#AF231C" radius={[4, 4, 0, 0]} />
              <Bar dataKey="leads" name="Leads" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-hb-text-muted"><span className="w-3 h-3 rounded bg-hb-red inline-block" />Games</span>
            <span className="flex items-center gap-1.5 text-xs text-hb-text-muted"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Leads</span>
          </div>
        </div>

        {entries.length > 0 && (
          <div className="bg-hb-surface border border-hb-border rounded-xl p-5">
            <h2 className="text-white font-bold mb-4">Score Distribution</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={(() => {
                const buckets = [0,500,1000,1500,2000,2500,3000,3500,4000,4500,5000];
                return buckets.slice(0,-1).map((low, i) => ({
                  range: `${low/1000}k`,
                  count: entries.filter(e => e.total_score >= low && e.total_score < buckets[i+1]).length,
                }));
              })()} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="range" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff', borderRadius: 8 }} />
                <Bar dataKey="count" name="Players" fill="#AF231C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}