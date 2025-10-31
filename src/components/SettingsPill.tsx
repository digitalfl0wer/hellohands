import { useMemo } from 'react';

import { AppButton } from './Button';
import { useLessonStore } from '../state/useLessonStore';

const hints = {
  voice: ['Try saying “Next” or “Replay”', 'Voice is optional but handy in kid mode.'],
  gestures: [
    '👍 starts lessons, ✋ pauses.',
    'Swipes: → Next, ← Replay, ↑ Slow, ↓ Help.',
  ],
};

export function SettingsPill() {
  const voiceOn = useLessonStore((state) => state.voiceOn);
  const toggleVoice = useLessonStore((state) => state.toggleVoice);
  const gesturesOn = useLessonStore((state) => state.gesturesOn);
  const toggleGestures = useLessonStore((state) => state.toggleGestures);

  const voiceHint = useMemo(
    () => hints.voice[Math.floor(Math.random() * hints.voice.length)],
    [],
  );
  const gestureHint = useMemo(
    () => hints.gestures[Math.floor(Math.random() * hints.gestures.length)],
    [],
  );

  return (
    <aside className="inline-flex items-center gap-sm rounded-full border border-white/15 bg-surface-700/60 px-md py-1.5 text-sm text-text-secondary shadow-lg backdrop-blur transition hover:border-white/40 hover:text-text-primary">
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-text-muted">
          Quick settings
        </span>
        <span className="text-sm text-text-secondary">
          {voiceOn ? voiceHint : 'Voice off. Manual or gestures still work.'}
        </span>
        <span className="text-xs text-text-muted">
          {gesturesOn
            ? gestureHint
            : 'Gestures off. Swipes disabled until you re-enable.'}
        </span>
      </div>
      <div className="flex gap-xs">
        <AppButton
          onClick={toggleVoice}
          type="button"
          variant="adult"
          className="min-w-[110px]"
          aria-pressed={voiceOn}
        >
          Voice: {voiceOn ? 'On' : 'Off'}
        </AppButton>
        <AppButton
          onClick={toggleGestures}
          type="button"
          variant="adult"
          className="min-w-[110px]"
          aria-pressed={gesturesOn}
        >
          Gestures: {gesturesOn ? 'On' : 'Off'}
        </AppButton>
      </div>
    </aside>
  );
}
