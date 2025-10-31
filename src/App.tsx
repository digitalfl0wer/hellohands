import { useEffect, useMemo, useState } from 'react';

import { AppShell } from './components/AppShell';
import { LevelCard } from './components/LevelCard';
import { SettingsPill } from './components/SettingsPill';
import { AppButton } from './components/Button';
import { Toast } from './components/Toast';
import { DirectionsSheet } from './components/sheets/DirectionsSheet';
import { CountdownOverlay } from './components/sheets/CountdownOverlay';
import { HelpSheet } from './components/sheets/HelpSheet';
import { FeedbackBanner } from './components/feedback/FeedbackBanner';
import { AttributionChip } from './components/attribution/AttributionChip';
import { selectManualMode, useLessonStore } from './state/useLessonStore';

function App(): JSX.Element | null {
  const [hydrated, setHydrated] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showDirections, setShowDirections] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [feedbackVariant, setFeedbackVariant] = useState<'pass' | 'almost' | 'miss'>(
    'pass',
  );
  const kidMode = useLessonStore((state) => state.kidMode);
  const setKidMode = useLessonStore((state) => state.setKidMode);
  const voiceOn = useLessonStore((state) => state.voiceOn);
  const toggleVoice = useLessonStore((state) => state.toggleVoice);
  const gesturesOn = useLessonStore((state) => state.gesturesOn);
  const toggleGestures = useLessonStore((state) => state.toggleGestures);
  const level = useLessonStore((state) => state.level);
  const stars = useLessonStore((state) => state.stars);
  const maxStars = useLessonStore((state) => state.maxStars);
  const manualMode = useLessonStore(selectManualMode);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return null;
  }

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-accent-lime">
            Hello Hands
          </h1>
          <AppButton onClick={() => setKidMode(!kidMode)} type="button" variant="kid">
            Kid Mode: {kidMode ? 'On' : 'Off'}
          </AppButton>
        </div>
      }
      footer={<SettingsPill />}
    >
      <section className="grid gap-lg md:grid-cols-2">
        <LevelCard
          title={`Level ${level}`}
          description="Earn five stars to unlock the next pack."
          starsEarned={stars}
          totalStars={maxStars}
          locked={false}
          action={
            <AppButton onClick={() => setShowToast(true)} type="button" variant="adult">
              Start lesson
            </AppButton>
          }
        />
        <LevelCard
          title="Level 2"
          description="Keep practicing to unlock more signs."
          starsEarned={0}
          totalStars={5}
          locked
        />
      </section>
      <section className="rounded-lg border border-white/10 bg-surface-800/70 p-lg shadow-brand ring-1 ring-white/5">
        <h2 className="text-xl font-semibold text-text-primary">Input toggles</h2>
        <div className="mt-md flex flex-wrap gap-sm">
          <AppButton onClick={toggleVoice} type="button" variant="adult">
            Voice: {voiceOn ? 'On' : 'Off'}
          </AppButton>
          <AppButton onClick={toggleGestures} type="button" variant="adult">
            Gestures: {gesturesOn ? 'On' : 'Off'}
          </AppButton>
        </div>
        <p className="mt-md text-sm text-text-muted">
          Manual mode is {manualMode ? 'enabled' : 'disabled'} (toggled via these
          controls).
        </p>
      </section>
      {showDirections && (
        <DirectionsSheet
          beginLabel="Begin Lesson"
          directions={[
            'Make sure your hands are visible to the camera.',
            'Stay centered and avoid strong backlighting.',
            'Remember: you can pause with a ✋ gesture any time.',
          ]}
          onBegin={() => {
            setShowDirections(false);
            setShowCountdown(true);
          }}
        />
      )}
      {showCountdown && <CountdownOverlay onComplete={() => setShowCountdown(false)} />}
      <HelpSheet
        kidMode={kidMode}
        mediaAlt="Placeholder clip"
        mediaPoster="/signs/level1/hello/poster.jpg"
        onReplaySlow={() => setShowHelp(true)}
        onResume={() => setShowHelp(false)}
        tip="Lift your hand near your head, palm out, and give a friendly wave."
      />
      <FeedbackBanner
        kidMode={kidMode}
        onNext={() => setFeedbackVariant('pass')}
        onRetry={() => setFeedbackVariant('almost')}
        variant={feedbackVariant}
      />
      <AttributionChip
        licenseText="C-UDA License — MS-ASL dataset"
        link="https://ms-asl.cs.rochester.edu/"
        signer="MS-ASL Contributor"
        source="msasl_train.json"
      />
      {showToast && (
        <Toast
          duration={2500}
          message="Starter toast! We'll hook this into lesson events later."
          variant="info"
        />
      )}
    </AppShell>
  );
}

export default App;
