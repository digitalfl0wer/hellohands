import { useEffect, useRef, useState } from 'react';

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
  const [lessonPaused, setLessonPaused] = useState(false);
  const gestureCueTimer = useRef<number | null>(null);
  const [gestureCue, setGestureCue] = useState<string | null>(null);
  const lessonRef = useRef<LessonScreenHandle | null>(null);
  const voiceHintShown = useRef(false);

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

  const handleVoiceCommand = (command: VoiceParseResult) => {
    switch (command.type) {
      case 'control':
        switch (command.action) {
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
        }
        break;
      case 'kidMode':
        if (command.enabled !== kidMode) {
          setKidMode(command.enabled);
          triggerToast(`Kid Mode ${command.enabled ? 'enabled' : 'disabled'}.`, 'success');
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
    }
  }, [voiceOn]);
  useVoiceInput({
    enabled: view === 'lesson' && voiceOn && !showCountdown,
    paused: lessonPaused,
    onCommand: (result) => handleVoiceCommand(result),
    onUnrecognized: () => triggerToast("Try 'Next' or 'Replay'.", 'info'),
    onError: (reason) => {
      if (voiceOn) {
        toggleVoice();
      }
      triggerToast(reason ?? 'Voice input unavailable right now.', 'warn');
    },
  });

  useGestureInput({
    enabled: view === 'lesson',
    paused: lessonPaused,
    suspended: showCountdown,
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
      gesturesOn={gesturesOn}
      kidMode={kidMode}
      manualMode={manualMode}
      onHint={() => triggerToast('Slow-mo replay coming soon.', 'info')}
      onNextClip={() => triggerToast('Next sign queued.', 'success')}
      onPauseChange={setLessonPaused}
      onToggleGestures={toggleGestures}
      onToggleVoice={toggleVoice}
      paused={lessonPaused}
      ref={lessonRef}
      voiceOn={voiceOn}
    />
  );

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-accent-lime">
            Hello Hands
          </h1>
          <div className="flex items-center gap-sm">
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
      footer={<SettingsPill />}
    >
      {view === 'welcome' && welcomeView}
      {view === 'directions' && directionsView}
      {view === 'lesson' && lessonView}

      {showCountdown && <CountdownOverlay onComplete={handleCountdownComplete} />}
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
    </AppShell>
  );
}

export default App;
