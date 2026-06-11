import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Edit2, Archive, CheckCircle, Circle } from 'lucide-react';

function CompetitionModal({ comp, onClose, onSave }) {
  const [form, setForm] = useState(comp || { name: '', event_location: '', start_date: '', end_date: '', description: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-hb-surface border border-hb-border rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-white font-bold text-lg">{comp ? 'Edit Competition' : 'New Competition'}</h2>
        {['name', 'event_location', 'description'].map(f => (
          <div key={f}>
            <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">{f.replace('_', ' ')}</label>
            <input className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
              value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-3">
          {['start_date', 'end_date'].map(f => (
            <div key={f}>
              <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">{f.replace('_', ' ')}</label>
              <input type="date" className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
                value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-hb-text-muted hover:text-white border border-hb-border rounded-lg">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-hb-red text-white rounded-lg font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Competitions() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-created_date', 100),
  });

  const save = useMutation({
    mutationFn: async (form) => {
      if (form.id) return base44.entities.Competition.update(form.id, form);
      return base44.entities.Competition.create(form);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['competitions'] }); setModal(null); },
  });

  const activate = useMutation({
    mutationFn: async (comp) => {
      // Deactivate all
      for (const c of competitions) {
        if (c.active) await base44.entities.Competition.update(c.id, { active: false });
      }
      await base44.entities.Competition.update(comp.id, { active: true, archived: false });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitions'] }),
  });

  const archive = useMutation({
    mutationFn: (comp) => base44.entities.Competition.update(comp.id, { active: false, archived: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitions'] }),
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Competitions</h1>
          <button onClick={() => setModal({})} className="flex items-center gap-2 bg-hb-red text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <Plus size={16} /> New
          </button>
        </div>

        {isLoading ? <div className="text-hb-text-muted">Loading…</div> : (
          <div className="space-y-3">
            {competitions.map(c => (
              <div key={c.id} className={`bg-hb-surface border rounded-xl px-5 py-4 flex items-center gap-4 ${c.active ? 'border-hb-red' : 'border-hb-border'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{c.name}</span>
                    {c.active && <span className="bg-hb-red text-white text-xs px-2 py-0.5 rounded-full font-semibold">ACTIVE</span>}
                    {c.archived && <span className="bg-hb-surface-2 text-hb-text-muted text-xs px-2 py-0.5 rounded-full">Archived</span>}
                  </div>
                  <p className="text-hb-text-muted text-sm mt-0.5">{[c.event_location, c.start_date, c.end_date].filter(Boolean).join(' · ')}</p>
                  {c.description && <p className="text-hb-text-muted text-xs mt-1">{c.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!c.active && !c.archived && (
                    <button onClick={() => activate.mutate(c)} title="Activate" className="p-2 text-green-400 hover:bg-hb-surface-2 rounded-lg">
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button onClick={() => setModal(c)} className="p-2 text-hb-text-muted hover:text-white hover:bg-hb-surface-2 rounded-lg">
                    <Edit2 size={18} />
                  </button>
                  {!c.archived && (
                    <button onClick={() => archive.mutate(c)} title="Archive" className="p-2 text-hb-text-muted hover:text-yellow-400 hover:bg-hb-surface-2 rounded-lg">
                      <Archive size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {competitions.length === 0 && <p className="text-hb-text-muted text-sm">No competitions yet.</p>}
          </div>
        )}
      </div>
      {modal !== null && (
        <CompetitionModal comp={modal.id ? modal : null} onClose={() => setModal(null)} onSave={form => save.mutate({ ...modal, ...form })} />
      )}
    </AdminLayout>
  );
}