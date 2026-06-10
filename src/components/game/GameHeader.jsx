import React from 'react';

export default function GameHeader({ level }) {
  return (
    <header
      className="flex items-center justify-between bg-white"
      style={{ height: 60, padding: '0 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flexShrink: 0 }}
    >
      <a href="https://www.headbox.com" target="_blank" rel="noopener noreferrer">
        <img
          src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
          alt="HeadBox"
          style={{ height: 36, objectFit: 'contain' }}
        />
      </a>
      {level != null && (
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
          Level {level}
        </div>
      )}
    </header>
  );
}