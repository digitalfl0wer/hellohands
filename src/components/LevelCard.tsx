import type { ReactNode } from 'react';

interface LevelCardProps {
  title: string;
  description: string;
  starsEarned: number;
  totalStars: number;
  locked?: boolean;
  action?: ReactNode;
}

export function LevelCard({
  title,
  description,
  starsEarned,
  totalStars,
  locked = false,
  action,
}: LevelCardProps) {
  const starFill = Math.round((starsEarned / totalStars) * 100);
  return (
    <article
      aria-live="polite"
      className="flex flex-col gap-md rounded-lg border border-white/10 bg-surface-800/70 p-lg shadow-brand ring-1 ring-white/5"
      data-locked={locked ? 'true' : 'false'}
    >
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
        {locked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-primary">
            Locked
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-teal/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-lime">
            Unlocked
          </span>
        )}
      </header>
      <div className="flex items-center gap-sm">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 bg-accent-orange transition-all"
            style={{ width: `${Math.min(100, Math.max(0, starFill))}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-text-secondary">
          {starsEarned} / {totalStars}
        </span>
      </div>
      <footer className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {locked
            ? 'Earn five stars in the current level to unlock.'
            : "You're on fire! Keep the streak going."}
        </p>
        {action}
      </footer>
    </article>
  );
}
