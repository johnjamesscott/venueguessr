import React, { useState } from 'react';
import CountdownTimer from './CountdownTimer';

const BTN_BASE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#fff',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  fontFamily: 'Montserrat, sans-serif',
  fontWeight: 700,
  color: '#1A1A1A',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  flexShrink: 0,
};

function ArcadeBtn({ size = 36, fontSize = 14, onClick, children }) {
  const [pressed, setPressed] = React.useState(false);
  const handleDown = () => { setPressed(true); onClick?.(); };
  const handleUp = () => setPressed(false);

  return (
    <button
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      style={{
        ...BTN_BASE,
        width: size,
        height: size,
        fontSize,
        transform: pressed ? 'scale(0.92) translateY(2px)' : 'scale(1)',
        boxShadow: pressed
          ? '0 2px 0 rgba(0,0,0,0.25), 0 3px 6px rgba(0,0,0,0.15)'
          : '0 4px 0 rgba(0,0,0,0.25), 0 6px 12px rgba(0,0,0,0.2)',
        transition: 'transform 0.08s ease, box-shadow 0.08s ease',
      }}
    >
      {children}
    </button>
  );
}

const Arrow = ({ dir }) => {
  const r = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg width="12" height="12" viewBox="0 0 18 18" fill="none" style={{ transform: `rotate(${r}deg)` }}>
      <path d="M9 3L15 13H3L9 3Z" fill="#1A1A1A" />
    </svg>
  );
};

// D-pad button size: fit 3 columns + 2 gaps (3px each) in 25vw minus some padding
const DPAD_BTN = 'calc((25vw - 22px) / 3)';
// Timer background circle: 6px padding on each side around the 120px SVG = 132px
const TIMER_BG = 132;

export default function ArcadeMapControls({ onPan, onZoom, timerSeconds, timerActive, onTimerExpire, roundIndex }) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      zIndex: 100,
    }}>

      {/* D-pad — 25vw, sits on the map only */}
      <div style={{ width: '25vw', display: 'flex', justifyContent: 'center', paddingTop: 10, pointerEvents: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(3, ${DPAD_BTN})`,
          gridTemplateRows: `repeat(3, ${DPAD_BTN})`,
          gap: 3,
        }}>
          <div style={{ gridColumn: 2, gridRow: 1 }}>
            <ArcadeBtn size={DPAD_BTN} onClick={() => onPan('up')}><Arrow dir="up" /></ArcadeBtn>
          </div>
          <div style={{ gridColumn: 1, gridRow: 2 }}>
            <ArcadeBtn size={DPAD_BTN} onClick={() => onPan('left')}><Arrow dir="left" /></ArcadeBtn>
          </div>
          <div style={{ gridColumn: 2, gridRow: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ gridColumn: 3, gridRow: 2 }}>
            <ArcadeBtn size={DPAD_BTN} onClick={() => onPan('right')}><Arrow dir="right" /></ArcadeBtn>
          </div>
          <div style={{ gridColumn: 2, gridRow: 3 }}>
            <ArcadeBtn size={DPAD_BTN} onClick={() => onPan('down')}><Arrow dir="down" /></ArcadeBtn>
          </div>
        </div>
      </div>

      {/* Timer — 50vw, centered, straddles the tour/map boundary */}
      <div style={{
        width: '50vw',
        display: 'flex',
        justifyContent: 'center',
        transform: 'translateY(-50%)',
        pointerEvents: 'auto',
      }}>
        <div style={{
          width: TIMER_BG,
          height: TIMER_BG,
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
            isActive={timerActive}
          />
        </div>
      </div>

      {/* Zoom buttons — 25vw, sits on the map only */}
      <div style={{
        width: '25vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        paddingTop: 10,
        pointerEvents: 'auto',
      }}>
        <ArcadeBtn size={40} fontSize={24} onClick={() => onZoom('in')}>+</ArcadeBtn>
        <ArcadeBtn size={40} fontSize={24} onClick={() => onZoom('out')}>−</ArcadeBtn>
      </div>

    </div>
  );
}