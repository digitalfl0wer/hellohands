import { ReactNode } from 'react';

type IntroMessageProps = {
  onDismiss?: () => void;
  learnMore?: ReactNode;
};

export function IntroMessage({ onDismiss, learnMore }: IntroMessageProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-surface-800/70 p-lg text-text-primary shadow-brand ring-1 ring-white/5">
      <h2 className="text-xl font-semibold">Welcome to Hello Hands</h2>
      <p className="mt-sm text-sm text-text-secondary">
        Practice friendly ASL signs with visual posters and simple hand gestures. Hold
        your pose steady for a couple seconds to confirm a match.
      </p>
      <ul className="mt-sm list-disc space-y-1 pl-5 text-sm text-text-secondary">
        <li>Choose a sign from Level 1 or the Practice page.</li>
        <li>Mirror the poster with your hand and hold steady ~2 seconds.</li>
        <li>On a match, you&apos;ll see a success message and advance.</li>
      </ul>
      {onDismiss || learnMore ? (
        <div className="mt-md flex items-center gap-3">
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-surface-700/60 px-4 py-2 text-sm font-semibold text-text-primary transition hover:border-white"
            >
              Got it
            </button>
          ) : null}
          {learnMore}
        </div>
      ) : null}
    </section>
  );
}

export default IntroMessage;
