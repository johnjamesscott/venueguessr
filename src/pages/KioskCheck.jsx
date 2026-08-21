import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Monitor, MousePointer2, RefreshCw, Wifi, XCircle } from 'lucide-react';

const getWebGlDetails = () => {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!context) return { supported: false, renderer: 'Unavailable' };
    const debugInfo = context.getExtension('WEBGL_debug_renderer_info');
    return {
      supported: true,
      renderer: debugInfo
        ? context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : context.getParameter(context.RENDERER),
    };
  } catch (_) {
    return { supported: false, renderer: 'Unavailable' };
  }
};

const readDevice = () => {
  const webgl = getWebGlDetails();
  const navigatorWithMemory = /** @type {Navigator & {deviceMemory?: number}} */ (navigator);
  return {
    viewport: `${window.innerWidth} × ${window.innerHeight}`,
    screen: `${window.screen.width} × ${window.screen.height}`,
    pixelRatio: window.devicePixelRatio || 1,
    online: navigator.onLine,
    touchPoints: navigator.maxTouchPoints || 0,
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches === true,
    orientation: window.screen.orientation?.type || (window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape'),
    memory: navigatorWithMemory.deviceMemory ? `${navigatorWithMemory.deviceMemory} GB estimate` : 'Not reported by browser',
    processors: navigator.hardwareConcurrency || 'Not reported',
    webgl,
  };
};

function Status({ pass, children }) {
  const Icon = pass ? CheckCircle2 : XCircle;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
      <Icon className={pass ? 'text-emerald-400' : 'text-amber-400'} size={26} />
      <span className="text-lg font-bold text-white">{children}</span>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <dt className="text-xs font-bold uppercase tracking-widest text-white/45">{label}</dt>
      <dd className="mt-2 break-words text-lg font-semibold text-white">{String(value)}</dd>
    </div>
  );
}

export default function KioskCheck() {
  const [device, setDevice] = useState(readDevice);
  const [touchCount, setTouchCount] = useState(0);
  const [lastPointer, setLastPointer] = useState('No touch detected yet');
  const refresh = useCallback(() => setDevice(readDevice()), []);

  useEffect(() => {
    window.addEventListener('resize', refresh);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    window.screen.orientation?.addEventListener?.('change', refresh);
    return () => {
      window.removeEventListener('resize', refresh);
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      window.screen.orientation?.removeEventListener?.('change', refresh);
    };
  }, [refresh]);

  const handlePointer = (event) => {
    setTouchCount((count) => count + 1);
    setLastPointer(`${event.pointerType || 'pointer'} at ${Math.round(event.clientX)}, ${Math.round(event.clientY)}`);
  };

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen?.();
      refresh();
    } catch (_) {
      // Chrome may reject fullscreen unless the kiosk policy allows it.
    }
  };

  return (
    <main className="min-h-screen bg-[#121212] px-6 py-8 text-white md:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#C76560]">VenueGuessr setup</p>
            <h1 className="mt-2 text-4xl font-black">Kiosk check</h1>
            <p className="mt-2 max-w-2xl text-white/55">Use this private setup screen before an event. It does not display player, lead or competition data.</p>
          </div>
          <a href="/" className="inline-flex min-h-14 items-center rounded-full border border-white/20 px-6 font-bold text-white">Back to game</a>
        </div>

        <section className="mt-8 grid gap-3 md:grid-cols-3">
          <Status pass={device.online}><Wifi size={20} /> {device.online ? 'Online' : 'Offline'}</Status>
          <Status pass={device.webgl.supported}><Monitor size={20} /> {device.webgl.supported ? 'WebGL ready' : 'WebGL unavailable'}</Status>
          <Status pass={device.touchPoints > 0 || device.coarsePointer}><MousePointer2 size={20} /> {device.touchPoints > 0 ? `${device.touchPoints} touch points` : 'Touch not detected'}</Status>
        </section>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Browser viewport" value={device.viewport} />
          <Detail label="Reported screen" value={device.screen} />
          <Detail label="Pixel ratio" value={device.pixelRatio} />
          <Detail label="Orientation" value={device.orientation} />
          <Detail label="Memory" value={device.memory} />
          <Detail label="Logical processors" value={device.processors} />
          <div className="sm:col-span-2 lg:col-span-3"><Detail label="Graphics renderer" value={device.webgl.renderer} /></div>
        </dl>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black">Touch test</h2>
          <p className="mt-1 text-white/50">Tap across the panel to confirm the touchscreen remains aligned after portrait rotation.</p>
          <button
            type="button"
            onPointerDown={handlePointer}
            className="mt-5 flex min-h-40 w-full touch-none items-center justify-center rounded-2xl border-2 border-dashed border-[#AF231C]/70 bg-[#AF231C]/10 px-5 text-center text-xl font-bold active:bg-[#AF231C]/25"
          >
            {touchCount ? `${touchCount} taps detected · ${lastPointer}` : 'Tap here in several places'}
          </button>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={refresh} className="inline-flex min-h-14 items-center gap-2 rounded-full bg-[#AF231C] px-6 font-bold text-white">
            <RefreshCw size={20} /> Refresh check
          </button>
          <button type="button" onClick={enterFullscreen} className="inline-flex min-h-14 items-center rounded-full border border-white/20 px-6 font-bold text-white">
            Enter fullscreen
          </button>
        </div>
      </div>
    </main>
  );
}
