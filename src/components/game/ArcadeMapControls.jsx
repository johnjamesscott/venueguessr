import React, { useState } from 'react';
import CountdownTimer from './CountdownTimer';

const BTN = {
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
  boxShadow: '0 4px 0 rgba(0,0,0,0.25), 0 6px 12px rgba(0,0,0,0.2)',
  transition: 'transform 0.08s ease, box-shadow 0.08s ease',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
  touchAction: 'manipulation',
  flexShrink: 0,
};

function ArcadeBtn({ size = 52, fontSize = 20, onClick, children, style }) {
  const [pressed, setPressed] = React.useState(false);
  const handleDown = () => { setPressed(true); onClick?.(); };
  const handleUp = () => setPressed(false);

  return (
    <button
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
      style={{
        ...BTN,
        width: size,
        height: size,
        fontSize,
        transform: pressed ? 'scale(0.92) translateY(2px)' : 'scale(1)',
        boxShadow: pressed
          ? '0 2px 0 rgba(0,0,0,0.25), 0 3px 6px rgba(0,0,0,0.15)'
          : '0 4px 0 rgba(0,0,0,0.25), 0 6px 12px rgba(0,0,0,0.2)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// Arrow SVGs
const Arrow = ({ dir }) => {
  const r = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: `rotate(${r}deg)` }}>
      <path d="M9 3L15 13H3L9 3Z" fill="#1A1A1A" />
    </svg>
  );
};

export default function ArcadeMapControls({ onPan, onZoom, timerSeconds, timerActive, onTimerExpire, roundIndex }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      height: '100%',
      gap: 8,
    }}>

      {/* D-Pad */}
      <div style={{ display: 'grid', gridTemplateColumns: '52px 52px 52px', gridTemplateRows: '52px 52px 52px', gap: 4, flexShrink: 0 }}>
        {/* Up */}
        <div style={{ gridColumn: 2, gridRow: 1 }}>
          <ArcadeBtn onClick={() => onPan('up')}><Arrow dir="up" /></ArcadeBtn>
        </div>
        {/* Left */}
        <div style={{ gridColumn: 1, gridRow: 2 }}>
          <ArcadeBtn onClick={() => onPan('left')}><Arrow dir="left" /></ArcadeBtn>
        </div>
        {/* Center fill */}
        <div style={{ gridColumn: 2, gridRow: 2, width: 52, height: 52, background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        {/* Right */}
        <div style={{ gridColumn: 3, gridRow: 2 }}>
          <ArcadeBtn onClick={() => onPan('right')}><Arrow dir="right" /></ArcadeBtn>
        </div>
        {/* Down */}
        <div style={{ gridColumn: 2, gridRow: 3 }}>
          <ArcadeBtn onClick={() => onPan('down')}><Arrow dir="down" /></ArcadeBtn>
        </div>
      </div>

      {/* Timer — centre with circle background */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        width: 180,
        height: 180,
        background: '#1f1f1f',
        borderRadius: '50%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
      }}>
        <CountdownTimer
          key={roundIndex}
          seconds={timerSeconds}
          onExpire={onTimerExpire}
          isActive={timerActive}
        />
      </div>

      {/* Zoom buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', flexShrink: 0 }}>
        <ArcadeBtn size={52} fontSize={28} onClick={() => onZoom('in')}>+</ArcadeBtn>
        <ArcadeBtn size={52} fontSize={28} onClick={() => onZoom('out')}>−</ArcadeBtn>
      </div>
    </div>
  );
}