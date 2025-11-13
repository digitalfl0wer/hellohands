import { FocusEvent, useEffect, useRef, useState } from 'react';

import { AppButton } from './Button';
import { useLessonStore } from '../state/useLessonStore';

interface SettingsPillProps {
  onOpenHowToUse?: () => void;
  onOpenCalibration?: () => void;
}

export function SettingsPill({ onOpenHowToUse, onOpenCalibration }: SettingsPillProps) {
  const voiceOn = useLessonStore((state) => state.voiceOn);
  const toggleVoice = useLessonStore((state) => state.toggleVoice);
  const gesturesOn = useLessonStore((state) => state.gesturesOn);
  const toggleGestures = useLessonStore((state) => state.toggleGestures);
  const runtimeMode = useLessonStore((state) => state.runtimeMode);
  const setRuntimeMode = useLessonStore((state) => state.setRuntimeMode);
  const workerOn = useLessonStore((state) => state.workerOn);
  const toggleWorkerOn = useLessonStore((state) => state.toggleWorkerOn);
  const countdownOn = useLessonStore((state) => state.countdownOn);
  const toggleCountdown = useLessonStore((state) => state.toggleCountdown);
  const refractoryOn = useLessonStore((state) => state.refractoryOn);
  const toggleRefractory = useLessonStore((state) => state.toggleRefractory);

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
          <div className="mt-4 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-accent-teal">
              Runtime flags
            </p>
            <div className="grid grid-cols-2 gap-3">
              <AppButton
                onClick={() =>
                  setRuntimeMode(runtimeMode === 'hands' ? 'tasks' : 'hands')
                }
                type="button"
                variant="adult"
                className="justify-between px-4 py-2 text-sm font-semibold shadow-md transition border border-white/15 bg-surface-800/80 text-text-primary hover:border-accent-teal/60"
              >
                <span>Runtime</span>
                <span>{runtimeMode}</span>
              </AppButton>
              <AppButton
                onClick={toggleWorkerOn}
                type="button"
                variant="adult"
                className={`justify-between px-4 py-2 text-sm font-semibold shadow-md transition ${
                  workerOn
                    ? 'border border-accent-teal bg-accent-teal/30 text-accent-teal'
                    : 'border border-white/15 bg-surface-800/80 text-text-primary hover:border-accent-teal/60'
                }`}
              >
                <span>Worker</span>
                <span>{workerOn ? 'On' : 'Off'}</span>
              </AppButton>
              <AppButton
                onClick={toggleCountdown}
                type="button"
                variant="adult"
                className={`justify-between px-4 py-2 text-sm font-semibold shadow-md transition ${
                  countdownOn
                    ? 'border border-accent-teal bg-accent-teal/30 text-accent-teal'
                    : 'border border-white/15 bg-surface-800/80 text-text-primary hover:border-accent-teal/60'
                }`}
              >
                <span>Countdown</span>
                <span>{countdownOn ? 'On' : 'Off'}</span>
              </AppButton>
              <AppButton
                onClick={toggleRefractory}
                type="button"
                variant="adult"
                className={`justify-between px-4 py-2 text-sm font-semibold shadow-md transition ${
                  refractoryOn
                    ? 'border border-accent-teal bg-accent-teal/30 text-accent-teal'
                    : 'border border-white/15 bg-surface-800/80 text-text-primary hover:border-accent-teal/60'
                }`}
              >
                <span>Refractory</span>
                <span>{refractoryOn ? 'On' : 'Off'}</span>
              </AppButton>
            </div>
          </div>
          {(onOpenHowToUse || onOpenCalibration) && (
            <div className="mt-2 space-y-2 border-t border-white/10 pt-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-text-muted">
                Help &amp; tuning
              </p>
              {onOpenHowToUse && (
                <button
                  type="button"
                  className="w-full rounded-md bg-surface-800/80 px-3 py-2 text-left text-xs font-medium text-text-primary hover:bg-surface-700/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
                  onClick={onOpenHowToUse}
                >
                  How to use Hello Hands
                </button>
              )}
              {onOpenCalibration && (
                <button
                  type="button"
                  className="w-full rounded-md bg-surface-800/80 px-3 py-2 text-left text-xs font-medium text-text-primary hover:bg-surface-700/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
                  onClick={onOpenCalibration}
                >
                  Re-calibrate gestures
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
