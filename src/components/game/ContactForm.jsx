import React, { useState } from 'react';
import { X } from 'lucide-react';

const EMPTY_ERRORS = { firstName: null, lastName: null, email: null, form: null };

export default function ContactForm({ onSubmit, onSkip }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', company: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState(EMPTY_ERRORS);

  const validate = () => {
    const errs = { ...EMPTY_ERRORS };
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
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }
    setSubmitting(true);

    try {
      await onSubmit(form);
    } catch (_) {
      setErrors(prev => ({ ...prev, form: 'Submission failed. Please try again.' }));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-hb-surface rounded-hb-lg border border-hb-border p-6 md:p-8 fade-in">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-white font-black text-2xl leading-tight">Well played!</h2>
            <p className="text-hb-text-muted text-sm mt-1">
              Enter your details to see the leaderboard and discover 100k+ venues on HeadBox.
            </p>
          </div>
          <button onClick={onSkip} disabled={submitting} className="text-hb-text-muted hover:text-white disabled:opacity-40 transition-colors ml-4 mt-1" aria-label="Skip">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errors.form && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-hb-md px-3 py-2">
              <p className="text-red-400 text-sm">{errors.form}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5">First name <span className="text-hb-red">*</span></label>
              <input type="text" name="firstName" value={form.firstName} onChange={e => handleChange('firstName', e.target.value)}
                className={`w-full bg-hb-surface-2 border rounded-hb-md px-3 py-2.5 text-white text-sm placeholder-hb-text-muted focus:outline-none focus:border-hb-red transition-colors ${errors.firstName ? 'border-red-500' : 'border-hb-border'}`}
                placeholder="Jane" />
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5">Last name <span className="text-hb-red">*</span></label>
              <input type="text" name="lastName" value={form.lastName} onChange={e => handleChange('lastName', e.target.value)}
                className={`w-full bg-hb-surface-2 border rounded-hb-md px-3 py-2.5 text-white text-sm placeholder-hb-text-muted focus:outline-none focus:border-hb-red transition-colors ${errors.lastName ? 'border-red-500' : 'border-hb-border'}`}
                placeholder="Smith" />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5">Business email <span className="text-hb-red">*</span></label>
            <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
              className={`w-full bg-hb-surface-2 border rounded-hb-md px-3 py-2.5 text-white text-sm placeholder-hb-text-muted focus:outline-none focus:border-hb-red transition-colors ${errors.email ? 'border-red-500' : 'border-hb-border'}`}
              placeholder="jane@company.com" autoComplete="off" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-white/80 text-xs font-semibold uppercase tracking-wider mb-1.5">Company</label>
            <input type="text" name="company" value={form.company} onChange={e => handleChange('company', e.target.value)}
              className="w-full bg-hb-surface-2 border border-hb-border rounded-hb-md px-3 py-2.5 text-white text-sm placeholder-hb-text-muted focus:outline-none focus:border-hb-red transition-colors"
              placeholder="Acme Events Ltd" />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-hb-red hover:bg-hb-red-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-sm py-3.5 rounded-hb-xl transition-colors duration-200 mt-2">
            {submitting ? 'Submitting...' : 'See My Results'}
          </button>
        </form>

        <p className="text-hb-text-muted text-xs text-center mt-4 leading-relaxed">
          By saving your score, you agree that HeadBox may email your results and contact you about relevant venues and events.{' '}
          <a href="https://www.headbox.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-hb-red hover:underline">Privacy policy</a>
        </p>
        <p className="text-hb-text-muted text-xs text-center mt-3 leading-relaxed">
          HeadBox connects you to 100,000+ unique venues worldwide.{' '}
          <a href="https://www.headbox.com" target="_blank" rel="noopener noreferrer" className="text-hb-red hover:underline">Explore venues →</a>
        </p>
      </div>
    </div>
  );
}
