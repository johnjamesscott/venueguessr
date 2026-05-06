import React, { useState, useCallback, useEffect } from 'react';
import { VENUES_BY_LEVEL, LEVELS } from '@/data/venues';
import { calculateDistance, shuffleArray } from '@/utils/distance';
import { calculateScore } from '@/utils/scoring';
import { base44 } from '@/api/base44Client';
import {
  unlockAudio,
  startTensionMusic,
  stopTensionMusic,
  playPinSound,
  playLockSound,
  playCelebrationSound,
  playErrorSound,
} from '@/utils/sounds';

import SplashScreen from '@/components/game/SplashScreen';
import GameHeader from '@/components/game/GameHeader';
import MatterportViewer from '@/components/game/MatterportViewer';
import CountdownTimer from '@/components/game/CountdownTimer';
import GuessMap from '@/components/game/GuessMap';
import RoundResult from '@/components/game/RoundResult';
import ContactForm from '@/components/game/ContactForm';
import GameSummary from '@/components/game/GameSummary';
import PreRoundCountdown from '@/components/game/PreRoundCountdown';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';

const ROUND_SECONDS = 30;
const TOTAL_ROUNDS = 3;
const GOOD_SCORE_THRESHOLD = 2000; // score >= this triggers celebration

const GAME_STATES = {
  SPLASH: 'splash',
  PLAYING: 'playing',
  ROUND_RESULT: 'round_result',
  CONTACT: 'contact',
  SUMMARY: 'summary',
};

