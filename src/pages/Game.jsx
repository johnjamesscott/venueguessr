import React, { lazy, useState, useCallback, useEffect, useRef } from 'react';
import { calculateDistance } from '@/utils/distance';
import { applyIcpBoost, calculateScore } from '@/utils/scoring';
import { base44 } from '@/api/base44Client';
import { EMPTY_LEADERBOARD, usePublicLeaderboard } from '@/hooks/usePublicLeaderboard';
import { useKioskInactivity } from '@/hooks/useKioskInactivity';
import { DEFAULT_GAME_SETTINGS, normalizeGameSettings } from '@/utils/gameSettings';
import { withTimeout } from '@/utils/withTimeout';
import { trackEvent } from '@/utils/analytics';
import {
  unlockAudio, playPinSound, playLockSound,
  playCelebrationSound, playErrorSound,
} from '@/utils/sounds';

import SplashScreen from '@/components/game/SplashScreen/SplashScreen';
import GameHeader from '@/components/game/GameHeader';
import MatterportViewer from '@/components/game/MatterportViewer';
import ArcadeMapControls from '@/components/game/ArcadeMapControls';
import GameSummary from '@/components/game/GameSummary';
import PreRoundCountdown from '@/components/game/PreRoundCountdown';
import CelebrationOverlay from '@/components/game/CelebrationOverlay';

const GuessMap = lazy(() => import('@/components/game/GuessMap'));
const RoundResult = lazy(() => import('@/components/game/RoundResult'));
const QrContactScreen = lazy(() => import('@/components/game/QrContactScreen'));

const GOOD_SCORE_THRESHOLD = 2000;
const VENUE_REQUEST_TIMEOUT_MS = 12_000;

