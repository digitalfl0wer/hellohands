import { useEffect, useState } from 'react';

import { AppButton } from '../Button';

type SlideId = 'intro' | 'gestures' | 'modes';

export interface OnboardingCarouselProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface SlideConfig {
  id: SlideId;
  title: string;
  body: string;
}

const SLIDES: SlideConfig[] = [
  {
    id: 'intro',
    title: 'Welcome to Hello Hands',
    body: 'We use your camera and microphone to mirror your signs and hear simple voice commands. Video stays on your device; we only use it to help you learn.',
  },
  {
    id: 'gestures',
    title: 'Your helper gestures',
    body: 'Start with four simple helpers: 👍 thumbs up, 🖐 open palm, 👉 point, and 🤌 pinch. You will use them to pause, resume, and confirm matches.',
  },
  {
    id: 'modes',
    title: 'Choose how you want to learn',
    body: 'Use Learn for guided paths and Practice for free play. You can turn Kid Mode, voice, and gestures on or off anytime from the settings menu.',
  },
];

const STORAGE_KEY = 'hh_onboarding_completed_v1';

function markOnboardingCompleted() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
  } catch {
    // best-effort only; ignore storage errors
  }
}

export function hasCompletedOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function OnboardingCarousel({ onComplete, onSkip }: OnboardingCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Announce first slide to screen readers
    const first = SLIDES[0];
    document.title = `${first.title} · Hello Hands`;
  }, []);

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      markOnboardingCompleted();
      onComplete();
      return;
    }
    setIndex((prev) => Math.min(SLIDES.length - 1, prev + 1));
  };

  const handleBack = () => {
    setIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    markOnboardingCompleted();
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/90 px-4 py-8"
      role="dialog"
      aria-labelledby="onboarding-title"
    >
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-surface-800/95 p-6 shadow-2xl ring-1 ring-white/10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
              How to use Hello Hands
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-text-primary" id="onboarding-title">
              {slide.title}
            </h2>
          </div>
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-wide text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
            onClick={handleSkip}
          >
            Skip
          </button>
        </header>

        <p className="mt-4 text-sm text-text-secondary">{slide.body}</p>

        <div className="mt-6 flex items-center justify-between">
          <div aria-hidden="true" className="flex gap-2">
            {SLIDES.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 w-7 rounded-full transition-colors ${
                  i === index ? 'bg-accent-teal' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <AppButton
              onClick={handleBack}
              type="button"
              variant="adult"
              disabled={index === 0}
            >
              Back
            </AppButton>
            <AppButton onClick={handleNext} type="button" variant="kid">
              {isLast ? 'Done' : 'Next'}
            </AppButton>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-text-muted">
          You can always reopen this guide later from the settings menu or the Help section.
        </p>
      </section>
    </div>
  );
}


