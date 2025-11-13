import { AppButton } from '../Button';

interface NoCameraRecoveryProps {
  message?: string | null;
  onRetry: () => void;
  onUseDemo: () => void;
}

export function NoCameraRecovery({
  message,
  onRetry,
  onUseDemo,
}: NoCameraRecoveryProps) {
  return (
    <div className="flex flex-col gap-sm rounded-lg border border-white/10 bg-surface-900/90 p-md text-sm text-text-primary shadow-brand ring-1 ring-white/5">
      <h3 className="text-base font-semibold">Camera not available</h3>
      <p className="text-xs text-text-secondary">
        We could not start your camera. You can try again, or explore this lesson in demo
        mode without live hand tracking.
      </p>
      {message ? (
        <p className="text-[11px] text-text-muted">Details: {message}</p>
      ) : null}
      <div className="mt-sm flex flex-wrap gap-sm">
        <AppButton onClick={onRetry} type="button" variant="adult">
          Retry camera
        </AppButton>
        <AppButton onClick={onUseDemo} type="button" variant="kid">
          Explore without camera
        </AppButton>
      </div>
    </div>
  );
}


