import { useEffect, useState } from 'react';

type UnlockStickerProps = {
  level: number;
  visible: boolean;
  onHide: () => void;
  durationMs?: number;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(mediaQuery.matches);
    handler();
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function UnlockSticker({
  level,
  visible,
  onHide,
  durationMs = 3600,
}: UnlockStickerProps) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!visible) return;
    const timeout = window.setTimeout(onHide, durationMs);
    return () => window.clearTimeout(timeout);
  }, [visible, onHide, durationMs]);

  if (!visible) {
    return null;
  }

  if (reducedMotion) {
    return (
      <div className="rounded-full border border-accent-lime/60 bg-accent-lime/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-lime shadow-sm">
        Level {level} unlocked
      </div>
    );
  }

  return (
    <div className="animate-bounce rounded-full border border-accent-lime/60 bg-accent-lime/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-lime shadow-lg">
      Level {level} unlocked 🎉
    </div>
  );
}

export default UnlockSticker;
