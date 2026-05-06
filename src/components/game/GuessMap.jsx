import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// HeadBox branded SVG pin — red teardrop with white dot
const hbPinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
  <defs>
    <filter id="shadow" x="-30%" y="-10%" width="160%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#AF231C" flood-opacity="0.45"/>
    </filter>
  </defs>
  <path
    d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z"
    fill="#AF231C"
    filter="url(#shadow)"
  />
  <circle cx="16" cy="15" r="5.5" fill="white" opacity="0.95"/>
</svg>
`;

const hbIcon = new L.DivIcon({
  html: hbPinSvg,
  className: '',
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -44],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function GuessMap({ onGuessPlaced, guessLocked, currentGuess }) {
  const [markerPos, setMarkerPos] = useState(null);

  // Sync external reset (new round)
  React.useEffect(() => {
    if (!currentGuess) setMarkerPos(null);
  }, [currentGuess]);

  const handleMapClick = useCallback((latlng) => {
    if (guessLocked) return;
    setMarkerPos(latlng);
    onGuessPlaced(latlng);
  }, [guessLocked, onGuessPlaced]);

  return (
    <div className="relative w-full rounded-hb-lg overflow-hidden" style={{ border: '1px solid #2a2a2a', height: '240px' }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ width: '100%', height: '240px', background: '#e8e8e8' }}
        zoomControl={true}
        attributionControl={false}
        minZoom={1}
        maxZoom={10}
      >
        {/* Light grayscale tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        <ClickHandler onMapClick={handleMapClick} />
        {markerPos && <Marker position={markerPos} icon={hbIcon} />}
      </MapContainer>

      {/* Tooltip */}
      {!markerPos && !guessLocked && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="flex items-center gap-2 bg-white/95 text-gray-700 text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg border border-gray-200">
            <svg width="13" height="13" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z" fill="#AF231C"/>
              <circle cx="16" cy="15" r="5.5" fill="white"/>
            </svg>
            Click anywhere to place your pin
          </div>
        </div>
      )}

      {/* Locked overlay hint */}
      {guessLocked && (
        <div className="absolute inset-0 z-[999] pointer-events-none" />
      )}
    </div>
  );
}