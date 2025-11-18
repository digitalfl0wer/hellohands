import whitelistConfig from '../../practice/whitelist.json';
import vocabMap from '../../practice/vocab.map.json';
import { DEMO_SIGN_CLIPS, DEMO_SIGN_CLIP_MAP } from '../data/demoClips';

export type GestureType = 'thumbs_up' | 'open_palm' | 'point' | 'pinch';

export interface PracticeItem {
  id: string;
  sign: string;
  expectedGesture: GestureType;
  clipUrl: string;
  posterUrl?: string;
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
    items: DEMO_SIGN_CLIPS.map((clip) => ({
      id: clip.sign.toLowerCase().replace(/\s+/g, '-'),
      sign: clip.sign,
      expectedGesture: clip.expectedGesture,
      clipUrl: clip.clipUrl,
      posterUrl: clip.posterUrl,
    })),
  },
];

const USE_MCP = import.meta.env.VITE_USE_MCP === '1';
const MCP_BASE =
  import.meta.env.VITE_MCP_URL ??
  (import.meta.env.DEV ? 'http://localhost:5175/api/mcp' : '/api/mcp');

type WhitelistConfig = { allow: string[] };
type VocabEntry = { aliases?: string[]; one_handed?: boolean };

const ALLOW_SET = new Set(
  ((whitelistConfig as WhitelistConfig).allow ?? [])
    .map((entry) => entry.trim().toUpperCase())
    .filter(Boolean),
);

const VOCAB = vocabMap as Record<string, VocabEntry>;

const normalizePracticeItems = (items?: PracticeItem[]): PracticeItem[] => {
  if (!items?.length) {
    return [];
  }
  const seen = new Set<string>();
  return items.reduce<PracticeItem[]>((acc, item) => {
    const key =
      item.clipUrl?.trim().toLowerCase() ||
      item.id?.trim().toLowerCase() ||
      item.sign.trim().toLowerCase();
    if (seen.has(key)) {
      return acc;
    }
    seen.add(key);
    const normalizedSign = item.sign.trim().toUpperCase();
    const fallbackPoster =
      item.posterUrl ?? DEMO_SIGN_CLIP_MAP.get(normalizedSign)?.posterUrl;
    acc.push({
      ...item,
      posterUrl: fallbackPoster,
      sign: normalizedSign,
    });
    return acc;
  }, []);
};

const normalizePack = (pack: PracticePackSummary): PracticePackSummary => {
  const items = normalizePracticeItems(pack.items);
  return {
    ...pack,
    items,
    itemCount: items.length,
  };
};

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

    return normalizePack({
      ...pack,
      items: filteredItems,
    });
  }).filter((pack) => (pack.items?.length ?? 0) > 0);
};

const BYPASS_WHITELIST = import.meta.env.VITE_PRACTICE_BYPASS_WHITELIST === '1';
const FALLBACK_SANITISED = BYPASS_WHITELIST
  ? FALLBACK_PACKS.map(normalizePack)
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
    // Try local published pack under /public/local/local_pack.json (if present)
    try {
      const resp = await fetch('/local/local_pack.json', { cache: 'no-store' });
      if (resp.ok) {
        const localPack = normalizePack((await resp.json()) as PracticePackSummary);
        return [localPack, ...FALLBACK_SANITISED];
      }
    } catch {
      // ignore and fall back
    }
    return FALLBACK_SANITISED;
  }

  const result = await safeFetch<{ packs: PracticePackSummary[] }>('/packs');
  if (!result?.packs?.length) {
    return FALLBACK_SANITISED;
  }
  return result.packs.map(normalizePack);
}

export async function getPracticePack(id: string): Promise<PracticePackSummary | null> {
  if (!USE_MCP) {
    return FALLBACK_SANITISED.find((pack) => pack.id === id) ?? null;
  }

  const result = await safeFetch<{ pack: PracticePackSummary }>(`/packs/${id}`);
  if (result?.pack) {
    const normalized = normalizePack(result.pack);
    if ((normalized.items?.length ?? 0) > 0) return normalized;
  }
  // Graceful fallback if empty/unavailable
  return (
    FALLBACK_SANITISED.find((pack) => pack.id === id) ?? FALLBACK_SANITISED[0] ?? null
  );
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

  const result = await safeFetch<{ item: PracticeItem; pack: PracticePackSummary }>(
    '/practice/next',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packId, cursor }),
    },
  );
  if (result?.item && result.pack) {
    const pack = normalizePack(result.pack);
    const item = pack.items?.find((entry) => entry.id === result.item.id) ?? {
      ...result.item,
      posterUrl:
        result.item.posterUrl ??
        DEMO_SIGN_CLIP_MAP.get(result.item.sign.trim().toUpperCase())?.posterUrl,
      sign: result.item.sign.trim().toUpperCase(),
    };
    return { item, pack };
  }
  // Fallback to local rotation logic
  const pack =
    FALLBACK_SANITISED.find((entry) => entry.id === packId) ?? FALLBACK_SANITISED[0];
  if (!pack?.items?.length) return null;
  const index = pack.items.findIndex((item) => item.id === cursor);
  const nextItem = pack.items[(index + 1) % pack.items.length];
  return { item: nextItem, pack };
}

export interface LicenseInfo {
  dataset: string;
  license: string;
  url: string;
  attribution: string;
}

export async function fetchLicenseInfo(): Promise<LicenseInfo | null> {
  const dataset = import.meta.env.VITE_DATASET || 'MSASL';

  if (!USE_MCP) {
    if (dataset === 'ASLLVD') {
      return {
        dataset: 'ASLLVD',
        license: 'Boston University License',
        url: 'https://www.bu.edu/av/asllvd/',
        attribution:
          'American Sign Language Lexicon Video Dataset (ASLLVD). Athitsos, V., Neidle, C., Sclaroff, S., Nash, J., Stefan, A., Yuan, Q., & Thangali, A. (2008). Proceedings of the IEEE International Conference on Computer Vision Workshops.',
      };
    }
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
