import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Download, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { downloadCsv } from '@/utils/csv';

export default function LeadManager() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async (compId) => {
    setLoading(true);
    const all = compId
      ? await base44.entities.Lead.filter({ competition_id: compId })
      : await base44.entities.Lead.list('-created_date', 500);
    setLeads(all.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime()));
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

  const syncMailjet = async (lead) => {
    await base44.functions.invoke('syncLeadToMailjet', { lead_id: lead.id });
    load(selectedComp);
  };

  const exportCSV = () => {
    const rows = [['First Name', 'Last Name', 'Email', 'Company', 'Score', 'Consent', 'Mailjet Synced', 'Date']];
    filtered.forEach(l => {
      rows.push([l.first_name, l.last_name, l.email, l.company, l.score, l.consent, l.mailjet_synced, l.created_date?.split('T')[0]]);
    });
    downloadCsv(`leads-${selectedComp || 'all'}.csv`, rows);
  };

  const filtered = leads.filter(l => !search ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.company?.toLowerCase().includes(search.toLowerCase()));

  const syncedCount = filtered.filter(l => l.mailjet_synced).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Lead Manager</h1>
          <p className="text-[#666] text-xs mt-0.5">{filtered.length} leads · {syncedCount} synced to Mailjet</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 text-sm border border-[#333] hover:bg-[#1e1e1e] text-[#aaa] px-3 py-2 rounded-lg transition-colors">
            <Download size={14} /> Export CSV
          </button>
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
          <input className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-2 text-white text-sm placeholder-[#555]" placeholder="Search by name, email or company..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              {['Name', 'Email', 'Company', 'Score', 'Mailjet', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[#666] font-semibold text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-[#555]">{loading ? 'Loading...' : 'No leads found'}</td></tr>
            )}
            {filtered.map(lead => (
              <tr key={lead.id} className="border-b border-[#2a2a2a] last:border-0 hover:bg-[#222] transition-colors">
                <td className="px-4 py-3 text-white font-medium">{lead.first_name} {lead.last_name}</td>
                <td className="px-4 py-3 text-[#888]">{lead.email}</td>
                <td className="px-4 py-3 text-[#888]">{lead.company || '—'}</td>
                <td className="px-4 py-3 font-bold text-[#AF231C]">{lead.score?.toLocaleString() || '—'}</td>
                <td className="px-4 py-3">
                  {lead.mailjet_synced
                    ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={12} /> Synced</span>
                    : <button onClick={() => syncMailjet(lead)} className="flex items-center gap-1 text-xs text-[#888] hover:text-white border border-[#333] px-2 py-1 rounded transition-colors"><XCircle size={12} /> Sync</button>}
                </td>
                <td className="px-4 py-3 text-[#666] text-xs">{lead.created_date?.split('T')[0]}</td>
                <td className="px-4 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
