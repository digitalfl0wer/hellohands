import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enableVoice } from '../voice';

describe('enableVoice', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('does nothing when voice flag is not enabled', () => {
    vi.stubEnv('VITE_USE_VOICE', '0');
    const startSpy = vi.fn();
    const FakeSpeechRecognition = vi.fn(function (this: any) {
      this.continuous = false;
      this.interimResults = false;
      this.lang = '';
      this.onresult = null;
      this.onerror = null;
      this.start = startSpy;
      this.stop = vi.fn();
    });

    Object.defineProperty(window as any, 'webkitSpeechRecognition', {
      configurable: true,
      writable: true,
      value: FakeSpeechRecognition,
    });

    enableVoice();

    expect(FakeSpeechRecognition).not.toHaveBeenCalled();
    expect(startSpy).not.toHaveBeenCalled();
  });

  it('starts recognition when flag enabled and API present', () => {
    vi.stubEnv('VITE_USE_VOICE', '1');
    const startSpy = vi.fn();
    const FakeSpeechRecognition = vi.fn(function (this: any) {
      this.continuous = false;
      this.interimResults = false;
      this.lang = '';
      this.onresult = null;
      this.onerror = null;
      this.start = startSpy;
      this.stop = vi.fn();
    });

    Object.defineProperty(window as any, 'webkitSpeechRecognition', {
      configurable: true,
      writable: true,
      value: FakeSpeechRecognition,
    });

    enableVoice();

    expect(FakeSpeechRecognition).toHaveBeenCalledTimes(1);
    expect(startSpy).toHaveBeenCalledTimes(1);
  });
});
