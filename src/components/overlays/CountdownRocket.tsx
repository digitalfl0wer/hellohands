import { useEffect, useState } from 'react';

type CountdownRocketProps = {
  onComplete: () => void;
  label?: string;
  overlayMode?: 'full' | 'camera';
};

const sequence = ['3', '2', '1', 'Go!'];

export function CountdownRocket({
  onComplete,
  label,
  overlayMode = 'full',
}: CountdownRocketProps) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (index >= sequence.length) {
      const fadeDuration = overlayMode === 'camera' ? 400 : 800;
      setFading(true);
      const timer = window.setTimeout(() => {
        onComplete();
      }, fadeDuration);
      return () => window.clearTimeout(timer);
    }
    const interval = overlayMode === 'camera' ? 1100 : 1200;
    const timer = window.setTimeout(() => setIndex((prev) => prev + 1), interval);
    return () => window.clearTimeout(timer);
  }, [index, onComplete, overlayMode]);

  const value = sequence[Math.min(index, sequence.length - 1)];
  const isCamera = overlayMode === 'camera';
  const wrapperClass = isCamera
    ? 'absolute inset-0 z-20 flex items-center justify-center bg-black/95'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-surface-900/90';

  return (
    <div className={wrapperClass}>
      <div
        className={`flex ${isCamera ? 'flex-col' : 'max-w-md flex-col'} items-center gap-4 text-center`}
      >
        {label ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
            {label}
          </p>
        ) : null}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-pink-500 to-yellow-300 ${
              isCamera ? 'text-5xl' : 'text-4xl shadow-2xl'
            }`}
          >
            🚀
          </div>
          <div className="flex flex-col items-start text-left text-xs uppercase tracking-[0.2em] text-white/80">
            <span>Get your hands ready in the frame.</span>
            <span>Countdown will start the match after Go!</span>
          </div>
        </div>
        <div
          className={`mt-2 text-6xl font-extrabold tracking-tight text-accent-teal drop-shadow-xl transition-opacity duration-300 ${
            fading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
