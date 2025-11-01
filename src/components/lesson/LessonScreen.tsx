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
  onPauseChange: (paused: boolean) => void;
  onNextClip: () => void;
  onHint: () => void;
}

export const LessonScreen = forwardRef<LessonScreenHandle, LessonScreenProps>(
  ({ kidMode, paused, voiceOn, gesturesOn, onPauseChange, onNextClip, onHint }, ref) => {
    const [clips, setClips] = useState<LessonClip[]>(() => SAMPLE_CLIPS);
    const [index, setIndex] = useState(0);
    const [feedback, setFeedback] = useState<'pass' | 'almost' | 'miss'>('pass');
    const [showHelp, setShowHelp] = useState(false);
    const playerRef = useRef<LessonPlayerHandle | null>(null);
    const registerResult = useLessonStore((s) => s.registerResult);
    const approveGuardRef = useRef<number>(0);
    const confettiTimerRef = useRef<number | null>(null);
    const [toast, setToast] = useState<{ message: string; duration?: number } | null>(
      null,
    );
    const [confetti, setConfetti] = useState(false);
    const advanceTimerRef = useRef<number | null>(null);

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
          if (!mounted || !packs.length) return;
          const items = await resolveItems(packs[0]);
          if (!mounted || !items.length) return;
          const lessonClips = lessonClipsFromPracticeItems(items);
          if (!lessonClips.length) return;
          setClips(lessonClips);
          setIndex(0);
        } catch (error) {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn('[LessonScreen] failed to load practice pack', error);
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
        if (advanceTimerRef.current) {
          window.clearTimeout(advanceTimerRef.current);
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
        registerResult('pass');
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
        if (!advanceTimerRef.current) {
          advanceTimerRef.current = window.setTimeout(() => {
            advanceTimerRef.current = null;
            goToNextClip();
          }, 1600);
        }
      },
      [currentClip, goToNextClip, onPauseChange, paused, registerResult],
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

    // (removed duplicate auto-advance listener)

    return (
      <section className="space-y-lg">
        <div className="grid gap-lg md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
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
            <aside className="rounded-lg border border-white/10 bg-surface-800/70 p-md text-text-primary shadow-brand ring-1 ring-white/5">
              <header className="mb-sm flex items-center justify-between">
                <h3 className="text-base font-semibold">Gesture camera</h3>
                <span className="text-xs uppercase tracking-wide text-accent-teal">On</span>
              </header>
              <p className="text-xs text-text-secondary">
                Keep within the frame and hold each gesture briefly for the best match.
              </p>
              <div className="mt-md overflow-hidden rounded-xl border border-white/10">
                <CameraFeed
                  enabled={gesturesOn}
                  expectedGesture={currentClip.expectedGesture ?? null}
                  onMatch={handleGestureMatch}
                />
              </div>
              <div className="mt-md">
                <VoiceGuide visible={voiceOn} />
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
                  NO: 'Open palm (or index + middle close to thumb).',
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
