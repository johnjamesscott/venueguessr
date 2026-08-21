import React, { lazy, useState, useCallback, useRef } from 'react';
import { calculateDistance } from '@/utils/distance';
import { calculateScore, ICP_BOOST_FACTOR } from '@/utils/scoring';
import { base44 } from '@/api/base44Client';
import { EMPTY_LEADERBOARD, usePublicLeaderboard } from '@/hooks/usePublicLeaderboard';
import {
  unlockAudio, playPinSound, playLockSound,
  playCelebrationSound, playErrorSound,
} from '@/utils/sounds';

import SplashScreen from '@/components/game/SplashScreen/SplashScreen';
import GameHeader from '@/components/game/GameHeader';
import MatterportViewer from '@/components/game/MatterportViewer';
import ArcadeMapControls from '@/components/game/ArcadeMapControls';
import QrContactScreen from '@/components/game/QrContactScreen';
import GameSummary from '@/components/game/GameSummary';
import PreRoundCountdown from '@/components/game/PreRoundCountdown';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';

const GuessMap = lazy(() => import('@/components/game/GuessMap'));
const RoundResult = lazy(() => import('@/components/game/RoundResult'));

const ROUND_SECONDS = 30;
const TOTAL_ROUNDS = 3;
const GOOD_SCORE_THRESHOLD = 2000;

const GAME_STATES = {
  SPLASH: 'splash',
  PLAYING: 'playing',
  ROUND_RESULT: 'round_result',
  CONTACT: 'contact',
  SUMMARY: 'summary',
};

