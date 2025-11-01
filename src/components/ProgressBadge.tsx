type ProgressBadgeProps = {
  level: number;
  stars: number;
  total: number;
};

export function ProgressBadge({ level, stars, total }: ProgressBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-surface-700/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
      <span aria-hidden="true" className="text-lg">
        ⭐
      </span>
      <span className="sr-only">{`Level ${level} progress: ${stars} of ${total} stars earned.`}</span>
      <span aria-hidden="true">
        L{level} · {stars}/{total}
      </span>
    </div>
  );
}

export default ProgressBadge;
