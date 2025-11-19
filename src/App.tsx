import { useCallback, useEffect, useRef, useState } from 'react';

import { AppShell } from './components/AppShell';
import { AppButton } from './components/Button';
import { Toast } from './components/Toast';
import { LessonScreen, LessonScreenHandle } from './components/lesson/LessonScreen';
import { useGestureInput } from './hooks/useGestureInput';
import { useVoiceInput } from './hooks/useVoiceInput';
import type { VoiceParseResult } from './hooks/voiceCommandParser';
import { DirectionsSheet } from './components/sheets/DirectionsSheet';
import { CountdownOverlay } from './components/sheets/CountdownOverlay';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LevelStackScreen } from './screens/LevelStackScreen';
import { PackStackScreen } from './screens/PackStackScreen';
import { LessonPackStackScreen } from './screens/LessonPackStackScreen';
import { PracticePage } from './pages/PracticePage';
import { useLessonStore } from './state/useLessonStore';
import { ConfettiOverlay } from './components/ConfettiOverlay';
import SubagentsPanel from './components/SubagentsPanel';
import ProgressBadge from './components/ProgressBadge';
import { StickerUnlockOverlay } from './components/StickerUnlockOverlay';
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
import { StickerBoard } from './components/progress/StickerBoard';
import { MilestoneCard } from './components/progress/MilestoneCard';
import { useProgressStore } from './state/progress';

type CountdownMode = 'lesson_start' | 'accept';

type PendingAccept = {
  source: 'gesture' | 'voice';
  gesture?: ExpectedGesture;
  score?: number;
  clipId?: string;
};

