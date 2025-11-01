import { FocusEvent, useEffect, useRef, useState } from 'react';

import { AppButton } from './Button';
import { useLessonStore } from '../state/useLessonStore';

export function SettingsPill() {
  const voiceOn = useLessonStore((state) => state.voiceOn);
  const toggleVoice = useLessonStore((state) => state.toggleVoice);
  const gesturesOn = useLessonStore((state) => state.gesturesOn);
  const toggleGestures = useLessonStore((state) => state.toggleGestures);

  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const closeIfOutside = (event: FocusEvent<HTMLDivElement>) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.relatedTarget as Node)
    ) {
      setExpanded(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onBlur={closeIfOutside}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide text-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal transition ${
          expanded
            ? 'border-accent-teal bg-accent-teal/20 text-accent-teal shadow-[0_0_20px_rgba(45,212,191,0.6)]'
            : 'border-accent-teal/60 bg-surface-900/90 text-text-primary shadow-[0_0_12px_rgba(45,212,191,0.4)] hover:shadow-[0_0_18px_rgba(45,212,191,0.6)]'
        }`}
        aria-haspopup="menu"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="text-base">⚙️</span>
        <span>Quick settings</span>
      </button>

      <div
        className={`${
          expanded
            ? 'pointer-events-auto opacity-100 translate-y-0'
            : 'pointer-events-none opacity-0 translate-y-1'
        } absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-accent-teal/60 bg-surface-900/98 p-4 text-sm text-text-primary shadow-2xl backdrop-blur transition-all`}
        role="menu"
      >
        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-accent-teal">
          Toggle inputs
        </p>
        <div className="flex flex-col gap-3">
          <AppButton
            onClick={toggleVoice}
            type="button"
            variant="adult"
            aria-pressed={voiceOn}
            className={`justify-between px-4 py-2 text-sm font-semibold shadow-md transition ${
              voiceOn
                ? 'border border-accent-teal bg-accent-teal/30 text-accent-teal'
                : 'border border-white/15 bg-surface-800/80 text-text-primary hover:border-accent-teal/60'
            }`}
          >
            <span>Voice</span>
            <span>{voiceOn ? 'On' : 'Off'}</span>
          </AppButton>
          <AppButton
            onClick={toggleGestures}
            type="button"
            variant="adult"
            aria-pressed={gesturesOn}
            className={`justify-between px-4 py-2 text-sm font-semibold shadow-md transition ${
              gesturesOn
                ? 'border border-accent-teal bg-accent-teal/30 text-accent-teal'
                : 'border border-white/15 bg-surface-800/80 text-text-primary hover:border-accent-teal/60'
            }`}
          >
            <span>Gestures</span>
            <span>{gesturesOn ? 'On' : 'Off'}</span>
          </AppButton>
        </div>
      </div>
    </div>
  );
}
