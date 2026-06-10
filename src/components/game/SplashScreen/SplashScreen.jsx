import React from 'react';
import SplineGlobe from './SplineGlobe';
import LeaderboardScroller from './LeaderboardScroller';

const GRID_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%236B1515' stroke-width='0.7' opacity='0.6'/%3E%3C/svg%3E")`;

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(160deg, #8B1A1A 0%, #5C0F0F 60%, #3a0808 100%)',
    fontFamily: 'Montserrat, sans-serif',
    WebkitTapHighlightColor: 'transparent',
    animation: 'fadeIn 0.6s ease-out both',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: GRID_SVG,
    backgroundSize: '60px 60px',
    transform: 'perspective(600px) rotateX(20deg) scaleY(1.3)',
    transformOrigin: 'bottom center',
    opacity: 0.5,
    pointerEvents: 'none',
  },
  scanlines: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  header: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    animation: 'slideDownIn 0.8s ease-out 0.1s both',
  },
  branding: {
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
    padding: '0 16px',
    gap: 12,
    animation: 'slideUpIn 0.8s ease-out 0.2s both',
    minHeight: 0,
  },
  title: {
    fontSize: 48,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: '1px',
    margin: 0,
    lineHeight: 1.05,
    textShadow: '0 2px 20px rgba(255,68,68,0.4)',
    animation: 'fadeInScale 0.8s ease-out 0.3s both',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.75)',
    margin: 0,
  },
  tagline: {
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
    letterSpacing: '0.3px',
  },
  ctaSection: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    padding: '0 16px 12px',
    animation: 'slideUpIn 0.8s ease-out 0.45s both',
  },
  button: {
    background: '#fff',
    color: '#8B1A1A',
    fontSize: 16,
    fontWeight: 700,
    fontFamily: 'Montserrat, sans-serif',
    border: 'none',
    borderRadius: 50,
    padding: '14px 48px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 20px rgba(255,255,255,0.15)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    WebkitTapHighlightColor: 'transparent',
    minHeight: 44,
    touchAction: 'manipulation',
    textTransform: 'uppercase',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  },
  leaderboardSection: {
    position: 'relative',
    zIndex: 10,
    padding: '0 16px 16px',
    animation: 'slideUpIn 0.8s ease-out 0.55s both',
    minHeight: 0,
    overflow: 'hidden',
  },
  leaderboardTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
};

export default function SplashScreen({ onStart }) {
  const handleStart = (e) => {
    e.preventDefault();
    onStart(1);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDownIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 24px 6px rgba(175,35,28,0.55), 0 0 60px 10px rgba(175,35,28,0.25); }
          50% { box-shadow: 0 0 40px 12px rgba(175,35,28,0.8), 0 0 80px 20px rgba(175,35,28,0.4); }
        }
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        .splash-btn:active { transform: scale(0.95) !important; }

        @media (max-height: 667px) {
          .splash-globe-wrapper { width: 150px !important; height: 150px !important; }
          .splash-title { font-size: 40px !important; }
        }
        @media (max-height: 600px) {
          .splash-globe-wrapper { width: 120px !important; height: 120px !important; }
          .splash-title { font-size: 32px !important; }
          .splash-subtitle { font-size: 14px !important; }
          .splash-tagline { font-size: 11px !important; }
          .splash-btn-text { font-size: 14px !important; }
        }
      `}</style>

      <div style={styles.container}>
        {/* Background layers */}
        <div style={styles.grid} />
        <div style={styles.scanlines} />

        {/* Header */}
        <div style={styles.header}>
          <a href="https://www.headbox.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
              alt="HeadBox"
              style={{ height: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            />
          </a>
          <span style={styles.branding}>VenueGuessr</span>
        </div>

        {/* Main */}
        <div style={styles.main}>
          <div className="splash-globe-wrapper" style={{ width: 200, height: 200 }}>
            <SplineGlobe />
          </div>

          <h1 className="splash-title" style={styles.title}>VenueGuessr</h1>
          <p className="splash-subtitle" style={styles.subtitle}>Test your venue knowledge</p>
          <p className="splash-tagline" style={styles.tagline}>Drop in. Place a pin. Play to win.</p>
        </div>

        {/* CTA */}
        <div style={styles.ctaSection}>
          <button
            className="splash-btn"
            style={styles.button}
            onClick={handleStart}
            onTouchEnd={handleStart}
          >
            <span className="splash-btn-text">Start Game</span>
          </button>
        </div>

        {/* Leaderboard */}
        <div style={styles.leaderboardSection}>
          <div style={styles.leaderboardTitle}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4444', display: 'inline-block', boxShadow: '0 0 6px #FF4444' }} />
            Current High Scores
          </div>
          <LeaderboardScroller />
        </div>
      </div>
    </>
  );
}