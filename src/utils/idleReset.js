export function createIdleResetController({
  timeoutSeconds,
  onIdle,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  const timeoutMs = Math.max(1, Number(timeoutSeconds) || 1) * 1_000;
  let timerId = null;
  let disposed = false;

  const activity = () => {
    if (disposed) return;
    if (timerId !== null) clearTimer(timerId);
    timerId = setTimer(() => {
      timerId = null;
      if (!disposed) onIdle();
    }, timeoutMs);
  };

  const dispose = () => {
    disposed = true;
    if (timerId !== null) clearTimer(timerId);
    timerId = null;
  };

  activity();
  return { activity, dispose };
}
