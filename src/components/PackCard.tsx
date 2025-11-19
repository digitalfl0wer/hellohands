interface PackCardProps {
  packId: string;
  level?: string;
  title: string;
  wordCount: number;
  completedCount: number;
  category?: string;
  onClick: () => void;
  className?: string;
  mode?: 'full' | 'corner';
  selected?: boolean;
  unlocked?: boolean;
  kidMode?: boolean;
}

export function PackCard({
  packId,
  level,
  title,
  wordCount,
  completedCount,
  category,
  onClick,
  className = '',
  mode = 'full',
  selected = false,
  unlocked = true,
  kidMode = false,
}: PackCardProps) {
  const progress = Math.round((completedCount / wordCount) * 100);

  // For carousel mode, always render full cards
  // The carousel handles scaling and positioning

  return (
    <div
      className={`relative w-full rounded-2xl border-2 p-6 cursor-pointer transition-all duration-200 ${
        unlocked
          ? selected
            ? kidMode
              ? 'bg-transparent border-yellow-400 shadow-lg shadow-yellow-400/30'
              : 'bg-surface-800 border-accent-teal shadow-lg shadow-accent-teal/20'
            : kidMode
              ? 'bg-transparent border-surface-700 hover:border-yellow-400/70'
              : 'bg-surface-800/85 border-surface-700 hover:border-accent-teal/60'
          : 'cursor-not-allowed opacity-60'
      } ${className}`}
      onClick={() => unlocked && onClick()}
    >
      <div className="text-center">
        <h3 className="text-3xl font-bold bg-gradient-to-r from-accent-lime via-accent-teal to-accent-lime bg-clip-text text-transparent mb-4">
          {title}
        </h3>

        {category && (
          <p className="text-sm text-accent-teal mb-4 uppercase tracking-wide">
            {category}
          </p>
        )}

        {/* Lock overlay for unlocked packs */}
        {!unlocked && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <span
                className={`${kidMode ? 'text-5xl' : 'text-3xl'} mb-2 block animate-bounce`}
              >
                {kidMode ? '🔐' : '🔒'}
              </span>
              <p
                className={`${kidMode ? 'text-sm' : 'text-xs'} text-white/80 font-semibold`}
              >
                {kidMode
                  ? 'Finish other lessons first!'
                  : 'Complete previous packs to unlock'}
              </p>
            </div>
          </div>
        )}

        <div className="mb-4">
          {/* Stars only show when words are completed */}
          {completedCount > 0 && (
            <div className="flex justify-center gap-1 mb-2">
              {Array.from({ length: Math.min(completedCount, 12) }, (_, i) => (
                <span
                  key={i}
                  className={`${kidMode ? 'text-2xl' : 'text-lg'} ${
                    kidMode ? 'text-yellow-400' : 'text-accent-lime'
                  }`}
                >
                  ⭐
                </span>
              ))}
            </div>
          )}

          {/* Word counter always visible */}
          <p className="text-sm text-text-secondary font-semibold">
            {completedCount}/{wordCount} words completed
          </p>
        </div>

        {progress === 100 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-lime/20 border border-accent-lime/40">
            <span className="text-sm text-accent-lime font-semibold">Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}
