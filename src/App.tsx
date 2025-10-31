import { useEffect, useState } from 'react';

import { AppShell } from './components/AppShell';
import { SettingsPill } from './components/SettingsPill';
import { AppButton } from './components/Button';
import { Toast } from './components/Toast';
import { LessonScreen } from './components/lesson/LessonScreen';
import { DirectionsSheet } from './components/sheets/DirectionsSheet';
import { CountdownOverlay } from './components/sheets/CountdownOverlay';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { selectManualMode, useLessonStore } from './state/useLessonStore';

function App(): JSX.Element | null {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<'welcome' | 'directions' | 'lesson'>('welcome');
  const [toast, setToast] = useState<{
    message: string;
    variant?: 'info' | 'success' | 'warn';
    duration?: number;
  } | null>(null);
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
    triggerToast(
      `Keep practicing to unlock Level ${lockedLevel} (earn 5 stars).`,
      'warn',
    );
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
    <LessonScreen
      kidMode={kidMode}
      onHint={() => triggerToast('Slow-mo replay coming soon.', 'info')}
      onNextClip={() => triggerToast('Next sign queued.', 'success')}
    />
  );

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
      {view === 'welcome' && welcomeView}
      {view === 'directions' && directionsView}
      {view === 'lesson' && lessonView}

      {showCountdown && <CountdownOverlay onComplete={handleCountdownComplete} />}
      {toast && (
        <Toast
          duration={toast.duration ?? 2500}
          message={toast.message}
          variant={toast.variant ?? 'info'}
        />
      )}
    </AppShell>
  );
}

export default App;
