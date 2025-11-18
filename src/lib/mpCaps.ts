import { logger } from '../utils/logger';

export interface MediaPipeCaps {
  hasRequestVideoFrameCallback: boolean;
  hasOffscreenCanvas: boolean;
  hasWebGL: boolean;
  hasWebGPU: boolean;
  isSafariIos: boolean;
  isWorkerSupported: boolean;
}

let cachedCaps: MediaPipeCaps | null = null;

export function getMediaPipeCaps(): MediaPipeCaps {
  if (cachedCaps) return cachedCaps;

  const hasWindow = typeof window !== 'undefined';
  const hasNavigator = typeof navigator !== 'undefined';

  let hasRequestVideoFrameCallback = false;
  let hasOffscreenCanvas = false;
  let hasWebGL = false;
  let hasWebGPU = false;
  let isSafariIos = false;
  let isWorkerSupported = typeof Worker !== 'undefined';

  try {
    if (hasWindow) {
      const video = document.createElement('video') as any;
      hasRequestVideoFrameCallback = typeof video.requestVideoFrameCallback === 'function';
      // OffscreenCanvas is undefined on many platforms; feature-detect safely.
      hasOffscreenCanvas = typeof (window as any).OffscreenCanvas !== 'undefined';

      try {
        const canvas = document.createElement('canvas');
        const gl =
          (canvas.getContext('webgl') as WebGLRenderingContext | null) ??
          (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
        hasWebGL = !!gl;
      } catch {
        hasWebGL = false;
      }
    }

    if (hasNavigator) {
      const ua = navigator.userAgent ?? '';
      isSafariIos =
        /Safari/.test(ua) &&
        (!/Chrome/.test(ua) || /iPhone|iPad|iPod/.test(ua));
      hasWebGPU = typeof (navigator as any).gpu !== 'undefined';
    }
  } catch {
    // If any probe fails, caps stay at safe defaults.
  }

  cachedCaps = {
    hasRequestVideoFrameCallback,
    hasOffscreenCanvas,
    hasWebGL,
    hasWebGPU,
    isSafariIos,
    isWorkerSupported,
  };

  if ((import.meta as any)?.env?.DEV) {
    logger.mp.info('caps', cachedCaps);
  }

  return cachedCaps;
}

