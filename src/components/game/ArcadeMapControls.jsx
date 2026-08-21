import React from 'react';
import CountdownTimer from './CountdownTimer';

function GBBtn({ size = 44, fontSize = 18, onClick, onMouseEnter, onMouseLeave, children }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onPointerDown={() => { setPressed(true); onClick?.(); }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => { setPressed(false); onMouseLeave?.(); }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        background: pressed ? '#555' : '#3a3a3a',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 800,
        fontSize,
        color: '#fff',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        flexShrink: 0,
        transform: pressed ? 'scale(0.93) translateY(2px)' : 'scale(1)',
        boxShadow: pressed
          ? 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 0 rgba(0,0,0,0.3)'
          : '0 4px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
        transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease',
      }}
    >
      {children}
    </button>
  );
}

const TIMER_SIZE = 240;

export default function ArcadeMapControls({ onZoom, timerSeconds, timerActive, onTimerExpire, onTimerTick, roundIndex, onReset }) {
  const [resetPressed, setResetPressed] = React.useState(false);
  const [zoomInTip, setZoomInTip] = React.useState(false);
  const [zoomOutTip, setZoomOutTip] = React.useState(false);
  const [zoomUsed, setZoomUsed] = React.useState(false);

  // Show persistent hints on round 1 until zoom is used
  const showHints = roundIndex === 0 && !zoomUsed;

  const handleZoom = (dir) => {
    setZoomUsed(true);
    onZoom(dir);
  };

  return (
    <div style={{ position: 'absolute', bottom: 0, left: '1em', right: '1em', height: '40vh', pointerEvents: 'none', zIndex: 20 }}>

      {/* Timer — centred, straddling the top edge of the map */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto',
        zIndex: 22,
      }}>
        <div style={{
          width: TIMER_SIZE,
          height: TIMER_SIZE,
          background: '#1f1f1f',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
        }}>
          <CountdownTimer
            key={roundIndex}
            seconds={timerSeconds}
            onExpire={onTimerExpire}
            onTick={onTimerTick}
            isActive={timerActive}
          />
        </div>
      </div>

      {/* Reset map — pill button, top left */}
      <div style={{ position: 'absolute', top: 20, left: 16, pointerEvents: 'auto' }}>
        <button
          onPointerDown={() => { setResetPressed(true); onReset?.(); }}
          onPointerUp={() => setResetPressed(false)}
          onPointerCancel={() => setResetPressed(false)}
          onPointerLeave={() => setResetPressed(false)}
          style={{
            background: resetPressed ? '#555' : '#3a3a3a',
            color: '#fff',
            border: 'none',
            borderRadius: 50,
            padding: '18px 32px',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 26,
            cursor: 'pointer',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation',
            transform: resetPressed ? 'scale(0.93) translateY(2px)' : 'scale(1)',
            boxShadow: resetPressed
              ? 'inset 0 2px 4px rgba(0,0,0,0.4)'
              : '0 4px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
            transition: 'transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease',
          }}
        >
          Reset map
        </button>
      </div>

      {/* Zoom buttons — top right with tooltips */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'auto',
      }}>
        {/* Zoom In */}
        <div style={{ position: 'relative' }}>
          {(showHints || zoomInTip) && (
            <div style={{
              position: 'absolute', right: 100, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.85)', color: '#fff', borderRadius: 8,
              padding: '6px 12px', fontSize: 20, fontWeight: 600, whiteSpace: 'nowrap',
              pointerEvents: 'none',
              animation: showHints && !zoomInTip ? 'hintPulse 2s ease-in-out infinite' : 'none',
            }}>Zoom In</div>
          )}
          <GBBtn size={88} fontSize={52} onClick={() => handleZoom('in')}
            onMouseEnter={() => setZoomInTip(true)} onMouseLeave={() => setZoomInTip(false)}>+</GBBtn>
        </div>
        {/* Zoom Out */}
        <div style={{ position: 'relative' }}>
          {(showHints || zoomOutTip) && (
            <div style={{
              position: 'absolute', right: 100, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.85)', color: '#fff', borderRadius: 8,
              padding: '6px 12px', fontSize: 20, fontWeight: 600, whiteSpace: 'nowrap',
              pointerEvents: 'none',
              animation: showHints && !zoomOutTip ? 'hintPulse 2s ease-in-out infinite' : 'none',
            }}>Zoom Out</div>
          )}
          <GBBtn size={88} fontSize={52} onClick={() => handleZoom('out')}
            onMouseEnter={() => setZoomOutTip(true)} onMouseLeave={() => setZoomOutTip(false)}>−</GBBtn>
        </div>
        <style>{`
          @keyframes hintPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>

    </div>
  );
}
