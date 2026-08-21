import { base44 } from '@/api/base44Client';

export function trackEvent(eventName, properties = {}) {
  try {
    base44.analytics.track({ eventName, properties });
  } catch {
    // Analytics must never interrupt a kiosk game or lead form.
  }
}
