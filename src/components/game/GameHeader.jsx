import React from 'react';

export default function GameHeader() {
  return (
    <header className="flex items-center justify-between bg-white shadow-sm" style={{ padding: '10px 12px' }}>
      <img
        src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
        alt="HeadBox"
        className="h-7 md:h-8 object-contain"
      />
      <div className="flex items-center gap-2">
        <a
          href="https://www.headbox.com/get-a-demo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center font-bold text-xs uppercase tracking-wider px-4 py-2 rounded border-2 border-gray-800 text-gray-800 hover:bg-gray-100 transition-colors"
        >
          Get a demo
        </a>
        <a
          href="https://www.headbox.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center font-bold text-xs uppercase tracking-wider px-4 py-2 rounded bg-hb-red hover:bg-hb-red-dark text-white transition-colors"
        >
          Plan your event
        </a>
      </div>
    </header>
  );
}