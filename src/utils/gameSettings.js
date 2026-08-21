export const DEFAULT_GAME_SETTINGS = Object.freeze({
  icpMultiplier: 1.25,
  roundCount: 3,
  roundSeconds: 30,
  kioskIdleSeconds: 90,
});

const clamp = (value, fallback, min, max, integer = false) => {
  if (value == null || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const normalized = integer ? Math.round(number) : number;
  return Math.min(max, Math.max(min, normalized));
};

export function normalizeGameSettings(value = {}) {
  const source = value?.settings || value || {};
  return {
    icpMultiplier: clamp(
      source.icpMultiplier ?? source.icp_multiplier,
      DEFAULT_GAME_SETTINGS.icpMultiplier,
      1,
      2,
    ),
    roundCount: clamp(
      source.roundCount ?? source.round_count,
      DEFAULT_GAME_SETTINGS.roundCount,
      1,
      5,
      true,
    ),
    roundSeconds: clamp(
      source.roundSeconds ?? source.round_seconds,
      DEFAULT_GAME_SETTINGS.roundSeconds,
      15,
      90,
      true,
    ),
    kioskIdleSeconds: clamp(
      source.kioskIdleSeconds ?? source.kiosk_idle_seconds,
      DEFAULT_GAME_SETTINGS.kioskIdleSeconds,
      30,
      300,
      true,
    ),
  };
}
