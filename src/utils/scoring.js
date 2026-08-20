// Score calculation for VenueGuessr
// Max 5000 points per round — accuracy only (time bonus removed).
// Steeper distance penalty to make high scores harder given venues in similar regions.

const MAX_BASE_SCORE = 5000;

// ICP Boost: multiplies a high-value prospect's final total score when armed on the kiosk.
// Adjust this single constant to control the boost strength.
export const ICP_BOOST_FACTOR = 2;

/**
 * Calculate score based on distance only (accuracy). Time is no longer rewarded.
 * @param {number} distanceKm - Distance in km between guess and actual
 * @param {number} _timeRemainingSeconds - unused (kept for call-site compatibility)
 * @param {number} _totalSeconds - unused (kept for call-site compatibility)
 */
export function calculateScore(distanceKm, _timeRemainingSeconds = 0, _totalSeconds = 30) {
  if (!distanceKm || distanceKm <= 0) return MAX_BASE_SCORE;
  if (distanceKm >= 2000) return 0;

  // Steeper exponential decay: accuracy only — no time bonus
  const decayFactor = Math.exp(-(distanceKm * distanceKm) / (2 * 300 * 300));
  const baseScore = Math.round(MAX_BASE_SCORE * decayFactor);

  return Math.max(0, baseScore);
}

export function getRating(score) {
  // Thresholds for accuracy-only max of 5000 per round
  if (score >= 4500) return { label: 'Perfect!', color: '#22c55e' };
  if (score >= 3000) return { label: 'Excellent', color: '#84cc16' };
  if (score >= 2000) return { label: 'Great', color: '#eab308' };
  if (score >= 1000) return { label: 'Good', color: '#f97316' };
  if (score >= 300)  return { label: 'Not bad', color: '#AF231C' };
  return { label: 'Keep trying!', color: '#888888' };
}