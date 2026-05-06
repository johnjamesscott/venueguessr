import React from 'react';
import { getEmbedUrl } from '@/data/venues';

export default function MatterportViewer({ tourUrl }) {
  const embedUrl = getEmbedUrl(tourUrl);

  if (!embedUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-hb-surface-2">
        <p className="text-hb-text-muted text-sm">Tour unavailable</p>
      </div>
    );
  }

  return (
    <iframe
      src={embedUrl}
      className="w-full h-full border-0"
      allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
      allowFullScreen
      title="Venue 3D Tour"
    />
  );
}