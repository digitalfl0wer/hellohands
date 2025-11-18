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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-accent-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading lesson packs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900/90 flex flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold uppercase tracking-wide text-text-secondary hover:text-text-primary"
        >
          Back
        </button>
        <h1 className="text-3xl font-bold text-text-primary">Lesson Packs</h1>
        <div className="w-16" />
      </header>

      <main className="flex-1">
        <CardStack renderChild={renderPackCard} className="py-4">
          {packs.map((pack) => (
            <div key={pack.id} />
          ))}
        </CardStack>
      </main>
    </div>
  );
}
