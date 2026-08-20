import React, { useRef, useState } from 'react';
import SplineGlobe from './SplineGlobe';
import LeaderboardScroller from './LeaderboardScroller';

const BG_IMAGE = 'https://media.base44.com/images/public/69fb297293cfcce3424dad36/78e67546d_iPhone17-211.png';

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100dvh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundImage: `url(${BG_IMAGE})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
    fontFamily: 'Montserrat, sans-serif',
    WebkitTapHighlightColor: 'transparent',
    animation: 'fadeIn 0.6s ease-out both',
  },
  scanlines: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  header: {
    position: 'relative',
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px 8px',
    animation: 'slideDownIn 0.8s ease-out 0.1s both',
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
    gap: 0,
    animation: 'slideUpIn 0.8s ease-out 0.2s both',
    minHeight: 0,
  },
  title: {
    fontSize: 126,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: '1px',
    margin: 0,
    lineHeight: 1.0,
    textShadow: '0 2px 24px rgba(0,0,0,0.8), 0 0 40px rgba(255,68,68,0.5)',
    animation: 'fadeInScale 0.8s ease-out 0.3s both',
  },
  subtitle: {
    fontSize: 45,
    fontWeight: 400,
    color: 'rgba(255,255,255,0.8)',
    margin: '10px 0 0',
    textShadow: '0 1px 8px rgba(0,0,0,0.6)',
  },
  tagline: {
    fontSize: 36,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.55)',
    margin: '4px 0 0',
    letterSpacing: '0.3px',
    textShadow: '0 1px 6px rgba(0,0,0,0.5)',
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
    fontSize: 48,
    fontWeight: 700,
    fontFamily: 'Montserrat, sans-serif',
    border: 'none',
    borderRadius: 50,
    padding: '28px 80px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.15)',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    textTransform: 'uppercase',
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
    fontSize: 33,
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

export default function SplashScreen({ onStart, onDemo, icpBoostArmed, onToggleIcpBoost }) {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const [flash, setFlash] = useState(false);

  // Hidden trigger: 5 quick taps on the HeadBox logo toggles the ICP boost.
  const handleLogoTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 1500);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      onToggleIcpBoost?.();
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    }
  };

  const handleStart = (e) => {
    e.preventDefault();
    onStart(1);
  };

  const handleDemo = (e) => {
    e.preventDefault();
    onDemo();
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
        .splash-btn:active { transform: scale(0.95) !important; }
        @keyframes creditFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .credit-flash { animation: creditFlash 1s step-start infinite; }

        @media (max-height: 750px) {
          .splash-globe-wrapper { width: 900px !important; height: 900px !important; }
          .splash-title { font-size: 36px !important; }
        }
        @media (max-height: 600px) {
          .splash-globe-wrapper { width: 700px !important; height: 700px !important; }
          .splash-title { font-size: 28px !important; }
        }
      `}</style>

      <div style={styles.container}>
        {/* Scanlines */}
        <div style={styles.scanlines} />

        {/* Header — centred HeadBox logo */}
        <div style={styles.header}>
          <div onClick={handleLogoTap} style={{ display: 'flex', alignItems: 'center', cursor: 'default', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}>
            <img
              src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b1384ca2c6e19d_HeadBox-Logo-Brick-header.png"
              alt="HeadBox"
              style={{ height: 256, objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.95, pointerEvents: 'none' }}
            />
          </div>
        </div>

        {/* Discreet ICP indicator — only the team sees this */}
        {icpBoostArmed && (
          <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 50, pointerEvents: 'none' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#AF231C', boxShadow: '0 0 6px #AF231C' }} />
          </div>
        )}
        {flash && (
          <div style={{ position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(20,20,20,0.92)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '8px 18px', borderRadius: 8, zIndex: 100, letterSpacing: '0.5px', pointerEvents: 'none' }}>
            ICP boost {icpBoostArmed ? 'armed' : 'disarmed'}
          </div>
        )}

        {/* Globe — absolute behind everything */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
          pointerEvents: 'none',
        }}>
          <div className="splash-globe-wrapper" style={{ width: 2800, height: 2800, flexShrink: 0 }}>
            <SplineGlobe size={2800} />
          </div>
        </div>

        {/* Main — title + subtitle centred over globe */}
        <div style={styles.main}>
          <div style={{ textAlign: 'center', zIndex: 20, pointerEvents: 'none' }}>
            <h1 className="splash-title" style={styles.title}>VenueGuessr</h1>
            <p className="splash-subtitle" style={styles.subtitle}>Test your venue knowledge</p>
            <p className="splash-tagline" style={styles.tagline}>Drop in. Place a pin. Play to win.</p>
          </div>
        </div>

        {/* CTA */}
        <div style={styles.ctaSection}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button
              className="splash-btn"
              style={styles.button}
              onClick={handleStart}
              onTouchEnd={handleStart}
            >
              <span className="splash-btn-text">Start Game</span>
            </button>
            <span className="credit-flash" style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: 39,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#ffffff',
              textShadow: '0 0 10px rgba(255,255,255,0.6)',
            }}>
              ★ 1 Credit ★
            </span>
          </div>
        </div>

        {/* Demo button */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', padding: '4px 16px 8px', animation: 'slideUpIn 0.8s ease-out 0.5s both' }}>
          <button
            className="splash-btn"
            style={{
              background: '#1f1f1f',
              color: '#fff',
              fontSize: 30,
              fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: 50,
              padding: '16px 56px',
              cursor: 'pointer',
              letterSpacing: '0.5px',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              textTransform: 'uppercase',
            }}
            onClick={handleDemo}
            onTouchEnd={handleDemo}
          >
            Play Demo
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