export const MAX_BASE_ROUND_SCORE = 5_000;
export const MAX_ROUNDS = 5;

const clamp = (value, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
};

export function normalizeIcpMultiplier(value) {
  if (value == null || value === '') return 1.25;
  const number = Number(value);
  if (!Number.isFinite(number)) return 1.25;
  return Math.min(2, Math.max(1, number));
}

export function calculateSubmittedRoundScore(baseScoreValue, boosted, multiplier) {
  const baseScore = Math.round(clamp(baseScoreValue, 0, MAX_BASE_ROUND_SCORE));
  return boosted ? Math.round(baseScore * normalizeIcpMultiplier(multiplier)) : baseScore;
}
