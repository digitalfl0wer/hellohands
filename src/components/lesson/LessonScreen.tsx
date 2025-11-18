import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { AppButton } from '../Button';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import { LessonPlayer, LessonPlayerHandle } from './LessonPlayer';
import { HelpSheet } from '../sheets/HelpSheet';
import { SAMPLE_CLIPS, LessonClip, lessonClipsFromPracticeItems } from './sampleClips';
import { setExpectedGesture } from '../../agents/planner';
import { useLessonStore } from '../../state/useLessonStore';
import { AttributionChip } from '../attribution/AttributionChip';
import { CameraFeed } from '../CameraFeed';
import { VoiceGuide } from '../VoiceGuide';
import { CountdownRocket } from '../overlays/CountdownRocket';
import { CountdownFinger } from '../overlays/CountdownFinger';
import { Toast } from '../Toast';
import { ConfettiOverlay } from '../ConfettiOverlay';
import {
  listPracticePacks,
  getPracticePack,
  type PracticeItem,
  type PracticePackSummary,
} from '../../services/practiceApi';
import type { ExpectedGesture } from '../../gestures/gestureEvaluator';
import { logger } from '../../utils/logger';
import { useProgressStore } from '../../state/progress';
import { NoCameraRecovery } from '../recovery/NoCameraRecovery';
import { NoHandFoundNotice } from '../recovery/NoHandFoundNotice';
import { DemoVideoFeed } from '../DemoVideoFeed';
import { Palma } from '../mascot/Palma';

