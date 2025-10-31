import { useEffect, useRef } from 'react';
import { parseVoiceCommand, VoiceParseResult } from './voiceCommandParser';

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
      if (parsed === 'uncertain') {
        onUnrecognized();
      } else {
        onCommand(parsed);
      }
    };

    recognition.onerror = (event) => {
      onError(event.error ?? event.message);
    };

    recognition.onend = () => {
      if (recognitionRef.current && enabled && !paused) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          onError((error as Error).message);
        }
      }
    };

    recognitionRef.current = recognition;

    if (enabled && !paused) {
      try {
        recognition.start();
      } catch (error) {
        onError((error as Error).message);
      }
    }

    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [enabled, paused, onCommand, onUnrecognized, onError]);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (enabled && !paused) {
      try {
        recognition.start();
      } catch (error) {
        // ignore errors when already started
      }
    } else {
      recognition.stop();
    }
  }, [enabled, paused]);
}
