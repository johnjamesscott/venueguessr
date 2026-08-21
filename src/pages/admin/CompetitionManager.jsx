import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, CheckCircle, Archive, RotateCcw } from 'lucide-react';

const DEFAULT_FORM = {
  name: '',
  event_location: '',
  start_date: '',
  end_date: '',
  description: '',
  icp_multiplier: 1.25,
  round_count: 3,
  round_seconds: 30,
  kiosk_idle_seconds: 90,
};

function CompetitionForm({ initial = null, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM, ...(initial || {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      event_location: form.event_location?.trim() || '',
      start_date: form.start_date || '',
      end_date: form.end_date || '',
      description: form.description?.trim() || '',
      icp_multiplier: Math.min(2, Math.max(1, Number(form.icp_multiplier) || 1.25)),
      round_count: Math.min(5, Math.max(1, Math.round(Number(form.round_count) || 3))),
      round_seconds: Math.min(90, Math.max(15, Math.round(Number(form.round_seconds) || 30))),
      kiosk_idle_seconds: Math.min(300, Math.max(30, Math.round(Number(form.kiosk_idle_seconds) || 90))),
    };
    try {
      if (initial?.id) {
        await base44.entities.Competition.update(initial.id, payload);
      } else {
        await base44.entities.Competition.create({ ...payload, active: false, archived: false });
      }
      onSave();
    } catch (_) {
      setError('Could not save these settings. Please try again.');
      setSaving(false);
    }
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
        <label className="text-[#aaa] text-xs font-semibold">
          ICP multiplier
          <input type="number" min="1" max="2" step="0.05" className="mt-1 w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" value={form.icp_multiplier} onChange={e => set('icp_multiplier', e.target.value)} />
        </label>
        <label className="text-[#aaa] text-xs font-semibold">
          Rounds per game
          <input type="number" min="1" max="5" step="1" className="mt-1 w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" value={form.round_count} onChange={e => set('round_count', e.target.value)} />
        </label>
        <label className="text-[#aaa] text-xs font-semibold">
          Seconds per round
          <input type="number" min="15" max="90" step="5" className="mt-1 w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" value={form.round_seconds} onChange={e => set('round_seconds', e.target.value)} />
        </label>
        <label className="text-[#aaa] text-xs font-semibold">
          Kiosk reset after inactivity
          <div className="relative mt-1">
            <input type="number" min="30" max="300" step="15" className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 pr-16 text-white text-sm" value={form.kiosk_idle_seconds} onChange={e => set('kiosk_idle_seconds', e.target.value)} />
            <span className="absolute right-3 top-2 text-[#666] text-xs">seconds</span>
          </div>
        </label>
      </div>
      {error && <p className="text-red-400 text-xs mt-3" role="alert">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button disabled={saving} onClick={handleSave} className="bg-[#AF231C] hover:bg-[#8C1C16] disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">{saving ? 'Saving…' : 'Save'}</button>
        <button disabled={saving} onClick={onCancel} className="bg-[#222] hover:bg-[#2a2a2a] disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancel</button>
      </div>
    </div>
  );
}

export default function CompetitionManager() {
  const [competitions, setCompetitions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [managerError, setManagerError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setManagerError('');
    try {
      const all = await base44.entities.Competition.list('-created_date', 100);
      setCompetitions(all);
    } catch (_) {
      setManagerError('Could not load competitions. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAction = async (id, action) => {
    if (busyId) return;
    setBusyId(id);
    setManagerError('');
    try {
      await action();
      await load();
    } catch (_) {
      setManagerError('That change could not be saved. Please retry.');
    } finally {
      setBusyId(null);
    }
  };

  const activate = async (comp) => {
    await runAction(comp.id, async () => {
      const active = competitions.filter(c => c.active);
      for (const c of active) {
        await base44.entities.Competition.update(c.id, { active: false });
      }
      await base44.entities.Competition.update(comp.id, { active: true, archived: false });
    });
  };

  const archive = async (comp) => {
    await runAction(comp.id, () => base44.entities.Competition.update(comp.id, { active: false, archived: true }));
  };

  const unarchive = async (comp) => {
    await runAction(comp.id, () => base44.entities.Competition.update(comp.id, { archived: false }));
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

      {managerError && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          <span>{managerError}</span>
          <button onClick={load} className="font-bold underline">Retry</button>
        </div>
      )}

      <div className="space-y-3">
        {loading && <div className="text-[#888] text-sm text-center py-12">Loading competitions…</div>}
        {!loading && visible.length === 0 && <div className="text-[#666] text-sm text-center py-12">No competitions found.</div>}
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
                  <div className="text-[#666] text-xs mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    <span>{Number(comp.icp_multiplier) || 1.25}x ICP</span>
                    <span>{Number(comp.round_count) || 3} rounds</span>
                    <span>{Number(comp.round_seconds) || 30}s per round</span>
                    <span>{Number(comp.kiosk_idle_seconds) || 90}s idle reset</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!comp.active && !comp.archived && (
                    <button disabled={Boolean(busyId)} onClick={() => activate(comp)} className="flex items-center gap-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 disabled:opacity-50 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg transition-colors">
                      <CheckCircle size={12} /> {busyId === comp.id ? 'Saving…' : 'Activate'}
                    </button>
                  )}
                  {comp.active && (
                    <span className="flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg">
                      <CheckCircle size={12} /> Active
                    </span>
                  )}
                  <button disabled={Boolean(busyId)} onClick={() => setEditing(comp)} className="flex items-center gap-1.5 text-xs bg-[#222] hover:bg-[#2a2a2a] disabled:opacity-50 text-[#aaa] border border-[#333] px-3 py-1.5 rounded-lg transition-colors">
                    <Edit2 size={12} /> Edit
                  </button>
                  {comp.archived ? (
                    <button disabled={Boolean(busyId)} onClick={() => unarchive(comp)} className="flex items-center gap-1.5 text-xs bg-[#222] hover:bg-[#2a2a2a] disabled:opacity-50 text-[#aaa] border border-[#333] px-3 py-1.5 rounded-lg transition-colors">
                      <RotateCcw size={12} /> {busyId === comp.id ? 'Saving…' : 'Unarchive'}
                    </button>
                  ) : (
                    <button disabled={Boolean(busyId)} onClick={() => archive(comp)} className="flex items-center gap-1.5 text-xs bg-[#222] hover:bg-[#2a2a2a] disabled:opacity-50 text-[#aaa] border border-[#333] px-3 py-1.5 rounded-lg transition-colors">
                      <Archive size={12} /> {busyId === comp.id ? 'Saving…' : 'Archive'}
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
