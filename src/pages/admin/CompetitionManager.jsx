import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, CheckCircle, Archive, RotateCcw } from 'lucide-react';

function CompetitionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', event_location: '', start_date: '', end_date: '', description: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (initial?.id) {
      await base44.entities.Competition.update(initial.id, form);
    } else {
      await base44.entities.Competition.create({ ...form, active: false, archived: false });
    }
    onSave();
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-4">
      <h3 className="font-bold text-white mb-4">{initial?.id ? 'Edit Competition' : 'New Competition'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Competition name *" value={form.name} onChange={e => set('name', e.target.value)} />
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Event location" value={form.event_location} onChange={e => set('event_location', e.target.value)} />
        <input type="date" className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        <input type="date" className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        <textarea className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm md:col-span-2" placeholder="Description" rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={handleSave} className="bg-[#AF231C] hover:bg-[#8C1C16] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">Save</button>
        <button onClick={onCancel} className="bg-[#222] hover:bg-[#2a2a2a] text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancel</button>
      </div>
    </div>
  );
}

export default function CompetitionManager() {
  const [competitions, setCompetitions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const load = async () => {
    const all = await base44.entities.Competition.list('-created_date', 100);
    setCompetitions(all);
  };

  useEffect(() => { load(); }, []);

  const activate = async (comp) => {
    // Deactivate all others first
    const active = competitions.filter(c => c.active);
    for (const c of active) {
      await base44.entities.Competition.update(c.id, { active: false });
    }
    await base44.entities.Competition.update(comp.id, { active: true, archived: false });
    load();
  };

  const archive = async (comp) => {
    await base44.entities.Competition.update(comp.id, { active: false, archived: true });
    load();
  };

  const unarchive = async (comp) => {
    await base44.entities.Competition.update(comp.id, { archived: false });
    load();
  };

  const visible = competitions.filter(c => showArchived ? c.archived : !c.archived);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Competitions</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowArchived(p => !p)} className="text-sm text-[#888] hover:text-white border border-[#333] px-3 py-1.5 rounded-lg transition-colors">
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-[#AF231C] hover:bg-[#8C1C16] text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={14} /> New Competition
          </button>
        </div>
      </div>

      {showForm && !editing && (
        <CompetitionForm onSave={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
      )}

      <div className="space-y-3">
        {visible.length === 0 && <div className="text-[#666] text-sm text-center py-12">No competitions found.</div>}
        {visible.map(comp => (
          <div key={comp.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            {editing?.id === comp.id ? (
              <CompetitionForm initial={comp} onSave={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{comp.name}</span>
                    {comp.active && <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                    {comp.archived && <span className="bg-[#333] text-[#888] text-xs px-2 py-0.5 rounded-full">Archived</span>}
                  </div>
                  {comp.event_location && <div className="text-[#888] text-xs mt-0.5">{comp.event_location}</div>}
                  {(comp.start_date || comp.end_date) && (
                    <div className="text-[#666] text-xs mt-0.5">{comp.start_date} → {comp.end_date}</div>
                  )}
                  {comp.description && <div className="text-[#777] text-xs mt-1">{comp.description}</div>}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!comp.active && !comp.archived && (
                    <button onClick={() => activate(comp)} className="flex items-center gap-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg transition-colors">
                      <CheckCircle size={12} /> Activate
                    </button>
                  )}
                  {comp.active && (
                    <span className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg">
                      <CheckCircle size={12} /> Active
                    </span>
                  )}
                  <button onClick={() => setEditing(comp)} className="flex items-center gap-1.5 text-xs bg-[#222] hover:bg-[#2a2a2a] text-[#aaa] border border-[#333] px-3 py-1.5 rounded-lg transition-colors">
                    <Edit2 size={12} /> Edit
                  </button>
                  {comp.archived ? (
                    <button onClick={() => unarchive(comp)} className="flex items-center gap-1.5 text-xs bg-[#222] hover:bg-[#2a2a2a] text-[#aaa] border border-[#333] px-3 py-1.5 rounded-lg transition-colors">
                      <RotateCcw size={12} /> Unarchive
                    </button>
                  ) : (
                    <button onClick={() => archive(comp)} className="flex items-center gap-1.5 text-xs bg-[#222] hover:bg-[#2a2a2a] text-[#aaa] border border-[#333] px-3 py-1.5 rounded-lg transition-colors">
                      <Archive size={12} /> Archive
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}