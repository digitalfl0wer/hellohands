import { useEffect, useState } from 'react';

type CountdownOverlayProps = {
  onComplete: () => void;
};

const sequence = ['3', '2', '1', 'Go!'];

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
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
      <div className="text-6xl font-bold text-accent-lime drop-shadow-xl animate-pulse">
        {sequence[index]}
      </div>
    </div>
  );
}
