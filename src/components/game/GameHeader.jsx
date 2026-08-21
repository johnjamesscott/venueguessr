import React from 'react';

export default function GameHeader({ level = null, round = null, totalRounds = null }) {
  const label = round != null
    ? `Round ${round}${totalRounds ? ` / ${totalRounds}` : ''}`
    : level != null ? `Level ${level}` : null;

  return (
    <header
      className="flex items-center justify-between bg-white"
      style={{
        height: 64,
        padding: '0 16px',
        borderRadius: 12,
        border: '1px solid rgba(217,217,217,0.5)',
        flexShrink: 0,
        boxSizing: 'border-box',
        margin: '12px 12px 0 12px',
      }}
    >
      <a href="https://www.headbox.com" target="_blank" rel="noopener noreferrer">
        <img
          src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
          alt="HeadBox"
          style={{ height: 64, objectFit: 'contain' }}
        />
      </a>
      {label && (
        <div style={{
          background: '#F5F5F5',
          borderRadius: 8,
          padding: '6px 14px',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#1A1A1A',
          letterSpacing: '0.5px',
          border: '1px solid #e0e0e0',
        }}>
          {label}
        </div>
      )}
    </header>
  );
}
