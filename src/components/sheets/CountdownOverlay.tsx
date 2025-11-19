import { useEffect, useState } from 'react';

type CountdownOverlayProps = {
  onComplete: () => void;
  label?: string;
};

const sequence = ['3', '2', '1', 'Go!'];

export function CountdownOverlay({ onComplete, label }: CountdownOverlayProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= sequence.length) {
      onComplete();
      return;
    }
    const timer = window.setTimeout(() => setIndex((prev) => prev + 1), 700);
    return () => window.clearTimeout(timer);
  }, [index, onComplete]);

  if (index >= sequence.length) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/90">
      <div className="text-center">
        {label ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/80">
            {label}
          </p>
        ) : null}
        <div className="animate-pulse text-6xl font-bold text-accent-lime drop-shadow-xl">
          {sequence[index]}
        </div>
      </div>
    </div>
  );
}
