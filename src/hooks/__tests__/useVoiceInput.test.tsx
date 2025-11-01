import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { useVoiceInput } from '../useVoiceInput';

vi.mock('../../utils/logger', () => {
  const noop = vi.fn();
  const logger = {
    info: noop,
    warn: noop,
    error: noop,
    getBuffer: vi.fn(() => []),
    clear: noop,
    download: noop,
  };
  return { logger, default: logger };
});

type SpeechRecognitionMock = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionMock;

type HarnessProps = {
  enabled: boolean;
  paused: boolean;
  onCommand: (value: unknown) => void;
  onUnrecognized: () => void;
  onError: (reason?: string) => void;
};

function VoiceHarness(props: HarnessProps) {
  useVoiceInput(props);
  return <div data-testid="voice-harness" />;
}

describe('useVoiceInput', () => {
  const instances: SpeechRecognitionMock[] = [];
  const startSpy = vi.fn();
  const stopSpy = vi.fn();

  beforeEach(() => {
    instances.length = 0;
    startSpy.mockReset();
    stopSpy.mockReset();

    const FakeSpeechRecognition = vi
      .fn(function (this: SpeechRecognitionMock) {
        this.lang = '';
        this.interimResults = false;
        this.continuous = false;
        this.maxAlternatives = 0;
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        this.start = startSpy;
        this.stop = stopSpy;
        instances.push(this);
      }) as unknown as SpeechRecognitionConstructor;

    Object.defineProperty(window as any, 'webkitSpeechRecognition', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: FakeSpeechRecognition,
    });
  });

  afterEach(() => {
    delete (window as any).webkitSpeechRecognition;
    vi.clearAllMocks();
  });

  it('does not recreate the recognition instance when callbacks change', () => {
    const commandA = vi.fn();
    const commandB = vi.fn();
    const noop = vi.fn();

    const { rerender } = render(
      <VoiceHarness
        enabled
        paused={false}
        onCommand={commandA}
        onUnrecognized={noop}
        onError={noop}
      />,
    );

    expect(instances.length).toBe(1);
    expect(startSpy).toHaveBeenCalledTimes(1);

    rerender(
      <VoiceHarness
        enabled
        paused={false}
        onCommand={commandB}
        onUnrecognized={noop}
        onError={noop}
      />,
    );

    expect(instances.length).toBe(1);
    expect(startSpy).toHaveBeenCalledTimes(1);
  });

  it('restarts recognition on end only when still enabled', () => {
    const noop = vi.fn();
    const onError = vi.fn();

    const { rerender } = render(
      <VoiceHarness
        enabled
        paused={false}
        onCommand={noop}
        onUnrecognized={noop}
        onError={onError}
      />,
    );

    const recognition = instances[0];
    expect(recognition).toBeDefined();
    expect(startSpy).toHaveBeenCalledTimes(1);

    recognition.onend?.();
    expect(startSpy).toHaveBeenCalledTimes(2);

    rerender(
      <VoiceHarness
        enabled={false}
        paused={false}
        onCommand={noop}
        onUnrecognized={noop}
        onError={onError}
      />,
    );

    recognition.onend?.();
    expect(startSpy).toHaveBeenCalledTimes(2);
    expect(onError).not.toHaveBeenCalled();
  });
});
