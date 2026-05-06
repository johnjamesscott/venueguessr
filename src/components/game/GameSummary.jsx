import React from 'react';
import { MapPin, RotateCcw, ExternalLink } from 'lucide-react';

export default function GameSummary({ results, venues, onPlayAgain }) {
  const avgMiles = results.length > 0
    ? (results.reduce((sum, r) => sum + (r.distance?.miles || 0), 0) / results.length).toFixed(1)
    : 0;
  const avgKm = results.length > 0
    ? (results.reduce((sum, r) => sum + (r.distance?.km || 0), 0) / results.length).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-hb-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-hb-surface border-b border-hb-border">
        <img
          src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b13872e8c6e1a7_HeadBox-Logo-White-.png"
          alt="HeadBox"
          className="h-7 md:h-8 object-contain"
        />
        <span className="text-hb-red font-bold text-sm uppercase tracking-widest">VenueGuessr</span>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 md:py-12">
        {/* Hero score */}
        <div className="text-center mb-10 fade-in">
          <div className="inline-flex items-center gap-2 bg-hb-red/10 border border-hb-red/30 text-hb-red text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-hb-xl mb-4">
            <MapPin size={12} />
            Game Complete
          </div>
          <h1 className="text-white font-black text-4xl md:text-5xl leading-tight mb-1">
            AVERAGE DISTANCE
          </h1>
          <div className="text-hb-red font-black text-5xl md:text-7xl leading-none mt-2">
            {avgMiles}
          </div>
          <div className="text-white/60 font-bold text-2xl mt-1">
            MILES ({avgKm} KM)
          </div>
          <p className="text-hb-text-muted text-sm mt-3">
            Across {results.length} rounds from 100,000+ venues worldwide
          </p>
        </div>

        {/* All rounds summary */}
        <div className="bg-hb-surface rounded-hb-lg border border-hb-border overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-hb-border">
            <h2 className="text-white font-bold text-sm uppercase tracking-widest">All Rounds</h2>
          </div>
          <div className="divide-y divide-hb-border">
            {results.map((result, i) => {
              const venue = venues[i];
              return (
                <div key={i} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-hb-text-muted text-xs font-bold uppercase tracking-wider w-16">
                      Round {i + 1}
                    </span>
                    <div>
                      <p className="text-white/80 text-sm font-medium">{venue?.venueName}</p>
                      <p className="text-hb-text-muted text-xs">{venue?.city}, {venue?.country}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {result.distance ? (
                      <>
                        <p className="text-white font-bold text-sm">{result.distance.miles} miles</p>
                        <p className="text-hb-text-muted text-xs">{result.distance.km} km</p>
                      </>
                    ) : (
                      <p className="text-hb-text-muted text-xs italic">No guess</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA section */}
        <div className="bg-hb-surface rounded-hb-lg border border-hb-border p-6 text-center mb-6">
          <p className="text-white font-bold text-lg mb-1">Explore the real venues</p>
          <p className="text-hb-text-muted text-sm mb-4">
            HeadBox has 100,000+ unique and inspiring venues around the world — from industrial warehouses to rooftop terraces.
          </p>
          <a
            href="https://www.headbox.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-hb-red hover:bg-hb-red-dark text-white font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-hb-md transition-colors duration-200"
          >
            Find a venue <ExternalLink size={14} />
          </a>
        </div>

        {/* Play again */}
        <button
          onClick={onPlayAgain}
          className="w-full flex items-center justify-center gap-2 bg-transparent border-2 border-white/20 hover:border-white/40 text-white font-bold uppercase tracking-widest text-sm py-4 rounded-hb-xl transition-colors duration-200"
        >
          <RotateCcw size={16} />
          Play Again
        </button>
      </div>
    </div>
  );
}