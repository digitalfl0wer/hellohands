import { useEffect, useState } from 'react';

type CountdownRocketProps = {
  onComplete: () => void;
  label?: string;
};

const sequence = ['3', '2', '1', 'Go!'];

export function CountdownRocket({ onComplete, label }: CountdownRocketProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= sequence.length) {
      const timer = window.setTimeout(() => {
        onComplete();
      }, 1000);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setIndex((prev) => prev + 1), 700);
    return () => window.clearTimeout(timer);
  }, [index, onComplete]);

  const value = sequence[Math.min(index, sequence.length - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/90">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        {label ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
            {label}
          </p>
        ) : null}
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-yellow-300 text-4xl shadow-2xl">
            🚀
          </div>
          <div className="flex flex-col items-start text-left text-xs text-text-secondary">
            <span>Get your hands ready in the frame.</span>
            <span>Countdown will start the match after Go!</span>
          </div>
        </div>
        <div className="mt-2 text-6xl font-extrabold tracking-tight text-accent-teal drop-shadow-xl">
          {value}
        </div>
      </div>
    </div>
  );
}
