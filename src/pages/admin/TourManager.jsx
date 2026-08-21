import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, Plus, Edit2, Trash2, Eye, EyeOff, Search, Upload, X } from 'lucide-react';
import { parseCsv } from '@/utils/csv';

function VenueForm({ initial = null, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    venue_name: '', space_name: '', city: '', country: 'GB',
    latitude: '', longitude: '', matterport_url: '', headbox_url: '',
    difficulty: 'easy', featured: false, active: true, is_demo: false,
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.venue_name || !form.matterport_url) return;
    const payload = {
      ...form,
      latitude: parseFloat(form.latitude) || 0,
      longitude: parseFloat(form.longitude) || 0,
    };
    if (initial?.id) {
      await base44.entities.Venue.update(initial.id, payload);
    } else {
      await base44.entities.Venue.create(payload);
    }
    onSave();
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">{initial?.id ? 'Edit Venue' : 'Add Venue'}</h3>
        <button onClick={onCancel}><X size={16} className="text-[#666]" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Venue name *" value={form.venue_name} onChange={e => set('venue_name', e.target.value)} />
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Space / room name" value={form.space_name} onChange={e => set('space_name', e.target.value)} />
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Country code (GB, IE...)" value={form.country} onChange={e => set('country', e.target.value)} />
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Latitude *" value={form.latitude} onChange={e => set('latitude', e.target.value)} />
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" placeholder="Longitude *" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm md:col-span-2" placeholder="Matterport URL *" value={form.matterport_url} onChange={e => set('matterport_url', e.target.value)} />
        <input className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm md:col-span-2" placeholder="HeadBox URL" value={form.headbox_url} onChange={e => set('headbox_url', e.target.value)} />
        <select className="bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white text-sm" value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-[#aaa] cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="accent-[#AF231C]" /> Active
          </label>
          <label className="flex items-center gap-2 text-sm text-[#aaa] cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="accent-[#AF231C]" /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-[#aaa] cursor-pointer">
            <input type="checkbox" checked={form.is_demo} onChange={e => set('is_demo', e.target.checked)} className="accent-[#AF231C]" /> Demo
          </label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={handleSave} className="bg-[#AF231C] hover:bg-[#8C1C16] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">Save</button>
        <button onClick={onCancel} className="bg-[#222] text-white text-sm px-4 py-2 rounded-lg">Cancel</button>
      </div>
    </div>
  );
}

function PreviewModal({ venue, onClose }) {
  const getEmbed = (url) => {
    if (!url) return null;
    const PARAMS = 'play=1&qs=1&dh=0&brand=0';
    if (url.includes('my.matterport.com/show/')) {
      const base = url.split('?')[0];
      const m = new URLSearchParams(url.split('?')[1] || '').get('m');
      return `${base}?${PARAMS}${m ? `&m=${m}` : ''}`;
    }
    if (url.includes('tours.headbox.com/model/')) {
      const match = url.match(/\/model\/([^/?]+)/);
      if (match) return `https://my.matterport.com/show/?m=${match[1]}&${PARAMS}`;
    }
    return url;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-4xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
          <div>
            <div className="font-bold text-white">{venue.venue_name}</div>
            <div className="text-[#888] text-xs">{venue.space_name} · {venue.city}</div>
          </div>
          <button onClick={onClose}><X size={20} className="text-[#666] hover:text-white" /></button>
        </div>
        <div style={{ height: '60vh' }}>
          <iframe src={getEmbed(venue.matterport_url)} className="w-full h-full" frameBorder="0" allowFullScreen />
        </div>
      </div>
    </div>
  );
}

export default function TourManager() {
  const [venues, setVenues] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [operationStatus, setOperationStatus] = useState('');
  const [checkingHealth, setCheckingHealth] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    const all = await base44.entities.Venue.list('-created_date', 200);
    setVenues(all);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (venue) => {
    await base44.entities.Venue.update(venue.id, { active: !venue.active });
    load();
  };

  const remove = async (venue) => {
    if (!confirm(`Delete "${venue.venue_name}"?`)) return;
    await base44.entities.Venue.delete(venue.id);
    load();
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOperationStatus('Importing venues…');
    try {
      const rows = parseCsv(await file.text());
      const payloads = rows.map((obj) => ({
        venue_name: obj.venue_name || obj.venueName || '',
        space_name: obj.space_name || obj.spaceName || '',
        city: obj.city || '',
        country: obj.country || 'GB',
        latitude: Number.parseFloat(obj.latitude || obj.lat),
        longitude: Number.parseFloat(obj.longitude || obj.lng),
        matterport_url: obj.matterport_url || obj.tourUrl || '',
        headbox_url: obj.headbox_url || '',
        difficulty: obj.difficulty || 'easy',
        featured: obj.featured === 'true',
        active: obj.active !== 'false',
        is_demo: obj.is_demo === 'true',
      })).filter((venue) => (
        venue.venue_name
        && venue.matterport_url
        && Number.isFinite(venue.latitude)
        && Number.isFinite(venue.longitude)
      ));
      if (payloads.length === 0) throw new Error('No valid venue rows were found');
      for (let index = 0; index < payloads.length; index += 100) {
        await base44.entities.Venue.bulkCreate(payloads.slice(index, index + 100));
      }
      await load();
      setOperationStatus(`Imported ${payloads.length} venue${payloads.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setOperationStatus(error?.message || 'Venue import failed.');
    } finally {
      e.target.value = '';
    }
  };

  const checkHealth = async (venueId = null) => {
    setCheckingHealth(venueId || 'all');
    setOperationStatus(venueId ? 'Checking tour…' : 'Checking all active tours…');
    try {
      const response = await base44.functions.invoke(
        'checkVenueHealth',
        venueId ? { venue_id: venueId } : {},
      );
      const data = response?.data || {};
      await load();
      setOperationStatus(
        `Checked ${data.checked || 0}: ${data.healthy || 0} healthy, ${data.unhealthy || 0} unavailable.`,
      );
    } catch (error) {
      setOperationStatus(error?.message || 'Tour health check failed.');
    } finally {
      setCheckingHealth(null);
    }
  };

  const filtered = venues.filter(v => {
    const matchSearch = !search || v.venue_name?.toLowerCase().includes(search.toLowerCase()) || v.city?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && v.active) || (filter === 'inactive' && !v.active) || (filter === 'featured' && v.featured);
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {preview && <PreviewModal venue={preview} onClose={() => setPreview(null)} />}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black text-white">Tour Manager</h1>
        <div className="flex gap-2">
          <button disabled={Boolean(checkingHealth)} onClick={() => checkHealth()} className="flex items-center gap-2 text-sm border border-[#333] hover:bg-[#1e1e1e] disabled:opacity-50 text-[#aaa] px-3 py-2 rounded-lg transition-colors">
            <Activity size={14} className={checkingHealth === 'all' ? 'animate-pulse' : ''} /> Check active tours
          </button>
          <input type="file" ref={fileRef} accept=".csv" onChange={handleCSV} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 text-sm border border-[#333] hover:bg-[#1e1e1e] text-[#aaa] px-3 py-2 rounded-lg transition-colors">
            <Upload size={14} /> Import CSV
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-[#AF231C] hover:bg-[#8C1C16] text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={14} /> Add Venue
          </button>
        </div>
      </div>

      {operationStatus && (
        <div className="mb-4 rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-3 text-sm text-[#aaa]" role="status">
          {operationStatus}
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-2 text-white text-sm placeholder-[#555]" placeholder="Search venues..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {['all', 'active', 'inactive', 'featured'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`text-sm px-3 py-2 rounded-lg capitalize transition-colors ${filter === f ? 'bg-[#AF231C] text-white' : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] hover:text-white'}`}>{f}</button>
        ))}
      </div>

      {showForm && !editing && (
        <VenueForm onSave={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
      )}

      <div className="text-[#666] text-xs mb-3">{filtered.length} venues</div>

      <div className="space-y-2">
        {filtered.map(v => (
          <div key={v.id}>
            {editing?.id === v.id ? (
              <VenueForm initial={v} onSave={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
            ) : (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${v.active ? 'bg-green-400' : 'bg-[#444]'}`} />
                  <div className="min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{v.venue_name}</div>
                    <div className="text-[#666] text-xs">{v.space_name && `${v.space_name} · `}{v.city}{v.country && `, ${v.country}`} · <span className="capitalize">{v.difficulty}</span>{v.featured && ' · ⭐ Featured'}{v.is_demo && ' · Demo'}</div>
                    <div className={`mt-1 text-[11px] ${v.health_status === 'healthy' ? 'text-green-400' : v.health_status === 'unhealthy' ? 'text-red-400' : 'text-amber-300'}`}>
                      {v.health_status === 'healthy' ? `Tour healthy · ${v.last_health_check_ms || 0} ms` : v.health_status === 'unhealthy' ? `Tour unavailable · ${v.health_message || 'Check failed'}` : 'Tour not checked yet'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button disabled={Boolean(checkingHealth)} onClick={() => checkHealth(v.id)} className="p-2 rounded-lg bg-[#222] hover:bg-[#2a2a2a] disabled:opacity-50 text-[#888] hover:text-white transition-colors" title="Check tour health"><Activity size={14} className={checkingHealth === v.id ? 'animate-pulse' : ''} /></button>
                  <button onClick={() => setPreview(v)} className="p-2 rounded-lg bg-[#222] hover:bg-[#2a2a2a] text-[#888] hover:text-white transition-colors" title="Preview"><Eye size={14} /></button>
                  <button onClick={() => setEditing(v)} className="p-2 rounded-lg bg-[#222] hover:bg-[#2a2a2a] text-[#888] hover:text-white transition-colors" title="Edit"><Edit2 size={14} /></button>
                  <button onClick={() => toggle(v)} className={`p-2 rounded-lg transition-colors ${v.active ? 'bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400' : 'bg-[#222] text-[#666] hover:bg-green-500/10 hover:text-green-400'}`} title={v.active ? 'Disable' : 'Enable'}>
                    {v.active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => remove(v)} className="p-2 rounded-lg bg-[#222] hover:bg-red-500/10 text-[#888] hover:text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
