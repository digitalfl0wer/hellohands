import { useEffect, useState } from 'react';
import CameraFeed from '../components/CameraFeed';
import { setExpectedGesture } from '../agents/planner';

const SIGN_TO_GESTURE: Record<string, 'thumbs_up' | 'open_palm' | 'point' | 'pinch'> = {
  YES: 'thumbs_up',
  NO: 'open_palm',
  WHERE: 'point',
  EAT: 'pinch',
};

const SIGNS = Object.keys(SIGN_TO_GESTURE);

export function PracticePage() {
  const [selectedSign, setSelectedSign] = useState(SIGNS[0]);

  useEffect(() => {
    setExpectedGesture(SIGN_TO_GESTURE[selectedSign] ?? null);
    return () => {
      setExpectedGesture(null);
    };
  }, [selectedSign]);

  return (
    <div className="grid gap-6 p-4 md:grid-cols-2">
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Practice</h2>
        <p className="text-sm text-text-secondary">
          Mirror your gesture to the example. Hold it steady for a moment so the worker
          can recognize it.
        </p>
        <div className="mt-4">
          <CameraFeed />
        </div>
      </section>
      <section>
        <h3 className="text-lg font-semibold text-text-primary">Select a sign</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {SIGNS.map((sign) => (
            <button
              key={sign}
              type="button"
              onClick={() => setSelectedSign(sign)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                selectedSign === sign
                  ? 'border-accent-teal bg-accent-teal/20 text-accent-teal'
                  : 'border-white/15 text-text-secondary hover:border-white/30 hover:text-text-primary'
              }`}
            >
              {sign}
            </button>
          ))}
        </div>
        <dl className="mt-6 space-y-2 text-sm text-text-secondary">
          <div>
            <dt className="font-semibold text-text-primary">Expected gesture</dt>
            <dd className="uppercase tracking-wide">
              {SIGN_TO_GESTURE[selectedSign].replace('_', ' ')}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text-primary">Tip</dt>
            <dd>Move slowly at first; quick movements can reduce confidence scores.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export default PracticePage;
