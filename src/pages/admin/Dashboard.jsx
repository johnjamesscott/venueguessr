import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import { Trophy, Users, MapPin, Target, TrendingUp, Calendar, UserCheck, Zap } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [competitions, venues, entries, leads] = await Promise.all([
        base44.entities.Competition.filter({ active: true }),
        base44.entities.Venue.list(),
        base44.entities.LeaderboardEntry.list('-total_score', 500),
        base44.entities.Lead.list(),
      ]);

      const competition = competitions[0] || null;
      const compEntries = competition
        ? entries.filter(e => e.competition_id === competition.id)
        : entries;
      const compLeads = competition
        ? leads.filter(l => l.competition_id === competition.id)
        : leads;

      const today = new Date().toISOString().slice(0, 10);
      const todayEntries = compEntries.filter(e => e.created_date?.slice(0, 10) === today);
      const todayLeads = compLeads.filter(l => l.created_date?.slice(0, 10) === today);
      const topScore = compEntries.length ? Math.max(...compEntries.map(e => e.total_score || 0)) : 0;
      const convRate = compEntries.length
        ? Math.round((compLeads.length / compEntries.length) * 100)
        : 0;

      setStats({
        competition,
        totalVenues: venues.length,
        activeVenues: venues.filter(v => v.active).length,
        totalPlayers: compEntries.length,
        totalLeads: compLeads.length,
        topScore,
        convRate,
        todayLeads: todayLeads.length,
        todayGames: todayEntries.length,
      });
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          {stats?.competition ? (
            <p className="text-hb-text-muted mt-1">
              Active: <span className="text-hb-red font-semibold">{stats.competition.name}</span>
              {stats.competition.event_location && ` · ${stats.competition.event_location}`}
            </p>
          ) : (
            <p className="text-yellow-400 mt-1 text-sm">⚠ No active competition. Set one in Competition Manager.</p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-hb-surface rounded-lg h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Players" value={stats.totalPlayers} icon={<Users size={20} />} color="red" />
            <StatCard label="Total Leads" value={stats.totalLeads} icon={<UserCheck size={20} />} color="green" />
            <StatCard label="Top Score" value={stats.topScore.toLocaleString()} icon={<Trophy size={20} />} color="yellow" />
            <StatCard label="Conversion Rate" value={`${stats.convRate}%`} icon={<TrendingUp size={20} />} color="blue" />
            <StatCard label="Active Venues" value={`${stats.activeVenues} / ${stats.totalVenues}`} icon={<MapPin size={20} />} />
            <StatCard label="Games Today" value={stats.todayGames} icon={<Zap size={20} />} />
            <StatCard label="Leads Today" value={stats.todayLeads} icon={<Calendar size={20} />} color="green" />
            <StatCard label="All Venues" value={stats.totalVenues} icon={<Target size={20} />} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}