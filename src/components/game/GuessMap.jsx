import React, { useState, useCallback } from 'react';
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

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function GuessMap({ onGuessPlaced, guessLocked }) {
  const [markerPos, setMarkerPos] = useState(null);

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
        style={{ width: '100%', height: '240px', background: '#1a1a1a' }}
        zoomControl={true}
        attributionControl={false}
        minZoom={1}
        maxZoom={10}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
        />
        <ClickHandler onMapClick={handleMapClick} />
        {markerPos && <Marker position={markerPos} icon={redIcon} />}
      </MapContainer>

      {!markerPos && !guessLocked && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-black/80 text-white/80 text-xs font-medium px-3 py-1.5 rounded-hb-xl border border-white/10">
            Drop a pin to make your guess
          </div>
        </div>
      )}
    </div>
  );
}