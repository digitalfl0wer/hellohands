import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { useGestureInput } from '../useGestureInput';

function TestHarness({ onGesture }: { onGesture: (gesture: string) => void }) {
  useGestureInput({ enabled: true, paused: false, onGesture });
  return <div data-testid="root">root</div>;
}

describe('useGestureInput', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits next on sufficient right swipe', () => {
    const onGesture = vi.fn();
    render(<TestHarness onGesture={onGesture} />);

    const start = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    const end = new PointerEvent('pointerup', { clientX: 300, clientY: 110 });
    window.dispatchEvent(start);
    window.dispatchEvent(end);

    expect(onGesture).toHaveBeenCalledWith('next');
  });

  it('debounces rapid consecutive gestures', () => {
    const onGesture = vi.fn();
    render(<TestHarness onGesture={onGesture} />);

    const start1 = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    const end1 = new PointerEvent('pointerup', { clientX: 300, clientY: 100 });
    window.dispatchEvent(start1);
    window.dispatchEvent(end1);

    const start2 = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    const end2 = new PointerEvent('pointerup', { clientX: 300, clientY: 100 });
    window.dispatchEvent(start2);
    window.dispatchEvent(end2);

    expect(onGesture).toHaveBeenCalledTimes(1);
  });

  it('emits pause after long press when enabled and not paused', () => {
    vi.useFakeTimers();
    const onGesture = vi.fn();
    render(<TestHarness onGesture={onGesture} />);

    const start = new PointerEvent('pointerdown', { clientX: 200, clientY: 200 });
    window.dispatchEvent(start);
    vi.advanceTimersByTime(3100);

    expect(onGesture).toHaveBeenCalledWith('pause');
  });
});
