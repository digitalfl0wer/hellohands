import { useEffect, useRef } from 'react';
import { parseVoiceCommand, VoiceParseResult } from './voiceCommandParser';
import { logger } from '../utils/logger';

interface VoiceInputOptions {
  enabled: boolean;
  paused: boolean;
  onCommand: (result: VoiceParseResult) => void;
  onUnrecognized: () => void;
  onError: (reason?: string) => void;
}

interface RecognitionResultEvent {
  results: ArrayLike<{ [index: number]: { transcript: string } }>;
}

interface RecognitionErrorEvent {
  error?: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export function useVoiceInput({
  enabled,
  paused,
  onCommand,
  onUnrecognized,
  onError,
}: VoiceInputOptions) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const callbacksRef = useRef({
    onCommand,
    onUnrecognized,
    onError,
  });
  const optionsRef = useRef({ enabled, paused });

  useEffect(() => {
    callbacksRef.current = { onCommand, onUnrecognized, onError };
  }, [onCommand, onUnrecognized, onError]);

  useEffect(() => {
    optionsRef.current = { enabled, paused };
  }, [enabled, paused]);

  useEffect(() => {
    const SpeechRecognitionImpl = (window as any).SpeechRecognition as
      | SpeechRecognitionConstructor
      | undefined;
    const WebkitImpl = (window as any).webkitSpeechRecognition as
      | SpeechRecognitionConstructor
      | undefined;

    const Constructor = SpeechRecognitionImpl || WebkitImpl;
    if (!Constructor) {
      return undefined;
    }

    const recognition = new Constructor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0]?.transcript ?? '';
      const parsed = parseVoiceCommand(transcript);
      const { onCommand: handleCommand, onUnrecognized: handleUnrecognized } =
        callbacksRef.current;

      if (parsed === 'uncertain') {
        logger.info('voice', 'uncertain', { transcript });
        handleUnrecognized();
      } else {
        logger.info('voice', 'recognized', parsed);
        handleCommand(parsed);
      }
    };

    recognition.onerror = (event) => {
      const message = event.error ?? event.message;
      logger.warn('voice', 'error', { error: message });
      callbacksRef.current.onError(message);
    };

    recognition.onend = () => {
      const { enabled: shouldRun, paused: isPaused } = optionsRef.current;
      if (!shouldRun || isPaused) {
        return;
      }
      try {
        recognition.start();
      } catch (error) {
        const reason = (error as Error).message;
        logger.warn('voice', 'restart_failed', { reason });
        callbacksRef.current.onError(reason);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (!enabled || paused) {
      recognition.stop();
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      const reason = (error as Error).message;
      logger.warn('voice', 'start_failed', { reason });
      callbacksRef.current.onError(reason);
    }
  }, [enabled, paused]);
}
