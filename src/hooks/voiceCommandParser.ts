export type VoiceControlAction = 'next' | 'replay' | 'slow' | 'help' | 'pause' | 'resume';
export type VoiceParseResult =
  | { type: 'control'; action: VoiceControlAction }
  | { type: 'kidMode'; enabled: boolean }
  | { type: 'level'; level: number }
  | { type: 'navigate'; destination: 'welcome' };

const levelWords: Record<string, number> = {
  one: 1,
  1: 1,
  two: 2,
  2: 2,
  three: 3,
  3: 3,
};

const kidOnPhrases = ['kid mode on', 'kid on', 'kids mode on'];
const kidOffPhrases = ['kid mode off', 'kid off', 'kids mode off'];

const controlMatches: Array<{ phrases: string[]; action: VoiceControlAction }> = [
  { phrases: ['next', 'continue', 'go on'], action: 'next' },
  { phrases: ['replay', 'again', 'repeat'], action: 'replay' },
  { phrases: ['slow motion', 'slow-mo', 'slow'], action: 'slow' },
  { phrases: ['help', 'show help'], action: 'help' },
  { phrases: ['pause', 'hold on', 'stop'], action: 'pause' },
  { phrases: ['resume', 'play', 'continue lesson'], action: 'resume' },
];

export function parseVoiceCommand(transcript: string): VoiceParseResult | 'uncertain' {
  const normalized = transcript.trim().toLowerCase();
  if (!normalized) {
    return 'uncertain';
  }

  if (kidOnPhrases.some((phrase) => normalized.includes(phrase))) {
    return { type: 'kidMode', enabled: true };
  }
  if (kidOffPhrases.some((phrase) => normalized.includes(phrase))) {
    return { type: 'kidMode', enabled: false };
  }

  for (const { phrases, action } of controlMatches) {
    if (phrases.some((phrase) => normalized.includes(phrase))) {
      return { type: 'control', action };
    }
  }

  if (normalized.includes('level')) {
    for (const [key, value] of Object.entries(levelWords)) {
      if (normalized.includes(`level ${key}`) || normalized === key) {
        return { type: 'level', level: value };
      }
    }
  }

  if (normalized.includes('back') || normalized.includes('home')) {
    return { type: 'navigate', destination: 'welcome' };
  }

  return 'uncertain';
}
