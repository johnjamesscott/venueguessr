import React from 'react';
import { MapPin, Clock, Lock } from 'lucide-react';
import { LEVELS } from '@/data/venues';

const ROUNDS = 3;
const SECONDS = 30;

export default function SplashScreen({ onStart }) {
  return (
    <div className="min-h-screen bg-hb-bg flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, #AF231C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #AF231C 0%, transparent 40%)'
      }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-lg w-full">
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
        <p className="text-hb-text-muted font-medium text-base md:text-lg mb-8">
          Can you guess where in the world these venues are?
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-6 mb-8">
          <div className="flex flex-col items-center gap-1">
            <MapPin size={20} className="text-hb-red" />
            <span className="text-white font-bold text-lg">100k+</span>
            <span className="text-hb-text-muted text-xs uppercase tracking-wider">Venues</span>
          </div>
          <div className="w-px h-10 bg-hb-border" />
          <div className="flex flex-col items-center gap-1">
            <MapPin size={20} className="text-hb-red" />
            <span className="text-white font-bold text-lg">{ROUNDS}</span>
            <span className="text-hb-text-muted text-xs uppercase tracking-wider">Rounds</span>
          </div>
          <div className="w-px h-10 bg-hb-border" />
          <div className="flex flex-col items-center gap-1">
            <Clock size={20} className="text-hb-red" />
            <span className="text-white font-bold text-lg">{SECONDS}s</span>
            <span className="text-hb-text-muted text-xs uppercase tracking-wider">Per Round</span>
          </div>
        </div>

        {/* Level select */}
        <div className="w-full bg-hb-surface border border-hb-border rounded-hb-lg overflow-hidden mb-6">
          <div className="px-5 py-3.5 border-b border-hb-border">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Choose your level</p>
          </div>
          <div className="divide-y divide-hb-border">
            {LEVELS.map(level => (
              <LevelRow key={level.id} level={level} onStart={onStart} />
            ))}
          </div>
        </div>

        {/* How to play */}
        <div className="bg-hb-surface border border-hb-border rounded-hb-lg p-5 mb-6 text-left w-full">
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">How to play</p>
          <ol className="space-y-2">
            {[
              "You'll be shown a 3D tour of a real HeadBox venue",
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

        <p className="text-hb-text-muted text-xs">
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

function DifficultyPip({ color }) {
  return <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />;
}

function LevelRow({ level, onStart }) {
  const difficultyPips = level.difficulty === 'Easy' ? 1 : level.difficulty === 'Moderate' ? 2 : 3;

  if (level.locked) {
    return (
      <div className="flex items-center justify-between px-5 py-3.5 opacity-40 cursor-not-allowed">
        <div className="flex items-center gap-3">
          <span className="text-xl">{level.emoji}</span>
          <div className="text-left">
            <p className="text-white font-bold text-sm">{level.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: difficultyPips }).map((_, i) => (
                <DifficultyPip key={i} color={level.color} />
              ))}
              <span className="text-hb-text-muted text-xs ml-1">{level.difficulty}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Lock size={14} className="text-hb-text-muted" />
          <span className="text-hb-text-muted text-xs font-bold uppercase tracking-wider">Coming soon</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onStart(level.id)}
      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors duration-150 group"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{level.emoji}</span>
        <div className="text-left">
          <p className="text-white font-bold text-sm">{level.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {Array.from({ length: difficultyPips }).map((_, i) => (
              <DifficultyPip key={i} color={level.color} />
            ))}
            <span className="text-hb-text-muted text-xs ml-1">{level.difficulty}</span>
          </div>
        </div>
      </div>
      <div
        className="text-white font-bold text-xs uppercase tracking-widest px-3 py-1.5 rounded-hb-md transition-colors duration-150 group-hover:opacity-90"
        style={{ background: level.color }}
      >
        Play
      </div>
    </button>
  );
}