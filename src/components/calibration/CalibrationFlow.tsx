import { useMemo, useState } from 'react';

import { CameraFeed } from '../CameraFeed';
import type { ExpectedGesture } from '../../gestures/gestureEvaluator';
import { saveGestureThresholds } from '../../gestures/gestureEvaluator';
import { AppButton } from '../Button';
import { logger } from '../../utils/logger';

export interface CalibrationFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

type GestureSampleMap = Partial<Record<ExpectedGesture, number>>;

const ORDER: ExpectedGesture[] = ['thumbs_up', 'open_palm', 'point', 'pinch'];

function formatGestureLabel(gesture: ExpectedGesture): string {
  switch (gesture) {
    case 'thumbs_up':
      return 'Thumbs up';
    case 'open_palm':
      return 'Open palm';
    case 'point':
      return 'Point';
    case 'pinch':
      return 'Pinch';
  }
}

export function CalibrationFlow({ onComplete, onSkip }: CalibrationFlowProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [samples, setSamples] = useState<GestureSampleMap>({});

  const currentGesture = ORDER[stepIndex];
  const isLastStep = stepIndex === ORDER.length - 1;

  const progressPct = useMemo(() => {
    const best = samples[currentGesture] ?? liveScore;
    return Math.round(Math.max(0, Math.min(1, best)) * 100);
  }, [currentGesture, liveScore, samples]);

  const handleCandidate = (payload: { gesture: ExpectedGesture; score: number }) => {
    if (payload.gesture !== currentGesture) return;
    const clamped = Math.max(0, Math.min(1, payload.score ?? 0));
    setLiveScore(clamped);
    setSamples((prev) => {
      const prevBest = prev[currentGesture] ?? 0;
      return {
        ...prev,
        [currentGesture]: Math.max(prevBest, clamped),
      };
    });
  };

  const computeThresholds = (): GestureSampleMap => {
    const result: GestureSampleMap = {};
    for (const gesture of ORDER) {
      const best = samples[gesture];
      if (typeof best !== 'number' || !Number.isFinite(best)) continue;
      const threshold = Math.max(0.4, Math.min(0.9, best - 0.1));
      result[gesture] = threshold;
    }
    return result;
  };

  const handleNext = () => {
    if (isLastStep) {
      const thresholds = computeThresholds();
      saveGestureThresholds(thresholds);
      logger.info('calibration', 'calibration:done', { thresholds });
      onComplete();
      return;
    }
    setStepIndex((prev) => Math.min(ORDER.length - 1, prev + 1));
    setLiveScore(0);
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
    setLiveScore(0);
  };

  const handleSkip = () => {
    logger.info('calibration', 'calibration:skipped');
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/95 px-4 py-6"
      role="dialog"
      aria-labelledby="calibration-title"
    >
      <section className="flex w-full max-w-4xl flex-col gap-6 rounded-2xl border border-white/10 bg-surface-800/95 p-6 shadow-2xl ring-1 ring-white/10 md:flex-row">
        <div className="flex-1 space-y-4">
          <header className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
                Quick calibration
              </p>
              <h2
                className="mt-1 text-2xl font-semibold text-text-primary"
                id="calibration-title"
              >
                Tune your gesture match
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Hold each gesture steady until the bar fills. We will adjust the
                sensitivity for this device so matches feel stable but not picky.
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-wide text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
              onClick={handleSkip}
            >
              Skip
            </button>
          </header>

          <div className="mt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Step {stepIndex + 1} of {ORDER.length}
            </p>
            <p className="mt-1 text-sm font-medium text-text-primary">
              Show a{' '}
              <span className="font-semibold">{formatGestureLabel(currentGesture)}</span>{' '}
              near your camera and hold it steady.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Confidence</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-700">
              <div
                className="h-full rounded-full bg-accent-teal transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-text-muted">
              Try to keep your hand in the frame and avoid strong backlighting. We will
              remember this calibration for this browser.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="inline-block h-2 w-2 rounded-full bg-accent-teal" />
              <span>Live from your camera</span>
            </div>
            <div className="flex items-center gap-3">
              <AppButton
                onClick={handleBack}
                type="button"
                variant="adult"
                disabled={stepIndex === 0}
              >
                Back
              </AppButton>
              <AppButton onClick={handleNext} type="button" variant="kid">
                {isLastStep ? 'Save & finish' : 'Next gesture'}
              </AppButton>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-xl border border-white/10 bg-surface-900/80 p-3">
            <CameraFeed
              enabled
              expectedGesture={currentGesture}
              // @ts-expect-error RecognizedGesture is compatible with ExpectedGesture here
              onCandidate={handleCandidate}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
