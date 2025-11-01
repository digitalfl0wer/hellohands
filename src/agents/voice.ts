import { post } from '../gestures/gestureBus';

export const enableVoice = () => {
  if (import.meta.env.VITE_USE_VOICE !== '1') {
    return;
  }

  const SpeechRecognitionCtor: any =
    (typeof window !== 'undefined' &&
      ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition)) ||
    null;

  if (!SpeechRecognitionCtor) {
    return;
  }

  try {
    const recognition: any = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const results = event?.results;
      const transcript = results?.[results.length - 1]?.[0]?.transcript;
      if (!transcript) return;

      post({ intent: 'voice', text: String(transcript).trim().toLowerCase() });
    };

    recognition.onerror = () => {
      recognition.stop();
    };

    recognition.start();
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('Voice recognition unavailable:', error);
    }
  }
};
