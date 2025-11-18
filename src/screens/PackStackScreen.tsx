import { useEffect, useState } from 'react';
import { CardStack } from '../components/CardStack';
import { PackCard } from '../components/PackCard';
import { ReactNode } from 'react';
import { useLessonStore } from '../state/useLessonStore';

interface PackData {
  packId: string;
  category: string;
  items: string[];
}

interface PackStackScreenProps {
  onSelectPack: (packId: string) => void;
  onBack: () => void;
}

function formatPackName(packId: string): { level: string; name: string } {
  const mappings: Record<string, string> = {
    'L1-ESSENTIALS': 'L1 Daily Essentials',
    'L1-SOCIAL-BASICS': 'L2 Social Connectors',
    'L2-INTERMEDIATE': 'L3 Life & Feelings',
  };

  const name = mappings[packId] || packId.split('-').slice(1).join(' ');

  return { level: '', name }; // Level is now included in the name
}

export function PackStackScreen({ onSelectPack, onBack }: PackStackScreenProps) {
  const [packs, setPacks] = useState<PackData[]>([]);
  const [loading, setLoading] = useState(true);
  const kidMode = useLessonStore((s) => s.kidMode);

  useEffect(() => {
    // Load practice packs
    fetch('/practice/packs.generated.json')
      .then((response) => response.json())
      .then((data: PackData[]) => {
        setPacks(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load practice packs:', error);
        setLoading(false);
      });
  }, []);

  const renderPackCard = (
    child: ReactNode,
    index: number,
    mode: 'full' | 'corner',
    selected?: boolean,
  ) => {
    const pack = packs[index];
    if (!pack) return null;

    const { name } = formatPackName(pack.packId);

    return (
      <PackCard
        key={pack.packId}
        packId={pack.packId}
        title={name}
        wordCount={pack.items.length}
        completedCount={0} // TODO: Track completion progress
        onClick={() => onSelectPack(pack.packId)}
        mode={mode}
        selected={selected}
        unlocked={true} // TODO: Implement pack unlocking logic
        kidMode={kidMode}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading practice packs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900 flex flex-col">
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
        <h1 className="text-3xl font-bold text-text-primary">Practice Packs</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Pack Stack */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full">
          {packs.length > 0 ? (
            <>
              <CardStack renderChild={renderPackCard} className="py-8">
                {packs.map((pack) => (
                  <div key={pack.packId} /> // Placeholder, actual rendering handled by renderChild
                ))}
              </CardStack>

              {/* Instructions */}
              <div className="text-center mt-8">
                <p className="text-sm text-text-secondary">
                  Tap a pack to practice those signs
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Build your ASL vocabulary with themed word packs
                </p>
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-text-secondary">No practice packs available yet.</p>
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
