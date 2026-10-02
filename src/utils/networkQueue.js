// Bound map traffic so it cannot open dozens of competing requests on kiosk Wi-Fi.
export function createRequestQueue(limit = 4) {
  let active = 0;
  const waiting = [];
  function drain() {
    while (active < limit && waiting.length) {
      const { task, resolve, reject } = waiting.shift();
      active++;
      Promise.resolve().then(task).then(resolve, reject).finally(() => { active--; drain(); });
    }
  }
  return (task) => new Promise((resolve, reject) => {
    waiting.push({ task, resolve, reject });
    drain();
  });
}

export function tourLookaheadDelay(connection, online = true) {
  if (!online || connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType)) return null;
  return connection?.effectiveType === '3g' ? 20_000 : 8_000;
}
