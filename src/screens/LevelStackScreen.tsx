import { useLessonStore } from '../state/useLessonStore';
import { CardStack } from '../components/CardStack';
import { LevelCard } from '../components/LevelCard';
import { ReactNode } from 'react';

interface LevelStackScreenProps {
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

export function LevelStackScreen({ onSelectLevel, onBack }: LevelStackScreenProps) {
  const currentLevel = useLessonStore((state) => state.level);
  const kidMode = useLessonStore((state) => state.kidMode);

  // Generate levels up to current level + 2 (to show some upcoming locked levels as corners)
  const maxLevel = Math.min(currentLevel + 2, 10); // Cap at a reasonable maximum
  const levels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  const renderLevelCard = (
    child: ReactNode,
    index: number,
    mode: 'full' | 'corner',
    selected?: boolean,
  ) => {
    const level = levels[index];
    return (
      <LevelCard
        key={level}
        level={level}
        onClick={() => onSelectLevel(level)}
        mode={mode}
        selected={selected}
      />
    );
  };

  return (
    <div
      className={`min-h-screen flex flex-col ${kidMode ? 'bg-transparent' : 'bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900'}`}
    >
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <span className="text-lg">←</span>
          <span>Back</span>
        </button>
        <h1 className="text-3xl font-bold text-text-primary">Select Level</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Level Stack */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full">
          <CardStack renderChild={renderLevelCard} className="py-8">
            {levels.map((level) => (
              <div key={level} /> // Placeholder, actual rendering handled by renderChild
            ))}
          </CardStack>

          {/* Instructions */}
          <div className="text-center mt-8">
            <p className="text-sm text-text-secondary">Tap a level to start practicing</p>
            <p className="text-xs text-text-muted mt-1">
              Complete levels to unlock the next ones
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
