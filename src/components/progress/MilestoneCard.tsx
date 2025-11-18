import { useMemo } from 'react';
import type { MilestoneEntry } from '../../state/progress';

interface MilestoneCardProps {
  milestone: MilestoneEntry;
  onDismiss: () => void;
}

function useMilestoneCopy(milestone: MilestoneEntry): { title: string; body: string } {
  return useMemo(() => {
    switch (milestone.type) {
      case 'five_signs':
        return {
          title: 'Nice streak of signs!',
          body: 'You have confidently matched 5 signs. Keep going to unlock more stickers.',
        };
      case 'ten_signs':
        return {
          title: 'Ten signs in the bag',
          body: 'You have matched 10 signs. Your hands are getting fluent.',
        };
      case 'path_complete':
        return {
          title: 'Path complete',
          body: 'You finished a learning path. Time to celebrate and pick a new challenge.',
        };
      case 'golden_spark':
        return {
          title: 'Golden Spark!',
          body: 'That last sign was picture-perfect. Golden Spark unlocked.',
        };
      default:
        return {
          title: 'Milestone reached',
          body: 'You just hit a new learning milestone.',
        };
    }
  }, [milestone.type]);
}

export function MilestoneCard({ milestone, onDismiss }: MilestoneCardProps) {
  const { title, body } = useMilestoneCopy(milestone);

  return (
    <aside
      aria-live="polite"
      className="fixed inset-x-0 bottom-6 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-surface-900/95 p-4 text-sm text-text-primary shadow-2xl ring-1 ring-white/15"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-teal/20 text-xl">
        {milestone.type === 'golden_spark' ? '✨' : '🏅'}
      </div>
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <p className="mt-1 text-xs text-text-secondary">{body}</p>
      </div>
      <button
        type="button"
        className="ml-2 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary hover:bg-surface-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
        onClick={onDismiss}
      >
        Close
      </button>
    </aside>
  );
}
