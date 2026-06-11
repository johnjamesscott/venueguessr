import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, Gift } from 'lucide-react';

export default function PrizeManager() {
  const [competitions, setCompetitions] = useState([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [prizes, setPrizes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ position: '', prize_name: '', description: '', active: true });
  const [showForm, setShowForm] = useState(false);

  const load = async (compId) => {
    const all = await base44.entities.Prize.filter({ competition_id: compId });
    setPrizes(all.sort((a, b) => (a.position || 0) - (b.position || 0)));
  };

  useEffect(() => {
    base44.entities.Competition.filter({ archived: false }).then(comps => {
      setCompetitions(comps);
      const active = comps.find(c => c.active);
      if (active) { setSelectedComp(active.id); load(active.id); }
    });
  }, []);

  useEffect(() => {
    if (selectedComp) load(selectedComp);
  }, [selectedComp]);

  const save = async () => {
    const payload = { ...form, competition_id: selectedComp, position: parseInt(form.position) || prizes.length + 1 };
    if (editing) {
      await base44.entities.Prize.update(editing.id, payload);
    } else {
      await base44.entities.Prize.create(payload);
    }
    setShowForm(false); setEditing(null); setForm({ position: '', prize_name: '', description: '', active: true });
    load(selectedComp);
  };

  const remove = async (prize) => {
    if (!confirm(`Delete "${prize.prize_name}"?`)) return;
    await base44.entities.Prize.delete(prize.id);
    load(selectedComp);
  };

  const move = async (prize, dir) => {
    const newPos = prize.position + dir;
    const other = prizes.find(p => p.position === newPos);
    if (other) await base44.entities.Prize.update(other.id, { position: prize.position });
    await base44.entities.Prize.update(prize.id, { position: newPos });
    load(selectedComp);
  };

  const startEdit = (prize) => {
    setEditing(prize);
    setForm({ position: prize.position, prize_name: prize.prize_name, description: prize.description || '', active: prize.active });
    setShowForm(true);
  };

  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Prize Manager</h1>
        {selectedComp && (
          <button onClick={() => { setEditing(null); setShowForm(true); setForm({ position: prizes.length + 1, prize_name: '', description: '', active: true }); }}
            className="bg-[#AF231C] hover:bg-[#8C1C16] text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={14} /> Add Prize
          </button>
        )}
      </div>

      <div className="mb-4">
        <select className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm" value={selectedComp} onChange={e => setSelectedComp(e.target.value)}>
          <option value="">Select competition...</option>
          {competitions.map(c => <option key={c.id} value={c.id}>{c.name}{c.active ? ' (Active)' : ''}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-4">
          <h3 className="font-bold text-white mb-4">{editing ? 'Edit Prize' : 'New Prize'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="number" className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Position (1=1st place)" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
            <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Prize name *" value={form.prize_name} onChange={e => setForm(p => ({ ...p, prize_name: e.target.value }))} />
            <textarea className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm md:col-span-2" placeholder="Description" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="bg-[#AF231C] hover:bg-[#8C1C16] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="bg-[#222] text-white text-sm px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {!selectedComp && (
        <div className="text-center py-16 text-[#666]">
          <Gift size={32} className="mx-auto mb-3 opacity-30" />
          <p>Select a competition to manage prizes</p>
        </div>
      )}

      {selectedComp && prizes.length === 0 && !showForm && (
        <div className="text-center py-16 text-[#666]">
          <Gift size={32} className="mx-auto mb-3 opacity-30" />
          <p>No prizes yet. Add your first prize!</p>
        </div>
      )}

      <div className="space-y-2">
        {prizes.map((prize, idx) => (
          <div key={prize.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{MEDALS[idx] || `#${prize.position}`}</span>
              <div>
                <div className="font-bold text-white">{prize.prize_name}</div>
                {prize.description && <div className="text-[#888] text-xs">{prize.description}</div>}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => move(prize, -1)} disabled={prize.position <= 1} className="p-2 rounded-lg bg-[#222] text-[#888] hover:text-white disabled:opacity-30 transition-colors"><ChevronUp size={14} /></button>
              <button onClick={() => move(prize, 1)} className="p-2 rounded-lg bg-[#222] text-[#888] hover:text-white transition-colors"><ChevronDown size={14} /></button>
              <button onClick={() => startEdit(prize)} className="p-2 rounded-lg bg-[#222] text-[#888] hover:text-white transition-colors"><Edit2 size={14} /></button>
              <button onClick={() => remove(prize)} className="p-2 rounded-lg bg-[#222] text-[#888] hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}