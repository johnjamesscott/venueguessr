import React from 'react';
import { MapPin, Clock, Globe } from 'lucide-react';

export default function SplashScreen({ totalRounds, onStart }) {
  return (
    <div className="min-h-screen bg-hb-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, #AF231C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #AF231C 0%, transparent 40%)'
      }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Logo */}
        <img
          src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b13872e8c6e1a7_HeadBox-Logo-White-.png"
          alt="HeadBox"
          className="h-10 object-contain mb-10"
        />

        {/* Title */}
        <div className="mb-2">
          <span className="text-hb-red font-black text-5xl md:text-7xl tracking-tight">Venue</span>
          <span className="text-white font-black text-5xl md:text-7xl tracking-tight">Guessr</span>
        </div>
        <p className="text-hb-text-muted font-medium text-base md:text-lg mb-10">
          Can you guess where in the world these venues are?
        </p>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-10">
          <div className="flex flex-col items-center gap-1">
            <Globe size={20} className="text-hb-red" />
            <span className="text-white font-bold text-lg">100k+</span>
            <span className="text-hb-text-muted text-xs uppercase tracking-wider">Venues</span>
          </div>
          <div className="w-px h-10 bg-hb-border" />
          <div className="flex flex-col items-center gap-1">
            <MapPin size={20} className="text-hb-red" />
            <span className="text-white font-bold text-lg">{totalRounds}</span>
            <span className="text-hb-text-muted text-xs uppercase tracking-wider">Rounds</span>
          </div>
          <div className="w-px h-10 bg-hb-border" />
          <div className="flex flex-col items-center gap-1">
            <Clock size={20} className="text-hb-red" />
            <span className="text-white font-bold text-lg">30s</span>
            <span className="text-hb-text-muted text-xs uppercase tracking-wider">Per Round</span>
          </div>
        </div>

        {/* How to play */}
        <div className="bg-hb-surface border border-hb-border rounded-hb-lg p-5 mb-8 text-left w-full">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">How to play</p>
          <ol className="space-y-2">
            {[
              'You\'ll be shown a 3D tour of a real HeadBox venue',
              'Explore the space and figure out where in the world it is',
              'Drop a pin on the world map within 30 seconds',
              'See how close you were in miles & km'
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-white/80 text-sm">
                <span className="text-hb-red font-bold text-xs mt-0.5 w-4 shrink-0">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={onStart}
          className="w-full bg-hb-red hover:bg-hb-red-dark text-white font-black uppercase tracking-widest text-base py-4 rounded-hb-xl transition-colors duration-200"
        >
          Start Playing
        </button>

        <p className="text-hb-text-muted text-xs mt-6">
          Powered by{' '}
          <a href="https://www.headbox.com" target="_blank" rel="noopener noreferrer" className="text-hb-red hover:underline">
            HeadBox
          </a>
          {' '}— 100,000+ unique & inspiring venues worldwide
        </p>
      </div>
    </div>
  );
}