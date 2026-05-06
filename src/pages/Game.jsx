import React, { useState, useCallback, useEffect } from 'react';
import { VENUES } from '@/data/venues';
import { calculateDistance, shuffleArray } from '@/utils/distance';
import SplashScreen from '@/components/game/SplashScreen';
import GameHeader from '@/components/game/GameHeader';
import MatterportViewer from '@/components/game/MatterportViewer';
import CountdownTimer from '@/components/game/CountdownTimer';
import GuessMap from '@/components/game/GuessMap';
import RoundResult from '@/components/game/RoundResult';
import ContactForm from '@/components/game/ContactForm';
import GameSummary from '@/components/game/GameSummary';
import PreRoundCountdown from '@/components/game/PreRoundCountdown';

const ROUND_SECONDS = 30;
const TOTAL_ROUNDS = 3;

const GAME_STATES = {
  SPLASH: 'splash',
  PLAYING: 'playing',
  ROUND_RESULT: 'round_result',
  CONTACT: 'contact',
  SUMMARY: 'summary',
};

export default function Game() {
  const [gameState, setGameState] = useState(GAME_STATES.SPLASH);
  const [shuffledVenues, setShuffledVenues] = useState([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentGuess, setCurrentGuess] = useState(null);
  const [results, setResults] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [guessLocked, setGuessLocked] = useState(false);
  const [currentDistance, setCurrentDistance] = useState(null);
  const [preRoundCountdown, setPreRoundCountdown] = useState(false);

  // Keep a pool of extra venues to swap in if a tour errors
  const [venuePool, setVenuePool] = useState([]);

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(VENUES);
    setShuffledVenues(shuffled.slice(0, TOTAL_ROUNDS));
    setVenuePool(shuffled.slice(TOTAL_ROUNDS));
    setCurrentRoundIndex(0);
    setResults([]);
    setCurrentGuess(null);
    setGuessLocked(false);
    setCurrentDistance(null);
    setTimerActive(false);
    setPreRoundCountdown(true);
    setGameState(GAME_STATES.PLAYING);
  }, []);

  // Swap out the current errored venue for the next one in the pool
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
  }, []);

  const lockGuess = useCallback((guess) => {
    if (guessLocked) return;
    const venue = shuffledVenues[currentRoundIndex];
    const dist = guess
      ? calculateDistance(guess.lat, guess.lng, venue.lat, venue.lng)
      : null;
    setCurrentGuess(guess);
    setCurrentDistance(dist);
    setGuessLocked(true);
    setTimerActive(false);
    setGameState(GAME_STATES.ROUND_RESULT);
  }, [guessLocked, shuffledVenues, currentRoundIndex]);

  const handleTimerExpire = useCallback(() => {
    if (!guessLocked) {
      lockGuess(currentGuess);
    }
  }, [guessLocked, lockGuess, currentGuess]);

  const handleGuessPlaced = useCallback((latlng) => {
    setCurrentGuess({ lat: latlng.lat, lng: latlng.lng });
  }, []);

  const handleNextRound = useCallback(() => {
    const venue = shuffledVenues[currentRoundIndex];
    setResults(prev => [...prev, {
      venueId: venue.id,
      guess: currentGuess,
      distance: currentDistance,
    }]);

    const isLastRound = currentRoundIndex >= shuffledVenues.length - 1;
    if (isLastRound) {
      setGameState(GAME_STATES.CONTACT);
    } else {
      setCurrentRoundIndex(i => i + 1);
      setCurrentGuess(null);
      setGuessLocked(false);
      setCurrentDistance(null);
      setTimerActive(false);
      setPreRoundCountdown(true);
      setGameState(GAME_STATES.PLAYING);
    }
  }, [currentRoundIndex, shuffledVenues, currentGuess, currentDistance]);

  const handleContactSubmit = useCallback(() => {
    setGameState(GAME_STATES.SUMMARY);
  }, []);

  const handleContactSkip = useCallback(() => {
    setGameState(GAME_STATES.SUMMARY);
  }, []);

  const currentVenue = shuffledVenues[currentRoundIndex];
  const isLastRound = currentRoundIndex >= shuffledVenues.length - 1;

  // SPLASH
  if (gameState === GAME_STATES.SPLASH) {
    return <SplashScreen totalRounds={TOTAL_ROUNDS} onStart={startGame} />;
  }

  // SUMMARY
  if (gameState === GAME_STATES.SUMMARY) {
    return (
      <GameSummary
        results={results}
        venues={shuffledVenues}
        onPlayAgain={startGame}
      />
    );
  }

  // CONTACT (shown after last round, before summary)
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
      <GameHeader currentRound={currentRoundIndex + 1} totalRounds={shuffledVenues.length} />

      <div className="flex-1 flex flex-col">
        {/* PLAYING state */}
        {gameState === GAME_STATES.PLAYING && currentVenue && (
          <>
            {/* Matterport tour — full bleed, takes most of screen */}
            <div className="relative" style={{ height: '52vh', minHeight: '280px' }}>
              <MatterportViewer tourUrl={currentVenue.tourUrl} onError={handleTourError} />
              <CountdownTimer
                key={currentRoundIndex}
                seconds={ROUND_SECONDS}
                onExpire={handleTimerExpire}
                isActive={timerActive}
              />
              {preRoundCountdown && (
                <PreRoundCountdown onComplete={handlePreRoundComplete} />
              )}
            </div>

            {/* Map section */}
            <div className="flex flex-col p-3 md:p-4 gap-3">
              <GuessMap
                onGuessPlaced={handleGuessPlaced}
                guessLocked={guessLocked}
              />
              {currentGuess && !guessLocked && (
                <button
                  onClick={() => lockGuess(currentGuess)}
                  className="w-full bg-hb-red hover:bg-hb-red-dark text-white font-bold uppercase tracking-widest text-sm py-3.5 rounded-hb-xl transition-colors duration-200"
                >
                  Lock In Guess
                </button>
              )}
            </div>
          </>
        )}

        {/* ROUND RESULT state */}
        {gameState === GAME_STATES.ROUND_RESULT && currentVenue && (
          <div className="flex-1 p-3 md:p-4">
            <RoundResult
              roundNumber={currentRoundIndex + 1}
              venue={currentVenue}
              guess={currentGuess}
              distance={currentDistance}
              onNext={handleNextRound}
              isLastRound={isLastRound}
            />
          </div>
        )}
      </div>
    </div>
  );
}