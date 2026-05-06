import React, { useState, useCallback, useEffect } from 'react';
import { VENUES_BY_LEVEL } from '@/data/venues';
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

      {/* PLAYING */}
      {gameState === GAME_STATES.PLAYING && currentVenue && (
        <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
          <div className="relative" style={{ height: '52vh', minHeight: '300px' }}>
            <MatterportViewer tourUrl={currentVenue.tourUrl} onError={handleTourError} />
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

          <div className="flex flex-col p-3 md:p-4 gap-3">
            <GuessMap
              onGuessPlaced={handleGuessPlaced}
              guessLocked={guessLocked}
              currentGuess={currentGuess}
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