function App(): JSX.Element | null {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<
    'welcome' | 'lesson-pack-stack' | 'level-stack' | 'pack-stack' | 'lesson' | 'practice'
  >('welcome');
  const [selectedPath, setSelectedPath] = useState<'lesson' | 'practice' | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showStickerBoard, setShowStickerBoard] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  // UI 2.0 feature flags default to ON; set env var to "0" to explicitly disable.
  const ui2Enabled = import.meta.env.VITE_UI2_ENABLED !== '0';
  const ui2ModesEnabled = (import.meta.env.VITE_KID_MODE_V2 ?? '1') !== '0' && ui2Enabled;
  const ui2OnboardingEnabled =
    (import.meta.env.VITE_UI2_ONBOARDING ?? '1') !== '0' && ui2Enabled;
  const ui2CalibrationEnabled =
    (import.meta.env.VITE_UI2_CALIBRATION ?? '1') !== '0' && ui2Enabled;
  const ui2StickersEnabled =
    (import.meta.env.VITE_UI2_STICKERS ?? '1') !== '0' && ui2Enabled;

  const kidMode = useLessonStore((state) => state.kidMode);
  const isBlockingCountdown =
    countdownMode === 'lesson_start' || (ui2ModesEnabled && countdownMode === 'accept');
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
  const countdownOn = useLessonStore((state) => state.countdownOn);
  const toggleCountdown = useLessonStore((state) => state.toggleCountdown);
  const refractoryOn = useLessonStore((state) => state.refractoryOn);
  const toggleRefractory = useLessonStore((state) => state.toggleRefractory);
  const milestones = useProgressStore((s) => s.milestones);
  const dismissMilestone = useProgressStore((s) => s.dismissMilestone);
  const newlyUnlockedStickers = useProgressStore((s) => s.newlyUnlockedStickers);
  const dismissStickerUnlock = useProgressStore((s) => s.dismissStickerUnlock);
  const recordPathCompletion = useProgressStore((s) => s.recordPathCompletion);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!ui2OnboardingEnabled) return;
    if (!hasCompletedOnboarding()) {
      setShowOnboarding(true);
    }
  }, [ui2OnboardingEnabled]);

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

  const handleSelectLessonPath = () => {
    setSelectedPath('lesson');
    setSideMenuOpen(false);
    setView('level-stack'); // Go to level selection, then lesson
  };

  const handleSelectPracticePath = () => {
    setSelectedPath('practice');
    setSideMenuOpen(false);
    setView('pack-stack');
  };

  const handleSelectLevel = (level: number) => {
    setSelectedLevel(level);
    setView('lesson');
  };

  const handleLessonPackSelect = (packId: string) => {
    setSelectedPack(packId);
    setView('level-stack');
  };

  const handleSelectPack = (packId: string) => {
    setSelectedPack(packId);
    setView('practice');
  };

  const handleCountdownComplete = useCallback(() => {
    const mode = countdownMode;
    setCountdownMode(null);
    if (mode === 'lesson_start') {
      triggerToast('Lesson starting — good luck!', 'success');
    } else if (mode === 'accept') {
      finalizeAcceptFlow();
    }
  }, [countdownMode, finalizeAcceptFlow, triggerToast]);

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
          setSelectedPath('lesson');
          setSideMenuOpen(false);
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
      recordPathCompletion(level);
      // auto-hide handled inside ConfettiOverlay
    }
    prevLevelRef.current = level;
  }, [level, recordPathCompletion]);

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
    const handleBus = ({ data }: MessageEvent<HHEvent>) => {
      if (!data) return;
      if (data.intent === 'planner' && data.action === 'PRACTICE_CORRECT') {
        triggerToast('Great match!', 'success');
        logger.info('practice', 'correct_gesture', data.meta);
      }
      if (data.intent === 'gesture' && data.type === 'countdown_done') {
        handleCountdownComplete();
      }
    };

    bus.addEventListener('message', handleBus);
    return () => {
      bus.removeEventListener('message', handleBus);
    };
  }, [handleCountdownComplete, triggerToast]);

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
      onSelectLesson={handleSelectLessonPath}
      onSelectPractice={handleSelectPracticePath}
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

  const lessonPackView = (
    <LessonPackStackScreen
      onSelectPack={handleLessonPackSelect}
      onBack={() => setView('welcome')}
    />
  );

  const levelStackView = (
    <LevelStackScreen
      onSelectLevel={handleSelectLevel}
      onBack={() => setView('welcome')}
    />
  );

  const packStackView = (
    <PackStackScreen onSelectPack={handleSelectPack} onBack={() => setView('welcome')} />
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
        if (!ui2OnboardingEnabled) return;
        setShowOnboarding(true);
      }}
      countdownLabel={countdownLabel}
      kidCountdownActive={ui2ModesEnabled && kidMode && countdownMode !== null}
      onKidCountdownComplete={handleCountdownComplete}
      adultCountdownActive={ui2ModesEnabled && !kidMode && countdownMode !== null}
      onAdultCountdownComplete={handleCountdownComplete}
    />
  );

  const practiceView = <PracticePage selectedPack={selectedPack} />;

  const nextMilestone = milestones.find((m) => !m.seen);

  return (
    <>
      <AppShell
        kidMode={kidMode}
        header={
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSideMenuOpen((prev) => !prev)}
                className={`burger-btn ${sideMenuOpen ? 'open' : ''}`}
                aria-label="Toggle side panel"
              >
                <span className="burger-bar" />
                <span className="burger-bar" />
                <span className="burger-bar" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPath(null);
                  setSideMenuOpen(false);
                  setView('welcome');
                  triggerToast('Back to main menu.', 'info');
                }}
                className={`main-logo ${kidMode ? 'kid-logo' : 'adult-logo'} text-left font-bold tracking-tight text-accent-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal`}
                aria-label="Back to main menu"
              >
                Hello Hands
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-sm">
              <ProgressBadge level={level} stars={stars} total={maxStars} />
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
        {view === 'lesson-pack-stack' && lessonPackView}
        {view === 'level-stack' && levelStackView}
        {view === 'pack-stack' && packStackView}
        {view === 'lesson' && lessonView}
        {view === 'practice' && practiceView}
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

        {showStickerBoard && (
          <StickerBoard
            onClose={() => {
              setShowStickerBoard(false);
            }}
          />
        )}

        {nextMilestone && (
          <MilestoneCard
            milestone={nextMilestone}
            onDismiss={() => dismissMilestone(nextMilestone.id)}
          />
        )}

        {showCelebration && (
          <ConfettiOverlay
            message={`Level ${level} unlocked!`}
            onEnd={() => setShowCelebration(false)}
          />
        )}

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
        {newlyUnlockedStickers.length > 0 && (
          <StickerUnlockOverlay
            stickerId={newlyUnlockedStickers[0]}
            onComplete={() => dismissStickerUnlock(newlyUnlockedStickers[0])}
          />
        )}
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
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-64 border-r border-white/10 bg-surface-900/95 p-5 text-sm text-text-primary shadow-2xl transition-transform duration-300 ${
          sideMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!sideMenuOpen}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.4em] text-accent-teal">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setSideMenuOpen(false)}
            className="text-xs font-semibold text-accent-teal hover:underline"
          >
            Close
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">
              Quick settings
            </p>
            <div className="mt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  toggleVoice();
                  logger.info('ui2', `voice:${voiceOn ? 'off' : 'on'}`);
                }}
                className="w-full rounded-lg border border-white/15 bg-surface-800/70 px-3 py-2 text-left font-semibold text-text-primary transition hover:border-accent-teal/60"
              >
                Voice: {voiceOn ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleGestures();
                  logger.info('ui2', `gesture:${gesturesOn ? 'off' : 'on'}`);
                }}
                className="w-full rounded-lg border border-white/15 bg-surface-800/70 px-3 py-2 text-left font-semibold text-text-primary transition hover:border-accent-teal/60"
              >
                Gestures: {gesturesOn ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleCountdown();
                  logger.info('ui2', `countdown:${countdownOn ? 'off' : 'on'}`);
                }}
                className="w-full rounded-lg border border-white/15 bg-surface-800/70 px-3 py-2 text-left font-semibold text-text-primary transition hover:border-accent-teal/60"
              >
                Countdown: {countdownOn ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleRefractory();
                  logger.info('ui2', `refractory:${refractoryOn ? 'off' : 'on'}`);
                }}
                className="w-full rounded-lg border border-white/15 bg-surface-800/70 px-3 py-2 text-left font-semibold text-text-primary transition hover:border-accent-teal/60"
              >
                Refractory: {refractoryOn ? 'On' : 'Off'}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Lessons</p>
            <div className="mt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setView('welcome');
                  setSideMenuOpen(false);
                }}
                className="w-full rounded-lg border border-white/15 bg-surface-800/70 px-3 py-2 text-left font-semibold text-text-primary transition hover:border-accent-teal/60"
              >
                Welcome
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('directions');
                  setSideMenuOpen(false);
                }}
                className="w-full rounded-lg border border-white/15 bg-surface-800/70 px-3 py-2 text-left font-semibold text-text-primary transition hover:border-accent-teal/60"
              >
                Directions
              </button>
            </div>
          </div>
          {ui2StickersEnabled && (
            <button
              type="button"
              onClick={() => {
                setShowStickerBoard(true);
                setSideMenuOpen(false);
              }}
              className="w-full rounded-lg border border-dashed border-white/40 bg-surface-800/70 px-3 py-2 text-left font-semibold text-accent-lime transition hover:border-accent-lime/70"
            >
              Open Stickers
            </button>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Tools</p>
            <div className="mt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (ui2OnboardingEnabled) {
                    setShowOnboarding(true);
                  }
                  setSideMenuOpen(false);
                }}
                disabled={!ui2OnboardingEnabled}
                className="w-full rounded-lg border border-white/15 bg-surface-800/70 px-3 py-2 text-left font-semibold text-text-primary transition hover:border-accent-teal/60 disabled:opacity-50"
              >
                How to use
              </button>
              <button
                type="button"
                onClick={() => {
                  if (ui2CalibrationEnabled) {
                    setShowCalibration(true);
                  }
                  setSideMenuOpen(false);
                }}
                disabled={!ui2CalibrationEnabled}
                className="w-full rounded-lg border border-white/15 bg-surface-800/70 px-3 py-2 text-left font-semibold text-text-primary transition hover:border-accent-teal/60 disabled:opacity-50"
              >
                Calibration
              </button>
            </div>
          </div>
        </div>
      </aside>
      {goosePanelEnabled && <SubagentsPanel />}
    </>
  );
}

export default App;
