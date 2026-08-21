import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Smartphone, Pencil } from 'lucide-react';
import QRCode from 'qrcode';
import ContactForm from './ContactForm';
import { trackEvent } from '@/utils/analytics';

const getSubmissionErrorMessage = (requestError) => {
  const status = requestError?.response?.status || requestError?.status;
  if (status === 429 || String(requestError?.message || '').includes('429')) {
    return 'Too many attempts from this kiosk. Wait one minute, then retry.';
  }
  if (!navigator.onLine) return 'This kiosk is offline. Reconnect, then retry.';
  return 'Could not generate the QR code.';
};

export default function QrContactScreen({
  totalScore,
  competitionId,
  roundResults,
  avgDistanceKm,
  icpBoosted,
  onManualSubmit,
  onSubmissionComplete,
  onSkip,
}) {
  const [pending, setPending] = useState(null);
  const [mode, setMode] = useState('qr');
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState(null);
  const [qrSrc, setQrSrc] = useState('');
  const completedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const pendingPromiseRef = useRef(null);
  const submissionPayloadRef = useRef({
    competition_id: competitionId || null,
    total_score: totalScore || 0,
    round_results: roundResults || [],
    avg_distance_km: avgDistanceKm || 0,
    icp_boosted: icpBoosted === true,
  });

  const createPendingSubmission = useCallback(() => {
    if (!pendingPromiseRef.current) {
      pendingPromiseRef.current = base44.functions.invoke(
        'createPendingSubmission',
        submissionPayloadRef.current,
      ).then((response) => {
        const data = response?.data;
        if (!data?.token) throw new Error('Could not generate QR code');
        setPending({ id: data.id, token: data.token });
        return data;
      }).catch((requestError) => {
        pendingPromiseRef.current = null;
        throw requestError;
      });
    }
    return pendingPromiseRef.current;
  }, []);

  const prepareQrCode = useCallback(async () => {
    const data = await createPendingSubmission();
    const submitUrl = `${window.location.origin}/submit?token=${data.token}`;
    const dataUrl = await QRCode.toDataURL(submitUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#121212', light: '#ffffff' },
    });
    setQrSrc(dataUrl);
    trackEvent('score_qr_ready', {
      duration_ms: Math.round(performance.now() - startedAtRef.current),
    });
  }, [createPendingSubmission]);

  // Create the pending submission (with a random token) once on mount.
  useEffect(() => {
    let cancelled = false;
    prepareQrCode()
      .then(() => {
        if (!cancelled) setCreating(false);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(getSubmissionErrorMessage(requestError));
          setCreating(false);
          trackEvent('score_qr_failed', {
            online: navigator.onLine,
            rate_limited: requestError?.response?.status === 429,
          });
        }
      });
    return () => { cancelled = true; };
  }, [prepareQrCode]);

  const retryPendingSubmission = useCallback(() => {
    if (creating) return;
    setCreating(true);
    setError(null);
    prepareQrCode()
      .then(() => setCreating(false))
      .catch((requestError) => {
        setError(getSubmissionErrorMessage(requestError));
        setCreating(false);
        trackEvent('score_qr_failed', {
          online: navigator.onLine,
          rate_limited: requestError?.response?.status === 429,
        });
      });
  }, [creating, prepareQrCode]);

  // Poll the token-specific public function. PendingSubmission records themselves
  // remain private, so the kiosk never subscribes to other players' submissions.
  useEffect(() => {
    if (!pending?.token) return undefined;
    let active = true;
    let timeoutId;

    const checkStatus = async () => {
      try {
        const response = await base44.functions.invoke('getPendingSubmission', { token: pending.token });
        const data = response?.data;
        if (active && data?.status === 'completed' && !completedRef.current) {
          completedRef.current = true;
          trackEvent('score_capture_confirmed_on_kiosk', { method: 'mobile' });
          onSubmissionComplete?.(data);
          return;
        }
      } catch (_) {
        // A temporary polling failure should not interrupt the kiosk journey.
      }
      if (active) timeoutId = window.setTimeout(checkStatus, 2_000);
    };

    timeoutId = window.setTimeout(checkStatus, 2_000);
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [onSubmissionComplete, pending?.token]);

  const handleManualSubmit = useCallback(async (formData) => {
    const currentPending = pending || await createPendingSubmission();
    const response = await base44.functions.invoke('finalizePendingSubmission', {
      token: currentPending.token,
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      company: formData.company,
    });
    const data = response?.data;
    if (!data?.success) throw new Error(data?.error || 'Submission failed');

    completedRef.current = true;
    trackEvent('score_capture_completed', { method: 'kiosk' });
    onManualSubmit?.(formData, data);
  }, [createPendingSubmission, onManualSubmit, pending]);

  if (mode === 'manual') {
    return (
      <ContactForm
        onSubmit={handleManualSubmit}
        onSkip={onSkip}
      />
    );
  }

  return (
    <div className="kiosk-contact-screen fixed inset-0 z-50 flex flex-col items-center justify-center bg-hb-bg px-6 py-8 overflow-y-auto">
      <div className="kiosk-contact-panel w-full max-w-md text-center fade-in flex flex-col items-center">
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
            <div className="kiosk-qr-code w-72 h-72 rounded-hb-xl bg-hb-surface border border-hb-border flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-hb-border border-t-hb-red rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="kiosk-qr-code w-72 h-72 rounded-hb-xl bg-hb-surface border border-red-500/40 flex flex-col items-center justify-center px-6">
              <p className="text-red-400 text-sm text-center mb-3">{error}</p>
              <button onClick={retryPendingSubmission} className="rounded-full bg-hb-red px-5 py-2 text-sm font-bold text-white">
                Retry QR code
              </button>
            </div>
          ) : (
            <div className="kiosk-qr-code w-72 h-72 rounded-hb-xl bg-white p-3 shadow-2xl">
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
            onClick={() => {
              trackEvent('kiosk_manual_form_opened');
              setMode('manual');
            }}
            className="kiosk-secondary-action inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-hb-border bg-hb-surface text-hb-text-muted hover:text-white hover:border-hb-text-muted text-sm font-semibold transition-colors"
          >
            <Pencil size={14} />
            Enter details here instead
          </button>
          <button
            onClick={onSkip}
            className="kiosk-text-action mt-1 text-hb-text-muted/70 hover:text-white text-xs font-medium transition-colors hover:underline underline-offset-4"
          >
            Skip & view results
          </button>
        </div>
      </div>
    </div>
  );
}
