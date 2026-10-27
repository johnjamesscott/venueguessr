export function createTourPreloadQueue(venues, roundCount) {
  const safeVenues = Array.isArray(venues) ? venues : [];
  const limit = Math.max(0, Math.min(safeVenues.length, Math.round(Number(roundCount) || 0)));
  const seen = new Set();

  return safeVenues.slice(0, limit).reduce((queue, venue) => {
    const url = venue?.tourUrl || venue?.matterport_url;
    if (typeof url !== 'string' || !url.trim() || seen.has(url)) return queue;
    seen.add(url);
    queue.push(url);
    return queue;
  }, []);
}

// With preloading off, never keep a hidden 3D renderer alive.
export function selectMountedTours(current, next, lookahead, playing, preloading = false) {
  if (!preloading) return playing && current ? [current] : [];
  return [...new Set([current, next === lookahead ? next : null].filter(Boolean))];
}
