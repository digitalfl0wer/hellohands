import { useEffect, useState } from 'react';
import { CardStack } from '../components/CardStack';
import { PackCard } from '../components/PackCard';
import { ReactNode } from 'react';
import { listPracticePacks, type PracticePackSummary } from '../services/practiceApi';
import { useLessonStore } from '../state/useLessonStore';

interface LessonPackStackScreenProps {
  onSelectPack: (packId: string) => void;
  onBack: () => void;
}

function formatPackName(packId: string): string {
  const mappings: Record<string, string> = {
    'L1-ESSENTIALS': 'L1 Daily Essentials',
    'L1-SOCIAL-BASICS': 'L2 Social Connectors',
    'L2-INTERMEDIATE': 'L3 Life & Feelings',
  };
  return mappings[packId] ?? packId.split('-').slice(1).join(' ');
}

export function LessonPackStackScreen({
  onSelectPack,
  onBack,
}: LessonPackStackScreenProps) {
  const [packs, setPacks] = useState<PracticePackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const level = useLessonStore((s) => s.level);
  const kidMode = useLessonStore((s) => s.kidMode);

  useEffect(() => {
    let mounted = true;
    listPracticePacks()
      .then((data) => {
        if (!mounted) return;
        const filtered = data.filter((pack) => {
          const packLevel = pack.id.startsWith('L') ? Number(pack.id.charAt(1)) : 1;
          return packLevel <= level;
        });
        setPacks(filtered);
      })
      .catch((error) => {
        console.error('Failed to load lesson packs', error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [level]);

  const renderPackCard = (
    child: ReactNode,
    index: number,
    mode: 'full' | 'corner',
    selected?: boolean,
  ) => {
    const pack = packs[index];
    if (!pack) return null;
    return (
      <PackCard
        key={pack.id}
        packId={pack.id}
        title={formatPackName(pack.id)}
        wordCount={pack.items.length}
        completedCount={0}
        onClick={() => onSelectPack(pack.id)}
        mode={mode}
        selected={selected}
        unlocked={true}
        kidMode={kidMode}
      />
    );
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${kidMode ? 'bg-transparent' : 'bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900'}`}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading lesson packs…</p>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-text-primary">Lesson Packs</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Pack Stack */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full">
          {packs.length > 0 ? (
            <>
              <CardStack renderChild={renderPackCard} className="py-8">
                {packs.map((pack) => (
                  <div key={pack.id} />
                ))}
              </CardStack>

              {/* Instructions */}
              <div className="text-center mt-8">
                <p className="text-sm text-text-secondary">
                  Tap a pack to start your lesson
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Learn ASL signs step by step with guided lessons
                </p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-text-secondary">No lesson packs available yet.</p>
              <p className="text-xs text-text-muted mt-2">
                Check back after more content is processed.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