export default function Game() {
  const [gameState, setGameState] = useState(GAME_STATES.SPLASH);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [shuffledVenues, setShuffledVenues] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState(null);
  const [results, setResults] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [guessLocked, setGuessLocked] = useState(false);
  const [currentDistance, setCurrentDistance] = useState(null);
  const [preRoundCountdown, setPreRoundCountdown] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [playerEmail, setPlayerEmail] = useState(null);
  const [venuePool, setVenuePool] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Stop music when leaving playing state
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) {
      stopTensionMusic();
    }
  }, [gameState]);

  const startGame = useCallback((levelId = 1) => {
    unlockAudio();
    setSelectedLevel(levelId);
    const venues = VENUES_BY_LEVEL[levelId] || VENUES_BY_LEVEL[1];
    const shuffled = shuffleArray(venues);
    setShuffledVenues(shuffled.slice(0, TOTAL_ROUNDS));
    setVenuePool(shuffled.slice(TOTAL_ROUNDS));
    setCurrentRoundIndex(0);
    setResults([]);
    setCurrentGuess(null);
    setGuessLocked(false);
    setCurrentDistance(null);
    setCurrentScore(0);
    setTimerActive(false);
    setPreRoundCountdown(true);
    setShowCelebration(false);
    setGameState(GAME_STATES.PLAYING);
  }, []);

  const handleTourError = useCallback(() => {
    setVenuePool(pool => {
      if (pool.length === 0) return pool;
      const [next, ...rest] = pool;
      setShuffledVenues(venues => {
        const updated = [...venues];
        updated[currentRoundIndex] = next;
        return updated;
      });
      return rest;
    });
  }, [currentRoundIndex]);

  const handlePreRoundComplete = useCallback(() => {
    setPreRoundCountdown(false);
    setTimerActive(true);
    startTensionMusic();
  }, []);

  const lockGuess = useCallback((guess) => {
    if (guessLocked) return;
    const venue = shuffledVenues[currentRoundIndex];
    const dist = guess
      ? calculateDistance(guess.lat, guess.lng, venue.lat, venue.lng)
      : null;
    const score = dist ? calculateScore(dist.km) : 0;

    stopTensionMusic();
    playLockSound();

    // Celebration or error sound based on score
    if (score >= GOOD_SCORE_THRESHOLD) {
      playCelebrationSound();
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } else {
      playErrorSound();
    }

    setCurrentGuess(guess);
    setCurrentDistance(dist);
    setCurrentScore(score);
    setGuessLocked(true);
    setTimerActive(false);
    setGameState(GAME_STATES.ROUND_RESULT);
  }, [guessLocked, shuffledVenues, currentRoundIndex]);

  const handleTimerExpire = useCallback(() => {
    if (!guessLocked) lockGuess(currentGuess);
  }, [guessLocked, lockGuess, currentGuess]);

  const handleGuessPlaced = useCallback((latlng) => {
    playPinSound();
    setCurrentGuess({ lat: latlng.lat, lng: latlng.lng });
  }, []);

  const handleNextRound = useCallback(() => {
    const venue = shuffledVenues[currentRoundIndex];
    setResults(prev => [...prev, {
      venueId: venue.id,
      guess: currentGuess,
      distance: currentDistance,
      score: currentScore,
    }]);
    const isLastRound = currentRoundIndex >= shuffledVenues.length - 1;
    if (isLastRound) {
      setGameState(GAME_STATES.CONTACT);
    } else {
      setCurrentRoundIndex(i => i + 1);
      setCurrentGuess(null);
      setGuessLocked(false);
      setCurrentDistance(null);
      setCurrentScore(0);
      setTimerActive(false);
      setPreRoundCountdown(true);
      setGameState(GAME_STATES.PLAYING);
    }
  }, [currentRoundIndex, shuffledVenues, currentGuess, currentDistance, currentScore]);

  const saveToLeaderboard = useCallback(async (formData, finalResults) => {
    const total = finalResults.reduce((sum, r) => sum + (r.score || 0), 0);
    const withDist = finalResults.filter(r => r.distance);
    const avgKm = withDist.length > 0
      ? withDist.reduce((sum, r) => sum + (r.distance?.km || 0), 0) / withDist.length
      : 0;
    const name = formData ? `${formData.firstName} ${formData.lastName}`.trim() : 'Anonymous';
    await base44.entities.LeaderboardEntry.create({
      player_name: name,
      email: formData?.email || '',
      total_score: total,
      rounds_played: finalResults.length,
      avg_distance_km: Math.round(avgKm),
    });
    if (formData?.email) setPlayerEmail(formData.email);
  }, []);

  const handleContactSubmit = useCallback((formData) => {
    const finalResults = [...results, {
      venueId: shuffledVenues[currentRoundIndex]?.id,
      guess: currentGuess,
      distance: currentDistance,
      score: currentScore,
    }];
    saveToLeaderboard(formData, finalResults);
    setGameState(GAME_STATES.SUMMARY);
  }, [results, shuffledVenues, currentRoundIndex, currentGuess, currentDistance, currentScore, saveToLeaderboard]);

  const handleContactSkip = useCallback(() => {
    setGameState(GAME_STATES.SUMMARY);
  }, []);

  const currentVenue = shuffledVenues[currentRoundIndex];
  const isLastRound = currentRoundIndex >= shuffledVenues.length - 1;

  if (gameState === GAME_STATES.SPLASH) {
    return <SplashScreen onStart={startGame} />;
  }

  if (gameState === GAME_STATES.SUMMARY) {
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    return (
      <GameSummary
        results={results}
        venues={shuffledVenues}
        totalScore={totalScore}
        playerEmail={playerEmail}
        onPlayAgain={() => setGameState(GAME_STATES.SPLASH)}
      />
    );
  }

  if (gameState === GAME_STATES.CONTACT) {
    return (
      <div className="min-h-screen bg-hb-bg">
        <GameHeader currentRound={shuffledVenues.length} totalRounds={shuffledVenues.length} />
        <ContactForm onSubmit={handleContactSubmit} onSkip={handleContactSkip} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hb-bg flex flex-col">
      <CelebrationOverlay active={showCelebration} />

      {/* PLAYING — side-by-side desktop layout */}
      {gameState === GAME_STATES.PLAYING && currentVenue && (
        <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
          {/* White header */}
          <header className="flex items-center justify-between px-4 md:px-8 py-3 bg-white border-b border-gray-200 shrink-0">
            <img
              src="https://cdn.prod.website-files.com/63bd498079b1380a81c6e13b/63bd498079b13872e8c6e1a7_HeadBox-Logo-White-.png"
              alt="HeadBox"
              className="h-7 md:h-8 object-contain"
              style={{ filter: 'invert(1) brightness(0)' }}
            />
            <div className="flex items-center gap-2">
              <a
                href="https://www.headbox.com/get-a-demo"
                target="_blank" rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center font-bold text-xs uppercase tracking-wider px-4 py-2 rounded border-2 border-gray-800 text-gray-800 hover:bg-gray-100 transition-colors"
              >
                Get a demo
              </a>
              <a
                href="https://www.headbox.com"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center font-bold text-xs uppercase tracking-wider px-4 py-2 rounded bg-hb-red hover:bg-hb-red-dark text-white transition-colors"
              >
                Plan your event
              </a>
            </div>
          </header>

          {/* Main area: tour left, panel right */}
          <div className="flex flex-1 overflow-hidden">
            {/* Tour — takes remaining width */}
            <div className="relative flex-1">
              <MatterportViewer tourUrl={currentVenue.tourUrl} onError={handleTourError} />
              {preRoundCountdown && (
                <PreRoundCountdown onComplete={handlePreRoundComplete} />
              )}
            </div>

            {/* Right panel */}
            <div className="flex flex-col bg-white border-l border-gray-200 shrink-0" style={{ width: '280px' }}>
              {/* Level label */}
              <div className="px-4 pt-4 pb-2 border-b border-gray-100">
                <p className="text-gray-800 font-black text-base leading-tight">
                  Level {selectedLevel}: {LEVELS.find(l => l.id === selectedLevel)?.name || 'UK and Ireland'}
                </p>
              </div>

              {/* Circular timer */}
              <div className="flex items-center justify-center py-6">
                <CountdownTimer
                  key={currentRoundIndex}
                  seconds={ROUND_SECONDS}
                  onExpire={handleTimerExpire}
                  isActive={timerActive}
                />
              </div>

              {/* Map fills remaining space */}
              <div className="flex-1 relative min-h-0">
                <GuessMap
                  onGuessPlaced={handleGuessPlaced}
                  guessLocked={guessLocked}
                  currentGuess={currentGuess}
                  onLockGuess={() => lockGuess(currentGuess)}
                  fill
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROUND RESULT */}
      {gameState === GAME_STATES.ROUND_RESULT && currentVenue && (
        <>
          <GameHeader currentRound={currentRoundIndex + 1} totalRounds={shuffledVenues.length} />
          <div className="flex-1 p-3 md:p-4">
            <RoundResult
              roundNumber={currentRoundIndex + 1}
              venue={currentVenue}
              guess={currentGuess}
              distance={currentDistance}
              score={currentScore}
              onNext={handleNextRound}
              isLastRound={isLastRound}
            />
          </div>
        </>
      )}
    </div>
  );
}