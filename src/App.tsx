function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="rounded-3xl bg-slate-900 px-10 py-12 shadow-xl ring-1 ring-white/10">
        <h1 className="text-3xl font-bold tracking-tight text-lime-300">
          Hello Hands
        </h1>
        <p className="mt-4 max-w-sm text-base text-slate-300">
          Tailwind is wired up. Swap in the real Level 1 welcome screen here.
        </p>
        <div className="mt-6 inline-flex gap-3">
          <button className="rounded-full bg-lime-400 px-6 py-2 text-slate-900 font-semibold shadow-sm transition hover:bg-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200">
            Start Lesson
          </button>
          <button className="rounded-full border border-white/30 px-6 py-2 text-slate-200 transition hover:border-white hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60">
            Preview Levels
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
