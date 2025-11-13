import { useCallback, useEffect, useRef, useState } from 'react';

import { AppShell } from './components/AppShell';
import { SettingsPill } from './components/SettingsPill';
import { AppButton } from './components/Button';
import { Toast } from './components/Toast';
import { LessonScreen, LessonScreenHandle } from './components/lesson/LessonScreen';
import { useGestureInput } from './hooks/useGestureInput';
import { useVoiceInput } from './hooks/useVoiceInput';
import type { VoiceParseResult } from './hooks/voiceCommandParser';
import { DirectionsSheet } from './components/sheets/DirectionsSheet';
import { CountdownOverlay } from './components/sheets/CountdownOverlay';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { useLessonStore } from './state/useLessonStore';
import { ConfettiOverlay } from './components/ConfettiOverlay';
import SubagentsPanel from './components/SubagentsPanel';
import ProgressBadge from './components/ProgressBadge';
import UnlockSticker from './components/UnlockSticker';
import { bus, post, type HHEvent } from './gestures/gestureBus';
import { logger } from './utils/logger';
import type { ExpectedGesture } from './gestures/gestureEvaluator';
import {
  OnboardingCarousel,
  hasCompletedOnboarding,
} from './components/onboarding/OnboardingCarousel';
import { CalibrationFlow } from './components/calibration/CalibrationFlow';
import { CountdownRocket } from './components/overlays/CountdownRocket';
import { CountdownFinger } from './components/overlays/CountdownFinger';
import { VoicePermissionBanner } from './components/recovery/VoicePermissionBanner';

type CountdownMode = 'lesson_start' | 'accept';

type PendingAccept = {
  source: 'gesture' | 'voice';
  gesture?: ExpectedGesture;
  score?: number;
  clipId?: string;
};

