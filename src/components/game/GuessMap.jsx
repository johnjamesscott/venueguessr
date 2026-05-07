import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const hbPinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
  <defs>
    <filter id="shadow" x="-30%" y="-10%" width="160%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#AF231C" flood-opacity="0.45"/>
    </filter>
  </defs>
  <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z" fill="#AF231C" filter="url(#shadow)"/>
  <circle cx="16" cy="15" r="5.5" fill="white" opacity="0.95"/>
</svg>`;

const hbIcon = new L.DivIcon({
  html: hbPinSvg,
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// The map fills its container — height is controlled by the parent
export default function GuessMap({ onGuessPlaced, guessLocked, currentGuess, onLockGuess, height, fill, mapCenter, mapZoom }) {
  const [markerPos, setMarkerPos] = useState(null);

  useEffect(() => {
    if (!currentGuess) setMarkerPos(null);
  }, [currentGuess]);

  const handleMapClick = useCallback((latlng) => {
    if (guessLocked) return;
    setMarkerPos(latlng);
    onGuessPlaced(latlng);
  }, [guessLocked, onGuessPlaced]);

  const containerStyle = fill
    ? { position: 'absolute', inset: 0 }
    : { height: height || 300 };

  return (
    <div className="relative w-full overflow-hidden" style={containerStyle}>
      <MapContainer
        center={mapCenter || [20, 0]}
        zoom={mapZoom || 2}
        style={{ width: '100%', height: '100%', background: '#e8e8e8' }}
        zoomControl={true}
        attributionControl={false}
        minZoom={1}
        maxZoom={10}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="" />
        <ClickHandler onMapClick={handleMapClick} />
        {markerPos && <Marker position={markerPos} icon={hbIcon} />}
      </MapContainer>

      {/* Bottom CTA — changes once pin placed */}
      {!guessLocked && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] p-3">
          {markerPos ? (
            <button
              onClick={onLockGuess}
              className="w-full bg-hb-red hover:bg-hb-red-dark text-white font-bold uppercase tracking-widest text-sm py-3 rounded-full transition-colors duration-200 shadow-lg"
            >
              Lock in your guess
            </button>
          ) : (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 bg-white/95 text-gray-700 text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-gray-200 pointer-events-none">
                <svg width="12" height="16" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z" fill="#AF231C"/>
                  <circle cx="16" cy="15" r="5.5" fill="white"/>
                </svg>
                Click to place your pin
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}