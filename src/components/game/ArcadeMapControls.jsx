import React from 'react';
import CountdownTimer from './CountdownTimer';

function GBBtn({ size = 44, fontSize = 18, onClick, label, children }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
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

const TIMER_SIZE = 144;

export default function ArcadeMapControls({ onZoom, timerSeconds, timerActive, onTimerExpire, onTimerTick, roundIndex, onReset }) {
  const [resetPressed, setResetPressed] = React.useState(false);
  return (
    <div style={{ position: 'absolute', bottom: 0, left: '1em', right: '1em', height: '40vh', pointerEvents: 'none', zIndex: 20 }}>

      {/* Timer — centred, straddling the top edge of the map */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
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
      <div style={{ position: 'absolute', top: 16, left: 16, pointerEvents: 'auto' }}>
        <button
          onClick={onReset}
          onPointerDown={() => setResetPressed(true)}
          onPointerUp={() => setResetPressed(false)}
          onPointerCancel={() => setResetPressed(false)}
          onPointerLeave={() => setResetPressed(false)}
          style={{
            background: resetPressed ? '#555' : '#3a3a3a',
            color: '#fff',
            border: 'none',
            borderRadius: 50,
            minHeight: 44,
            padding: '10px 14px',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 14,
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

      {/* Compact fallback controls; drag and pinch remain available on the map. */}
      <div style={{
        position: 'absolute', top: 16, right: 16,
        display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'auto',
      }}>
        <GBBtn size={44} fontSize={28} label="Zoom in" onClick={() => onZoom('in')}>+</GBBtn>
        <GBBtn size={44} fontSize={28} label="Zoom out" onClick={() => onZoom('out')}>−</GBBtn>
      </div>

    </div>
  );
}
