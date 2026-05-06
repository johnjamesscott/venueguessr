import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

const greyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

function FitBounds({ guess, actual }) {
  const map = useMap();
  useEffect(() => {
    if (guess && actual) {
      const bounds = L.latLngBounds([guess, actual]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [guess, actual, map]);
  return null;
}

export default function RoundResult({ roundNumber, venue, guess, distance, onNext, isLastRound }) {
  const guessPos = guess ? [guess.lat, guess.lng] : null;
  const actualPos = [venue.lat, venue.lng];

  return (
    <div className="fade-in bg-hb-surface rounded-hb-lg overflow-hidden border border-hb-border">
      <div className="flex flex-col md:flex-row">
        {/* Left: result info */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
          <p className="text-hb-red font-bold text-sm uppercase tracking-widest mb-2">Round {roundNumber}</p>
          {guess ? (
            <>
              <h2 className="text-white font-black text-4xl md:text-5xl leading-tight mb-1">
                {distance.miles} MILES
              </h2>
              <h3 className="text-white/60 font-bold text-2xl md:text-3xl mb-2">
                ({distance.km} KM) AWAY
              </h3>
            </>
          ) : (
            <>
              <h2 className="text-white font-black text-3xl md:text-4xl leading-tight mb-1">TIME'S UP!</h2>
              <p className="text-white/60 font-medium text-lg mb-2">No guess was placed</p>
            </>
          )}
          <p className="text-hb-text-muted text-sm mb-6">
            <span className="text-white/80 font-medium">{venue.venueName}</span>
            {' — '}
            {venue.city}, {venue.country}
          </p>
          <button
            onClick={onNext}
            className="w-full md:w-auto px-8 py-3 bg-transparent border-2 border-hb-red text-white font-bold uppercase tracking-widest text-sm rounded-hb-md hover:bg-hb-red transition-colors duration-200"
          >
            {isLastRound ? 'See Results' : 'Next Round'}
          </button>
        </div>

        {/* Right: result map */}
        <div className="w-full md:w-80 h-56 md:h-auto" style={{ minHeight: '224px' }}>
          <MapContainer
            center={actualPos}
            zoom={6}
            style={{ width: '100%', height: '100%', minHeight: '224px' }}
            zoomControl={false}
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
                  weight={2}
                  dashArray="6 4"
                />
                <FitBounds guess={guessPos} actual={actualPos} />
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}