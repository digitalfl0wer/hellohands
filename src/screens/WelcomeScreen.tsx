import { AppButton } from '../components/Button';
import { LevelCard } from '../components/LevelCard';
import IntroMessage from '../components/IntroMessage';

type WelcomeScreenProps = {
  kidMode: boolean;
  level: number;
  stars: number;
  totalStars: number;
  onStart: () => void;
  onLockedLevel: (level: number) => void;
};

export function WelcomeScreen({
  kidMode,
  level,
  stars,
  totalStars,
  onStart,
  onLockedLevel,
}: WelcomeScreenProps) {
  const levelTwoLocked = level < 2;
  const levelThreeLocked = level < 3;
  // Intro message is always visible (permanent)

  return (
    <section className="space-y-lg">
      <header className="space-y-sm">
        <IntroMessage />
        <p className="max-w-xl text-base text-text-secondary">
          Earn five stars to unlock the next pack. Manual controls always work; gestures
          and voice are optional power-ups.
        </p>
        <p className="text-xs text-text-muted">
          Kid Mode is {kidMode ? 'on' : 'off'} — toggle anytime from the top-right
          control.
        </p>
      </header>
      <div className="grid gap-md md:grid-cols-3">
        <LevelCard
          title="Level 1"
          description="Start practicing friendly ASL signs."
          starsEarned={stars}
          totalStars={totalStars}
          locked={false}
          action={
            <AppButton onClick={onStart} type="button" variant="adult">
              Begin lesson
            </AppButton>
          }
        />
        <LevelCard
          title="Level 2"
          description="Unlock to learn social basics and quick replies."
          starsEarned={levelTwoLocked ? 0 : 5}
          totalStars={5}
          locked={levelTwoLocked}
          action={
            levelTwoLocked ? (
              <AppButton onClick={() => onLockedLevel(2)} type="button" variant="adult">
                Locked
              </AppButton>
            ) : (
              <AppButton onClick={onStart} type="button" variant="adult">
                Continue
              </AppButton>
            )
          }
        />
        <LevelCard
          title="Level 3"
          description="Coming soon: storyteller basics and quick phrases."
          starsEarned={0}
          totalStars={5}
          locked={levelThreeLocked}
          action={
            <AppButton onClick={() => onLockedLevel(3)} type="button" variant="adult">
              Locked
            </AppButton>
          }
        />
      </div>
    </section>
  );
}
