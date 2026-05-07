import React, { useState, useCallback, useEffect } from 'react';
import { VENUES_BY_LEVEL, LEVELS, LONDON_VENUES, OUTSIDE_VENUES } from '@/data/venues';
import { calculateDistance, shuffleArray } from '@/utils/distance';
import { calculateScore } from '@/utils/scoring';
import { base44 } from '@/api/base44Client';
import {
  unlockAudio,
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



  const startGame = useCallback((levelId = 1) => {
    unlockAudio();
    setSelectedLevel(levelId);

    // For level 1: guarantee at least 1 outside-London venue in the 3 rounds
    let selected;
    if (levelId === 1 && OUTSIDE_VENUES.length > 0) {
      const outsideShuffled = shuffleArray(OUTSIDE_VENUES);
      const londonShuffled = shuffleArray(LONDON_VENUES);
      // Pick 1 outside + 2 London, then shuffle the trio
      const trio = shuffleArray([outsideShuffled[0], londonShuffled[0], londonShuffled[1]]);
      // Remaining venues for the fallback pool
      const pool = [...outsideShuffled.slice(1), ...londonShuffled.slice(2)];
      selected = trio;
      setShuffledVenues(selected);
      setVenuePool(shuffleArray(pool));
    } else {
      const venues = VENUES_BY_LEVEL[levelId] || VENUES_BY_LEVEL[1];
      const shuffled = shuffleArray(venues);
      selected = shuffled.slice(0, TOTAL_ROUNDS);
      setShuffledVenues(selected);
      setVenuePool(shuffled.slice(TOTAL_ROUNDS));
    }
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
  }, [OUTSIDE_VENUES, LONDON_VENUES]);

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
        <GameHeader />
        <ContactForm onSubmit={handleContactSubmit} onSkip={handleContactSkip} />
      </div>
    );
  }

  return (
    <div className="bg-hb-bg flex flex-col" style={{ minHeight: '100dvh' }}>
      <CelebrationOverlay active={showCelebration} />

      {/* PLAYING — full-screen tour with overlaid header and bottom panel */}
      {gameState === GAME_STATES.PLAYING && currentVenue && (
        <div className="fixed inset-0">
          {/* Tour: full screen */}
          <MatterportViewer tourUrl={currentVenue.tourUrl} onError={handleTourError} />
          {preRoundCountdown && (
            <PreRoundCountdown onComplete={handlePreRoundComplete} />
          )}

          {/* Header overlay — top, 12px from edges */}
          <div className="absolute top-0 left-0 right-0 z-50" style={{ padding: '12px' }}>
            <GameHeader />
          </div>

          {/* Bottom overlay — map + timer, 33vh, 12px from edges */}
          <div
            className="absolute bottom-0 left-0 right-0 z-50 flex gap-3"
            style={{ padding: '0 12px 12px 12px', height: '33vh' }}
          >
            {/* Map */}
            <div className="flex-1 relative rounded-xl overflow-hidden shadow-2xl">
              <GuessMap
                onGuessPlaced={handleGuessPlaced}
                guessLocked={guessLocked}
                currentGuess={currentGuess}
                onLockGuess={() => lockGuess(currentGuess)}
                fill
                mapCenter={selectedLevel === 1 ? [54.5, -3.5] : undefined}
                mapZoom={selectedLevel === 1 ? 5 : undefined}
              />
            </div>

            {/* Timer + level panel */}
            <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-2xl px-5 py-4 shrink-0 gap-2" style={{ minWidth: '160px' }}>
              <p className="text-gray-800 font-black text-sm leading-tight text-center">
                Level {selectedLevel}: {LEVELS.find(l => l.id === selectedLevel)?.name || 'UK and Ireland'}
              </p>
              <CountdownTimer
                key={currentRoundIndex}
                seconds={ROUND_SECONDS}
                onExpire={handleTimerExpire}
                isActive={timerActive}
              />
            </div>
          </div>
        </div>
      )}

      {/* ROUND RESULT */}
      {gameState === GAME_STATES.ROUND_RESULT && currentVenue && (
        <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
          <GameHeader />
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
        </div>
      )}
    </div>
  );
}