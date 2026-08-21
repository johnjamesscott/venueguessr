import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronDown, ChevronRight, Delete } from 'lucide-react';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const SYMBOLS = ['@', '.', '_', '-', '#', '&', '+', '(', ')', '/'];
const KIOSK_FIELD_SELECTOR = '[data-kiosk-keyboard="true"]';
const KEYBOARD_HEIGHT = 'clamp(300px, 38dvh, 430px)';
const KEY_FONT = 'clamp(18px, 2.2vw, 28px)';

const getFormFields = (target) => Array.from(
  target?.closest('form')?.querySelectorAll(KIOSK_FIELD_SELECTOR) || [],
).filter((field) => !field.disabled && field.getAttribute('aria-hidden') !== 'true');

const getNextField = (target) => {
  const fields = getFormFields(target);
  const currentIndex = fields.indexOf(target);
  return currentIndex >= 0 ? fields[currentIndex + 1] || null : null;
};

const setNativeValue = (element, value) => {
  const prototype = element.tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (setter) setter.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
};

const setCaretPosition = (element, position) => {
  try {
    element.setSelectionRange(position, position);
  } catch (_) {
    // Chromium does not expose selection APIs for inputs such as type="email".
  }
};

export default function VirtualKeyboard() {
  const [visible, setVisible] = useState(false);
  const [target, setTarget] = useState(/** @type {HTMLInputElement | HTMLTextAreaElement | null} */ (null));
  const [shifted, setShifted] = useState(false);
  const [tab, setTab] = useState('alpha');

  const hideKeyboard = useCallback(() => {
    const active = /** @type {HTMLElement | null} */ (document.activeElement);
    if (active?.matches?.(KIOSK_FIELD_SELECTOR)) active.blur();
    setVisible(false);
    setTarget(null);
    setShifted(false);
    setTab('alpha');
  }, []);

  useEffect(() => {
    const onFocus = (event) => {
      const element = /** @type {HTMLElement} */ (event.target);
      if (!element?.matches?.(KIOSK_FIELD_SELECTOR)) return;

      setTarget(/** @type {HTMLInputElement | HTMLTextAreaElement} */ (element));
      setVisible(true);
      setShifted(false);
      setTab('alpha');
      window.setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    };

    const onBlur = () => {
      window.setTimeout(() => {
        const active = /** @type {HTMLElement | null} */ (document.activeElement);
        if (!active?.matches?.(KIOSK_FIELD_SELECTOR)) {
          setVisible(false);
          setTarget(null);
        }
      }, 180);
    };

    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', onBlur);
    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
    };
  }, []);

  useEffect(() => {
    if (visible) document.documentElement.dataset.kioskKeyboard = 'open';
    else delete document.documentElement.dataset.kioskKeyboard;

    window.dispatchEvent(new CustomEvent('kiosk-keyboard-visibility', {
      detail: { open: visible },
    }));
  }, [visible]);

  useEffect(() => () => {
    delete document.documentElement.dataset.kioskKeyboard;
    window.dispatchEvent(new CustomEvent('kiosk-keyboard-visibility', {
      detail: { open: false },
    }));
  }, []);

  const press = useCallback((character) => {
    const element = target;
    if (!element) return;
    element.focus({ preventScroll: true });

    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    const isNameField = ['firstName', 'lastName', 'company'].includes(element.name)
      || ['firstName', 'lastName', 'company'].includes(element.id);
    const startsWord = start === 0 || /[\s'-]/.test(element.value.charAt(start - 1));
    const shouldCapitalise = character.length === 1 && isNameField && startsWord;
    const finalCharacter = shifted || shouldCapitalise ? character.toUpperCase() : character;
    const newValue = element.value.slice(0, start) + finalCharacter + element.value.slice(end);

    setNativeValue(element, newValue);
    const newPosition = start + finalCharacter.length;
    setCaretPosition(element, newPosition);
    if (shifted) setShifted(false);
  }, [shifted, target]);

  const backspace = useCallback(() => {
    const element = target;
    if (!element) return;
    element.focus({ preventScroll: true });

    const start = element.selectionStart ?? element.value.length;
    const end = element.selectionEnd ?? element.value.length;
    if (start === end && start === 0) return;

    const deleteFrom = start === end ? start - 1 : start;
    const newValue = element.value.slice(0, deleteFrom) + element.value.slice(end);
    setNativeValue(element, newValue);
    setCaretPosition(element, deleteFrom);
  }, [target]);

  const handlePrimaryAction = useCallback(() => {
    const nextField = getNextField(target);
    if (!nextField) {
      hideKeyboard();
      return;
    }

    setShifted(false);
    setTab('alpha');
    nextField.focus({ preventScroll: true });
    window.setTimeout(() => {
      nextField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }, [hideKeyboard, target]);

  if (!visible || !target) return null;

  const isEmailField = target.dataset.keyboardType === 'email'
    || target.type === 'email'
    || target.autocomplete === 'email';
  const isCompanyField = target.name === 'company' || target.id === 'company';
  const hasNextField = Boolean(getNextField(target));
  const fieldLabel = target.dataset.keyboardLabel || target.getAttribute('aria-label') || 'Enter details';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] select-none"
      style={{
        background: '#181818',
        borderTop: '1px solid #363636',
        boxShadow: '0 -12px 32px rgba(0,0,0,0.38)',
        padding: '10px clamp(8px, 1.2vw, 18px) max(12px, env(safe-area-inset-bottom))',
        height: KEYBOARD_HEIGHT,
        touchAction: 'none',
      }}
      onPointerDown={(event) => event.preventDefault()}
      role="group"
      aria-label={`On-screen keyboard for ${fieldLabel}`}
    >
      <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col gap-1.5">
        <div className="flex min-h-10 items-center gap-2 px-1" style={{ flexShrink: 0 }}>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white/65">
            {fieldLabel}
          </span>
          <div className="flex rounded-lg bg-black/25 p-0.5" aria-label="Keyboard layout">
            <LayoutButton active={tab === 'alpha'} label="ABC" onPress={() => setTab('alpha')} />
            <LayoutButton active={tab === 'numbers'} label="123" onPress={() => setTab('numbers')} />
          </div>
          <button
            type="button"
            onPointerDown={(event) => { event.preventDefault(); hideKeyboard(); }}
            className="flex min-h-10 min-w-12 items-center justify-center rounded-lg text-white/60 transition-colors active:bg-white/10 active:text-white"
            aria-label="Hide keyboard"
          >
            <ChevronDown size={26} />
          </button>
        </div>

        {tab === 'alpha' ? (
          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            {ROWS.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex min-h-0 flex-1 justify-center gap-1.5"
                style={{ paddingInline: rowIndex === 1 ? '3.5%' : 0 }}
              >
                {rowIndex === 2 && (
                  <Key
                    label="⇧"
                    ariaLabel="Shift"
                    onPress={() => setShifted((current) => !current)}
                    active={shifted}
                    flex={1.25}
                  />
                )}
                {row.map((character) => (
                  <Key
                    key={character}
                    label={shifted ? character.toUpperCase() : character}
                    onPress={() => press(character)}
                  />
                ))}
                {rowIndex === 2 && (
                  <Key
                    label={<Delete size={26} />}
                    ariaLabel="Delete"
                    onPress={backspace}
                    flex={1.25}
                  />
                )}
              </div>
            ))}

            <div className="flex min-h-0 flex-1 justify-center gap-1.5">
              {isEmailField ? (
                <>
                  <Key label="@" onPress={() => press('@')} flex={1.15} />
                  <Key label="-" onPress={() => press('-')} />
                  <Key label="_" onPress={() => press('_')} />
                  <Key label="." onPress={() => press('.')} />
                  <Key label=".com" onPress={() => press('.com')} flex={1.5} compact />
                  <Key label=".co.uk" onPress={() => press('.co.uk')} flex={1.7} compact />
                </>
              ) : (
                <>
                  <Key label="'" ariaLabel="Apostrophe" onPress={() => press("'")} />
                  <Key label="-" ariaLabel="Hyphen" onPress={() => press('-')} />
                  {isCompanyField && <Key label="&" onPress={() => press('&')} />}
                  <Key label="space" onPress={() => press(' ')} flex={4} muted compact />
                  <Key label="." onPress={() => press('.')} />
                </>
              )}
              <PrimaryKey hasNextField={hasNextField} onPress={handlePrimaryAction} />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-1.5">
            <div className="flex min-h-0 flex-1 justify-center gap-1.5">
              {NUMBERS.map((character) => (
                <Key key={character} label={character} onPress={() => press(character)} />
              ))}
            </div>
            <div className="flex min-h-0 flex-1 justify-center gap-1.5">
              {SYMBOLS.map((character) => (
                <Key key={character} label={character} onPress={() => press(character)} />
              ))}
            </div>
            <div className="flex min-h-0 flex-1 justify-center gap-1.5">
              <Key
                label={<Delete size={28} />}
                ariaLabel="Delete"
                onPress={backspace}
                flex={1.4}
              />
              {!isEmailField && <Key label="space" onPress={() => press(' ')} flex={4} muted compact />}
              <PrimaryKey hasNextField={hasNextField} onPress={handlePrimaryAction} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutButton({ active, label, onPress }) {
  return (
    <button
      type="button"
      onPointerDown={(event) => { event.preventDefault(); onPress(); }}
      className="min-h-9 min-w-14 rounded-md px-3 text-sm font-bold transition-colors"
      style={{
        background: active ? '#AF231C' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.48)',
      }}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

function PrimaryKey({ hasNextField, onPress }) {
  return (
    <Key
      label={(
        <span className="flex items-center justify-center gap-1.5">
          {hasNextField ? 'Next' : 'Done'}
          {hasNextField ? <ChevronRight size={24} /> : <Check size={22} />}
        </span>
      )}
      ariaLabel={hasNextField ? 'Next field' : 'Done typing'}
      onPress={onPress}
      flex={2.2}
      primary
      compact
    />
  );
}

function Key({
  label,
  onPress,
  ariaLabel = null,
  flex = 1,
  active = false,
  primary = false,
  muted = false,
  compact = false,
}) {
  return (
    <button
      type="button"
      onPointerDown={(event) => { event.preventDefault(); onPress(); }}
      className="flex min-h-0 min-w-0 items-center justify-center rounded-[10px] border font-semibold transition-transform active:scale-[0.97]"
      style={{
        flex,
        background: primary || active ? '#AF231C' : '#292929',
        borderColor: primary || active ? '#c83a32' : '#383838',
        boxShadow: primary || active ? '0 2px 0 #78140f' : '0 2px 0 #101010',
        color: muted ? 'rgba(255,255,255,0.5)' : '#fff',
        fontSize: compact ? 'clamp(14px, 1.7vw, 21px)' : KEY_FONT,
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
      }}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      aria-pressed={active || undefined}
    >
      {label}
    </button>
  );
}
