import { useEffect, useRef } from 'react';

interface VoiceGuideProps {
  visible: boolean;
}

const prompts = [
  'Say “Next” or “Replay” to control the sign.',
  'Try “Pause” when you want to freeze the lesson.',
  'Need help? Say “Help” to open the guide.',
];

export function VoiceGuide({ visible }: VoiceGuideProps) {
  const promptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visible) {
      promptRef.current?.focus();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <aside className="rounded-lg border border-accent-teal bg-surface-900/95 p-md text-text-primary shadow-lg ring-2 ring-accent-teal">
      <div
        className="flex items-center gap-sm text-accent-teal"
        tabIndex={-1}
        ref={promptRef}
        aria-live="assertive"
      >
        <span className="text-lg" aria-hidden="true">
          🎤
        </span>
        <h3 className="text-lg font-bold uppercase tracking-wide">Voice Tips</h3>
      </div>
      <p className="mt-sm text-sm font-semibold text-text-primary">
        Microphone is listening. Toggle voice off to stop.
      </p>
      <ul className="mt-md space-y-2 text-sm font-semibold text-text-secondary">
        {prompts.map((prompt) => (
          <li key={prompt} className="rounded bg-surface-800/80 px-3 py-2">
            {prompt}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default VoiceGuide;
