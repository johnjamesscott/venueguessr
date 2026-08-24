import React from 'react';
import SplineGlobe from './SplashScreen/SplineGlobe';

const BG_IMAGE = 'https://media.base44.com/images/public/69fb297293cfcce3424dad36/78e67546d_iPhone17-211.png';
const HEADBOX_LOGO = 'https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png';

export default function ScoreCaptureBackdrop({ children }) {
  return (
    <div
      className="score-capture-backdrop fixed inset-0 z-50 overflow-hidden"
      style={{
        minHeight: '100dvh',
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      <style>{`
        @keyframes scoreCaptureGlowPulse {
          0%, 100% { filter: brightness(0.88); opacity: 0.7; }
          50% { filter: brightness(1); opacity: 0.82; }
        }
        .score-capture-globe {
          animation: scoreCaptureGlowPulse 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .score-capture-globe { animation: none; }
        }
      `}</style>

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
        }}
      />
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/20 via-black/45 to-black/75 pointer-events-none" />

      <div className="score-capture-globe absolute inset-0 z-[3] flex items-center justify-center pointer-events-none">
        <div className="h-[min(1200px,128vmax)] w-[min(1200px,128vmax)] shrink-0">
          <SplineGlobe size="100%" />
        </div>
      </div>

      <header className="absolute inset-x-0 top-0 z-20 flex justify-center px-6 pt-5 md:pt-8 pointer-events-none">
        <img
          src={HEADBOX_LOGO}
          alt="HeadBox"
          className="h-[clamp(70px,11vw,120px)] max-w-[calc(100vw-48px)] object-contain opacity-95 brightness-0 invert"
        />
      </header>

      <div className="relative z-30 h-full min-h-[100dvh] overflow-y-auto px-5 pb-8 pt-[clamp(110px,17vw,180px)] md:px-8">
        <div className="flex min-h-[calc(100dvh-clamp(140px,20vw,210px))] items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}
