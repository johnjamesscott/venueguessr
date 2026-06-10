import React, { useState, useCallback, useEffect, useRef } from 'react';
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

import SplashScreen from '@/components/game/SplashScreen/SplashScreen';
import GameHeader from '@/components/game/GameHeader';
import MatterportViewer from '@/components/game/MatterportViewer';
import GuessMap from '@/components/game/GuessMap';
import ArcadeMapControls from '@/components/game/ArcadeMapControls';
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
      // Pick at least 1 outside-London, rest random from full pool
      const guaranteed = outsideShuffled[0];
      const remaining = shuffleArray([...outsideShuffled.slice(1), ...londonShuffled]);
      const trio = shuffleArray([guaranteed, ...remaining.slice(0, TOTAL_ROUNDS - 1)]);
      const pool = remaining.slice(TOTAL_ROUNDS - 1);
      selected = trio;
      setShuffledVenues(selected);
      setVenuePool(pool);
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

  const mapRef = useRef(null);

  const handlePan = useCallback((dir) => {
    const map = mapRef.current;
    if (!map) return;
    const PAN = 80;
    const offsets = { up: [0, -PAN], down: [0, PAN], left: [-PAN, 0], right: [PAN, 0] };
    map.panBy(offsets[dir], { animate: true, duration: 0.3 });
  }, []);

  const handleZoom = useCallback((direction) => {
    const map = mapRef.current;
    if (!map) return;
    const current = map.getZoom();
    map.setZoom(direction === 'in' ? current + 1 : current - 1, { animate: true });
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
        <GameHeader level={selectedLevel} />
        <ContactForm onSubmit={handleContactSubmit} onSkip={handleContactSkip} />
      </div>
    );
  }

  return (
    <div className="bg-hb-bg flex flex-col" style={{ minHeight: '100dvh' }}>
      <CelebrationOverlay active={showCelebration} />

      {/* PLAYING — mobile-first arcade layout */}
      {gameState === GAME_STATES.PLAYING && currentVenue && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#121212' }}>
          {/* Header */}
          <GameHeader level={selectedLevel} round={currentRoundIndex + 1} totalRounds={TOTAL_ROUNDS} />

          {/* Tour — fills remaining space */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <MatterportViewer
              tourUrl={currentVenue.tourUrl}
              nextTourUrl={shuffledVenues[currentRoundIndex + 1]?.tourUrl}
              onError={handleTourError}
            />
            {preRoundCountdown && (
              <PreRoundCountdown onComplete={handlePreRoundComplete} />
            )}
          </div>

          {/* Map + overlaid controls */}
          <div style={{ position: 'relative', height: '48vh', flexShrink: 0, borderTop: '2px solid #2a2a2a' }}>
            <GuessMap
              onGuessPlaced={handleGuessPlaced}
              guessLocked={guessLocked}
              currentGuess={currentGuess}
              onLockGuess={() => lockGuess(currentGuess)}
              fill
              mapCenter={selectedLevel === 1 ? [54.5, -3.5] : undefined}
              mapZoom={selectedLevel === 1 ? 5 : undefined}
              mapRef={mapRef}
            />
            {/* Arcade controls overlaid at top of map */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, pointerEvents: 'none' }}>
              <div style={{ pointerEvents: 'auto' }}>
                <ArcadeMapControls
                  onPan={handlePan}
                  onZoom={handleZoom}
                  timerSeconds={ROUND_SECONDS}
                  timerActive={timerActive}
                  onTimerExpire={handleTimerExpire}
                  roundIndex={currentRoundIndex}
                />
              </div>
            </div>
          </div>

          {/* Lock-in button */}
          {!guessLocked && currentGuess && (
            <div style={{ padding: '8px 16px', flexShrink: 0, background: '#1a1a1a' }}>
              <button
                onClick={() => lockGuess(currentGuess)}
                style={{
                  width: '100%',
                  height: 52,
                  background: '#AF231C',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 50,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: 15,
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 rgba(0,0,0,0.3), 0 6px 16px rgba(175,35,28,0.4)',
                  textTransform: 'uppercase',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
              >
                Lock in your guess
              </button>
            </div>
          )}
        </div>
      )}

      {/* ROUND RESULT */}
      {gameState === GAME_STATES.ROUND_RESULT && currentVenue && (
        <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
          <GameHeader level={selectedLevel} round={currentRoundIndex + 1} totalRounds={TOTAL_ROUNDS} />
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