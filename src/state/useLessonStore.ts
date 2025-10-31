import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type FeedbackState = 'idle' | 'pass' | 'almost' | 'miss';

export interface ClipDescriptor {
  id: string;
  poster: string;
  video: string;
  label: string;
}

interface LessonState {
  kidMode: boolean;
  voiceOn: boolean;
  gesturesOn: boolean;
  level: number;
  stars: number;
  maxStars: number;
  index: number;
  clips: ClipDescriptor[];
  feedback: FeedbackState;
  setKidMode: (enabled: boolean) => void;
  toggleVoice: () => void;
  toggleGestures: () => void;
  setClips: (clips: ClipDescriptor[]) => void;
  resetSession: () => void;
  registerResult: (result: FeedbackState) => void;
  nextClip: () => void;
  setFeedback: (state: FeedbackState) => void;
}

const MAX_STARS_PER_LEVEL = 5;

const noopStorage: Storage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => undefined,
  removeItem: (_key: string) => undefined,
  clear: () => undefined,
  key: (_index: number) => null,
  length: 0,
};

export const useLessonStore = create<LessonState>()(
  persist(
    (set, get) => ({
      kidMode: false,
      voiceOn: true,
      gesturesOn: true,
      level: 1,
      stars: 0,
      maxStars: MAX_STARS_PER_LEVEL,
      index: 0,
      clips: [],
      feedback: 'idle',
      setKidMode: (enabled) => set(() => ({ kidMode: enabled })),
      toggleVoice: () => set((state) => ({ voiceOn: !state.voiceOn })),
      toggleGestures: () => set((state) => ({ gesturesOn: !state.gesturesOn })),
      setClips: (clips) =>
        set(() => ({
          clips,
          index: 0,
        })),
      resetSession: () =>
        set((state) => ({
          stars: 0,
          index: 0,
          feedback: 'idle',
          level: state.level,
        })),
      registerResult: (result) => {
        if (result === 'idle') {
          set(() => ({ feedback: 'idle' }));
          return;
        }

        set((state) => {
          let nextStars = state.stars;
          let nextLevel = state.level;

          if (result === 'pass') {
            nextStars = Math.min(state.maxStars, state.stars + 1);
            if (nextStars >= state.maxStars) {
              nextLevel = state.level + 1;
              nextStars = 0;
            }
          } else if (result === 'miss') {
            nextStars = Math.max(0, state.stars - 1);
          }

          return {
            stars: nextStars,
            level: nextLevel,
            feedback: result,
          };
        });
      },
      nextClip: () => {
        const { clips, index } = get();
        if (clips.length === 0) return;
        const nextIndex = (index + 1) % clips.length;
        set(() => ({
          index: nextIndex,
          feedback: 'idle',
        }));
      },
      setFeedback: (state) => set(() => ({ feedback: state })),
    }),
    {
      name: 'lesson-store',
      version: 1,
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage,
      ),
      partialize: (state) => ({
        kidMode: state.kidMode,
        voiceOn: state.voiceOn,
        gesturesOn: state.gesturesOn,
        level: state.level,
        stars: state.stars,
      }),
    },
  ),
);

export const selectManualMode = (state: LessonState): boolean =>
  !state.voiceOn && !state.gesturesOn;

export const selectCurrentClip = (state: LessonState): ClipDescriptor | undefined =>
  state.clips[state.index];