const getStartErrorMessage = (error) => {
  if (!navigator.onLine) return 'This kiosk is offline. Check the connection.';
  const message = String(error?.message || '');
  if (message.includes('took too long')) return 'The venue request took too long.';
  if (message.toLowerCase().includes('no active venues') || error?.response?.status === 404) {
    return 'No venues are ready for play.';
  }
  return 'The game could not load.';
};

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
  const [currentBaseScore, setCurrentBaseScore] = useState(0);
  const [playerEntryId, setPlayerEntryId] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_GAME_SETTINGS.roundSeconds);
  const [venuePool, setVenuePool] = useState([]);
  const [icpBoostArmed, setIcpBoostArmed] = useState(false);
  const [gameIcpBoosted, setGameIcpBoosted] = useState(false);
  const [gameSettings, setGameSettings] = useState(DEFAULT_GAME_SETTINGS);
  const [gameCompetitionId, setGameCompetitionId] = useState(null);
  const [gameSessionId, setGameSessionId] = useState(0);
  const [startMode, setStartMode] = useState(null);
  const [startError, setStartError] = useState('');
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [venueUnavailable, setVenueUnavailable] = useState(false);
  const [viewerRetryKey, setViewerRetryKey] = useState(0);
  const startInFlightRef = useRef(false);
  const startRequestIdRef = useRef(0);
  const activeGameSessionRef = useRef(0);
  const {
    data: publicLeaderboard = EMPTY_LEADERBOARD,
    isLoading: leaderboardLoading,
    isError: leaderboardError,
  } = usePublicLeaderboard({
    enabled: gameState === GAME_STATES.SPLASH,
  });
  const activeCompetition = publicLeaderboard.competition;
  const activeSettings = normalizeGameSettings(activeCompetition);

  useEffect(() => {
    // Remove the legacy persisted toggle so every fresh kiosk session starts at 1 Credit.
    try { localStorage.removeItem('vg_icp_boost'); } catch {}
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleIcpBoost = useCallback(() => {
    setIcpBoostArmed(prev => !prev);
  }, []);

  const resetRoundState = useCallback((roundSeconds = gameSettings.roundSeconds) => {
    setCurrentGuess(null);
    setGuessLocked(false);
    setCurrentDistance(null);
    setCurrentScore(0);
    setCurrentBaseScore(0);
    setTimerActive(false);
    setTimeRemaining(roundSeconds);
    setPreRoundCountdown(false);
    setShowCelebration(false);
    setVenueUnavailable(false);
    setViewerRetryKey(0);
  }, [gameSettings.roundSeconds]);

  const resetKiosk = useCallback(() => {
    startRequestIdRef.current += 1;
    startInFlightRef.current = false;
    setGameState(GAME_STATES.SPLASH);
    setShuffledVenues([]);
    setCurrentRoundIndex(0);
    setCurrentGuess(null);
    setResults([]);
    setTimerActive(false);
    setGuessLocked(false);
    setCurrentDistance(null);
    setPreRoundCountdown(false);
    setCurrentScore(0);
    setCurrentBaseScore(0);
    setPlayerEntryId(null);
    setShowCelebration(false);
    setIsDemo(false);
    setTimeRemaining(activeSettings.roundSeconds);
    setVenuePool([]);
    setIcpBoostArmed(false);
    setGameIcpBoosted(false);
    setGameSettings(activeSettings);
    setGameCompetitionId(null);
    setGameSessionId(0);
    setStartMode(null);
    setStartError('');
    setVenueUnavailable(false);
    setViewerRetryKey(0);
    activeGameSessionRef.current = 0;
  }, [activeSettings.icpMultiplier, activeSettings.kioskIdleSeconds, activeSettings.roundCount, activeSettings.roundSeconds]);

  useKioskInactivity({
    timeoutSeconds: gameState === GAME_STATES.SPLASH
      ? activeSettings.kioskIdleSeconds
      : gameSettings.kioskIdleSeconds,
    onIdle: resetKiosk,
  });

  const startSession = useCallback(async (demoMode) => {
    if (startInFlightRef.current) return;
    startInFlightRef.current = true;
    const requestId = startRequestIdRef.current + 1;
    startRequestIdRef.current = requestId;
    setStartMode(demoMode ? 'demo' : 'game');
    setStartError('');
    unlockAudio();
    const startedAt = performance.now();

    try {
      const response = await withTimeout(
        base44.functions.invoke('getRandomVenues', demoMode ? { demo: true } : {}),
        VENUE_REQUEST_TIMEOUT_MS,
        'The venue request took too long',
      );
      if (startRequestIdRef.current !== requestId) return;

      const settings = normalizeGameSettings(response?.data?.settings);
      let venues = (response?.data?.venues || []).map(venueToGame);
      if (demoMode && venues.length === 0) {
        venues = [{
          id: 'demo', venueName: 'Natural History Museum', spaceName: 'Cromwell Road',
          city: 'London', country: 'GB', lat: 51.4965109, lng: -0.1760019,
          tourUrl: 'https://my.matterport.com/show/?m=8sZPNjQPLGm',
        }];
      }
      if (venues.length === 0) throw new Error('No active venues are available');

      const playableCount = demoMode ? 1 : settings.roundCount;
      setGameSettings(settings);
      setGameCompetitionId(response?.data?.competitionId || activeCompetition?.id || null);
      setGameSessionId(requestId);
      setShuffledVenues(venues.slice(0, playableCount));
      setVenuePool(demoMode ? [] : venues.slice(playableCount));
      setCurrentRoundIndex(0);
      setResults([]);
      setPlayerEntryId(null);
      setIsDemo(demoMode);
      setGameIcpBoosted(icpBoostArmed);
      setIcpBoostArmed(false);
      resetRoundState(settings.roundSeconds);
      activeGameSessionRef.current = requestId;
      setGameState(GAME_STATES.PLAYING);
      trackEvent('game_started', {
        demo: demoMode,
        icp_boosted: demoMode ? false : icpBoostArmed,
        round_count: playableCount,
        load_ms: Math.round(performance.now() - startedAt),
      });
    } catch (error) {
      if (startRequestIdRef.current !== requestId) return;
      if (demoMode && navigator.onLine) {
        const fallbackSettings = normalizeGameSettings(activeCompetition);
        setGameSettings(fallbackSettings);
        setGameCompetitionId(activeCompetition?.id || null);
        setGameSessionId(requestId);
        setShuffledVenues([{
          id: 'demo', venueName: 'Natural History Museum', spaceName: 'Cromwell Road',
          city: 'London', country: 'GB', lat: 51.4965109, lng: -0.1760019,
          tourUrl: 'https://my.matterport.com/show/?m=8sZPNjQPLGm',
        }]);
        setVenuePool([]);
        setCurrentRoundIndex(0);
        setResults([]);
        setPlayerEntryId(null);
        setIsDemo(true);
        setGameIcpBoosted(icpBoostArmed);
        setIcpBoostArmed(false);
        resetRoundState(fallbackSettings.roundSeconds);
        activeGameSessionRef.current = requestId;
        setGameState(GAME_STATES.PLAYING);
        trackEvent('game_started', {
          demo: true,
          icp_boosted: false,
          round_count: 1,
          fallback: true,
          load_ms: Math.round(performance.now() - startedAt),
        });
        return;
      }
      setStartError(getStartErrorMessage(error));
      trackEvent('game_start_failed', {
        demo: demoMode,
        online: navigator.onLine,
        timed_out: String(error?.message || '').includes('took too long'),
        load_ms: Math.round(performance.now() - startedAt),
      });
    } finally {
      if (startRequestIdRef.current === requestId) {
        startInFlightRef.current = false;
        setStartMode(null);
      }
    }
  }, [activeCompetition, icpBoostArmed, resetRoundState]);

  const startDemo = useCallback(() => startSession(true), [startSession]);
  const startGame = useCallback(() => startSession(false), [startSession]);

  const handleTourError = useCallback(() => {
    setTimerActive(false);
    setPreRoundCountdown(false);
    setTimeRemaining(gameSettings.roundSeconds);
    setVenuePool(pool => {
      trackEvent('venue_tour_failed', {
        round_number: currentRoundIndex + 1,
        spare_available: pool.length > 0,
        online: navigator.onLine,
      });
      if (pool.length === 0) {
        setVenueUnavailable(true);
        return pool;
      }
      const [next, ...rest] = pool;
      setShuffledVenues(venues => {
        const updated = [...venues];
        updated[currentRoundIndex] = next;
        return updated;
      });
      setVenueUnavailable(false);
      setViewerRetryKey(key => key + 1);
      return rest;
    });
  }, [currentRoundIndex, gameSettings.roundSeconds]);

  const retryVenue = useCallback(() => {
    setVenueUnavailable(false);
    setTimerActive(false);
    setPreRoundCountdown(false);
    setTimeRemaining(gameSettings.roundSeconds);
    setViewerRetryKey(key => key + 1);
  }, [gameSettings.roundSeconds]);

  const handleVenueLoaded = useCallback(() => {
    setVenueUnavailable(false);
    setPreRoundCountdown(true);
  }, []);

  const handlePreRoundComplete = useCallback(() => {
    setPreRoundCountdown(false);
    setTimerActive(true);
  }, []);

  const lockGuess = useCallback((guess, lockedTimeRemaining) => {
    if (guessLocked) return;
    const venue = shuffledVenues[currentRoundIndex];
    const dist = guess ? calculateDistance(guess.lat, guess.lng, venue.lat, venue.lng) : null;
    const baseScore = dist
      ? calculateScore(dist.km, lockedTimeRemaining ?? timeRemaining, gameSettings.roundSeconds)
      : 0;
    const score = applyIcpBoost(baseScore, gameIcpBoosted, gameSettings.icpMultiplier);

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
    setCurrentBaseScore(baseScore);
    setCurrentScore(score);
    setGuessLocked(true);
    setTimerActive(false);
    setGameState(GAME_STATES.ROUND_RESULT);
  }, [guessLocked, shuffledVenues, currentRoundIndex, timeRemaining, gameIcpBoosted, gameSettings]);

  const handleTimerExpire = useCallback(() => {
    if (!guessLocked) lockGuess(currentGuess, 0);
  }, [guessLocked, lockGuess, currentGuess]);

  const handleGuessPlaced = useCallback((latlng) => {
    playPinSound();
    setCurrentGuess({ lat: latlng.lat, lng: latlng.lng });
  }, []);

  const handleNextRound = useCallback(() => {
    const venue = shuffledVenues[currentRoundIndex];
    const nextResults = [...results, {
      venueId: venue.id, venueName: venue.venueName, city: venue.city,
      guess: currentGuess, distance: currentDistance,
      baseScore: currentBaseScore, score: currentScore,
    }];
    setResults(nextResults);
    const isLastRound = currentRoundIndex >= shuffledVenues.length - 1;
    if (isLastRound) {
      trackEvent('game_completed', {
        demo: isDemo,
        icp_boosted: gameIcpBoosted,
        round_count: nextResults.length,
        total_score: nextResults.reduce((sum, result) => sum + (result.score || 0), 0),
      });
    }
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
      setCurrentBaseScore(0);
      setTimerActive(false);
      setTimeRemaining(gameSettings.roundSeconds);
      setPreRoundCountdown(false);
      setVenueUnavailable(false);
      setViewerRetryKey(0);
      setGameState(GAME_STATES.PLAYING);
    }
  }, [currentRoundIndex, shuffledVenues, results, currentGuess, currentDistance, currentBaseScore, currentScore, isDemo, gameIcpBoosted, gameSettings.roundSeconds]);

  const handlePlayAgain = useCallback(() => {
    resetKiosk();
  }, [resetKiosk]);

  const handleContactSubmit = useCallback((_formData, submissionResult) => {
    if (activeGameSessionRef.current !== gameSessionId) return;
    setPlayerEntryId(submissionResult?.entry_id || null);
    setGameState(GAME_STATES.SUMMARY);
  }, [gameSessionId]);

  const handleRemoteContactComplete = useCallback((submissionResult) => {
    if (activeGameSessionRef.current !== gameSessionId) return;
    setPlayerEntryId(submissionResult?.leaderboard_entry_id || null);
    setGameState(GAME_STATES.SUMMARY);
  }, [gameSessionId]);

  const handleContactSkip = useCallback(() => {
    trackEvent('score_capture_skipped', {
      round_count: results.length,
      icp_boosted: gameIcpBoosted,
    });
    setGameState(GAME_STATES.SUMMARY);
  }, [gameIcpBoosted, results.length]);

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
        startMode={startMode}
        startError={startError}
        isOnline={isOnline}
      />
    );
  }

  if (gameState === GAME_STATES.SUMMARY) {
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    return (
      <>
        <OfflineBanner isOnline={isOnline} />
        <GameSummary
          results={results}
          venues={shuffledVenues}
          totalScore={totalScore}
          playerEntryId={playerEntryId}
          onPlayAgain={handlePlayAgain}
          competitionId={gameCompetitionId}
        />
      </>
    );
  }

  if (gameState === GAME_STATES.CONTACT) {
    const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
    const withDist = results.filter(r => r.distance);
    const avgKm = withDist.length > 0
      ? withDist.reduce((s, r) => s + (r.distance?.km || 0), 0) / withDist.length : 0;
    return (
      <div className="min-h-screen bg-hb-bg">
        <OfflineBanner isOnline={isOnline} />
        <GameHeader />
        <QrContactScreen
          totalScore={totalScore}
          competitionId={gameCompetitionId}
          roundResults={results.map(r => ({
            venue_name: r.venueName,
            city: r.city,
            score: r.baseScore ?? r.score,
            distance_km: r.distance?.km || 0,
          }))}
          avgDistanceKm={Math.round(avgKm)}
          icpBoosted={gameIcpBoosted}
          onManualSubmit={handleContactSubmit}
          onSubmissionComplete={handleRemoteContactComplete}
          onSkip={handleContactSkip}
        />
      </div>
    );
  }

  return (
    <div className="bg-hb-bg flex flex-col" style={{ minHeight: '100dvh' }}>
      <OfflineBanner isOnline={isOnline} />
      <CelebrationOverlay active={showCelebration} />

      {gameState === GAME_STATES.PLAYING && currentVenue && (
        <div style={{ position: 'fixed', inset: 0, background: '#121212' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, background: 'white' }}>
            <GameHeader round={currentRoundIndex + 1} totalRounds={shuffledVenues.length} />
          </div>
          <div style={{ position: 'absolute', top: 88, left: 0, right: 0, bottom: 0, zIndex: -10, overflow: 'hidden' }}>
            <MatterportViewer
              key={`${currentVenue.id}-${viewerRetryKey}`}
              tourUrl={currentVenue.tourUrl}
              nextTourUrl={shuffledVenues[currentRoundIndex + 1]?.tourUrl}
              onError={handleTourError}
              onLoaded={handleVenueLoaded}
              loadTimeoutMs={12_000}
            />
            {venueUnavailable && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80">
                <div className="rounded-2xl border border-white/20 bg-[#1f1f1f] px-8 py-7 text-center shadow-2xl">
                  <p className="text-white text-xl font-bold">This venue could not load</p>
                  <p className="text-white/60 text-sm mt-2 mb-5">Check the connection, then try it again.</p>
                  <button onClick={retryVenue} className="rounded-full bg-white px-6 py-3 font-bold text-[#8B1A1A]">Retry venue</button>
                </div>
              </div>
            )}
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
            timerSeconds={gameSettings.roundSeconds}
            timerActive={timerActive}
            onTimerExpire={handleTimerExpire}
            onTimerTick={setTimeRemaining}
            roundIndex={currentRoundIndex}
          />
        </div>
      )}

      {gameState === GAME_STATES.ROUND_RESULT && currentVenue && (
        <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
          <GameHeader round={currentRoundIndex + 1} totalRounds={shuffledVenues.length} />
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

function OfflineBanner({ isOnline }) {
  if (isOnline) return null;
  return (
    <div className="fixed left-1/2 top-3 z-[100] -translate-x-1/2 rounded-full bg-amber-300 px-5 py-2 text-sm font-bold text-black shadow-xl" role="status">
      Kiosk offline — reconnect to continue
    </div>
  );
}
