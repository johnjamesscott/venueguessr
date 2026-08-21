// Sound manager using Web Audio API — no external files needed
// All sounds are synthesised procedurally

let ctx = null;

function getCtx() {
  const AudioContextConstructor = window.AudioContext || window['webkitAudioContext'];
  if (!ctx && AudioContextConstructor) ctx = new AudioContextConstructor();
  return ctx;
}

// Resume context after user gesture
export function unlockAudio() {
  try { getCtx().resume(); } catch (_) {}
}

// ── Tension music loop ────────────────────────────────────────────────────
let tensionNodes = [];
let tensionStarted = false;

export function startTensionMusic() {
  if (tensionStarted) return;
  tensionStarted = true;
  const ac = getCtx();

  // Low pulsing bass + hi-hat rhythm
  function schedulePulse(time, freq, dur, gain = 0.18) {
    const osc = ac.createOscillator();
    const gainNode = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(gain, time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gainNode);
    gainNode.connect(ac.destination);
    osc.start(time);
    osc.stop(time + dur + 0.05);
    tensionNodes.push(osc, gainNode);
  }

  function scheduleHat(time) {
    const bufSize = ac.sampleRate * 0.05;
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;
    const gainNode = ac.createGain();
    gainNode.gain.setValueAtTime(0.06, time);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    src.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ac.destination);
    src.start(time);
    tensionNodes.push(src, gainNode);
  }

  const bpm = 140;
  const beat = 60 / bpm;
  const loop = beat * 8; // 8-beat loop

  function playLoop(startTime) {
    if (!tensionStarted) return;
    // Bass pulses on beats 1, 3, 5, 7
    for (let b = 0; b < 8; b += 2) {
      schedulePulse(startTime + b * beat, 55, beat * 1.5, 0.2);
      schedulePulse(startTime + b * beat, 82, beat * 1.2, 0.12);
    }
    // Hi-hats on every beat
    for (let b = 0; b < 8; b++) {
      scheduleHat(startTime + b * beat);
    }
    // Rising tension note on beat 5
    schedulePulse(startTime + 4 * beat, 220, beat * 2, 0.08);
    // Schedule next loop
    const nextStart = startTime + loop;
    const timeoutMs = (nextStart - ac.currentTime) * 1000 - 50;
    const tid = setTimeout(() => playLoop(nextStart), Math.max(0, timeoutMs));
    tensionNodes.push({ stop: () => clearTimeout(tid) });
  }

  playLoop(ac.currentTime + 0.1);
}

export function stopTensionMusic() {
  tensionStarted = false;
  tensionNodes.forEach(n => {
    try { if (n.stop) n.stop(0); } catch (_) {}
  });
  tensionNodes = [];
}

// ── Pin placed ────────────────────────────────────────────────────────────
export function playPinSound() {
  const ac = getCtx();
  const t = ac.currentTime;
  // Quick "plop" — descending tone
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
  gain.gain.setValueAtTime(0.4, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.25);
}

// ── Lock in guess ─────────────────────────────────────────────────────────
export function playLockSound() {
  const ac = getCtx();
  const t = ac.currentTime;
  // Two-click mechanical lock sound
  [0, 0.08].forEach(offset => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.3, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.06);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + offset);
    osc.stop(t + offset + 0.1);
  });
}

// ── Celebration (good score) ──────────────────────────────────────────────
export function playCelebrationSound() {
  const ac = getCtx();
  const t = ac.currentTime;
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const start = t + i * 0.12;
    gain.gain.setValueAtTime(0.35, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.4);
  });
}

// ── Error / bad score ─────────────────────────────────────────────────────
export function playErrorSound() {
  const ac = getCtx();
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.linearRampToValueAtTime(110, t + 0.3);
  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.45);
}
