import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { ClipDescriptor, useLessonStore } from '../useLessonStore';

afterEach(() => {
  const { resetSession, setClips } = useLessonStore.getState();
  resetSession();
  setClips([]);
});

describe('useLessonStore', () => {
  it('increments stars and unlocks next level after five passes', () => {
    act(() => {
      useLessonStore.setState({ stars: 4, level: 1 });
      useLessonStore.getState().registerResult('pass');
    });

    const { stars, level } = useLessonStore.getState();
    expect(stars).toBe(0);
    expect(level).toBe(2);
  });

  it('decrements stars on miss and never goes negative', () => {
    act(() => {
      useLessonStore.setState({ stars: 0 });
      useLessonStore.getState().registerResult('miss');
    });

    expect(useLessonStore.getState().stars).toBe(0);

    act(() => {
      useLessonStore.setState({ stars: 3 });
      useLessonStore.getState().registerResult('miss');
    });

    expect(useLessonStore.getState().stars).toBe(2);
  });

  it('advances to next clip in the queue, wrapping around', () => {
    const clips: ClipDescriptor[] = [
      { id: '1', poster: '', video: '', label: 'hello' },
      { id: '2', poster: '', video: '', label: 'thank-you' },
    ];

    act(() => {
      useLessonStore.getState().setClips(clips);
    });

    expect(useLessonStore.getState().index).toBe(0);

    act(() => {
      useLessonStore.getState().nextClip();
    });
    expect(useLessonStore.getState().index).toBe(1);

    act(() => {
      useLessonStore.getState().nextClip();
    });
    expect(useLessonStore.getState().index).toBe(0);
  });

  it('resets feedback to idle when registerResult receives idle', () => {
    act(() => {
      useLessonStore.setState({ feedback: 'pass' });
      useLessonStore.getState().registerResult('idle');
    });

    expect(useLessonStore.getState().feedback).toBe('idle');
  });

  it('derives manual mode when voice and gestures are off', () => {
    expect(useLessonStore.getState().voiceOn).toBe(true);
    expect(useLessonStore.getState().gesturesOn).toBe(true);

    act(() => {
      useLessonStore.getState().toggleVoice();
      useLessonStore.getState().toggleGestures();
    });

    expect(useLessonStore.getState().voiceOn).toBe(false);
    expect(useLessonStore.getState().gesturesOn).toBe(false);
    expect(
      useLessonStore.getState().voiceOn || useLessonStore.getState().gesturesOn,
    ).toBe(false);
  });
});
