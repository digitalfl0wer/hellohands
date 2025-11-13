interface NoHandFoundNoticeProps {
  onRetry: () => void;
  onToggleHighGain?: () => void;
  highGainEnabled?: boolean;
}

export function NoHandFoundNotice({
  onRetry,
  onToggleHighGain,
  highGainEnabled,
}: NoHandFoundNoticeProps) {
  return (
    <div className="mt-sm rounded-md border border-white/10 bg-surface-900/90 p-3 text-xs text-text-secondary">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-semibold text-text-primary">No hand found</p>
        <button
          type="button"
          className="rounded bg-surface-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent-teal hover:bg-surface-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
      <ul className="list-disc space-y-1 pl-4">
        <li>Move a little closer so your hand fills more of the frame.</li>
        <li>Keep your palm facing the camera with fingers clearly separated.</li>
        <li>Avoid strong backlighting or very dark rooms.</li>
      </ul>
      {onToggleHighGain && (
        <button
          type="button"
          className="mt-2 text-[11px] font-semibold text-accent-teal underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
          onClick={onToggleHighGain}
        >
          {highGainEnabled ? 'High gain mode is on' : 'Low light? Turn on high gain mode'}
        </button>
      )}
    </div>
  );
}


