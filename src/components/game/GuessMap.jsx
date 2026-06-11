import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

// Exposes pan/zoom control to parent via mapRef
function MapController({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    if (mapRef) mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export default function GuessMap({ onGuessPlaced, guessLocked, currentGuess, onLockGuess, height, fill, mapCenter, mapZoom, mapRef }) {
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
        zoomControl={false}
        attributionControl={false}
        minZoom={1}
        maxZoom={18}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="" />
        <ClickHandler onMapClick={handleMapClick} />
        <MapController mapRef={mapRef} />
        {markerPos && <Marker position={markerPos} icon={hbIcon} />}
      </MapContainer>

      {/* Place your pin hint — full width */}
      {!guessLocked && !markerPos && (
        <div style={{ position: 'absolute', bottom: 90, left: 12, right: 12, zIndex: 1000, pointerEvents: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'rgba(255,255,255,0.97)', color: '#333',
            fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18,
            padding: '14px 20px', borderRadius: 50,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)', border: '1px solid #e0e0e0',
            width: '100%', boxSizing: 'border-box',
          }}>
            <svg width="16" height="21" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26s16-16 16-26C32 7.163 24.837 0 16 0z" fill="#AF231C"/>
              <circle cx="16" cy="15" r="5.5" fill="white"/>
            </svg>
            Tap to place your pin
          </div>
        </div>
      )}
    </div>
  );
}