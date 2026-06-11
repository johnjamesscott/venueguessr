import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

function PrizeModal({ prize, competitions, onClose, onSave }) {
  const [form, setForm] = useState(prize || { competition_id: competitions[0]?.id || '', position: 1, prize_name: '', description: '', active: true });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-hb-surface border border-hb-border rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-white font-bold text-lg">{prize ? 'Edit Prize' : 'New Prize'}</h2>
        <div>
          <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">Competition</label>
          <select className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
            value={form.competition_id} onChange={e => setForm(p => ({ ...p, competition_id: e.target.value }))}>
            {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">Position</label>
            <input type="number" min="1" className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
              value={form.position} onChange={e => setForm(p => ({ ...p, position: parseInt(e.target.value) }))} />
          </div>
          <div>
            <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">Prize Name</label>
            <input className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
              value={form.prize_name} onChange={e => setForm(p => ({ ...p, prize_name: e.target.value }))} placeholder="e.g. PS5" />
          </div>
        </div>
        <div>
          <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">Description</label>
          <input className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
            value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
          <input type="checkbox" checked={!!form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="accent-hb-red" />
          Active
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-hb-text-muted border border-hb-border rounded-lg hover:text-white">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-hb-red text-white rounded-lg font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

const TROPHY = ['🥇', '🥈', '🥉'];

export default function Prizes() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [selectedComp, setSelectedComp] = useState('');

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-created_date', 50),
  });

  const activeComp = competitions.find(c => c.active) || competitions[0];

  const { data: prizes = [], isLoading } = useQuery({
    queryKey: ['prizes', selectedComp || activeComp?.id],
    queryFn: () => {
      const cid = selectedComp || activeComp?.id;
      return cid ? base44.entities.Prize.filter({ competition_id: cid }) : Promise.resolve([]);
    },
    enabled: !!(selectedComp || activeComp?.id),
  });

  const sorted = [...prizes].sort((a, b) => a.position - b.position);

  const save = useMutation({
    mutationFn: async (form) => {
      if (form.id) return base44.entities.Prize.update(form.id, form);
      return base44.entities.Prize.create(form);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['prizes'] }); setModal(null); },
  });

  const del = useMutation({
    mutationFn: p => base44.entities.Prize.delete(p.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prizes'] }),
  });

  const reorder = useMutation({
    mutationFn: async ({ prize, dir }) => {
      const idx = sorted.findIndex(p => p.id === prize.id);
      const target = sorted[idx + dir];
      if (!target) return;
      await Promise.all([
        base44.entities.Prize.update(prize.id, { position: target.position }),
        base44.entities.Prize.update(target.id, { position: prize.position }),
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['prizes'] }),
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">Prize Manager</h1>
          <button onClick={() => setModal({})} className="flex items-center gap-2 bg-hb-red text-white px-4 py-2 rounded-lg text-sm font-semibold">
            <Plus size={16} /> Add Prize
          </button>
        </div>
        <select className="bg-hb-surface border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
          value={selectedComp || activeComp?.id || ''}
          onChange={e => setSelectedComp(e.target.value)}>
          {competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? ' (active)' : ''}</option>)}
        </select>
        {isLoading ? <div className="text-hb-text-muted">Loading…</div> : (
          <div className="space-y-2">
            {sorted.map((p, i) => (
              <div key={p.id} className="bg-hb-surface border border-hb-border rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl w-8 text-center">{TROPHY[i] || `#${p.position}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold">{p.prize_name}</p>
                  {p.description && <p className="text-hb-text-muted text-xs">{p.description}</p>}
                  {!p.active && <span className="text-xs text-hb-text-muted">Inactive</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => reorder.mutate({ prize: p, dir: -1 })} disabled={i === 0} className="p-1.5 text-hb-text-muted hover:text-white disabled:opacity-30"><ChevronUp size={16} /></button>
                  <button onClick={() => reorder.mutate({ prize: p, dir: 1 })} disabled={i === sorted.length - 1} className="p-1.5 text-hb-text-muted hover:text-white disabled:opacity-30"><ChevronDown size={16} /></button>
                  <button onClick={() => setModal(p)} className="p-2 text-hb-text-muted hover:text-white hover:bg-hb-surface-2 rounded-lg"><Edit2 size={16} /></button>
                  <button onClick={() => { if (confirm('Delete?')) del.mutate(p); }} className="p-2 text-hb-text-muted hover:text-red-400 hover:bg-hb-surface-2 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {sorted.length === 0 && <p className="text-hb-text-muted text-sm">No prizes for this competition yet.</p>}
          </div>
        )}
      </div>
      {modal !== null && (
        <PrizeModal prize={modal.id ? modal : null} competitions={competitions} onClose={() => setModal(null)} onSave={form => save.mutate({ ...modal, ...form })} />
      )}
    </AdminLayout>
  );
}