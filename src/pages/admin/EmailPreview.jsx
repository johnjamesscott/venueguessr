import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Monitor, Smartphone } from 'lucide-react';

const SAMPLE_DATA = {
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
  total_score: 8750,
  round_results: [
    { venue_name: 'The Shard', city: 'London', score: 3200, distance_km: 1.2 },
    { venue_name: 'Tobacco Dock', city: 'London', score: 2900, distance_km: 2.8 },
    { venue_name: 'Natural History Museum', city: 'London', score: 2650, distance_km: 4.1 },
  ],
  preview_only: true,
};

export default function EmailPreview() {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewport, setViewport] = useState('desktop'); // 'desktop' | 'mobile'

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('sendPostGameEmail', SAMPLE_DATA);
      setHtml(res?.data?.html || '');
    } catch (e) {
      setHtml('<p style="color:red;padding:16px;">Failed to load preview.</p>');
    }
    setLoading(false);
  };

  useEffect(() => { fetchPreview(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Email Preview</h1>
          <p className="text-[#888] text-sm mt-1">Post-game summary email sent to players after completing VenueGuessr</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Viewport toggle */}
          <div className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${viewport === 'desktop' ? 'bg-[#AF231C] text-white' : 'text-[#888] hover:text-white'}`}
            >
              <Monitor size={13} /> Desktop
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${viewport === 'mobile' ? 'bg-[#AF231C] text-white' : 'text-[#888] hover:text-white'}`}
            >
              <Smartphone size={13} /> Mobile
            </button>
          </div>
          <button
            onClick={fetchPreview}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs font-medium text-[#aaa] hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Sample data info strip */}
      <div className="mb-4 px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
        <p className="text-xs text-[#888]">
          Showing preview with sample data — <span className="text-white font-medium">Jane Smith</span>, score <span className="text-white font-medium">8,750 pts</span>, 3 rounds
        </p>
      </div>

      {/* Preview frame */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {/* Email client chrome */}
        <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 bg-[#111] rounded px-3 py-1 text-xs text-[#555] font-mono truncate">
            From: noreply@headbox.com · Subject: You scored 8,750 pts in VenueGuessr 🎯
          </div>
        </div>

        <div className="flex justify-center bg-[#e8e8e8] p-4 min-h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center w-full">
              <div className="w-6 h-6 border-2 border-[#2a2a2a] border-t-[#AF231C] rounded-full animate-spin" />
            </div>
          ) : (
            <iframe
              srcDoc={html}
              title="Email Preview"
              sandbox="allow-same-origin"
              style={{
                width: viewport === 'mobile' ? 375 : '100%',
                maxWidth: viewport === 'desktop' ? 640 : 375,
                border: 'none',
                minHeight: 700,
                borderRadius: 4,
                transition: 'width 0.2s ease',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}