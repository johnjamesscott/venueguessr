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
  const [tab, setTab] = useState('alpha');

  useEffect(() => {
    const onFocus = (e) => {
      const el = e.target;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) {
        setTarget(el);
        setVisible(true);
      }
    };
    const onBlur = () => {
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
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (setter) setter.call(el, newVal); else el.value = newVal;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.setSelectionRange(start - 1, start - 1);
      } else if (start !== end) {
        const newVal = el.value.slice(0, start) + el.value.slice(end);
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
        if (setter) setter.call(el, newVal); else el.value = newVal;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.setSelectionRange(start, start);
      }
    }
  }, [target]);

  const submitForm = useCallback(() => {
    const el = target;
    if (!el) return;
    const form = el.closest('form');
    if (form) {
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) submitBtn.click();
    }
    setVisible(false);
  }, [target]);

  if (!visible) return null;

  const alphaRows = ROWS.map(row => row.map(c => shifted ? c.toUpperCase() : c));

  // Key sizing: target 40vh total height, distributed across rows
  const KEY_H = 'calc((40vh - 80px) / 5)';
  const KEY_FONT = 'calc((40vh - 80px) / 8)';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] select-none"
      style={{
        background: '#1a1a1a',
        borderTop: '2px solid #2a2a2a',
        padding: '10px 8px 14px',
        height: '40vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
      onPointerDown={e => e.preventDefault()}
    >
      {/* Tab switcher + close */}
      <div className="flex gap-2 px-1" style={{ flexShrink: 0 }}>
        <button
          onPointerDown={e => { e.preventDefault(); setTab('alpha'); }}
          style={{
            fontSize: KEY_FONT,
            fontWeight: 700,
            padding: '4px 16px',
            borderRadius: 8,
            border: 'none',
            background: tab === 'alpha' ? '#AF231C' : 'transparent',
            color: tab === 'alpha' ? '#fff' : 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
          }}
        >ABC</button>
        <button
          onPointerDown={e => { e.preventDefault(); setTab('numbers'); }}
          style={{
            fontSize: KEY_FONT,
            fontWeight: 700,
            padding: '4px 16px',
            borderRadius: 8,
            border: 'none',
            background: tab === 'numbers' ? '#AF231C' : 'transparent',
            color: tab === 'numbers' ? '#fff' : 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
          }}
        >123</button>
        <div style={{ flex: 1 }} />
        <button
          onPointerDown={e => { e.preventDefault(); setVisible(false); setTarget(null); }}
          style={{ fontSize: KEY_FONT, color: 'rgba(255,255,255,0.35)', border: 'none', background: 'none', cursor: 'pointer', padding: '4px 12px' }}
        >✕</button>
      </div>

      {tab === 'alpha' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {alphaRows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', justifyContent: 'center', gap: 4, flex: 1 }}>
              {ri === 2 && (
                <Key label="⇧" onPress={() => setShifted(s => !s)} active={shifted} h={KEY_H} f={KEY_FONT} minW="calc(8vw)" />
              )}
              {row.map(c => (
                <Key key={c} label={c} onPress={() => press(c)} h={KEY_H} f={KEY_FONT} />
              ))}
              {ri === 2 && (
                <button
                  onPointerDown={e => { e.preventDefault(); backspace(); }}
                  style={{
                    minWidth: 'calc(8vw)', height: KEY_H,
                    background: '#2a2a2a', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <Delete style={{ width: KEY_FONT, height: KEY_FONT }} />
                </button>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flex: 1 }}>
            <Key label="," onPress={() => press(',')} h={KEY_H} f={KEY_FONT} minW="calc(8vw)" />
            <Key label="space" onPress={() => press(' ')} h={KEY_H} f={KEY_FONT} flex={1} />
            <Key label="." onPress={() => press('.')} h={KEY_H} f={KEY_FONT} minW="calc(8vw)" />
            <button
              onPointerDown={e => { e.preventDefault(); submitForm(); }}
              style={{
                minWidth: 'calc(14vw)', height: KEY_H,
                background: '#AF231C', border: 'none', borderRadius: 8,
                color: '#fff', fontWeight: 700, fontSize: KEY_FONT,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >Go ↵</button>
          </div>
        </div>
      )}

      {tab === 'numbers' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flex: 1 }}>
            {NUMBERS.map(c => <Key key={c} label={c} onPress={() => press(c)} h={KEY_H} f={KEY_FONT} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flex: 1 }}>
            {SYMBOLS.map(c => <Key key={c} label={c} onPress={() => press(c)} h={KEY_H} f={KEY_FONT} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flex: 1 }}>
            <button
              onPointerDown={e => { e.preventDefault(); backspace(); }}
              style={{
                minWidth: 'calc(12vw)', height: KEY_H,
                background: '#2a2a2a', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Delete style={{ width: KEY_FONT, height: KEY_FONT }} />
            </button>
            <Key label="space" onPress={() => press(' ')} h={KEY_H} f={KEY_FONT} flex={1} />
            <button
              onPointerDown={e => { e.preventDefault(); submitForm(); }}
              style={{
                minWidth: 'calc(14vw)', height: KEY_H,
                background: '#AF231C', border: 'none', borderRadius: 8,
                color: '#fff', fontWeight: 700, fontSize: KEY_FONT,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >Go ↵</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Key({ label, onPress, h, f, minW, flex, active }) {
  return (
    <button
      onPointerDown={e => { e.preventDefault(); onPress(); }}
      style={{
        minWidth: minW || 'calc(8.5vw)',
        flex: flex || undefined,
        height: h,
        background: active ? '#AF231C' : '#2a2a2a',
        border: 'none',
        borderRadius: 8,
        color: label === 'space' ? '#666' : '#fff',
        fontWeight: 600,
        fontSize: label === 'space' ? `calc(${f} * 0.6)` : f,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.08s',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        flexShrink: 0,
      }}
    >
      {label === 'space' ? 'space' : label}
    </button>
  );
}