function StarProgress({
  earned,
  total,
  kidMode = false,
}: {
  earned: number;
  total: number;
  kidMode?: boolean;
}) {
  if (kidMode) {
    // Kid mode: bigger, more colorful stars
    return (
      <div className="flex justify-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`text-2xl transition-colors duration-300 ${
              i < earned ? 'text-yellow-400 drop-shadow-lg' : 'text-surface-600'
            }`}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  }

  // Adult mode: standard stars
  return (
    <div className="flex justify-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`text-lg ${i < earned ? 'text-accent-lime' : 'text-surface-600'}`}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

export interface LessonScreenHandle {
  nextClip(): void;
  replayClip(): void;
  playSlow(): void;
  toggleHelp(open?: boolean): void;
  pause(): void;
  resume(): void;
}

interface LessonScreenProps {
  kidMode: boolean;
  paused: boolean;
  voiceOn: boolean;
  gesturesOn: boolean;
  gestureCameraEnabled?: boolean;
  onPauseChange: (paused: boolean) => void;
  onNextClip: () => void;
  onHint: () => void;
  onShowHowToUse?: () => void;
  onAcceptRequest?: (payload: {
    clipId: string;
    gesture: ExpectedGesture;
    score: number;
  }) => void;
  countdownLabel?: string;
  kidCountdownActive?: boolean;
  onKidCountdownComplete?: () => void;
  adultCountdownActive?: boolean;
  onAdultCountdownComplete?: () => void;
}

export const LessonScreen = forwardRef<LessonScreenHandle, LessonScreenProps>(
  (
    {
      kidMode,
      paused,
      voiceOn,
      gesturesOn,
      gestureCameraEnabled,
      onPauseChange,
      onNextClip,
      onHint,
      onShowHowToUse,
      onAcceptRequest,
      countdownLabel,
      kidCountdownActive,
      onKidCountdownComplete,
      adultCountdownActive,
      onAdultCountdownComplete,
    },
    ref,
  ) => {
    const [clips, setClips] = useState<LessonClip[]>(() => SAMPLE_CLIPS);
    const [index, setIndex] = useState(0);
    const [feedback, setFeedback] = useState<'pass' | 'almost' | 'miss'>('pass');
    const [showHelp, setShowHelp] = useState(false);
    const playerRef = useRef<LessonPlayerHandle | null>(null);
    const registerResult = useLessonStore((s) => s.registerResult);
    const currentLevel = useLessonStore((s) => s.level);
    const currentStars = useLessonStore((s) => s.stars);
    const maxStars = useLessonStore((s) => s.maxStars);
    const registerPassInProgress = useProgressStore((s) => s.registerPass);
    const recordSessionActivity = useProgressStore((s) => s.recordSessionActivity);
    const approveGuardRef = useRef<number>(0);
    const confettiTimerRef = useRef<number | null>(null);
    const [toast, setToast] = useState<{ message: string; duration?: number } | null>(
      null,
    );
    const [confetti, setConfetti] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [demoMode, setDemoMode] = useState(false);
    const [noHandFound, setNoHandFound] = useState(false);
    const [highGain, setHighGain] = useState(false);

    const currentClip = clips[index];

    useEffect(() => {
      let mounted = true;

      const resolveItems = async (
        pack: PracticePackSummary | null | undefined,
      ): Promise<PracticeItem[]> => {
        if (!pack) return [];
        if (pack.items?.length) return pack.items;
        const full = await getPracticePack(pack.id);
        return full?.items ?? [];
      };

      const load = async () => {
        try {
          const packs = await listPracticePacks();
          const level = useLessonStore.getState().level;
          if (!mounted || !packs.length) return;

          // Filter packs based on user level
          // Level 1: L1 packs only
          // Level 2: L1 + L2 packs
          // Level 3+: All packs
          const availablePacks = packs.filter((pack) => {
            const packLevel = pack.id.startsWith('L') ? parseInt(pack.id.charAt(1)) : 1;
            return packLevel <= level;
          });

          if (!availablePacks.length) return;

          // Combine items from all available packs for this level
          const allItems: PracticeItem[] = [];
          for (const pack of availablePacks) {
            const items = await resolveItems(pack);
            allItems.push(...items);
          }

          if (!mounted || !allItems.length) return;
          const lessonClips = lessonClipsFromPracticeItems(allItems);
          if (!lessonClips.length) return;
          setClips(lessonClips);
          setIndex(0);
        } catch (error) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn('[LessonScreen] failed to load practice packs', error);
          }
        }
      };

      void load();

      return () => {
        mounted = false;
      };
    }, []);

    // Update expected gesture for planner when the active clip changes
    useEffect(() => {
      setExpectedGesture(currentClip?.expectedGesture ?? null);
      return () => setExpectedGesture(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, clips]);

    useEffect(
      () => () => {
        if (confettiTimerRef.current) {
          window.clearTimeout(confettiTimerRef.current);
        }
      },
      [],
    );

    const goToNextClip = useCallback(() => {
      setIndex((prev) => (prev + 1) % clips.length);
      setFeedback('pass');
      onNextClip();
    }, [clips.length, onNextClip]);

    const handleGestureMatch = useCallback(
      ({ gesture, score }: { gesture: ExpectedGesture; score: number }) => {
        if (!currentClip) return;
        const now = Date.now();
        if (now - approveGuardRef.current < 1200) return;
        approveGuardRef.current = now;
        if (paused) {
          onPauseChange(false);
          playerRef.current?.resume();
        }
        setNoHandFound(false);
        registerResult('pass');
        registerPassInProgress(currentClip.id, score);
        recordSessionActivity();
        setFeedback('pass');
        setToast({ message: 'Great match!', duration: 1200 });
        setConfetti(true);
        if (confettiTimerRef.current) {
          window.clearTimeout(confettiTimerRef.current);
        }
        confettiTimerRef.current = window.setTimeout(() => setConfetti(false), 1200);
        logger.info('practice', 'correct_gesture', {
          clipId: currentClip.id,
          gesture,
          expected: currentClip.expectedGesture,
          score,
        });
        onAcceptRequest?.({
          clipId: currentClip.id,
          gesture,
          score,
        });
      },
      [currentClip, onAcceptRequest, onPauseChange, paused, registerResult],
    );

    const handleReplay = () => {
      setFeedback('pass');
    };

    const handleSlowMo = () => {
      setFeedback('almost');
      onHint();
    };

    useEffect(() => {
      if (paused) {
        playerRef.current?.pause();
      } else {
        playerRef.current?.resume();
      }
    }, [paused]);

    useImperativeHandle(ref, () => ({
      nextClip: () => {
        goToNextClip();
      },
      replayClip: () => {
        playerRef.current?.replay();
        handleReplay();
      },
      playSlow: () => {
        playerRef.current?.playSlow();
        handleSlowMo();
      },
      toggleHelp: (open) => {
        setShowHelp((prev) => (open === undefined ? !prev : open));
      },
      pause: () => {
        onPauseChange(true);
        playerRef.current?.pause();
      },
      resume: () => {
        onPauseChange(false);
        playerRef.current?.resume();
      },
    }));

    return (
      <section className="space-y-lg">
        {/* Star Progress Display */}
        <div className="flex justify-center">
          <div className="rounded-2xl border border-white/10 bg-surface-800/70 p-4 shadow-lg ring-1 ring-white/5">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                Level {currentLevel} Progress
              </h3>
              <StarProgress earned={currentStars} total={maxStars} kidMode={kidMode} />
              <p className="text-xs text-text-secondary mt-2">
                {currentStars} / {maxStars} stars
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-lg md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] items-start">
          <LessonPlayer
            kidMode={kidMode}
            onNext={goToNextClip}
            onReplay={handleReplay}
            onSlowMo={handleSlowMo}
            paused={paused}
            poster={currentClip.poster}
            ref={playerRef}
            title={currentClip.title}
            videoSrc={currentClip.video}
          />

          {gesturesOn ? (
            <aside className="relative flex min-h-[420px] flex-1 flex-col rounded-lg border border-white/10 bg-surface-800/70 p-md text-text-primary shadow-brand ring-1 ring-white/5">
              <header className="mb-sm flex items-center justify-between">
                <h3 className="text-base font-semibold">Gesture camera</h3>
                <span className="text-xs uppercase tracking-wide text-accent-teal">
                  {demoMode ? 'Demo' : 'On'}
                </span>
              </header>
              <p className="text-xs text-text-secondary">
                Keep within the frame and hold each gesture briefly for the best match.
              </p>
              <div className="mt-sm flex-1 overflow-hidden rounded-xl border border-white/10 bg-surface-900/90 relative">
                {demoMode ? (
                  <DemoVideoFeed />
                ) : cameraError ? (
                  <NoCameraRecovery
                    message={cameraError}
                    onRetry={() => {
                      setCameraError(null);
                      setDemoMode(false);
                    }}
                    onUseDemo={() => {
                      setDemoMode(true);
                    }}
                  />
                ) : (
                  <>
                    <CameraFeed
                      enabled={gestureCameraEnabled ?? gesturesOn}
                      kidMode={kidMode}
                      highGain={highGain}
                      expectedGesture={currentClip.expectedGesture ?? null}
                      onMatch={handleGestureMatch}
                      onCameraError={(msg) => {
                        setCameraError(msg);
                        setDemoMode(false);
                      }}
                      onNoHandTimeout={() => {
                        setNoHandFound(true);
                      }}
                      suppressHud={
                        (kidMode && kidCountdownActive) ||
                        (!kidMode && adultCountdownActive)
                      }
                    />
                    {kidMode && kidCountdownActive && onKidCountdownComplete ? (
                      <CountdownRocket
                        overlayMode="camera"
                        label={countdownLabel}
                        onComplete={onKidCountdownComplete}
                      />
                    ) : null}
                    {!kidMode && adultCountdownActive && onAdultCountdownComplete ? (
                      <CountdownFinger
                        overlayMode="camera"
                        label={countdownLabel}
                        durationMs={4500}
                        onComplete={onAdultCountdownComplete}
                      />
                    ) : null}
                  </>
                )}
              </div>
              {!demoMode && noHandFound && !cameraError && (
                <NoHandFoundNotice
                  highGainEnabled={highGain}
                  onRetry={() => setNoHandFound(false)}
                  onToggleHighGain={() => setHighGain((v) => !v)}
                />
              )}
              <div className="mt-sm">
                <VoiceGuide visible={voiceOn} />
              </div>
              <div className="pointer-events-none absolute -bottom-4 -right-2 hidden h-16 w-16 md:block">
                <Palma
                  state={
                    cameraError
                      ? 'oops'
                      : confetti
                        ? 'success'
                        : noHandFound
                          ? 'encouraging'
                          : 'idle'
                  }
                />
              </div>
            </aside>
          ) : (
            <div />
          )}

          <div className="md:col-span-2">
            <p className="text-sm text-text-secondary">
              {(() => {
                const TIPS: Record<string, string> = {
                  HELLO: 'Open palm near temple; small outward wave.',
                  'THANK YOU': 'Open palm from chin outward.',
                  YES: 'Thumbs-up; hold steady.',
                  NO: 'Pinch index + middle to thumb; hold briefly.',
                  WHERE: 'Point with index; keep other fingers curled.',
                  EAT: 'Pinch fingertips together near mouth.',
                  DRINK: 'Pinch like holding a cup; slight tilt.',
                  MORE: 'Pinch both hands; bring fingertips together.',
                };
                return (
                  TIPS[currentClip.title.toUpperCase()] ??
                  'Mirror the poster and hold your gesture steady for a moment.'
                );
              })()}
            </p>
          </div>
        </div>

        {paused ? (
          <div className="rounded-lg border border-white/10 bg-surface-800/80 p-lg shadow-brand ring-1 ring-white/5">
            <h3 className="text-lg font-semibold text-text-primary">Paused</h3>
            <p className="mt-sm text-sm text-text-secondary">
              Hold a thumbs-up (or tap resume) to continue. Manual controls remain
              available.
            </p>
            <AppButton
              onClick={() => {
                onPauseChange(false);
                playerRef.current?.resume();
              }}
              type="button"
              variant="kid"
            >
              Resume
            </AppButton>
          </div>
        ) : showHelp ? (
          <HelpSheet
            kidMode={kidMode}
            mediaAlt={`Help clip for ${currentClip.title}`}
            mediaPoster={currentClip.poster}
            onHowToUse={onShowHowToUse}
            onReplaySlow={onHint}
            onResume={() => setShowHelp(false)}
            tip="Lift your hand near your head, palm out, and give a friendly wave."
          />
        ) : (
          <AppButton onClick={() => setShowHelp(true)} type="button" variant="adult">
            Need help?
          </AppButton>
        )}

        <FeedbackBanner
          kidMode={kidMode}
          onNext={() => {
            setFeedback('pass');
            goToNextClip();
          }}
          onRetry={() => {
            setFeedback('almost');
            onHint();
            playerRef.current?.playSlow();
          }}
          variant={feedback}
        />

        <AttributionChip attribution={currentClip.attribution} />
        {confetti ? (
          <ConfettiOverlay message="Great match!" onEnd={() => setConfetti(false)} />
        ) : null}
        {toast ? (
          <Toast
            duration={toast.duration ?? 1200}
            message={toast.message}
            variant="success"
          />
        ) : null}
      </section>
    );
  },
);

LessonScreen.displayName = 'LessonScreen';
