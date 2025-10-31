import { useEffect, useMemo, useState } from 'react';

type ConfettiOverlayProps = {
  message?: string;
  durationMs?: number;
  onEnd?: () => void;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = () => setReduced(mq.matches);
    listener();
    mq.addEventListener?.('change', listener);
    return () => mq.removeEventListener?.('change', listener);
  }, []);
  return reduced;
}

export function ConfettiOverlay({
  message = 'Level up!',
  durationMs = 1600,
  onEnd,
}: ConfettiOverlayProps) {
  const [visible, setVisible] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      onEnd?.();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onEnd]);

  const particles = useMemo(() => {
    return new Array(36).fill(0).map((_, idx) => {
      const left = Math.random() * 100; // percent
      const delay = Math.random() * 200; // ms
      const size = 6 + Math.random() * 6; // px
      const hue = Math.floor(Math.random() * 360);
      return { id: idx, left, delay, size, hue };
    });
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      {reducedMotion ? (
        <div className="rounded-full border border-white/15 bg-accent-teal/30 px-4 py-2 text-sm font-semibold text-text-primary shadow-lg ring-1 ring-white/10">
          {message}
        </div>
      ) : (
        <>
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute block rounded-sm"
                style={{
                  left: `${p.left}%`,
                  top: '-10px',
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: `hsl(${p.hue} 80% 60%)`,
                  transform: 'translateY(0)',
                  animation: `hh-confetti-fall ${durationMs}ms ease-in forwards`,
                  animationDelay: `${p.delay}ms`,
                }}
              />
            ))}
          </div>
          <style>
            {`
@keyframes hh-confetti-fall {
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
}
            `}
          </style>
          <div className="rounded-full border border-white/15 bg-surface-800/80 px-4 py-2 text-sm font-semibold text-text-primary shadow-lg ring-1 ring-white/10">
            {message}
          </div>
        </>
      )}
    </div>
  );
}

export default ConfettiOverlay;


