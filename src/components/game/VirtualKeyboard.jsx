import React, { useState, useEffect, useCallback } from 'react';
import { Delete } from 'lucide-react';

const ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l'],
  ['z','x','c','v','b','n','m'],
];

const NUMBERS = ['1','2','3','4','5','6','7','8','9','0'];
const SYMBOLS = ['@','.','_','-','#','!','&','+','(',')','/'];

export default function VirtualKeyboard() {
  const [visible, setVisible] = useState(false);
  const [target, setTarget] = useState(null);
  const [shifted, setShifted] = useState(false);
  const [tab, setTab] = useState('alpha'); // 'alpha' | 'numbers'

  useEffect(() => {
    const onFocus = (e) => {
      const el = e.target;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) {
        setTarget(el);
        setVisible(true);
      }
    };
    const onBlur = (e) => {
      // Small delay so keyboard button taps don't immediately close it
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && !active.isContentEditable)) {
          setVisible(false);
          setTarget(null);
        }
      }, 150);
    };

    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
    };
  }, []);

  const press = useCallback((char) => {
    const el = target;
    if (!el) return;
    el.focus();

    // Use execCommand for contenteditable, direct value manipulation for inputs
    if (el.isContentEditable) {
      document.execCommand('insertText', false, char);
    } else {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const newVal = el.value.slice(0, start) + char + el.value.slice(end);
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(el, newVal);
      } else {
        el.value = newVal;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.setSelectionRange(start + 1, start + 1);
    }

    if (shifted) setShifted(false);
  }, [target, shifted]);

  const backspace = useCallback(() => {
    const el = target;
    if (!el) return;
    el.focus();
    if (el.isContentEditable) {
      document.execCommand('delete');
    } else {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      if (start === end && start > 0) {
        const newVal = el.value.slice(0, start - 1) + el.value.slice(end);
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, newVal);
        } else {
          el.value = newVal;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.setSelectionRange(start - 1, start - 1);
      } else if (start !== end) {
        const newVal = el.value.slice(0, start) + el.value.slice(end);
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(el, newVal);
        } else {
          el.value = newVal;
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.setSelectionRange(start, start);
      }
    }
  }, [target]);

  const submitForm = useCallback(() => {
    const el = target;
    if (!el) return;
    // Try to find and submit the parent form
    const form = el.closest('form');
    if (form) {
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.click();
    }
    setVisible(false);
  }, [target]);

  if (!visible) return null;

  const alphaRows = ROWS.map(row => row.map(c => shifted ? c.toUpperCase() : c));

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] select-none"
      style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a', padding: '8px 6px 12px' }}
      onPointerDown={e => e.preventDefault()} // prevent blur of target
    >
      {/* Tab switcher */}
      <div className="flex gap-1 mb-2 px-1">
        <button
          onPointerDown={e => { e.preventDefault(); setTab('alpha'); }}
          className={`text-xs font-bold px-3 py-1 rounded-md transition-colors ${tab === 'alpha' ? 'bg-hb-red text-white' : 'text-white/50'}`}
        >ABC</button>
        <button
          onPointerDown={e => { e.preventDefault(); setTab('numbers'); }}
          className={`text-xs font-bold px-3 py-1 rounded-md transition-colors ${tab === 'numbers' ? 'bg-hb-red text-white' : 'text-white/50'}`}
        >123</button>
        <div className="flex-1" />
        <button
          onPointerDown={e => { e.preventDefault(); setVisible(false); setTarget(null); }}
          className="text-xs text-white/40 px-3 py-1"
        >✕ Close</button>
      </div>

      {tab === 'alpha' && (
        <>
          {alphaRows.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1 mb-1">
              {ri === 2 && (
                <button
                  onPointerDown={e => { e.preventDefault(); setShifted(s => !s); }}
                  className={`flex items-center justify-center rounded-md font-bold text-sm transition-colors ${shifted ? 'bg-hb-red text-white' : 'bg-[#2a2a2a] text-white/70'}`}
                  style={{ minWidth: 42, height: 42 }}
                >⇧</button>
              )}
              {row.map(c => (
                <Key key={c} label={c} onPress={() => press(c)} />
              ))}
              {ri === 2 && (
                <button
                  onPointerDown={e => { e.preventDefault(); backspace(); }}
                  className="flex items-center justify-center bg-[#2a2a2a] rounded-md text-white/70"
                  style={{ minWidth: 42, height: 42 }}
                >
                  <Delete size={16} />
                </button>
              )}
            </div>
          ))}
          <div className="flex justify-center gap-1 mt-1">
            <Key label="," onPress={() => press(',')} width={42} />
            <Key label="space" onPress={() => press(' ')} width={160} />
            <Key label="." onPress={() => press('.')} width={42} />
            <button
              onPointerDown={e => { e.preventDefault(); submitForm(); }}
              className="flex items-center justify-center bg-hb-red rounded-md text-white font-bold text-xs"
              style={{ minWidth: 72, height: 42 }}
            >Go ↵</button>
          </div>
        </>
      )}

      {tab === 'numbers' && (
        <>
          <div className="flex justify-center gap-1 mb-1 flex-wrap">
            {NUMBERS.map(c => <Key key={c} label={c} onPress={() => press(c)} />)}
          </div>
          <div className="flex justify-center gap-1 mb-1 flex-wrap">
            {SYMBOLS.map(c => <Key key={c} label={c} onPress={() => press(c)} />)}
          </div>
          <div className="flex justify-center gap-1 mt-1">
            <button
              onPointerDown={e => { e.preventDefault(); backspace(); }}
              className="flex items-center justify-center bg-[#2a2a2a] rounded-md text-white/70"
              style={{ minWidth: 60, height: 42 }}
            >
              <Delete size={16} />
            </button>
            <Key label="space" onPress={() => press(' ')} width={160} />
            <button
              onPointerDown={e => { e.preventDefault(); submitForm(); }}
              className="flex items-center justify-center bg-hb-red rounded-md text-white font-bold text-xs"
              style={{ minWidth: 72, height: 42 }}
            >Go ↵</button>
          </div>
        </>
      )}
    </div>
  );
}

function Key({ label, onPress, width }) {
  return (
    <button
      onPointerDown={e => { e.preventDefault(); onPress(); }}
      className="flex items-center justify-center bg-[#2a2a2a] active:bg-[#3a3a3a] rounded-md text-white font-medium text-sm transition-colors"
      style={{ minWidth: width || 34, height: 42, fontSize: label === 'space' ? 11 : 14, color: label === 'space' ? '#888' : undefined }}
    >
      {label === 'space' ? 'space' : label}
    </button>
  );
}