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
import { AttributionChip } from '../attribution/AttributionChip';

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
  manualMode: boolean;
  onPauseChange: (paused: boolean) => void;
  onNextClip: () => void;
  onHint: () => void;
  onToggleVoice: () => void;
  onToggleGestures: () => void;
}

export const LessonScreen = forwardRef<LessonScreenHandle, LessonScreenProps>(
  (
    {
      kidMode,
      paused,
      voiceOn,
      gesturesOn,
      manualMode,
      onPauseChange,
      onNextClip,
      onHint,
      onToggleVoice,
      onToggleGestures,
    },
    ref,
  ) => {
    const clips = useMemo<LessonClip[]>(() => SAMPLE_CLIPS, []);
    const [index, setIndex] = useState(0);
    const [feedback, setFeedback] = useState<'pass' | 'almost' | 'miss'>('pass');
    const [showHelp, setShowHelp] = useState(false);
    const playerRef = useRef<LessonPlayerHandle | null>(null);

    const currentClip = clips[index];

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

    return (
      <section className="space-y-lg">
        <section className="rounded-lg border border-white/10 bg-surface-800/70 p-lg shadow-brand ring-1 ring-white/5">
          <h2 className="text-xl font-semibold text-text-primary">Input toggles</h2>
          <div className="mt-md flex flex-wrap gap-sm">
            <AppButton onClick={onToggleVoice} type="button" variant="adult">
              Voice: {voiceOn ? 'On' : 'Off'}
            </AppButton>
            <AppButton onClick={onToggleGestures} type="button" variant="adult">
              Gestures: {gesturesOn ? 'On' : 'Off'}
            </AppButton>
          </div>
          <p className="mt-md text-sm text-text-muted">
            Manual mode is {manualMode ? 'enabled' : 'disabled'} (toggled via these
            controls).
          </p>
          <p className="text-xs text-text-muted">
            Low-light hint: Swipe down to reopen help if the camera struggles.
          </p>
        </section>

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

        <AttributionChip
          licenseText="C-UDA License — MS-ASL dataset"
          link="https://ms-asl.cs.rochester.edu/"
          signer="MS-ASL Contributor"
          source="msasl_train.json"
        />
      </section>
    );
  },
);

LessonScreen.displayName = 'LessonScreen';
