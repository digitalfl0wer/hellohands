import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type StickerRarity = 'common' | 'rare' | 'epic';

export interface StickerDefinition {
  id: string;
  label: string;
  emoji: string;
  rarity: StickerRarity;
  unlocked: boolean;
}

export interface StickerPlacement {
  id: string;
  x: number;
  y: number;
}

export type MilestoneType = 'five_signs' | 'ten_signs' | 'path_complete' | 'golden_spark';

export interface MilestoneEntry {
  id: string;
  type: MilestoneType;
  createdAtIso: string;
  seen: boolean;
}

export interface StreakState {
  count: number;
  lastActivityIso: string | null;
  graceUsedThisWeek: boolean;
}

interface ProgressState {
  stickers: StickerDefinition[];
  placements: StickerPlacement[];
  totalPasses: number;
  milestones: MilestoneEntry[];
  streak: StreakState;
  newlyUnlockedStickers: string[];
  unlockSticker: (id: string) => void;
  placeSticker: (id: string, x: number, y: number) => void;
  registerPass: (clipId: string, score?: number) => void;
  addMilestone: (type: MilestoneType) => void;
  dismissMilestone: (id: string) => void;
  recordSessionActivity: () => void;
  dismissStickerUnlock: (id: string) => void;
  recordPathCompletion: (level: number) => void;
}

const initialStickers: StickerDefinition[] = [
  { id: 'star_common', label: 'Star', emoji: '⭐', rarity: 'common', unlocked: false },
  { id: 'heart_common', label: 'Heart', emoji: '💖', rarity: 'common', unlocked: false },
  { id: 'rocket_rare', label: 'Rocket', emoji: '🚀', rarity: 'rare', unlocked: false },
  {
    id: 'golden_spark_epic',
    label: 'Golden Spark',
    emoji: '✨',
    rarity: 'epic',
    unlocked: false,
  },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isSameCalendarDay(aIso: string, bIso: string): boolean {
  return aIso.slice(0, 10) === bIso.slice(0, 10);
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      stickers: initialStickers,
      placements: [],
      totalPasses: 0,
      milestones: [],
      newlyUnlockedStickers: [],
      streak: {
        count: 0,
        lastActivityIso: null,
        graceUsedThisWeek: false,
      },
      unlockSticker: (id) =>
        set((state) => {
          const stickers = state.stickers.map((s) =>
            s.id === id ? { ...s, unlocked: true } : s,
          );
          const newlyUnlockedStickers = [...state.newlyUnlockedStickers];
          if (!newlyUnlockedStickers.includes(id)) {
            newlyUnlockedStickers.push(id);
          }
          return { stickers, newlyUnlockedStickers };
        }),
      placeSticker: (id, x, y) =>
        set((state) => {
          const sticker = state.stickers.find((s) => s.id === id);
          if (!sticker || !sticker.unlocked) return state;
          const placements = state.placements.filter((p) => p.id !== id);
          placements.push({ id, x, y });
          return { placements };
        }),
      registerPass: (_clipId: string, score?: number) => {
        const state = get();
        const nextTotal = state.totalPasses + 1;
        const updates: Partial<ProgressState> = { totalPasses: nextTotal };
        const milestones: MilestoneEntry[] = [...state.milestones];
        const stickers = [...state.stickers];

        const addMilestoneEntry = (type: MilestoneType) => {
          const id = `${type}-${Date.now()}`;
          milestones.push({
            id,
            type,
            createdAtIso: new Date().toISOString(),
            seen: false,
          });
        };

        if (nextTotal === 1) {
          const idx = stickers.findIndex((s) => s.id === 'star_common');
          if (idx >= 0 && !stickers[idx].unlocked) {
            stickers[idx] = { ...stickers[idx], unlocked: true };
          }
        }
        if (nextTotal === 5) {
          const idx = stickers.findIndex((s) => s.id === 'heart_common');
          if (idx >= 0 && !stickers[idx].unlocked) {
            stickers[idx] = { ...stickers[idx], unlocked: true };
          }
          addMilestoneEntry('five_signs');
        }
        if (nextTotal === 10) {
          const idx = stickers.findIndex((s) => s.id === 'rocket_rare');
          if (idx >= 0 && !stickers[idx].unlocked) {
            stickers[idx] = { ...stickers[idx], unlocked: true };
          }
          addMilestoneEntry('ten_signs');
        }

        // Golden Spark for perfect matches (score >= 0.9)
        if (score !== undefined && score >= 0.9) {
          const idx = stickers.findIndex((s) => s.id === 'golden_spark_epic');
          if (idx >= 0 && !stickers[idx].unlocked) {
            stickers[idx] = { ...stickers[idx], unlocked: true };
            addMilestoneEntry('golden_spark');
          }
        }

        return {
          ...state,
          ...updates,
          stickers,
          milestones,
        };
      },
      addMilestone: (type) =>
        set((state) => ({
          milestones: [
            ...state.milestones,
            {
              id: `${type}-${Date.now()}`,
              type,
              createdAtIso: new Date().toISOString(),
              seen: false,
            },
          ],
        })),
      dismissMilestone: (id) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === id ? { ...m, seen: true } : m,
          ),
        })),
      recordSessionActivity: () =>
        set((state) => {
          const today = todayIso();
          const last = state.streak.lastActivityIso;

          if (!last) {
            return {
              ...state,
              streak: {
                count: 1,
                lastActivityIso: today,
                graceUsedThisWeek: false,
              },
            };
          }

          if (isSameCalendarDay(last, today)) {
            return state;
          }

          const lastDate = new Date(last);
          const todayDate = new Date(today);
          const diffMs = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

          let { count, graceUsedThisWeek } = state.streak;

          if (diffDays === 1) {
            count += 1;
          } else if (diffDays === 2 && !graceUsedThisWeek) {
            graceUsedThisWeek = true;
          } else {
            count = 1;
            graceUsedThisWeek = false;
          }

          return {
            ...state,
            streak: {
              count,
              lastActivityIso: today,
              graceUsedThisWeek,
            },
          };
        }),
      dismissStickerUnlock: (id) =>
        set((state) => ({
          newlyUnlockedStickers: state.newlyUnlockedStickers.filter(
            (stickerId) => stickerId !== id,
          ),
        })),
      recordPathCompletion: (level) =>
        set((state) => {
          const milestones: MilestoneEntry[] = [...state.milestones];
          const stickers = [...state.stickers];

          // Add path complete milestone
          const id = `path_complete-${level}-${Date.now()}`;
          milestones.push({
            id,
            type: 'path_complete',
            createdAtIso: new Date().toISOString(),
            seen: false,
          });

          // Unlock Golden Spark on first path completion if not already unlocked
          const sparkIdx = stickers.findIndex((s) => s.id === 'golden_spark_epic');
          if (sparkIdx >= 0 && !stickers[sparkIdx].unlocked) {
            stickers[sparkIdx] = { ...stickers[sparkIdx], unlocked: true };
            // Note: We don't add to newlyUnlockedStickers here since this is triggered
            // by path completion, not by registerPass
          }

          return {
            milestones,
            stickers,
          };
        }),
    }),
    {
      name: 'progress-store',
      version: 1,
      storage: createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        stickers: state.stickers,
        placements: state.placements,
        totalPasses: state.totalPasses,
        milestones: state.milestones,
        streak: state.streak,
        newlyUnlockedStickers: state.newlyUnlockedStickers,
      }),
    },
  ),
);
