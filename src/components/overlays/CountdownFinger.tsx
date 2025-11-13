import { useEffect, useState } from 'react';

type CountdownFingerProps = {
  onComplete: () => void;
  label?: string;
  durationMs?: number;
};

export function CountdownFinger({
  onComplete,
  label,
  durationMs = 1300,
}: CountdownFingerProps) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!active) return;
    const timer = window.setTimeout(() => {
      setActive(false);
      onComplete();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [active, durationMs, onComplete]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-surface-900/90 px-4 py-2 text-xs font-semibold text-text-primary shadow-xl ring-1 ring-white/10">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-700 text-lg">
          ☝️
        </span>
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
            {label ?? 'Next sign coming up'}
          </span>
          <span className="text-xs text-text-secondary">Finger countdown in progress</span>
        </div>
      </div>
    </div>
  );
}


