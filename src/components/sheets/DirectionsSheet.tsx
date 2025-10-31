import { useEffect, useState } from 'react';
import { AppButton } from '../Button';

type DirectionsSheetProps = {
  directions: string[];
  onBegin: () => void;
  beginLabel?: string;
};

export function DirectionsSheet({
  directions,
  onBegin,
  beginLabel = 'Begin',
}: DirectionsSheetProps) {
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setCtaVisible(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="rounded-lg border border-white/10 bg-surface-800/80 p-lg shadow-brand ring-1 ring-white/5">
      <h2 className="text-xl font-semibold text-text-primary">Before we start</h2>
      <ol className="mt-md list-decimal space-y-sm pl-5 text-sm text-text-secondary">
        {directions.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
      <div className="mt-lg flex flex-col gap-sm">
        {ctaVisible ? (
          <AppButton onClick={onBegin} type="button" variant="kid" className="self-start">
            {beginLabel}
          </AppButton>
        ) : (
          <span className="text-sm text-text-muted">Preparing lesson&hellip;</span>
        )}
        <span className="text-xs uppercase tracking-widest text-text-muted">
          Touch controls always available.
        </span>
      </div>
    </section>
  );
}
