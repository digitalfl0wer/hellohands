import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

type GestureType = 'next' | 'replay' | 'slow' | 'help' | 'pause' | 'resume';

interface GestureOptions {
  enabled: boolean;
  paused: boolean;
  suspended?: boolean;
  swipeThresholdRatio?: number;
  maxSwipeMs?: number;
  debounceMs?: number;
  palmHoldMs?: number;
  onGesture: (gesture: GestureType) => void;
}

interface PointerState {
  x: number;
  y: number;
  time: number;
}

export function useGestureInput({
  enabled,
  paused,
  suspended = false,
  swipeThresholdRatio = 0.15,
  maxSwipeMs = 400,
  debounceMs = 600,
  palmHoldMs = 3000,
  onGesture,
}: GestureOptions) {
  const startRef = useRef<PointerState | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const lastGestureTime = useRef(0);

  useEffect(() => {
    const shouldListen = (enabled || paused) && !suspended;
    if (!shouldListen) {
      return undefined;
    }

    const thresholdPx =
      Math.max(window.innerWidth, window.innerHeight) * swipeThresholdRatio;

    const clearLongPress = () => {
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };

    const emit = (gesture: GestureType, bypassDebounce = false) => {
      const now = Date.now();
      if (!bypassDebounce && now - lastGestureTime.current < debounceMs) {
        return;
      }
      lastGestureTime.current = now;
      logger.info('gesture', 'recognized', { gesture });
      onGesture(gesture);
    };

    const handlePointerDown = (event: PointerEvent) => {
      startRef.current = { x: event.clientX, y: event.clientY, time: Date.now() };
      clearLongPress();
      longPressTimer.current = window.setTimeout(() => {
        if (paused) {
          emit('resume', true);
        } else if (enabled) {
          emit('pause');
        }
      }, palmHoldMs);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!startRef.current) return;
      const dx = event.clientX - startRef.current.x;
      const dy = event.clientY - startRef.current.y;
      if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
        clearLongPress();
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!startRef.current) return;
      const started = startRef.current;
      clearLongPress();

      const now = Date.now();
      const dt = now - started.time;
      const dx = event.clientX - started.x;
      const dy = event.clientY - started.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (paused) {
        if (dt <= maxSwipeMs && absX < 25 && absY < 25) {
          emit('resume', true);
        }
        startRef.current = null;
        return;
      }

      if (!enabled) {
        startRef.current = null;
        return;
      }

      if (dt <= maxSwipeMs) {
        if (absX > absY && absX > thresholdPx) {
          emit(dx > 0 ? 'next' : 'replay');
        } else if (absY > thresholdPx) {
          emit(dy < 0 ? 'slow' : 'help');
        }
      }

      startRef.current = null;
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });

    return () => {
      clearLongPress();
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    enabled,
    paused,
    suspended,
    swipeThresholdRatio,
    maxSwipeMs,
    debounceMs,
    palmHoldMs,
    onGesture,
  ]);
}
