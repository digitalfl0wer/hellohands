import { AppButton } from '../Button';

interface FeedbackBannerProps {
  variant: 'pass' | 'almost' | 'miss';
  kidMode?: boolean;
  onRetry: () => void;
  onNext: () => void;
}

const variantCopy = {
  pass: {
    title: 'Great job!',
    kid: 'Awesome high five! Ready for the next sign?',
  },
  almost: {
    title: 'Almost there!',
    kid: 'So close! Want to try again together?',
  },
  miss: {
    title: 'Let’s review!',
    kid: 'No worries. Let’s replay slowly and try again.',
  },
};

const variantStyles = {
  pass: 'bg-accent-teal/30 text-text-primary border-accent-teal/50',
  almost: 'bg-accent-orange/30 text-text-primary border-accent-orange/40',
  miss: 'bg-rose-500/30 text-text-primary border-rose-500/40',
};

export function FeedbackBanner({
  variant,
  kidMode = false,
  onRetry,
  onNext,
}: FeedbackBannerProps) {
  const copy = variantCopy[variant];
  const adultText = {
    pass: 'Nail the next sign to keep your streak alive.',
    almost: 'Rewatch the tips and give it another shot.',
    miss: 'Let’s slow it down and focus on the key motion.',
  }[variant];

  return (
    <aside
      aria-live="assertive"
      className={`rounded-lg border p-md shadow-brand ${variantStyles[variant]}`}
      role="status"
    >
      <div className="flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{copy.title}</h3>
          <p className="text-sm text-text-secondary">{kidMode ? copy.kid : adultText}</p>
        </div>
        <div className="flex gap-sm">
          <AppButton onClick={onRetry} type="button" variant="adult">
            Replay
          </AppButton>
          <AppButton onClick={onNext} type="button" variant="kid">
            Next Sign
          </AppButton>
        </div>
      </div>
    </aside>
  );
}
