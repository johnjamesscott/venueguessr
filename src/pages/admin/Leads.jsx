import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Search, Download, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

function exportCSV(leads) {
  const rows = [['First Name','Last Name','Email','Company','Score','Competition','Consent','Mailjet Synced','Date']];
  leads.forEach(l => rows.push([l.first_name, l.last_name, l.email, l.company, l.score, l.competition_id, l.consent, l.mailjet_synced, l.created_date?.slice(0,10)]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leads.csv'; a.click();
}

export default function Leads() {
  const [search, setSearch] = useState('');
  const [selectedComp, setSelectedComp] = useState('');

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-created_date', 50),
  });
  const activeComp = competitions.find(c => c.active) || competitions[0];
  const compId = selectedComp || activeComp?.id;

  const { data: leads = [], isLoading, refetch } = useQuery({
    queryKey: ['leads', compId],
    queryFn: () => compId
      ? base44.entities.Lead.filter({ competition_id: compId })
      : base44.entities.Lead.list('-created_date', 500),
  });

  const sorted = [...leads].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  const filtered = sorted.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.first_name?.toLowerCase().includes(q) || l.last_name?.toLowerCase().includes(q)
      || l.email?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q);
  });

  const synced = filtered.filter(l => l.mailjet_synced).length;

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Lead Manager</h1>
            <p className="text-hb-text-muted text-sm mt-0.5">{filtered.length} leads · {synced} Mailjet synced</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="flex items-center gap-2 border border-hb-border text-white px-3 py-2 rounded-lg text-sm hover:bg-hb-surface-2">
              <RefreshCw size={15} /> Refresh
            </button>
            <button onClick={() => exportCSV(filtered)} className="flex items-center gap-2 border border-hb-border text-white px-3 py-2 rounded-lg text-sm hover:bg-hb-surface-2">
              <Download size={15} /> Export CSV
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
              placeholder="Search leads…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? <div className="text-hb-text-muted">Loading…</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-hb-text-muted text-xs uppercase tracking-wider border-b border-hb-border">
                  {['Name','Email','Company','Score','Consent','Mailjet','Date'].map(h => (
                    <th key={h} className="text-left py-3 px-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b border-hb-border hover:bg-hb-surface-2 transition-colors">
                    <td className="py-3 px-2 text-white font-semibold">{l.first_name} {l.last_name}</td>
                    <td className="py-3 px-2 text-hb-text-muted">{l.email}</td>
                    <td className="py-3 px-2 text-hb-text-muted">{l.company || '—'}</td>
                    <td className="py-3 px-2 text-hb-red font-bold">{(l.score || 0).toLocaleString()}</td>
                    <td className="py-3 px-2">
                      {l.consent ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-hb-text-muted" />}
                    </td>
                    <td className="py-3 px-2">
                      {l.mailjet_synced ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-hb-text-muted" />}
                    </td>
                    <td className="py-3 px-2 text-hb-text-muted">{l.created_date?.slice(0,10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-hb-text-muted text-sm py-4">No leads found.</p>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}