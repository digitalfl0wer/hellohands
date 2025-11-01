import { AppButton } from '../Button';

type HelpSheetProps = {
  mediaPoster: string;
  mediaAlt: string;
  tip: string;
  kidMode?: boolean;
  onReplaySlow: () => void;
  onResume: () => void;
};

export function HelpSheet({
  mediaPoster,
  mediaAlt,
  tip,
  kidMode = false,
  onReplaySlow,
  onResume,
}: HelpSheetProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-surface-800/80 p-lg shadow-brand ring-1 ring-white/5">
      <h2 className="text-xl font-semibold text-text-primary">Need a quick refresher?</h2>
      <div className="mt-md flex flex-col gap-md md:flex-row">
        <figure className="flex-1">
          <img
            alt={mediaAlt}
            className="w-full rounded-lg border border-white/10 object-cover"
            src={mediaPoster}
          />
        </figure>
        <div className="flex-1 space-y-md">
          <p className="text-sm text-text-secondary">{tip}</p>
          <div className="flex gap-sm">
            <AppButton
              onClick={onReplaySlow}
              type="button"
              variant={kidMode ? 'kid' : 'adult'}
            >
              Replay in slow-mo
            </AppButton>
            <AppButton onClick={onResume} type="button" variant="adult">
              Resume
            </AppButton>
          </div>
          <p className="text-xs text-text-muted">
            {kidMode
              ? 'Kid Mode keeps instructions simple and animated.'
              : 'Manual mode ready if gestures misfire.'}
          </p>
        </div>
      </div>
    </section>
  );
}
