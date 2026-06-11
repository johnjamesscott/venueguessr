import React, { useState } from 'react';
import CountdownTimer from './CountdownTimer';

// Game Boy style button primitive
function GBBtn({ size = 44, fontSize = 18, onClick, children, color = '#C0C0C0', textColor = '#1A1A1A' }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onPointerDown={() => { setPressed(true); onClick?.(); }}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        background: pressed ? '#999' : color,
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 800,
        fontSize,
        color: textColor,
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

const TIMER_BG = 132;

export default function ArcadeMapControls({ onPan, onZoom, timerSeconds, timerActive, onTimerExpire, roundIndex, onReset }) {
  return (
    // This wrapper is placed at bottom:'40vh' in Game.jsx — aligns to top edge of map
    // paddingTop pushes buttons DOWN into the map
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      width: '100%',
      paddingTop: 'calc(40vh * 0.30)', // 30% down the map height
    }}>

      {/* Reset button — left 25vw, on the map */}
      <div style={{ width: '25vw', display: 'flex', justifyContent: 'center', pointerEvents: 'auto' }}>
        <GBBtn size={52} fontSize={22} color='#3a3a3a' textColor='#fff' onClick={onReset}>
          {/* Reset icon — two curved arrows */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </GBBtn>
      </div>

      {/* Timer — 50vw, straddling the tour/map boundary via translateY(-50%) from Game.jsx wrapper */}
      <div style={{
        width: '50vw',
        display: 'flex',
        justifyContent: 'center',
        transform: 'translateY(calc(-100% + calc(40vh * 0.40)))', // shifted down 40% of map height
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

      {/* Zoom buttons — right 25vw, on the map */}
      <div style={{
        width: '25vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'auto',
      }}>
        <GBBtn size={44} fontSize={26} color='#3a3a3a' textColor='#fff' onClick={() => onZoom('in')}>+</GBBtn>
        <GBBtn size={44} fontSize={26} color='#3a3a3a' textColor='#fff' onClick={() => onZoom('out')}>−</GBBtn>
      </div>

    </div>
  );
}