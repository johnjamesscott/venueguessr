import { useEffect } from 'react';

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

export function useKioskInteractionGuards({ enabled }) {
  useEffect(() => {
    if (!enabled) return undefined;

    document.body.classList.add('venueguessr-kiosk-active');

    const preventContextMenu = (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest(EDITABLE_SELECTOR)) return;
      event.preventDefault();
    };

    document.addEventListener('contextmenu', preventContextMenu);
    return () => {
      document.body.classList.remove('venueguessr-kiosk-active');
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [enabled]);
}
