interface VoicePermissionBannerProps {
  error?: string | null;
  onRetry: () => void;
}

export function VoicePermissionBanner({ error, onRetry }: VoicePermissionBannerProps) {
  if (!error) return null;

  return (
    <div
      aria-live="polite"
      className="mb-3 rounded-md border border-accent-orange/70 bg-accent-orange/15 px-3 py-2 text-xs text-text-primary"
    >
      <p className="font-semibold text-accent-orange-100">
        Voice is off because the browser blocked the microphone.
      </p>
      <p className="mt-1 text-[11px] text-text-secondary">
        Check your browser’s site settings and allow microphone access for Hello Hands. Then
        turn voice back on.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded bg-surface-900 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-orange-100 hover:bg-surface-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-orange-100"
          onClick={onRetry}
        >
          Try voice again
        </button>
        <span className="text-[11px] text-text-muted">
          Error: <span className="font-mono">{error}</span>
        </span>
      </div>
    </div>
  );
}


