import { useEffect, useState } from 'react';

type CountdownFingerProps = {
  onComplete: () => void;
  label?: string;
  overlayMode?: 'full' | 'camera';
  durationMs?: number;
};

const sequence = ['3', '2', '1', 'Go!'];

export function CountdownFinger({
  onComplete,
  label,
  overlayMode = 'full',
  durationMs = 4500,
}: CountdownFingerProps) {
  const [active, setActive] = useState(true);
  const [index, setIndex] = useState(0);
  const isCameraMode = overlayMode === 'camera';

  useEffect(() => {
    if (!active) return;

    if (isCameraMode) {
      // Camera mode: show 3..2..1..Go with counting
      if (index >= sequence.length) {
        const timer = window.setTimeout(() => {
          setActive(false);
          onComplete();
        }, 1000); // 1 second grace period after "Go!"
        return () => window.clearTimeout(timer);
      }
      const timer = window.setTimeout(() => setIndex((prev) => prev + 1), 1100);
      return () => window.clearTimeout(timer);
    } else {
      // Full mode: just fade out after duration
      const timer = window.setTimeout(() => {
        setActive(false);
        onComplete();
      }, durationMs);
      return () => window.clearTimeout(timer);
    }
  }, [active, index, durationMs, onComplete, isCameraMode]);

  if (!active) return null;

  const isCamera = overlayMode === 'camera';
  const wrapperClass = isCamera
    ? 'absolute inset-0 z-50 flex items-center justify-center bg-black/95 rounded-xl'
    : 'pointer-events-none fixed inset-x-0 bottom-8 z-40 flex justify-center';

  const value = isCameraMode ? sequence[Math.min(index, sequence.length - 1)] : undefined;
  const showCounter = isCameraMode && index < sequence.length;

  return (
    <div
      className={`${wrapperClass} transition-opacity duration-500 ${
        !isCamera && !active ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`pointer-events-auto flex items-center gap-3 text-white transition-opacity duration-300 ${
          !isCamera ? 'opacity-0' : 'opacity-100'
        } ${isCamera ? 'flex-col space-y-4 text-center' : 'rounded-full bg-surface-900/90 px-4 py-2 text-xs font-semibold shadow-xl ring-1 ring-white/10'}`}
      >
        <span
          className={`flex items-center justify-center rounded-full ${
            isCamera ? 'text-7xl' : 'h-8 w-8 bg-surface-700 text-lg'
          }`}
        >
          ☝️
        </span>
        {isCamera ? (
          <div className="flex flex-col gap-4">
            <p className="text-2xl font-bold tracking-tight">{label ?? 'Get ready'}</p>
            {showCounter && (
              <div className="text-6xl font-extrabold tracking-tight text-white drop-shadow-xl">
                {value}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="text-xs uppercase tracking-[0.18em] text-white/80">
              <span>{label ?? 'Finger countdown'}</span>
              <span className="text-[10px] text-white/60 block">
                Countdown in progress
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
