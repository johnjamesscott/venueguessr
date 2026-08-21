export function withTimeout(promise, timeoutMs, message = 'Request timed out') {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout])
    .finally(() => clearTimeout(timeoutId));
}
