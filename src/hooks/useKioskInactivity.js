import { useEffect } from 'react';
import { createIdleResetController } from '@/utils/idleReset';

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'blur', 'focus'];

export function useKioskInactivity({ timeoutSeconds, onIdle }) {
  useEffect(() => {
    const controller = createIdleResetController({ timeoutSeconds, onIdle });
    ACTIVITY_EVENTS.forEach(eventName => {
      window.addEventListener(eventName, controller.activity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach(eventName => {
        window.removeEventListener(eventName, controller.activity);
      });
      controller.dispose();
    };
  }, [onIdle, timeoutSeconds]);
}