// Convert a Base44 Venue entity to the shape the game components expect
const venueToGame = (v) => ({
  id: v.id,
  venueName: v.venue_name,
  spaceName: v.space_name,
  city: v.city,
  country: v.country,
  lat: v.latitude,
  lng: v.longitude,
  tourUrl: v.matterport_url,
  headboxUrl: v.headbox_url,
});

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
  const [playerEntryId, setPlayerEntryId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(ROUND_SECONDS);
  const [venuePool, setVenuePool] = useState([]);
  const [icpBoostArmed, setIcpBoostArmed] = useState(() => {
    try { return localStorage.getItem('vg_icp_boost') === '1'; } catch { return false; }
  });
  const {
    data: publicLeaderboard = EMPTY_LEADERBOARD,
    isLoading: leaderboardLoading,
    isError: leaderboardError,
  } = usePublicLeaderboard({
    enabled: gameState === GAME_STATES.SPLASH,
  });
  const activeCompetition = publicLeaderboard.competition;

  const toggleIcpBoost = useCallback(() => {
    setIcpBoostArmed(prev => {
      const next = !prev;
      try { localStorage.setItem('vg_icp_boost', next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  const resetRoundState = () => {
    setCurrentGuess(null);
    setGuessLocked(false);
    setCurrentDistance(null);
    setCurrentScore(0);
    setTimerActive(false);
    setTimeRemaining(ROUND_SECONDS);
    setPreRoundCountdown(true);
    setShowCelebration(false);
  };

  const startDemo = useCallback(async () => {
    unlockAudio();
    // Load demo venue from Base44
    let demoVenues = [];
    try {
      const response = await base44.functions.invoke('getRandomVenues', { demo: true });
      demoVenues = (response?.data?.venues || []).map(venueToGame);
    } catch (_) {}

    if (demoVenues.length === 0) {
      // Fallback demo venue
      demoVenues = [{
        id: 'demo', venueName: 'Natural History Museum', spaceName: 'Cromwell Road',
        city: 'London', country: 'GB', lat: 51.4965109, lng: -0.1760019,
        tourUrl: 'https://my.matterport.com/show/?m=8sZPNjQPLGm',
      }];
    }

    setShuffledVenues(demoVenues.slice(0, 1));
    setVenuePool([]);
    setCurrentRoundIndex(0);
    setResults([]);
    setPlayerEntryId(null);
    setIsDemo(true);
    resetRoundState();
    setGameState(GAME_STATES.PLAYING);
  }, []);

  const startGame = useCallback(async () => {
    unlockAudio();
    try {
      const res = await base44.functions.invoke('getRandomVenues', {});
      const venues = (res?.data?.venues || []).map(venueToGame);
      if (venues.length > 0) {
        setShuffledVenues(venues.slice(0, TOTAL_ROUNDS));
        setVenuePool(venues.slice(TOTAL_ROUNDS));
        setCurrentRoundIndex(0);
        setResults([]);
        setPlayerEntryId(null);
        setIsDemo(false);
        resetRoundState();
        setGameState(GAME_STATES.PLAYING);
        return;
      }
    } catch (_) {}
    // Fallback: no venues in Base44 yet
    alert('No active venues found. Please add venues in the admin panel.');
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
  }, []);

  const lockGuess = useCallback((guess, lockedTimeRemaining) => {
    if (guessLocked) return;
    const venue = shuffledVenues[currentRoundIndex];
    const dist = guess ? calculateDistance(guess.lat, guess.lng, venue.lat, venue.lng) : null;
    const score = dist ? calculateScore(dist.km, lockedTimeRemaining ?? timeRemaining, ROUND_SECONDS) : 0;

    playLockSound();
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
    if (!guessLocked) lockGuess(currentGuess, 0);
  }, [guessLocked, lockGuess, currentGuess]);

  const handleGuessPlaced = useCallback((latlng) => {
    playPinSound();
    setCurrentGuess({ lat: latlng.lat, lng: latlng.lng });
  }, []);

  const handleNextRound = useCallback(() => {
    const venue = shuffledVenues[currentRoundIndex];
    setResults(prev => [...prev, {
      venueId: venue.id, venueName: venue.venueName, city: venue.city,
      guess: currentGuess, distance: currentDistance, score: currentScore,
    }]);
    const isLastRound = currentRoundIndex >= Math.min(shuffledVenues.length, TOTAL_ROUNDS) - 1;
    if (isLastRound && isDemo) {
      setGameState(GAME_STATES.SUMMARY);
    } else if (isLastRound) {
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
  }, [currentRoundIndex, shuffledVenues, currentGuess, currentDistance, currentScore, isDemo]);

  const handleContactSubmit = useCallback((_formData, submissionResult) => {
    setPlayerEntryId(submissionResult?.entry_id || null);
    setGameState(GAME_STATES.SUMMARY);
  }, []);

  const handleRemoteContactComplete = useCallback((submissionResult) => {
    setPlayerEntryId(submissionResult?.leaderboard_entry_id || null);
    setGameState(GAME_STATES.SUMMARY);
  }, []);

  const handleContactSkip = useCallback(() => {
    setGameState(GAME_STATES.SUMMARY);
  }, []);

  const mapRef = useRef(null);

  const handleZoom = useCallback((direction) => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(direction === 'in' ? map.getZoom() + 1 : map.getZoom() - 1, { animate: true });
  }, []);

  const handleReset = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([54.5, -3.5], 5, { animate: true });
  }, []);

  const currentVenue = shuffledVenues[currentRoundIndex];
  const isLastRound = currentRoundIndex >= shuffledVenues.length - 1;

  if (gameState === GAME_STATES.SPLASH) {
    return (
      <SplashScreen
        onStart={startGame}
        onDemo={startDemo}
        leaderboardData={publicLeaderboard}
        leaderboardLoading={leaderboardLoading}
        leaderboardError={leaderboardError}
        icpBoostArmed={icpBoostArmed}
        onToggleIcpBoost={toggleIcpBoost}
      />
    );
  }

  if (gameState === GAME_STATES.SUMMARY) {
    const baseTotal = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const totalScore = icpBoostArmed ? Math.round(baseTotal * ICP_BOOST_FACTOR) : baseTotal;
    return (
      <GameSummary
        results={results}
        venues={shuffledVenues}
        totalScore={totalScore}
        playerEntryId={playerEntryId}
        onPlayAgain={() => setGameState(GAME_STATES.SPLASH)}
        competitionId={activeCompetition?.id}
      />
    );
  }

  if (gameState === GAME_STATES.CONTACT) {
    const baseTotal = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const totalScore = icpBoostArmed ? Math.round(baseTotal * ICP_BOOST_FACTOR) : baseTotal;
    const withDist = results.filter(r => r.distance);
    const avgKm = withDist.length > 0
      ? withDist.reduce((s, r) => s + (r.distance?.km || 0), 0) / withDist.length : 0;
    return (
      <div className="min-h-screen bg-hb-bg">
        <GameHeader />
        <QrContactScreen
          totalScore={totalScore}
          competitionId={activeCompetition?.id}
          roundResults={results.map(r => ({
            venue_name: r.venueName,
            city: r.city,
            score: r.score,
            distance_km: r.distance?.km || 0,
          }))}
          avgDistanceKm={Math.round(avgKm)}
          icpBoosted={icpBoostArmed}
          onManualSubmit={handleContactSubmit}
          onSubmissionComplete={handleRemoteContactComplete}
          onSkip={handleContactSkip}
        />
      </div>
    );
  }

  return (
    <div className="bg-hb-bg flex flex-col" style={{ minHeight: '100dvh' }}>
      <CelebrationOverlay active={showCelebration} />

      {gameState === GAME_STATES.PLAYING && currentVenue && (
        <div style={{ position: 'fixed', inset: 0, background: '#121212' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, background: 'white' }}>
            <GameHeader round={currentRoundIndex + 1} totalRounds={Math.min(shuffledVenues.length, TOTAL_ROUNDS)} />
          </div>
          <div style={{ position: 'absolute', top: 88, left: 0, right: 0, bottom: 0, zIndex: -10, overflow: 'hidden' }}>
            <MatterportViewer
              tourUrl={currentVenue.tourUrl}
              nextTourUrl={shuffledVenues[currentRoundIndex + 1]?.tourUrl}
              onError={handleTourError}
            />
            {preRoundCountdown && <PreRoundCountdown onComplete={handlePreRoundComplete} />}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: '1em', right: '1em', height: '40vh', zIndex: 10 }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderTopLeftRadius: 48, borderTopRightRadius: 48, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
              <GuessMap
                onGuessPlaced={handleGuessPlaced}
                guessLocked={guessLocked}
                currentGuess={currentGuess}
                onLockGuess={() => lockGuess(currentGuess, timeRemaining)}
                fill
                mapCenter={[54.5, -3.5]}
                mapZoom={5}
                mapRef={mapRef}
              />
            </div>
          </div>
          <ArcadeMapControls
            onZoom={handleZoom}
            onReset={handleReset}
            timerSeconds={ROUND_SECONDS}
            timerActive={timerActive}
            onTimerExpire={handleTimerExpire}
            onTimerTick={setTimeRemaining}
            roundIndex={currentRoundIndex}
          />
        </div>
      )}

      {gameState === GAME_STATES.ROUND_RESULT && currentVenue && (
        <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
          <GameHeader round={currentRoundIndex + 1} totalRounds={Math.min(shuffledVenues.length, TOTAL_ROUNDS)} />
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
