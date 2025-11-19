import { useMemo, useRef, useState } from 'react';
import { useProgressStore } from '../../state/progress';
import { StickerDisplay } from '../StickerDisplay';

interface StickerBoardProps {
  onClose: () => void;
}

export function StickerBoard({ onClose }: StickerBoardProps) {
  const stickers = useProgressStore((s) => s.stickers);
  const placements = useProgressStore((s) => s.placements);
  const placeSticker = useProgressStore((s) => s.placeSticker);
  const streak = useProgressStore((s) => s.streak);
  const [activeStickerId, setActiveStickerId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const unlockedStickers = useMemo(() => stickers.filter((s) => s.unlocked), [stickers]);

  const handleBoardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!activeStickerId || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    placeSticker(
      activeStickerId,
      Math.max(0, Math.min(1, x)),
      Math.max(0, Math.min(1, y)),
    );
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/95 px-4 py-6"
      role="dialog"
      aria-labelledby="sticker-board-title"
    >
      <section className="flex w-full max-w-5xl flex-col gap-4 rounded-2xl border border-white/10 bg-surface-800/95 p-4 shadow-2xl ring-1 ring-white/10">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-teal">
              Sticker board
            </p>
            <h2
              className="mt-1 text-lg font-semibold text-text-primary"
              id="sticker-board-title"
            >
              Your small wins, all in one place
            </h2>
            <p className="mt-1 text-xs text-text-secondary">
              Tap a sticker, then tap anywhere on the board to place it. This layout is
              saved on this device.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md bg-surface-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-secondary hover:bg-surface-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
          <div
            ref={boardRef}
            className="relative h-64 cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900"
            onClick={handleBoardClick}
          >
            {placements.map((placement) => {
              const def = stickers.find((s) => s.id === placement.id);
              if (!def) return null;
              return (
                <div
                  key={placement.id}
                  className="absolute"
                  style={{
                    left: `${placement.x * 100}%`,
                    top: `${placement.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <StickerDisplay stickerId={def.id} size="medium" />
                </div>
              );
            })}
            {placements.length === 0 && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-text-muted">
                Place your first sticker by tapping on the board.
              </p>
            )}
          </div>
          <aside className="flex flex-col gap-3 rounded-xl border border-white/10 bg-surface-900/80 p-3 text-xs text-text-secondary">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                Unlocked stickers
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {unlockedStickers.length === 0 ? (
                  <p className="text-[11px] text-text-muted">
                    Unlock stickers by matching signs and finishing paths.
                  </p>
                ) : (
                  unlockedStickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      type="button"
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold ${
                        activeStickerId === sticker.id
                          ? 'border-accent-teal bg-accent-teal/20 text-accent-teal'
                          : 'border-white/15 bg-surface-800/80 text-text-primary hover:border-accent-teal/60'
                      }`}
                      onClick={() =>
                        setActiveStickerId((current) =>
                          current === sticker.id ? null : sticker.id,
                        )
                      }
                    >
                      <StickerDisplay stickerId={sticker.id} size="small" />
                      <span>{sticker.label}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="mt-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
                Streak
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {streak.count > 0
                  ? `You have practiced ${streak.count} day${
                      streak.count === 1 ? '' : 's'
                    } in a row.`
                  : 'Your streak starts the next time you practice.'}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
