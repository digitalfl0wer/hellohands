import whitelistConfig from '../../practice/whitelist.json';
import vocabMap from '../../practice/vocab.map.json';

export type GestureType = 'thumbs_up' | 'open_palm' | 'point' | 'pinch';

export interface PracticeItem {
  id: string;
  sign: string;
  expectedGesture: GestureType;
  clipUrl: string;
}

export interface PracticePackSummary {
  id: string;
  title: string;
  level: number;
  itemCount?: number;
  items?: PracticeItem[];
}

const FALLBACK_PACKS: PracticePackSummary[] = [
  {
    id: 'L1-ESSENTIALS',
    title: 'Level 1 · Essentials',
    level: 1,
    items: [
      {
        id: 'hello',
        sign: 'HELLO',
        expectedGesture: 'open_palm',
        clipUrl: '/signs/level1/hello/front.mp4',
      },
      {
        id: 'thank-you',
        sign: 'THANK YOU',
        expectedGesture: 'open_palm',
        clipUrl: '/signs/level1/thank-you/front.mp4',
      },
      {
        id: 'yes',
        sign: 'YES',
        expectedGesture: 'thumbs_up',
        clipUrl: '/signs/level1/yes/front.mp4',
      },
      {
        id: 'no',
        sign: 'NO',
        expectedGesture: 'point',
        clipUrl: '/signs/level1/no/front.mp4',
      },
      {
        id: 'more',
        sign: 'MORE',
        expectedGesture: 'pinch',
        clipUrl: '/signs/level1/more/front.mp4',
      },
    ],
  },
];

const USE_MCP = import.meta.env.VITE_USE_MCP === '1';
const MCP_BASE =
  import.meta.env.VITE_MCP_URL ?? (import.meta.env.DEV ? 'http://localhost:5175/api/mcp' : '/api/mcp');

type WhitelistConfig = { allow: string[] };
type VocabEntry = { aliases?: string[]; one_handed?: boolean };

const ALLOW_SET = new Set(
  ((whitelistConfig as WhitelistConfig).allow ?? [])
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean),
);

const VOCAB = vocabMap as Record<string, VocabEntry>;

const sanitizeFallbackPacks = (): PracticePackSummary[] => {
  return FALLBACK_PACKS.map((pack) => {
    const filteredItems = pack.items?.filter((item) => {
      const normalized = item.sign.trim().toUpperCase();
      if (!ALLOW_SET.has(normalized)) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('[practiceApi] dropping item not in whitelist', {
            pack: pack.id,
            item: item.sign,
          });
        }
        return false;
      }
      const vocabEntry = VOCAB[normalized];
      if (!vocabEntry?.one_handed) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('[practiceApi] dropping item missing one_handed flag', {
            pack: pack.id,
            item: item.sign,
          });
        }
        return false;
      }
      return true;
    });

    return {
      ...pack,
      items: filteredItems,
    };
  }).filter((pack) => (pack.items?.length ?? 0) > 0);
};

const BYPASS_WHITELIST = import.meta.env.VITE_PRACTICE_BYPASS_WHITELIST === '1';
const FALLBACK_SANITISED = BYPASS_WHITELIST
  ? FALLBACK_PACKS
  : sanitizeFallbackPacks();

async function safeFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${MCP_BASE}${path}`, init);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[practiceApi] falling back to fixtures', error);
    }
    return null;
  }
}

export async function listPracticePacks(): Promise<PracticePackSummary[]> {
  if (!USE_MCP) {
    return FALLBACK_SANITISED;
  }

  const result = await safeFetch<{ packs: PracticePackSummary[] }>('/packs');
  if (!result?.packs?.length) {
    return FALLBACK_SANITISED;
  }
  return result.packs;
}

export async function getPracticePack(id: string): Promise<PracticePackSummary | null> {
  if (!USE_MCP) {
    return FALLBACK_SANITISED.find((pack) => pack.id === id) ?? null;
  }

  const result = await safeFetch<{ pack: PracticePackSummary }>(`/packs/${id}`);
  return result?.pack ?? null;
}

export async function getNextPracticeItem(
  packId: string,
  cursor?: string,
): Promise<{ item: PracticeItem; pack: PracticePackSummary } | null> {
  if (!USE_MCP) {
    const pack =
      FALLBACK_SANITISED.find((entry) => entry.id === packId) ?? FALLBACK_SANITISED[0];
    if (!pack?.items?.length) {
      return null;
    }
    const index = pack.items.findIndex((item) => item.id === cursor);
    const nextItem = pack.items[(index + 1) % pack.items.length];
    return { item: nextItem, pack };
  }

  return safeFetch<{ item: PracticeItem; pack: PracticePackSummary }>('/practice/next', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId, cursor }),
  });
}

export interface LicenseInfo {
  dataset: string;
  license: string;
  url: string;
  attribution: string;
}

export async function fetchLicenseInfo(): Promise<LicenseInfo | null> {
  if (!USE_MCP) {
    return {
      dataset: 'MS-ASL',
      license: 'C-UDA (Computational Use of Data Agreement)',
      url: 'https://ms-asl.cs.rochester.edu/',
      attribution:
        'MS-ASL: A Large-Scale Data Set and Benchmark for Understanding American Sign Language. BMVC 2019.',
    };
  }
  return safeFetch<LicenseInfo>('/license');
}
