export const MAX_BASE_ROUND_SCORE = 5_000;
export const MAX_ROUNDS = 5;
const EARTH_RADIUS_KM = 6_371;

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

const toRadians = (degrees) => degrees * (Math.PI / 180);

export function normalizeGuess(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export function calculateDistanceKm(guess, venue) {
  if (!guess || !venue) return null;
  const venueLat = Number(venue.latitude);
  const venueLng = Number(venue.longitude);
  if (!Number.isFinite(venueLat) || !Number.isFinite(venueLng)) return null;

  const dLat = toRadians(venueLat - guess.lat);
  const dLng = toRadians(venueLng - guess.lng);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(guess.lat)) * Math.cos(toRadians(venueLat))
    * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(1));
}

export function calculateBaseRoundScore(distanceKm) {
  if (distanceKm == null) return 0;
  if (distanceKm <= 0) return MAX_BASE_ROUND_SCORE;
  if (distanceKm >= 2_000) return 0;
  const decayFactor = Math.exp(-(distanceKm * distanceKm) / (2 * 300 * 300));
  return Math.max(0, Math.round(MAX_BASE_ROUND_SCORE * decayFactor));
}

export function calculateVerifiedRound({ venue, guess, boosted, multiplier }) {
  const distanceKm = calculateDistanceKm(guess, venue);
  const baseScore = calculateBaseRoundScore(distanceKm);
  const score = boosted
    ? Math.round(baseScore * normalizeIcpMultiplier(multiplier))
    : baseScore;
  return { baseScore, score, distanceKm: distanceKm ?? 0 };
}
