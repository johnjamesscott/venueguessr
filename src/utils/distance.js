// Haversine formula to calculate distance between two lat/lng points

export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R_km = 6371;
  const R_mi = 3958.8;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return {
    km: parseFloat((R_km * c).toFixed(1)),
    miles: parseFloat((R_mi * c).toFixed(1))
  };
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}