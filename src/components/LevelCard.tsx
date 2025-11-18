import { useLessonStore } from '../state/useLessonStore';

interface LevelCardProps {
  level: number;
  onClick: () => void;
  className?: string;
  mode?: 'full' | 'corner';
  selected?: boolean;
}

function StarProgress({ earned, total }: { earned: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`text-lg ${i < earned ? 'text-accent-lime' : 'text-surface-600'}`}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}

export function LevelCard({
  level,
  onClick,
  className = '',
  mode = 'full',
  selected = false,
}: LevelCardProps) {
  const currentLevel = useLessonStore((state) => state.level);
  const stars = useLessonStore((state) => state.stars);
  const maxStars = useLessonStore((state) => state.maxStars);

  const isCurrentLevel = level === currentLevel;
  const isCompleted = level < currentLevel;
  const isLocked = level > currentLevel;

  const starsEarned = isCurrentLevel ? stars : isCompleted ? maxStars : 0;

  const handleClick = () => {
    if (!isLocked && mode === 'full') {
      onClick();
    }
  };

  // For carousel mode, always render full cards
  // The carousel handles scaling and positioning

  return (
    <div
      className={`relative w-full rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 ${
        selected
          ? 'bg-surface-800 border-accent-teal shadow-lg shadow-accent-teal/20'
          : isLocked
            ? 'bg-surface-800/80 border-surface-600 cursor-not-allowed opacity-60'
            : isCurrentLevel
              ? 'bg-surface-800/90 border-accent-teal shadow-lg shadow-accent-teal/20 hover:shadow-accent-teal/30'
              : 'bg-surface-800/85 border-surface-700 hover:border-accent-teal/60'
      } ${className}`}
      onClick={handleClick}
    >
      {/* Lock overlay for locked levels */}
      {isLocked && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl mb-2 block">🔒</span>
            <p className="text-xs text-white/80">Complete Level {level - 1} to unlock</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-2xl font-bold text-text-primary mb-2">Level {level}</h3>

        <div className="mb-4">
          <StarProgress earned={starsEarned} total={maxStars} />
          <p className="text-xs text-text-secondary mt-2">
            {isCurrentLevel
              ? `${starsEarned}/${maxStars} stars`
              : isCompleted
                ? 'Completed'
                : 'Locked'}
          </p>
        </div>

        {isCurrentLevel && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-teal/20 border border-accent-teal/40">
            <span className="text-sm text-accent-teal font-semibold">Current</span>
          </div>
        )}
      </div>
    </div>
  );
}
