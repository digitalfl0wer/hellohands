import { useMemo, useState } from 'react';

import { LessonPlayer } from './LessonPlayer';
import { SAMPLE_CLIPS, LessonClip } from './sampleClips';
import { FeedbackBanner } from '../feedback/FeedbackBanner';
import { AppButton } from '../Button';
import { HelpSheet } from '../sheets/HelpSheet';

interface LessonScreenProps {
  kidMode: boolean;
  onNextClip: () => void;
  onHint: () => void;
}

export function LessonScreen({ kidMode, onNextClip, onHint }: LessonScreenProps) {
  const clips = useMemo<LessonClip[]>(() => SAMPLE_CLIPS, []);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<'pass' | 'almost' | 'miss'>('pass');
  const [showHelp, setShowHelp] = useState(false);

  const currentClip = clips[index];

  const goToNextClip = () => {
    const nextIndex = (index + 1) % clips.length;
    setIndex(nextIndex);
    onNextClip();
  };

  return (
    <section className="space-y-lg">
      <LessonPlayer
        kidMode={kidMode}
        onNext={goToNextClip}
        onReplay={() => setFeedback('pass')}
        onSlowMo={() => setFeedback('almost')}
        poster={currentClip.poster}
        title={currentClip.title}
        videoSrc={currentClip.video}
      />

      {showHelp ? (
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
        }}
        variant={feedback}
      />
    </section>
  );
}
