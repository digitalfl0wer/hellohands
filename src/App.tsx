import { useEffect, useState } from 'react';

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
import { WelcomeScreen } from './screens/WelcomeScreen';
import { selectManualMode, useLessonStore } from './state/useLessonStore';

function App(): JSX.Element | null {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<'welcome' | 'directions' | 'lesson'>('welcome');
  const [toast, setToast] = useState<
    { message: string; variant?: 'info' | 'success' | 'warn'; duration?: number } | null
  >(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [feedbackVariant, setFeedbackVariant] = useState<'pass' | 'almost' | 'miss'>('pass');

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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), toast.duration ?? 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (!hydrated) {
    return null;
  }

  const triggerToast = (
    message: string,
    variant: 'info' | 'success' | 'warn' = 'info',
    duration?: number,
  ) => {
    setToast({ message, variant, duration });
  };

  const handleLockedLevel = (lockedLevel: number) => {
    triggerToast(`Keep practicing to unlock Level ${lockedLevel} (earn 5 stars).`, 'warn');
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    triggerToast('Lesson starting — good luck!', 'success');
  };

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
        setShowCountdown(true);
        setView('lesson');
        triggerToast('Get ready! Lesson starting…', 'info');
      }}
    />
  );

  const lessonView = (
    <section className="space-y-lg">
      <div className="grid gap-lg md:grid-cols-2">
        <LevelCard
          title={`Level ${level}`}
          description="Earn five stars to unlock the next pack."
          starsEarned={stars}
          totalStars={maxStars}
          locked={false}
          action={
            <AppButton onClick={() => triggerToast('Lesson restarted.', 'info')} type="button" variant="adult">
              Restart lesson
            </AppButton>
          }
        />
        <LevelCard
          title="Level 2"
          description="Keep practicing to unlock more signs."
          starsEarned={level >= 2 ? 5 : 0}
          totalStars={5}
          locked={level < 2}
          action={
            level < 2 ? (
              <AppButton onClick={() => handleLockedLevel(2)} type="button" variant="adult">
                Locked
              </AppButton>
            ) : (
              <AppButton
                onClick={() => triggerToast('Loading Level 2 — stay tuned!', 'info')}
                type="button"
                variant="adult"
              >
                Continue
              </AppButton>
            )
          }
        />
      </div>

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
          Manual mode is {manualMode ? 'enabled' : 'disabled'} (toggled via these controls).
        </p>
      </section>

      {showHelp ? (
        <HelpSheet
          kidMode={kidMode}
          mediaAlt="Placeholder clip"
          mediaPoster="/signs/level1/hello/poster.jpg"
          onReplaySlow={() => triggerToast('Slow-mo replay coming soon.', 'info')}
          onResume={() => {
            setShowHelp(false);
            triggerToast('Welcome back!', 'success');
          }}
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
          setFeedbackVariant('pass');
          triggerToast('Next sign queued.', 'success');
        }}
        onRetry={() => {
          setFeedbackVariant('almost');
          triggerToast('Replaying sign…', 'info');
        }}
        variant={feedbackVariant}
      />

      <AttributionChip
        licenseText="C-UDA License — MS-ASL dataset"
        link="https://ms-asl.cs.rochester.edu/"
        signer="MS-ASL Contributor"
        source="msasl_train.json"
      />
    </section>
  );

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-accent-lime">Hello Hands</h1>
          <AppButton onClick={() => setKidMode(!kidMode)} type="button" variant="kid">
            Kid Mode: {kidMode ? 'On' : 'Off'}
          </AppButton>
        </div>
      }
      footer={<SettingsPill />}
    >
      {view === 'welcome' && welcomeView}
      {view === 'directions' && directionsView}
      {view === 'lesson' && lessonView}

      {showCountdown && <CountdownOverlay onComplete={handleCountdownComplete} />}
      {toast && (
        <Toast duration={toast.duration ?? 2500} message={toast.message} variant={toast.variant ?? 'info'} />
      )}
    </AppShell>
  );
}

export default App;
