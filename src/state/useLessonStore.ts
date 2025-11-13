import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type FeedbackState = 'idle' | 'pass' | 'almost' | 'miss';
export type RuntimeMode = 'hands' | 'tasks';

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
  introDismissed: boolean;
  level: number;
  stars: number;
  maxStars: number;
  index: number;
  clips: ClipDescriptor[];
  feedback: FeedbackState;
  runtimeMode: RuntimeMode;
  workerOn: boolean;
  countdownOn: boolean;
  refractoryOn: boolean;
  setKidMode: (enabled: boolean) => void;
  toggleVoice: () => void;
  toggleGestures: () => void;
  setIntroDismissed: (value: boolean) => void;
  setClips: (clips: ClipDescriptor[]) => void;
  resetSession: () => void;
  registerResult: (result: FeedbackState) => void;
  nextClip: () => void;
  setFeedback: (state: FeedbackState) => void;
  setRuntimeMode: (mode: RuntimeMode) => void;
  toggleWorkerOn: () => void;
  toggleCountdown: () => void;
  toggleRefractory: () => void;
}

const MAX_STARS_PER_LEVEL = 5;

const DEFAULT_RUNTIME_MODE: RuntimeMode =
  String((import.meta as any)?.env?.VITE_GESTURE_RUNTIME ?? 'hands').toLowerCase() ===
  'tasks'
    ? 'tasks'
    : 'hands';
const DEFAULT_WORKER_ON =
  String(
    (import.meta as any)?.env?.VITE_GESTURE_WORKER_ON ??
      (DEFAULT_RUNTIME_MODE === 'tasks' ? '1' : '0'),
  ) === '1';
const DEFAULT_COUNTDOWN_ON =
  String((import.meta as any)?.env?.VITE_ENABLE_COUNTDOWN ?? '1') === '1';
const DEFAULT_REFRACTORY_ON =
  String((import.meta as any)?.env?.VITE_ENABLE_REFRACTORY ?? '1') === '1';

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
      introDismissed: false,
      level: 1,
      stars: 0,
      maxStars: MAX_STARS_PER_LEVEL,
      index: 0,
      clips: [],
      feedback: 'idle',
      runtimeMode: DEFAULT_RUNTIME_MODE,
      workerOn: DEFAULT_WORKER_ON,
      countdownOn: DEFAULT_COUNTDOWN_ON,
      refractoryOn: DEFAULT_REFRACTORY_ON,
      setKidMode: (enabled) => set(() => ({ kidMode: enabled })),
      toggleVoice: () => set((state) => ({ voiceOn: !state.voiceOn })),
      toggleGestures: () => set((state) => ({ gesturesOn: !state.gesturesOn })),
      setIntroDismissed: (value) => set(() => ({ introDismissed: value })),
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
      setRuntimeMode: (mode) => set(() => ({ runtimeMode: mode })),
      toggleWorkerOn: () => set((state) => ({ workerOn: !state.workerOn })),
      toggleCountdown: () => set((state) => ({ countdownOn: !state.countdownOn })),
      toggleRefractory: () => set((state) => ({ refractoryOn: !state.refractoryOn })),
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
        introDismissed: state.introDismissed,
        level: state.level,
        stars: state.stars,
        runtimeMode: state.runtimeMode,
        workerOn: state.workerOn,
        countdownOn: state.countdownOn,
        refractoryOn: state.refractoryOn,
      }),
    },
  ),
);

export const selectManualMode = (state: LessonState): boolean =>
  !state.voiceOn && !state.gesturesOn;

export const selectCurrentClip = (state: LessonState): ClipDescriptor | undefined =>
  state.clips[state.index];
