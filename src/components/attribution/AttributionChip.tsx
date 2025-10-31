import { useState } from 'react';
import { AttributionModal, AttributionModalProps } from './AttributionModal';

export function AttributionChip(props: Omit<AttributionModalProps, 'onClose'>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface-700/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-muted transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="h-2 w-2 rounded-full bg-accent-teal" /> Attribution
      </button>
      {open && <AttributionModal {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
