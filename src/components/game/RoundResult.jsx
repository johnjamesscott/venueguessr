import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getRating } from '@/utils/scoring';

const createPinIcon = (colour) => new L.DivIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41" aria-hidden="true"><path d="M12.5 0C5.6 0 0 5.6 0 12.5 0 23 12.5 41 12.5 41S25 23 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="${colour}" stroke="white" stroke-width="1.5"/><circle cx="12.5" cy="12.5" r="4" fill="white"/></svg>`,
  className: '',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = createPinIcon('#AF231C');
const greyIcon = createPinIcon('#94a3b8');

function FitBounds({ guess, actual }) {
  const map = useMap();
  useEffect(() => {
    if (guess && actual) {
      const bounds = L.latLngBounds([guess, actual]);
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (actual) {
      map.setView(actual, 5);
    }
  }, [guess, actual, map]);
  return null;
}

function AnimatedScore({ target }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 1200;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(current + increment, target);
      setDisplayed(Math.round(current));
      if (current >= target) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);

  return <>{displayed.toLocaleString()}</>;
}

export default function RoundResult({ roundNumber, venue, guess, distance, score, onNext, isLastRound }) {
  /** @type {[number, number] | null} */
  const guessPos = guess ? [Number(guess.lat), Number(guess.lng)] : null;
  /** @type {[number, number]} */
  const actualPos = [Number(venue.lat), Number(venue.lng)];
  const rating = getRating(score);

  return (
    <div className="fade-in flex flex-col gap-3">
      {/* Full-width map */}
      <div className="w-full rounded-hb-lg overflow-hidden border border-hb-border" style={{ height: '280px' }}>
        <MapContainer
          center={actualPos}
          zoom={4}
          style={{ width: '100%', height: '280px' }}
          zoomControl={true}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
          <Marker position={actualPos} icon={redIcon} />
          {guessPos && (
            <>
              <Marker position={guessPos} icon={greyIcon} />
              <Polyline
                positions={[guessPos, actualPos]}
                color="#AF231C"
                weight={2.5}
                dashArray="8 5"
              />
            </>
          )}
          <FitBounds guess={guessPos} actual={actualPos} />
        </MapContainer>
      </div>

      {/* Score + info card */}
      <div className="bg-hb-surface rounded-hb-lg border border-hb-border p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: distance & venue */}
          <div className="flex-1 min-w-0">
            <p className="text-hb-red font-bold text-xs uppercase tracking-widest mb-1">Round {roundNumber}</p>
            {guess ? (
              <>
                <p className="text-white font-black text-2xl leading-tight">
                  {distance.miles} <span className="text-white/50 font-bold text-lg">miles</span>
                </p>
                <p className="text-white/40 font-medium text-sm">{distance.km} km away</p>
              </>
            ) : (
              <p className="text-white font-black text-xl">TIME'S UP</p>
            )}
            <p className="text-hb-text-muted text-xs mt-2 truncate">
              <span className="text-white/70 font-medium">{venue.venueName}</span>
              {' — '}{venue.city}, {venue.country}
            </p>
          </div>

          {/* Right: score */}
          <div className="text-right shrink-0">
            <div
              className="text-4xl font-black leading-tight"
              style={{ color: rating.color }}
            >
              <AnimatedScore target={score} />
            </div>
            <div className="text-hb-text-muted text-xs font-bold uppercase tracking-wider">points</div>
            <div
              className="text-xs font-bold uppercase tracking-wider mt-1"
              style={{ color: rating.color }}
            >
              {rating.label}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {guessPos && (
        <div className="flex items-center gap-4 text-xs text-hb-text-muted px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-400" />
            Your guess
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-hb-red" />
            Actual venue
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 border-t-2 border-dashed border-hb-red" />
            Distance
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full bg-hb-red hover:bg-hb-red-dark text-white font-bold uppercase tracking-widest text-sm py-3.5 rounded-hb-xl transition-colors duration-200"
      >
        {isLastRound ? 'See Results' : 'Next Round'}
      </button>
    </div>
  );
}
