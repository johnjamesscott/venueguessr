import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, Search, ExternalLink } from 'lucide-react';

function VenueModal({ venue, onClose, onSave }) {
  const [form, setForm] = useState(venue || {
    venue_name: '', space_name: '', city: '', country: 'GB',
    latitude: '', longitude: '', matterport_url: '', headbox_url: '',
    difficulty: 'medium', featured: false, active: true, is_demo: false
  });
  const [preview, setPreview] = useState(false);

  const embedUrl = form.matterport_url ? (() => {
    const EMBED_PARAMS = 'play=1&qs=1&dh=0&mls=2&gt=0&hr=0&measurements=0&mt=0&brand=0';
    const url = form.matterport_url;
    if (url.includes('my.matterport.com/show/')) {
      const base = url.split('?')[0];
      const existing = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const ours = new URLSearchParams(EMBED_PARAMS);
      const m = existing.get('m'); if (m) ours.set('m', m);
      return `${base}?${ours.toString()}`;
    }
    if (url.includes('tours.headbox.com/model/')) {
      const match = url.match(/\/model\/([^/?]+)/);
      if (match) return `https://my.matterport.com/show/?m=${match[1]}&${EMBED_PARAMS}`;
    }
    return url;
  })() : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-auto">
      <div className="bg-hb-surface border border-hb-border rounded-xl w-full max-w-2xl p-6 space-y-4 my-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">{venue ? 'Edit Venue' : 'Add Venue'}</h2>
          {embedUrl && (
            <button onClick={() => setPreview(p => !p)} className="flex items-center gap-1 text-xs text-hb-red border border-hb-red px-3 py-1.5 rounded-lg">
              <ExternalLink size={12} /> {preview ? 'Hide' : 'Preview Tour'}
            </button>
          )}
        </div>
        {preview && embedUrl && (
          <div className="w-full rounded-lg overflow-hidden" style={{ height: 280 }}>
            <iframe src={embedUrl} className="w-full h-full border-0" allow="xr-spatial-tracking" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {[['venue_name','Venue Name'],['space_name','Space Name'],['city','City'],['country','Country'],['matterport_url','Matterport URL'],['headbox_url','HeadBox URL']].map(([f, l]) => (
            <div key={f} className={f.includes('url') ? 'col-span-2' : ''}>
              <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">{l}</label>
              <input className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
                value={form[f] || ''} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">Latitude</label>
            <input type="number" step="0.0001" className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
              value={form.latitude || ''} onChange={e => setForm(p => ({ ...p, latitude: parseFloat(e.target.value) }))} />
          </div>
          <div>
            <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">Longitude</label>
            <input type="number" step="0.0001" className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
              value={form.longitude || ''} onChange={e => setForm(p => ({ ...p, longitude: parseFloat(e.target.value) }))} />
          </div>
          <div>
            <label className="text-hb-text-muted text-xs uppercase tracking-wider block mb-1">Difficulty</label>
            <select className="w-full bg-hb-surface-2 border border-hb-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
              value={form.difficulty || 'medium'} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))}>
              <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>
          <div className="flex items-center gap-4 pt-4">
            {[['active','Active'],['featured','Featured'],['is_demo','Demo Only']].map(([f, l]) => (
              <label key={f} className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input type="checkbox" checked={!!form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.checked }))} className="accent-hb-red" />
                {l}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-hb-text-muted border border-hb-border rounded-lg hover:text-white">Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 text-sm bg-hb-red text-white rounded-lg font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function Tours() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const fileRef = useRef();

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list('-created_date', 200),
  });

  const save = useMutation({
    mutationFn: async (form) => {
      if (form.id) return base44.entities.Venue.update(form.id, form);
      return base44.entities.Venue.create(form);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['venues'] }); setModal(null); },
  });

  const toggle = useMutation({
    mutationFn: v => base44.entities.Venue.update(v.id, { active: !v.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }),
  });

  const del = useMutation({
    mutationFn: v => base44.entities.Venue.delete(v.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['venues'] }),
  });

  const handleCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').filter(Boolean);
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    for (const line of lines.slice(1)) {
      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, i) => row[h] = vals[i]);
      if (row.venue_name && row.matterport_url) {
        await base44.entities.Venue.create({
          venue_name: row.venue_name, space_name: row.space_name || '',
          city: row.city || '', country: row.country || 'GB',
          latitude: parseFloat(row.latitude) || 0, longitude: parseFloat(row.longitude) || 0,
          matterport_url: row.matterport_url, headbox_url: row.headbox_url || '',
          difficulty: row.difficulty || 'medium', active: true, featured: false, is_demo: false,
        });
      }
    }
    qc.invalidateQueries({ queryKey: ['venues'] });
  };

  const filtered = venues.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q || v.venue_name?.toLowerCase().includes(q) || v.city?.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || (filter === 'active' && v.active) || (filter === 'inactive' && !v.active) || (filter === 'demo' && v.is_demo);
    return matchSearch && matchFilter;
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-white">Tour Manager</h1>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 border border-hb-border text-white px-3 py-2 rounded-lg text-sm hover:bg-hb-surface-2">
              <Upload size={15} /> Import CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
            <button onClick={() => setModal({})} className="flex items-center gap-2 bg-hb-red text-white px-4 py-2 rounded-lg text-sm font-semibold">
              <Plus size={16} /> Add Venue
            </button>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hb-text-muted" />
            <input className="w-full bg-hb-surface border border-hb-border rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-hb-red"
              placeholder="Search venues…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {['all','active','inactive','demo'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-hb-red text-white' : 'bg-hb-surface border border-hb-border text-hb-text-muted hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
        <p className="text-hb-text-muted text-sm">{filtered.length} venues</p>
        {isLoading ? <div className="text-hb-text-muted">Loading…</div> : (
          <div className="space-y-2">
            {filtered.map(v => (
              <div key={v.id} className="bg-hb-surface border border-hb-border rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{v.venue_name}</span>
                    {v.space_name && <span className="text-hb-text-muted text-xs">· {v.space_name}</span>}
                    {v.is_demo && <span className="bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded-full">Demo</span>}
                    {v.featured && <span className="bg-yellow-900 text-yellow-300 text-xs px-2 py-0.5 rounded-full">Featured</span>}
                    {!v.active && <span className="bg-hb-surface-2 text-hb-text-muted text-xs px-2 py-0.5 rounded-full">Disabled</span>}
                  </div>
                  <p className="text-hb-text-muted text-xs mt-0.5">{[v.city, v.country].filter(Boolean).join(', ')} · {v.difficulty}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggle.mutate(v)} title={v.active ? 'Disable' : 'Enable'}
                    className={`p-2 rounded-lg hover:bg-hb-surface-2 ${v.active ? 'text-green-400' : 'text-hb-text-muted'}`}>
                    {v.active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button onClick={() => setModal(v)} className="p-2 text-hb-text-muted hover:text-white hover:bg-hb-surface-2 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if (confirm('Delete this venue?')) del.mutate(v); }}
                    className="p-2 text-hb-text-muted hover:text-red-400 hover:bg-hb-surface-2 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-hb-text-muted text-sm">No venues found.</p>}
          </div>
        )}
      </div>
      {modal !== null && (
        <VenueModal venue={modal.id ? modal : null} onClose={() => setModal(null)} onSave={form => save.mutate({ ...modal, ...form })} />
      )}
    </AdminLayout>
  );
}