function App(): JSX.Element | null {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<'welcome' | 'directions' | 'lesson'>('welcome');
  const [toast, setToast] = useState<{
    message: string;
    variant?: 'info' | 'success' | 'warn';
    duration?: number;
  } | null>(null);
  const [countdownMode, setCountdownMode] = useState<CountdownMode | null>(null);
  const [pendingAccept, setPendingAccept] = useState<PendingAccept | null>(null);
  const [lessonPaused, setLessonPaused] = useState(false);
  const gestureCueTimer = useRef<number | null>(null);
  const [gestureCue, setGestureCue] = useState<string | null>(null);
  const lessonRef = useRef<LessonScreenHandle | null>(null);
  const voiceHintShown = useRef(false);
  const [unlockStickerLevel, setUnlockStickerLevel] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const ui2ModesEnabled =
    import.meta.env.VITE_KID_MODE_V2 === '1' || import.meta.env.VITE_UI2_ENABLED === '1';
  const isBlockingCountdown =
    countdownMode === 'lesson_start' || (ui2ModesEnabled && kidMode && countdownMode === 'accept');

  const kidMode = useLessonStore((state) => state.kidMode);
  const setKidMode = useLessonStore((state) => state.setKidMode);
  const voiceOn = useLessonStore((state) => state.voiceOn);
  const toggleVoice = useLessonStore((state) => state.toggleVoice);
  const gesturesOn = useLessonStore((state) => state.gesturesOn);
  const toggleGestures = useLessonStore((state) => state.toggleGestures);
  const level = useLessonStore((state) => state.level);
  const stars = useLessonStore((state) => state.stars);
  const maxStars = useLessonStore((state) => state.maxStars);
  const registerResult = useLessonStore((state) => state.registerResult);
  const countdownEnabled = useLessonStore((state) => state.countdownOn);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const ui2Enabled =
      import.meta.env.VITE_UI2_ONBOARDING === '1' ||
      import.meta.env.VITE_UI2_ENABLED === '1';
    if (!ui2Enabled) return;
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.duration ?? 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // hydration guard moved below custom hooks to keep hook order stable across renders

  const triggerToast = useCallback(
    (
      message: string,
      variant: 'info' | 'success' | 'warn' = 'info',
      duration?: number,
    ) => {
      setToast({ message, variant, duration });
    },
    [],
  );

  const finalizeAcceptFlow = useCallback(
    (payload?: PendingAccept) => {
      const target = payload ?? pendingAccept;
      if (!target) return;
      logger.info(
        target.source === 'voice' ? 'voice' : 'gesture',
        'accept_countdown_complete',
        target,
      );
      if (target.source === 'voice') {
        registerResult('pass');
      }
      lessonRef.current?.nextClip();
      setPendingAccept(null);
    },
    [pendingAccept, registerResult],
  );

  const beginAcceptCountdown = useCallback(
    (payload: PendingAccept) => {
      if (countdownMode !== null) {
        logger.info('accept_flow', 'countdown_busy', {
          mode: countdownMode,
          payload,
        });
        return;
      }
      setPendingAccept(payload);
      if (!countdownEnabled) {
        finalizeAcceptFlow(payload);
        return;
      }
      setCountdownMode('accept');
    },
    [countdownEnabled, countdownMode, finalizeAcceptFlow],
  );

  const handleLockedLevel = (lockedLevel: number) => {
    triggerToast(
      `Keep practicing to unlock Level ${lockedLevel} (earn 5 stars).`,
      'warn',
    );
  };

  const handleCountdownComplete = () => {
    const mode = countdownMode;
    setCountdownMode(null);
    if (mode === 'lesson_start') {
      triggerToast('Lesson starting — good luck!', 'success');
    } else if (mode === 'accept') {
      finalizeAcceptFlow();
    }
  };

  const handleVoiceCommand = (command: VoiceParseResult) => {
    switch (command.type) {
      case 'control':
        switch (command.action) {
          case 'next':
            flashGestureCue('Next');
            beginAcceptCountdown({ source: 'voice' });
            break;
          case 'replay':
            lessonRef.current?.replayClip();
            flashGestureCue('Replay');
            break;
          case 'slow':
            lessonRef.current?.playSlow();
            flashGestureCue('Slow-mo');
            break;
          case 'help':
            lessonRef.current?.toggleHelp(true);
            flashGestureCue('Help');
            break;
          case 'pause':
            if (!lessonPaused) {
              setLessonPaused(true);
              lessonRef.current?.pause();
              flashGestureCue('Paused', 600);
            }
            break;
          case 'resume':
            if (lessonPaused) {
              setLessonPaused(false);
              lessonRef.current?.resume();
              flashGestureCue('Resume', 600);
            }
            break;
        }
        break;
      case 'kidMode':
        if (command.enabled !== kidMode) {
          setKidMode(command.enabled);
          triggerToast(
            `Kid Mode ${command.enabled ? 'enabled' : 'disabled'}.`,
            'success',
          );
        }
        break;
      case 'level':
        if (command.level === 1) {
          setView('directions');
          triggerToast('Opening Level 1.', 'info');
        } else {
          handleLockedLevel(command.level);
        }
        break;
      case 'navigate':
        if (command.destination === 'welcome') {
          setView('welcome');
          triggerToast('Returning to welcome.', 'info');
        }
        break;
    }
  };

  const flashGestureCue = (message: string, duration = 300) => {
    if (gestureCueTimer.current) {
      window.clearTimeout(gestureCueTimer.current);
    }
    setGestureCue(message);
    gestureCueTimer.current = window.setTimeout(() => {
      setGestureCue(null);
    }, duration);
  };

  const handleGestureAcceptRequest = useCallback(
    (payload: { clipId: string; gesture: ExpectedGesture; score: number }) => {
      beginAcceptCountdown({ source: 'gesture', ...payload });
    },
    [beginAcceptCountdown],
  );

  useEffect(() => {
    return () => {
      if (gestureCueTimer.current) {
        window.clearTimeout(gestureCueTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (voiceOn && !voiceHintShown.current) {
      voiceHintShown.current = true;
      triggerToast('Tip: quiet background gives the best results.', 'info');
      logger.info('voice', 'hint_shown');
    }
  }, [voiceOn]);

  // Celebrate level unlocks once per session per level
  const celebratedLevelsRef = useRef<Set<number>>(new Set());
  const prevLevelRef = useRef<number>(level);
  useEffect(() => {
    if (level > prevLevelRef.current && !celebratedLevelsRef.current.has(level)) {
      celebratedLevelsRef.current.add(level);
      triggerToast(`Level ${level} unlocked!`, 'success', 2800);
      setShowCelebration(true);
      logger.info('progress', 'level_unlocked', { level });
      setUnlockStickerLevel(level);
      // auto-hide handled inside ConfettiOverlay
    }
    prevLevelRef.current = level;
  }, [level]);

  const [showCelebration, setShowCelebration] = useState(false);
  const [goosePanelEnabled, setGoosePanelEnabled] = useState(false);
  useVoiceInput({
    enabled: view === 'lesson' && voiceOn && !isBlockingCountdown,
    paused: lessonPaused,
    onCommand: (result) => handleVoiceCommand(result),
    onUnrecognized: () => triggerToast("Try 'Next' or 'Replay'.", 'info'),
    onError: (reason) => {
      if (voiceOn) {
        toggleVoice();
      }
      const message = reason ?? 'Voice input unavailable right now.';
      setVoiceError(message);
      triggerToast(message, 'warn');
    },
  });

  useGestureInput({
    enabled: view === 'lesson' && gesturesOn,
    paused: lessonPaused && gesturesOn,
    suspended: isBlockingCountdown,
    onGesture: (gesture) => {
      switch (gesture) {
        case 'next':
          lessonRef.current?.nextClip();
          flashGestureCue('Next');
          break;
        case 'replay':
          lessonRef.current?.replayClip();
          flashGestureCue('Replay');
          break;
        case 'slow':
          lessonRef.current?.playSlow();
          flashGestureCue('Slow-mo');
          break;
        case 'help':
          lessonRef.current?.toggleHelp(true);
          flashGestureCue('Help');
          break;
        case 'pause':
          if (!lessonPaused) {
            setLessonPaused(true);
            lessonRef.current?.pause();
            flashGestureCue('Paused', 600);
          }
          break;
        case 'resume':
          if (lessonPaused) {
            setLessonPaused(false);
            lessonRef.current?.resume();
            flashGestureCue('Resume', 600);
          }
          break;
        default:
          break;
      }
    },
  });

  useEffect(() => {
    const handlePlanner = ({ data }: MessageEvent<HHEvent>) => {
      if (!data || data.intent !== 'planner') {
        return;
      }

      // Ignore practice navigation while the Practice tab is disabled

      if (data.action === 'PRACTICE_CORRECT') {
        triggerToast('Great match!', 'success');
        logger.info('practice', 'correct_gesture', data.meta);
      }
    };

    bus.addEventListener('message', handlePlanner);
    return () => {
      bus.removeEventListener('message', handlePlanner);
    };
  }, [triggerToast]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return;
    }

    const streamUrl =
      import.meta.env.VITE_GOOSE_STREAM_URL ??
      (import.meta.env.DEV ? 'http://localhost:5174/api/goose/stream' : undefined);

    const enableStreamEnv = import.meta.env.VITE_ENABLE_GOOSE_STREAM;
    const shouldConnect =
      enableStreamEnv === '1' || (enableStreamEnv === undefined && Boolean(streamUrl));

    if (!shouldConnect || !streamUrl) {
      setGoosePanelEnabled(false);
      return;
    }

    setGoosePanelEnabled(true);
    let source: EventSource | null = null;
    let retryTimer: number | null = null;
    let attempts = 0;

    const connect = () => {
      try {
        source = new EventSource(streamUrl);
      } catch (error) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('Failed to connect to goose stream:', error);
        }
        scheduleRetry();
        return;
      }

      source.onopen = () => {
        attempts = 0;
      };
      source.onmessage = (event) => {
        if (!event.data) return;
        post({ intent: 'planner', action: 'GOOSE_LOG', meta: { line: event.data } });
        logger.info('goose', 'stream_line', { line: event.data });
      };
      source.onerror = () => {
        source?.close();
        scheduleRetry();
      };
    };

    const scheduleRetry = () => {
      if (retryTimer) return;
      attempts += 1;
      const delay = Math.min(30000, 1000 * Math.pow(2, Math.min(attempts, 5)));
      retryTimer = window.setTimeout(() => {
        retryTimer = null;
        connect();
      }, delay);
    };

    connect();

    return () => {
      if (retryTimer) window.clearTimeout(retryTimer);
      retryTimer = null;
      source?.close();
    };
  }, []);

  if (!hydrated) {
    return null;
  }

  const welcomeView = (
    <WelcomeScreen
      kidMode={kidMode}
      level={level}
      stars={stars}
      totalStars={maxStars}
      onLockedLevel={handleLockedLevel}
      onStart={() => setView('directions')}
    />
  );

  const directionsView = (
    <DirectionsSheet
      beginLabel="Begin lesson"
      directions={[
        'Make sure your hands are visible to the camera.',
        'Stay centered and avoid strong backlighting.',
        'Remember: you can pause with a ✋ gesture any time.',
      ]}
      onBegin={() => {
        setCountdownMode('lesson_start');
        setView('lesson');
        triggerToast('Get ready! Lesson starting…', 'info');
      }}
    />
  );

  const lessonView = (
    <LessonScreen
      gesturesOn={gesturesOn}
      kidMode={kidMode}
      gestureCameraEnabled={gesturesOn && !showCalibration}
      onAcceptRequest={handleGestureAcceptRequest}
      onHint={() => {
        registerResult('almost');
        triggerToast('Slow-mo replay coming soon.', 'info');
      }}
      onNextClip={() => {
        triggerToast('Next sign queued.', 'success');
      }}
      onPauseChange={setLessonPaused}
      paused={lessonPaused}
      ref={lessonRef}
      voiceOn={voiceOn}
      onShowHowToUse={() => {
        const ui2Enabled =
          import.meta.env.VITE_UI2_ONBOARDING === '1' ||
          import.meta.env.VITE_UI2_ENABLED === '1';
        if (!ui2Enabled) return;
        setShowOnboarding(true);
      }}
    />
  );

  const countdownLabel =
    countdownMode === 'lesson_start'
      ? 'Lesson starting'
      : pendingAccept?.source === 'voice'
        ? 'Voice accept · advancing'
        : pendingAccept
        ? 'Gesture accepted · advancing'
        : undefined;

  let countdownNode: JSX.Element | null = null;
  if (countdownMode) {
    if (!ui2ModesEnabled) {
      countdownNode = (
        <CountdownOverlay label={countdownLabel} onComplete={handleCountdownComplete} />
      );
    } else if (kidMode) {
      countdownNode = (
        <CountdownRocket label={countdownLabel} onComplete={handleCountdownComplete} />
      );
    } else {
      countdownNode = (
        <CountdownFinger label={countdownLabel} onComplete={handleCountdownComplete} />
      );
    }
  }

  return (
    <>
      <AppShell
        header={
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <h1 className="text-3xl font-bold tracking-tight text-accent-lime">
              Hello Hands
            </h1>
            <div className="flex flex-wrap items-center justify-end gap-sm">
              <SettingsPill
                onOpenHowToUse={() => {
                  const ui2Enabled =
                    import.meta.env.VITE_UI2_ONBOARDING === '1' ||
                    import.meta.env.VITE_UI2_ENABLED === '1';
                  if (!ui2Enabled) return;
                  setShowOnboarding(true);
                }}
                onOpenCalibration={() => {
                  const ui2Enabled =
                    import.meta.env.VITE_UI2_CALIBRATION === '1' ||
                    import.meta.env.VITE_UI2_ENABLED === '1';
                  if (!ui2Enabled) return;
                  setShowCalibration(true);
                }}
              />
              <ProgressBadge level={level} stars={stars} total={maxStars} />
              {/* Practice entry temporarily removed */}
              <AppButton onClick={() => setKidMode(!kidMode)} type="button" variant="kid">
                Kid Mode: {kidMode ? 'On' : 'Off'}
              </AppButton>
              {voiceOn && (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent-teal/60 bg-accent-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-teal">
                  Listening
                </span>
              )}
            </div>
          </div>
        }
      >
        {view === 'welcome' && welcomeView}
        {view === 'directions' && directionsView}
        {view === 'lesson' && lessonView}
        {/* Practice view temporarily removed */}

        <VoicePermissionBanner
          error={voiceError}
          onRetry={() => {
            setVoiceError(null);
            if (!voiceOn) {
              toggleVoice();
            }
          }}
        />

        {showCelebration && (
          <ConfettiOverlay
            message={`Level ${level} unlocked!`}
            onEnd={() => setShowCelebration(false)}
          />
        )}

        {countdownNode}
        {gestureCue && (
          <div className="pointer-events-none fixed bottom-6 right-6 rounded-full bg-surface-800/80 px-md py-2 text-sm font-semibold text-text-primary shadow-lg ring-1 ring-white/10">
            {gestureCue}
          </div>
        )}
        {toast && (
          <Toast
            duration={toast.duration ?? 2500}
            message={toast.message}
            variant={toast.variant ?? 'info'}
          />
        )}
        <div className="pointer-events-none fixed top-6 left-1/2 z-[65] -translate-x-1/2">
          <UnlockSticker
            level={unlockStickerLevel ?? 0}
            visible={unlockStickerLevel !== null}
            onHide={() => setUnlockStickerLevel(null)}
          />
        </div>
        {showOnboarding && (
          <OnboardingCarousel
            onComplete={() => {
              setShowOnboarding(false);
              logger.info('ui2', 'onboarding_complete');
            }}
            onSkip={() => {
              setShowOnboarding(false);
              logger.info('ui2', 'onboarding_skipped');
            }}
          />
        )}
        {showCalibration && (
          <CalibrationFlow
            onComplete={() => {
              setShowCalibration(false);
            }}
            onSkip={() => {
              setShowCalibration(false);
            }}
          />
        )}
      </AppShell>
      {goosePanelEnabled && <SubagentsPanel />}
    </>
  );
}

export default App;
