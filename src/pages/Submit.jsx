import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Trophy, ArrowRight } from 'lucide-react';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Submit() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', company: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setToken(t);
    if (!t) { setLoadError('Missing score token.'); setLoading(false); return; }
    (async () => {
      try {
        const res = await base44.functions.invoke('getPendingSubmission', { token: t });
        const data = res?.data;
        if (!data || data.error) { setLoadError(data?.error || 'Score not found.'); setLoading(false); return; }
        setPending(data);
        if (data.status === 'completed') { setResult({ alreadySubmitted: true }); }
        setLoading(false);
      } catch (e) {
        setLoadError('Could not load your score.'); setLoading(false);
      }
    })();
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Business email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email address';
    else if (/^[^@]+@(gmail|yahoo|hotmail|outlook|icloud|me|mac|live|msn|aol|protonmail|yandex|zoho|gmx|mail)\./i.test(form.email)) errs.email = 'Please use a business email address';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await base44.functions.invoke('finalizePendingSubmission', {
        token,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        company: form.company,
      });
      const data = res?.data;
      if (!data || data.error) {
        setErrors({ form: data?.error || 'Submission failed. Please try again.' });
        setSubmitting(false);
        return;
      }
      setResult({
        position: data.position,
        total_entries: data.total_entries,
        competition_name: data.competition_name,
        leaderboard: data.leaderboard || [],
      });
    } catch (err) {
      setErrors({ form: 'Submission failed. Please try again.' });
    }
    setSubmitting(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="min-h-screen bg-hb-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-hb-border border-t-hb-red rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Error / missing token ───
  if (loadError) {
    return (
      <Shell>
        <p className="text-white text-lg font-bold mb-2">Hmm, something's off</p>
        <p className="text-hb-text-muted text-sm">{loadError}</p>
        <a href="https://www.headbox.com" className="mt-6 inline-flex items-center gap-1 text-hb-red text-sm font-semibold">
          Explore HeadBox <ArrowRight size={14} />
        </a>
      </Shell>
    );
  }

  // ─── Already submitted ───
  if (result?.alreadySubmitted) {
    return (
      <Shell>
        <CheckCircle2 size={56} className="text-hb-red mb-4" />
        <h1 className="text-white text-2xl font-black mb-2">Score already saved</h1>
        <p className="text-hb-text-muted text-sm mb-6">This score has already been submitted. Thanks for playing VenueGuessr!</p>
        <a href="https://www.headbox.com" className="inline-flex items-center gap-1 text-hb-red text-sm font-semibold">
          Explore HeadBox venues <ArrowRight size={14} />
        </a>
      </Shell>
    );
  }

  // ─── Confirmation ───
  if (result && !result.alreadySubmitted) {
    return (
      <Shell>
        <div className="w-16 h-16 rounded-full bg-hb-red/15 border border-hb-red/40 flex items-center justify-center mb-4">
          <Trophy size={32} className="text-hb-red" />
        </div>
        <h1 className="text-white text-3xl font-black mb-1">Score saved!</h1>
        <p className="text-hb-text-muted text-sm mb-5">
          You scored <span className="text-white font-bold">{(pending?.total_score || 0).toLocaleString()} pts</span>
          {result.competition_name ? <> in {result.competition_name}</> : null}
        </p>

        {/* Rank */}
        <div className="w-full bg-hb-surface border border-hb-border rounded-hb-lg p-5 mb-4">
          <p className="text-hb-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Your current rank</p>
          <p className="text-white font-black text-3xl">
            #{result.position}
            <span className="text-hb-text-muted text-base font-medium"> of {result.total_entries}</span>
          </p>
        </div>

        {/* Leaderboard preview */}
        {result.leaderboard?.length > 0 && (
          <div className="w-full bg-hb-surface border border-hb-border rounded-hb-lg p-3 mb-5">
            <p className="text-hb-text-muted text-[10px] font-bold uppercase tracking-widest px-1 pb-2">Top scores</p>
            <div className="space-y-1">
              {result.leaderboard.map((e, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-2 rounded-md ${i + 1 === result.position ? 'bg-hb-red/15 border border-hb-red/40' : ''}`}>
                  <span className="text-lg w-6 text-center">{i + 1 <= 3 ? MEDAL[i] : i + 1}</span>
                  <span className="flex-1 text-white text-sm font-medium truncate">
                    {(e.player_name || '').split(' ')[0]}
                    {i + 1 === result.position && <span className="text-hb-red text-xs ml-1">(you)</span>}
                  </span>
                  <span className="text-white font-bold text-sm">{(e.total_score || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <a href="https://app.headbox.com/plan-my-event" className="w-full bg-hb-red hover:bg-hb-red-dark text-white font-bold uppercase tracking-widest text-sm py-3.5 rounded-hb-xl transition-colors flex items-center justify-center gap-2">
          Plan your next event <ArrowRight size={16} />
        </a>
        <a href="https://www.headbox.com" className="mt-3 text-hb-text-muted text-xs font-medium">headbox.com</a>
      </Shell>
    );
  }

  // ─── Form ───
  return (
    <Shell>
      <img
        src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
        alt="HeadBox"
        className="h-8 mb-5"
        style={{ filter: 'brightness(0) invert(1)' }}
      />

      <div className="w-full bg-hb-surface border border-hb-border rounded-hb-lg p-5 mb-5">
        <p className="text-hb-text-muted text-xs font-semibold uppercase tracking-wider mb-1">Your score</p>
        <p className="text-white font-black text-4xl">{(pending?.total_score || 0).toLocaleString()}</p>
        {pending?.competition_name && <p className="text-hb-text-muted text-xs mt-1">{pending.competition_name}</p>}
      </div>

      <h1 className="text-white text-2xl font-black mb-1">Save your score</h1>
      <p className="text-hb-text-muted text-sm mb-5">Enter your details to join the leaderboard.</p>

      {errors.form && (
        <div className="w-full bg-red-500/10 border border-red-500/40 rounded-hb-md px-3 py-2 mb-4">
          <p className="text-red-400 text-sm">{errors.form}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5">First name <span className="text-hb-red">*</span></label>
            <input type="text" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)} autoCapitalize="words"
              className={`w-full bg-hb-surface-2 border rounded-hb-md px-3 py-3 text-white text-base placeholder-hb-text-muted focus:outline-none focus:border-hb-red transition-colors ${errors.firstName ? 'border-red-500' : 'border-hb-border'}`}
              placeholder="Jane" />
            {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5">Last name <span className="text-hb-red">*</span></label>
            <input type="text" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)} autoCapitalize="words"
              className={`w-full bg-hb-surface-2 border rounded-hb-md px-3 py-3 text-white text-base placeholder-hb-text-muted focus:outline-none focus:border-hb-red transition-colors ${errors.lastName ? 'border-red-500' : 'border-hb-border'}`}
              placeholder="Smith" />
            {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5">Business email <span className="text-hb-red">*</span></label>
          <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} autoComplete="off"
            className={`w-full bg-hb-surface-2 border rounded-hb-md px-3 py-3 text-white text-base placeholder-hb-text-muted focus:outline-none focus:border-hb-red transition-colors ${errors.email ? 'border-red-500' : 'border-hb-border'}`}
            placeholder="jane@company.com" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5">Company</label>
          <input type="text" value={form.company} onChange={e => handleChange('company', e.target.value)}
            className="w-full bg-hb-surface-2 border border-hb-border rounded-hb-md px-3 py-3 text-white text-base placeholder-hb-text-muted focus:outline-none focus:border-hb-red transition-colors"
            placeholder="Acme Events Ltd" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-hb-red hover:bg-hb-red-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-sm py-3.5 rounded-hb-xl transition-colors">
          {submitting ? 'Saving...' : 'Save my score'}
        </button>
      </form>

      <p className="text-hb-text-muted text-xs text-center mt-5 leading-relaxed">
        HeadBox connects you to 100,000+ unique venues worldwide.
      </p>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-hb-bg flex flex-col items-center justify-start px-5 py-8">
      <div className="w-full max-w-sm flex flex-col items-center">{children}</div>
    </div>
  );
}