import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Smartphone, Pencil, ChevronRight } from 'lucide-react';
import ContactForm from './ContactForm';

export default function QrContactScreen({
  totalScore,
  competitionId,
  roundResults,
  avgDistanceKm,
  icpBoosted,
  onManualSubmit,
  onSkip,
}) {
  const [pending, setPending] = useState(null);
  const [mode, setMode] = useState('qr');
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState(null);
  const completedRef = useRef(false);

  // Create the pending submission (with a random token) once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke('createPendingSubmission', {
          competition_id: competitionId || null,
          total_score: totalScore || 0,
          round_results: roundResults || [],
          avg_distance_km: avgDistanceKm || 0,
          icp_boosted: icpBoosted === true,
        });
        const data = res?.data;
        if (!cancelled && data?.token) { setPending({ id: data.id, token: data.token }); setCreating(false); }
        else if (!cancelled) { setError('Could not generate QR code'); setCreating(false); }
      } catch (e) {
        if (!cancelled) { setError('Could not generate QR code'); setCreating(false); }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: advance to summary when the phone finalizes the submission
  useEffect(() => {
    if (!pending?.id) return;
    const unsub = base44.entities.PendingSubmission.subscribe((event) => {
      if (event.id === pending.id && event.type === 'update' && event.data?.status === 'completed') {
        if (!completedRef.current) { completedRef.current = true; onSkip(); }
      }
    });
    return unsub;
  }, [pending?.id, onSkip]);

  const submitUrl = pending
    ? `${window.location.origin}/submit?token=${pending.token}`
    : '';
  const qrSrc = pending
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=2&bgcolor=ffffff&color=121212&data=${encodeURIComponent(submitUrl)}`
    : '';

  if (mode === 'manual') {
    return (
      <ContactForm
        onSubmit={onManualSubmit}
        onSkip={onSkip}
        competitionId={competitionId}
        totalScore={totalScore}
        icpBoosted={icpBoosted}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-hb-bg px-6 py-8 overflow-y-auto">
      <div className="w-full max-w-md text-center fade-in flex flex-col items-center">
        {/* Score chip */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-hb-red/15 border border-hb-red/40 mb-5">
          <span className="text-hb-red font-black text-lg">{(totalScore || 0).toLocaleString()}</span>
          <span className="text-hb-text-muted text-xs font-semibold uppercase tracking-wider">pts</span>
        </div>

        <h2 className="text-white font-black text-3xl leading-tight mb-2">Well played!</h2>
        <p className="text-hb-text-muted text-sm mb-6 max-w-xs">
          Scan the QR code with your phone to enter your details and save your score — it's much faster than the kiosk screen.
        </p>

        {/* QR code */}
        <div className="relative">
          {creating ? (
            <div className="w-72 h-72 rounded-hb-xl bg-hb-surface border border-hb-border flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-hb-border border-t-hb-red rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="w-72 h-72 rounded-hb-xl bg-hb-surface border border-red-500/40 flex flex-col items-center justify-center px-6">
              <p className="text-red-400 text-sm text-center mb-3">{error}</p>
              <button onClick={() => setMode('manual')} className="text-hb-red text-sm font-semibold underline">
                Enter details instead
              </button>
            </div>
          ) : (
            <div className="w-72 h-72 rounded-hb-xl bg-white p-3 shadow-2xl">
              <img src={qrSrc} alt="Scan to submit your score" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-5 text-hb-text-muted">
          <Smartphone size={16} className="text-hb-red" />
          <span className="text-sm font-medium">Point your camera at the code</span>
        </div>

        {/* Fallback + skip */}
        <div className="flex flex-col items-center gap-3 mt-7 w-full">
          <button
            onClick={() => setMode('manual')}
            className="flex items-center gap-2 text-hb-text-muted hover:text-white text-sm font-medium transition-colors"
          >
            <Pencil size={14} />
            Enter details here instead
          </button>
          <button
            onClick={onSkip}
            className="mt-1 px-5 py-2.5 rounded-full border border-hb-border bg-hb-surface text-hb-text-muted hover:text-white hover:border-hb-text-muted text-sm font-semibold transition-colors"
          >
            Skip & view results
          </button>
        </div>
      </div>
    </div>
  );
}