import { selectManualMode, useLessonStore } from './state/useLessonStore';

function App(): JSX.Element {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="rounded-3xl bg-slate-900 px-10 py-12 shadow-xl ring-1 ring-white/10 max-w-lg">
        <h1 className="text-3xl font-bold tracking-tight text-lime-300">Hello Hands</h1>
        <p className="mt-4 text-base text-slate-300">
          Zustand store is live. Kid Mode and input toggles update the shared state so the
          eventual welcome screen has a single source of truth.
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-200">
          <div className="rounded-xl border border-white/10 p-4">
            <dt className="text-xs uppercase tracking-widest text-slate-400">Level</dt>
            <dd className="mt-2 text-2xl font-semibold text-lime-300">{level}</dd>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <dt className="text-xs uppercase tracking-widest text-slate-400">Stars</dt>
            <dd className="mt-2 text-2xl font-semibold text-orange-300">
              {stars} / {maxStars}
            </dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            onClick={() => setKidMode(!kidMode)}
            type="button"
          >
            Kid Mode: {kidMode ? 'On' : 'Off'}
          </button>
          <button
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            onClick={toggleVoice}
            type="button"
          >
            Voice: {voiceOn ? 'On' : 'Off'}
          </button>
          <button
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            onClick={toggleGestures}
            type="button"
          >
            Gestures: {gesturesOn ? 'On' : 'Off'}
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Manual mode is {manualMode ? 'enabled' : 'disabled'} (voice and gestures toggles
          control this).
        </p>
      </div>
    </div>
  );
}

export default App;
