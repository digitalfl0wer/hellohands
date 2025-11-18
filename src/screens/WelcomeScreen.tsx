import { AppButton } from '../components/Button';
import IntroMessage from '../components/IntroMessage';

type WelcomeScreenProps = {
  kidMode: boolean;
  level: number;
  stars: number;
  totalStars: number;
  onSelectLesson: () => void;
  onSelectPractice: () => void;
};

export function WelcomeScreen({
  kidMode,
  level,
  stars,
  totalStars,
  onSelectLesson,
  onSelectPractice,
}: WelcomeScreenProps) {
  const levelTwoLocked = level < 2;
  // Intro message is always visible (permanent)

  return (
    <section className="space-y-lg">
      <header className="space-y-sm">
        <IntroMessage />
      </header>
      <div className="grid gap-lg md:grid-cols-2">
        <article className="flex flex-col justify-between rounded-3xl border border-white/10 bg-surface-900/70 p-lg pt-8 shadow-lg ring-1 ring-white/10">
          <div className="space-y-sm">
            <h2 className="text-2xl font-semibold text-text-primary">Lesson path</h2>
            <p className="text-sm text-text-secondary">
              Follow the guided lesson trajectory with paced sign demos, countdowns, and
              voice/gesture milestones. Earn stars to keep unlocking new packs.
            </p>
            <div className="flex items-center gap-sm text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">Level {level}</span>
              <span>
                {stars} / {totalStars} stars (Level requirements progress)
              </span>
              <span className="inline-flex h-2 w-2 rounded-full bg-accent-lime" />
            </div>
          </div>
          <div className="mt-6">
            <AppButton onClick={onSelectLesson} type="button" variant="adult">
              Begin lesson path
            </AppButton>
          </div>
        </article>
        <article className="flex flex-col justify-between rounded-3xl border border-white/10 bg-surface-800/70 p-lg pt-8 shadow-lg ring-1 ring-white/10">
          <div className="space-y-sm">
            <h2 className="text-2xl font-semibold text-text-primary">Practice path</h2>
            <p className="text-sm text-text-secondary">
              Jump into hands-on practice with dynamic sign drills, on-the-fly challenges,
              and camera feedback so you can rehearse gestures at your own pace.
            </p>
            <p className="text-xs text-text-muted">
              Independent flow, same lessons, perfect for warming up.
            </p>
          </div>
          <div className="mt-6">
            <AppButton onClick={onSelectPractice} type="button" variant="kid">
              Try practice path
            </AppButton>
          </div>
        </article>
      </div>
    </section>
  );
}
