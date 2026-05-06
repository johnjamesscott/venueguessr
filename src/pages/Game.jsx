import React, { useState, useCallback, useEffect } from 'react';
import { VENUES } from '@/data/venues';
import { calculateDistance, shuffleArray } from '@/utils/distance';
import { calculateScore } from '@/utils/scoring';
import { base44 } from '@/api/base44Client';
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
  const [currentScore, setCurrentScore] = useState(0);
  const [playerEmail, setPlayerEmail] = useState(null);

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
    setCurrentScore(0);
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
    const score = dist ? calculateScore(dist.km) : 0;
    setCurrentGuess(guess);
    setCurrentDistance(dist);
    setCurrentScore(score);
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
  }, [currentRoundIndex, shuffledVenues, currentGuess, currentDistance]);

  const saveToLeaderboard = useCallback(async (formData, finalResults) => {
    const total = finalResults.reduce((sum, r) => sum + (r.score || 0), 0);
    const avgKm = finalResults.filter(r => r.distance).length > 0
      ? finalResults.reduce((sum, r) => sum + (r.distance?.km || 0), 0) / finalResults.filter(r => r.distance).length
      : 0;
    const name = formData
      ? `${formData.firstName} ${formData.lastName}`.trim()
      : 'Anonymous';
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

  // SPLASH
  if (gameState === GAME_STATES.SPLASH) {
    return <SplashScreen totalRounds={TOTAL_ROUNDS} onStart={startGame} />;
  }

  // SUMMARY
  if (gameState === GAME_STATES.SUMMARY) {
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    return (
      <GameSummary
        results={results}
        venues={shuffledVenues}
        totalScore={totalScore}
        playerEmail={playerEmail}
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
      {/* PLAYING state — tour is full bleed behind the nav */}
      {gameState === GAME_STATES.PLAYING && currentVenue && (
        <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
          {/* Tour takes full screen with nav overlaid on top */}
          <div className="relative" style={{ height: '52vh', minHeight: '300px' }}>
            <MatterportViewer tourUrl={currentVenue.tourUrl} onError={handleTourError} />
            {/* Nav overlay — sits on top of the tour */}
            <div className="absolute top-0 left-0 right-0 z-30">
              <GameHeader currentRound={currentRoundIndex + 1} totalRounds={shuffledVenues.length} overlay />
            </div>
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
        </div>
      )}

      {/* ROUND RESULT state — normal header */}
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