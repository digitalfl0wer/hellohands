import { useEffect, useState } from 'react';

import { AppShell } from './components/AppShell';
import { selectManualMode, useLessonStore } from './state/useLessonStore';

function App(): JSX.Element {
  const [hydrated, setHydrated] = useState(false);
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
          <h1 className="text-3xl font-bold tracking-tight text-accent-lime">Hello Hands</h1>
          <span className="text-sm text-text-muted">Prototype shell wired to Zustand</span>
        </div>
      }
    >
      <section className="rounded-[var(--radius-lg)] border border-white/10 bg-surface-800/70 p-lg shadow-brand ring-1 ring-white/5">
        <p className="text-base text-text-secondary">
          Kid Mode and input toggles update the shared store, paving the way for the welcome
          screen. Tokens flow through Tailwind classes and CSS variables.
        </p>
        <dl className="mt-lg grid grid-cols-2 gap-md text-sm text-text-secondary">
          <div className="rounded-[var(--radius-md)] border border-white/10 bg-surface-700/40 p-md">
            <dt className="text-xs uppercase tracking-widest text-text-muted">Level</dt>
            <dd className="mt-2 text-2xl font-semibold text-accent-lime">{level}</dd>
          </div>
          <div className="rounded-[var(--radius-md)] border border-white/10 bg-surface-700/40 p-md">
            <dt className="text-xs uppercase tracking-widest text-text-muted">Stars</dt>
            <dd className="mt-2 text-2xl font-semibold text-accent-orange">
              {stars} / {maxStars}
            </dd>
          </div>
        </dl>
        <div className="mt-lg flex flex-wrap gap-sm">
          <button
            className="rounded-full border border-white/20 px-md py-2 text-sm font-semibold transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
            onClick={() => setKidMode(!kidMode)}
            type="button"
          >
            Kid Mode: {kidMode ? 'On' : 'Off'}
          </button>
          <button
            className="rounded-full border border-white/20 px-md py-2 text-sm font-semibold transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
            onClick={toggleVoice}
            type="button"
          >
            Voice: {voiceOn ? 'On' : 'Off'}
          </button>
          <button
            className="rounded-full border border-white/20 px-md py-2 text-sm font-semibold transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
            onClick={toggleGestures}
            type="button"
          >
            Gestures: {gesturesOn ? 'On' : 'Off'}
          </button>
        </div>
        <p className="mt-md text-sm text-text-muted">
          Manual mode is {manualMode ? 'enabled' : 'disabled'} (toggled via store for the
          upcoming welcome screen).
        </p>
      </section>
    </AppShell>
  );
}

export default App;
