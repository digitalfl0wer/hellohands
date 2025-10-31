import { useEffect, useRef } from 'react';

export type AttributionModalProps = {
  signer: string;
  source: string;
  licenseText: string;
  link: string;
  onClose: () => void;
};

export function AttributionModal({
  signer,
  source,
  licenseText,
  link,
  onClose,
}: AttributionModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        aria-modal="true"
        className="relative z-10 w-full max-w-lg rounded-lg border border-white/10 bg-surface-800/90 p-lg text-text-primary shadow-brand"
        ref={dialogRef}
        role="dialog"
      >
        <header className="mb-md flex items-center justify-between">
          <h2 className="text-lg font-semibold">Attribution</h2>
          <button
            className="rounded-full border border-white/15 px-3 py-1 text-sm text-text-secondary transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            Close
          </button>
        </header>
        <dl className="space-y-sm text-sm">
          <div>
            <dt className="font-semibold text-text-secondary">Signer</dt>
            <dd>{signer}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-secondary">Source</dt>
            <dd>{source}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-secondary">License</dt>
            <dd className="text-text-muted">{licenseText}</dd>
          </div>
        </dl>
        <a
          className="mt-md inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface-700/50 px-4 py-2 text-sm text-text-primary transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
          href={link}
          rel="noreferrer"
          target="_blank"
        >
          View source
        </a>
      </div>
    </div>
  );
}
