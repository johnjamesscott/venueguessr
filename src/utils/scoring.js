// Score calculation for VenueGuessr
// Max 5000 points per round (base) + up to 2000 time bonus
// Steeper distance penalty to make high scores harder given venues in similar regions

const MAX_BASE_SCORE = 5000;
const MAX_TIME_BONUS = 2000;

/**
 * Calculate score based on distance and time remaining.
 * @param {number} distanceKm - Distance in km between guess and actual
 * @param {number} timeRemainingSeconds - Seconds left on the timer when guess was locked (0 if timed out)
 * @param {number} totalSeconds - Total round time in seconds (default 30)
 */
export function calculateScore(distanceKm, timeRemainingSeconds = 0, totalSeconds = 30) {
  if (!distanceKm || distanceKm <= 0) return MAX_BASE_SCORE + MAX_TIME_BONUS;
  if (distanceKm >= 2000) return 0;

  // Steeper exponential decay: halved decay constant (500 → 250) and squared penalty
  // This makes it much harder to score well — being even 50km off hurts significantly
  const decayFactor = Math.exp(-(distanceKm * distanceKm) / (2 * 300 * 300));
  const baseScore = Math.round(MAX_BASE_SCORE * decayFactor);

  // Time bonus: linear — full bonus for instant answer, zero bonus if timed out
  const timeFraction = Math.max(0, Math.min(1, timeRemainingSeconds / totalSeconds));
  const timeBonus = Math.round(MAX_TIME_BONUS * timeFraction);

  return Math.max(0, baseScore + timeBonus);
}

export function getRating(score) {
  // Thresholds adjusted for new max of 7000 (5000 base + 2000 time bonus)
  if (score >= 6000) return { label: 'Perfect!', color: '#22c55e' };
  if (score >= 4500) return { label: 'Excellent', color: '#84cc16' };
  if (score >= 3000) return { label: 'Great', color: '#eab308' };
  if (score >= 1500) return { label: 'Good', color: '#f97316' };
  if (score >= 500)  return { label: 'Not bad', color: '#AF231C' };
  return { label: 'Keep trying!', color: '#888888' };
}