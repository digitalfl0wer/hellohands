import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';

import { AppButton } from '../Button';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import { LessonPlayer, LessonPlayerHandle } from './LessonPlayer';
import { HelpSheet } from '../sheets/HelpSheet';
import { SAMPLE_CLIPS, LessonClip } from './sampleClips';
import { setExpectedGesture } from '../../agents/planner';
import { AttributionChip } from '../attribution/AttributionChip';
import { CameraFeed } from '../CameraFeed';
import { VoiceGuide } from '../VoiceGuide';
import { bus, type HHEvent } from '../../gestures/gestureBus';

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
    const clips = useMemo<LessonClip[]>(() => SAMPLE_CLIPS, []);
    const [index, setIndex] = useState(0);
    const [feedback, setFeedback] = useState<'pass' | 'almost' | 'miss'>('pass');
    const [showHelp, setShowHelp] = useState(false);
    const playerRef = useRef<LessonPlayerHandle | null>(null);

    const currentClip = clips[index];

    // Update expected gesture for planner when the active clip changes
    useEffect(() => {
      setExpectedGesture(currentClip?.expectedGesture ?? null);
      return () => setExpectedGesture(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, clips]);

    const goToNextClip = () => {
      setIndex((prev) => (prev + 1) % clips.length);
      setFeedback('pass');
      onNextClip();
    };

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

    // Auto-advance when planner marks a correct gesture
    useEffect(() => {
      const handlePlanner = ({ data }: MessageEvent<HHEvent>) => {
        if (!data || data.intent !== 'planner' || data.action !== 'PRACTICE_CORRECT') {
          return;
        }
        goToNextClip();
      };
      bus.addEventListener('message', handlePlanner);
      return () => {
        bus.removeEventListener('message', handlePlanner);
      };
    }, [clips]);

    return (
      <section className="space-y-lg">
        <div className="grid gap-lg md:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
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

          <div className="grid gap-md">
            {gesturesOn ? (
              <aside className="rounded-lg border border-white/10 bg-surface-800/70 p-md text-text-primary shadow-brand ring-1 ring-white/5">
                <header className="mb-sm flex items-center justify-between">
                  <h3 className="text-base font-semibold">Gesture camera</h3>
                  <span className="text-xs uppercase tracking-wide text-accent-teal">
                    On
                  </span>
                </header>
                <p className="text-xs text-text-secondary">
                  Keep within the frame and hold each gesture briefly for the best match.
                </p>
                <div className="mt-md overflow-hidden rounded-xl border border-white/10">
                  <CameraFeed />
                </div>
              </aside>
            ) : null}

            <VoiceGuide visible={voiceOn} />
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
      </section>
    );
  },
);

LessonScreen.displayName = 'LessonScreen';
