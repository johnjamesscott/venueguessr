// Score calculation for VenueGuessr
// Max 5000 points per round, scaling down with distance

const MAX_SCORE = 5000;
const ZERO_SCORE_KM = 5000; // distance at which score = 0

export function calculateScore(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return 0;
  if (distanceKm >= ZERO_SCORE_KM) return 0;
  // Exponential decay feels more rewarding for close guesses
  const score = MAX_SCORE * Math.exp(-distanceKm / 1000);
  return Math.round(score);
}

export function getRating(score) {
  if (score >= 4500) return { label: 'Perfect!', color: '#22c55e' };
  if (score >= 3500) return { label: 'Excellent', color: '#84cc16' };
  if (score >= 2500) return { label: 'Great', color: '#eab308' };
  if (score >= 1500) return { label: 'Good', color: '#f97316' };
  if (score >= 500)  return { label: 'Not bad', color: '#AF231C' };
  return { label: 'Keep trying!', color: '#888888' };
}