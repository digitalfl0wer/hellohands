import { useEffect, useRef } from 'react';
import type { LessonClipAttribution } from '../lesson/sampleClips';

export type AttributionModalProps = {
  attribution: LessonClipAttribution;
  dialogId: string;
  headingId: string;
  onClose: () => void;
};

export function AttributionModal({
  attribution,
  dialogId,
  headingId,
  onClose,
}: AttributionModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dialogNode = dialogRef.current;
    if (!dialogNode) {
      return;
    }

    const focusableSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      Array.from(dialogNode.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1,
      );

    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const elements = getFocusable();
        if (elements.length === 0) {
          event.preventDefault();
          return;
        }

        const first = elements[0];
        const last = elements[elements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey) {
          if (activeElement === first || !dialogNode.contains(activeElement)) {
            event.preventDefault();
            last.focus();
          }
        } else if (activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    dialogNode.addEventListener('keydown', handleKey);
    return () => {
      dialogNode.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const descriptionId = `${dialogId}-description`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-lg rounded-lg border border-white/10 bg-surface-800/90 p-lg text-text-primary shadow-brand"
        ref={dialogRef}
        id={dialogId}
        role="dialog"
      >
        <header className="mb-md flex items-center justify-between">
          <h2 className="text-lg font-semibold" id={headingId}>
            Attribution
          </h2>
          <button
            className="rounded-full border border-white/15 px-3 py-1 text-sm text-text-secondary transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </header>
        <dl className="space-y-sm text-sm" id={descriptionId}>
          <div>
            <dt className="font-semibold text-text-secondary">Clip</dt>
            <dd>{attribution.className}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-secondary">Clip ID</dt>
            <dd>{attribution.clipId}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-secondary">Dataset</dt>
            <dd>
              {attribution.dataset} • {attribution.subset} • {attribution.split}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text-secondary">Signer</dt>
            <dd>
              {attribution.signerLabel}
              {attribution.signerId ? (
                <span className="text-text-muted"> ({attribution.signerId})</span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text-secondary">Source</dt>
            <dd>{attribution.source}</dd>
          </div>
          <div>
            <dt className="font-semibold text-text-secondary">License</dt>
            <dd className="text-text-muted">{attribution.licenseText}</dd>
          </div>
        </dl>
        <a
          className="mt-md inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface-700/50 px-4 py-2 text-sm text-text-primary transition hover:border-white hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
          href={attribution.link}
          rel="noreferrer"
          target="_blank"
        >
          View source
        </a>
      </div>
    </div>
  );
}
