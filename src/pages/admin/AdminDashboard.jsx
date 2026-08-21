import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, MapPin, Users, Zap, TrendingUp, Target, Calendar } from 'lucide-react';

function StatCard({ label, value, icon: IconComp, sub = null }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#888] text-xs font-semibold uppercase tracking-wider">{label}</span>
        {IconComp && <IconComp size={16} className="text-[#AF231C]" />}
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
      {sub && <div className="text-[#666] text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [competitions, venues] = await Promise.all([
        base44.entities.Competition.filter({ active: true }),
        base44.entities.Venue.list('-created_date', 500),
      ]);

      const competition = competitions[0] || null;
      const today = new Date().toISOString().split('T')[0];
      const [compEntries, compLeads] = await Promise.all([
        competition
          ? base44.entities.LeaderboardEntry.filter({ competition_id: competition.id }, '-created_date', 500)
          : base44.entities.LeaderboardEntry.list('-created_date', 500),
        competition
          ? base44.entities.Lead.filter({ competition_id: competition.id }, '-created_date', 500)
          : base44.entities.Lead.list('-created_date', 500),
      ]);

      const todayEntries = compEntries.filter(e => e.created_date?.startsWith(today));
      const todayLeads = compLeads.filter(l => l.created_date?.startsWith(today));
      const topScore = compEntries.reduce((max, e) => Math.max(max, e.total_score || 0), 0);
      const convRate = compEntries.length > 0
        ? Math.round((compLeads.length / compEntries.length) * 100)
        : 0;

      setData({
        competition,
        totalVenues: venues.length,
        activeVenues: venues.filter(v => v.active).length,
        totalPlayers: compEntries.length,
        totalLeads: compLeads.length,
        topScore,
        convRate,
        leadsToday: todayLeads.length,
        gamesToday: todayEntries.length,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#2a2a2a] border-t-[#AF231C] rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-[#666] text-sm mt-1">
          {data.competition
            ? <>Active competition: <span className="text-white font-semibold">{data.competition.name}</span></>
            : <span className="text-[#AF231C]">No active competition — create one in Competitions</span>}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Players" value={data.totalPlayers.toLocaleString()} icon={Users} sub="This competition" />
        <StatCard label="Total Leads" value={data.totalLeads.toLocaleString()} icon={TrendingUp} sub="This competition" />
        <StatCard label="Top Score" value={data.topScore.toLocaleString()} icon={Trophy} sub="This competition" />
        <StatCard label="Conversion Rate" value={`${data.convRate}%`} icon={Target} sub="Leads / players" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Venues" value={data.activeVenues} icon={MapPin} sub={`of ${data.totalVenues} total`} />
        <StatCard label="Games Today" value={data.gamesToday} icon={Zap} />
        <StatCard label="Leads Today" value={data.leadsToday} icon={Calendar} />
        <StatCard label="All Venues" value={data.totalVenues} icon={MapPin} sub="In database" />
      </div>
    </div>
  );
}
