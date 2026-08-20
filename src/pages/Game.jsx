import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getEmbedUrl } from '@/data/venues';
import { calculateDistance } from '@/utils/distance';
import { calculateScore, ICP_BOOST_FACTOR } from '@/utils/scoring';
import { base44 } from '@/api/base44Client';
import {
  unlockAudio, playPinSound, playLockSound,
  playCelebrationSound, playErrorSound,
} from '@/utils/sounds';

import SplashScreen from '@/components/game/SplashScreen/SplashScreen';
import GameHeader from '@/components/game/GameHeader';
import MatterportViewer from '@/components/game/MatterportViewer';
import GuessMap from '@/components/game/GuessMap';
import ArcadeMapControls from '@/components/game/ArcadeMapControls';
import RoundResult from '@/components/game/RoundResult';
import QrContactScreen from '@/components/game/QrContactScreen';
import GameSummary from '@/components/game/GameSummary';
import PreRoundCountdown from '@/components/game/PreRoundCountdown';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';

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
  const [playerEmail, setPlayerEmail] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(ROUND_SECONDS);
  const [activeCompetition, setActiveCompetition] = useState(null);
  const [prizes, setPrizes] = useState([]);
  const [venuePool, setVenuePool] = useState([]);
  const [icpBoostArmed, setIcpBoostArmed] = useState(() => {
    try { return localStorage.getItem('vg_icp_boost') === '1'; } catch { return false; }
  });
  const scoreSubmittedRef = useRef(false);

  const toggleIcpBoost = useCallback(() => {
    setIcpBoostArmed(prev => {
      const next = !prev;
      try { localStorage.setItem('vg_icp_boost', next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  // Load active competition + prizes on mount
  useEffect(() => {
    base44.functions.invoke('getActiveCompetition', {}).then(res => {
      if (res?.data?.competition) setActiveCompetition(res.data.competition);
      if (res?.data?.prizes) setPrizes(res.data.prizes);
    }).catch(() => {});
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
      const all = await base44.entities.Venue.filter({ is_demo: true, active: true });
      demoVenues = all.map(venueToGame);
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
        setShuffledVenues(venues);
        setVenuePool([]);
        setCurrentRoundIndex(0);
        setResults([]);
        setIsDemo(false);
        scoreSubmittedRef.current = false;
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

  const handleContactSubmit = useCallback(async (formData) => {
    if (scoreSubmittedRef.current) return;
    scoreSubmittedRef.current = true;

    // results already contains all rounds (added in handleNextRound for the last round too)
    const finalResults = results;
    const baseTotal = finalResults.reduce((sum, r) => sum + (r.score || 0), 0);
    const total = icpBoostArmed ? Math.round(baseTotal * ICP_BOOST_FACTOR) : baseTotal;
    const withDist = finalResults.filter(r => r.distance);
    const avgKm = withDist.length > 0
      ? withDist.reduce((sum, r) => sum + (r.distance?.km || 0), 0) / withDist.length : 0;

    try {
      await base44.functions.invoke('submitScore', {
        player_name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        total_score: total,
        rounds_played: finalResults.length,
        avg_distance_km: Math.round(avgKm),
        icp_boosted: icpBoostArmed,
      });
      if (formData.email) setPlayerEmail(formData.email);
    } catch (_) {}

    // Send post-game email
    if (formData.email) {
      base44.functions.invoke('sendPostGameEmail', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        total_score: total,
        round_results: finalResults.map(r => ({
          venue_name: r.venueName || 'Unknown Venue',
          city: r.city || '',
          score: r.score || 0,
          distance_km: r.distance?.km || 0,
        })),
      }).catch(err => console.error('sendPostGameEmail failed:', err));
    }

    setGameState(GAME_STATES.SUMMARY);
  }, [results, shuffledVenues, currentRoundIndex, currentGuess, currentDistance, currentScore, icpBoostArmed]);

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
    return <SplashScreen onStart={startGame} onDemo={startDemo} prizes={prizes} icpBoostArmed={icpBoostArmed} onToggleIcpBoost={toggleIcpBoost} />;
  }

  if (gameState === GAME_STATES.SUMMARY) {
    const baseTotal = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const totalScore = icpBoostArmed ? Math.round(baseTotal * ICP_BOOST_FACTOR) : baseTotal;
    return (
      <GameSummary
        results={results}
        venues={shuffledVenues}
        totalScore={totalScore}
        playerEmail={playerEmail}
        onPlayAgain={() => setGameState(GAME_STATES.SPLASH)}
        prizes={prizes}
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
            <GameHeader round={currentRoundIndex + 1} totalRounds={TOTAL_ROUNDS} />
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
          <GameHeader round={currentRoundIndex + 1} totalRounds={TOTAL_ROUNDS} />
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