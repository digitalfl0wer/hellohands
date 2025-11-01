import { useId, useRef, useState } from 'react';
import type { LessonClipAttribution } from '../lesson/sampleClips';
import { AttributionModal } from './AttributionModal';

type AttributionChipProps = {
  attribution: LessonClipAttribution;
};

export function AttributionChip({ attribution }: AttributionChipProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const baseId = useId();
  const dialogId = `${baseId}-attribution-dialog`;
  const headingId = `${baseId}-attribution-title`;

  const handleClose = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        aria-controls={dialogId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`View attribution for ${attribution.className}`}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface-700/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <span className="h-2 w-2 rounded-full bg-accent-teal" /> Attribution
      </button>
      {open ? (
        <AttributionModal
          attribution={attribution}
          dialogId={dialogId}
          headingId={headingId}
          onClose={handleClose}
        />
      ) : null}
    </>
  );
}
