import express from 'express';
import { DEMO_SIGN_CLIPS } from '../src/data/demoClips';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const app = express();
const PORT = Number(process.env.MCP_PORT ?? 5175);
const BASE_PATH = '/api/mcp';

app.use(express.json());
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

type PracticeItem = {
  id: string;
  sign: string;
  expectedGesture: 'thumbs_up' | 'open_palm' | 'point' | 'pinch';
  clipUrl: string;
  posterUrl?: string;
};

type PracticePack = {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  items: PracticeItem[];
};

const defaultPacks: PracticePack[] = [
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

function normalizeItems(items?: PracticeItem[]): PracticeItem[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items
    .filter((it): it is PracticeItem => Boolean(it && it.sign && it.clipUrl))
    .map((it) => ({
      ...it,
      sign: it.sign.trim().toUpperCase(),
      id: it.id || it.sign.trim().toLowerCase().replace(/\s+/g, '-'),
    }))
    .filter((it) => {
      const key = (it.clipUrl || it.id).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function loadLocalPack(): Promise<PracticePack | null> {
  try {
    const path = resolve(process.cwd(), 'public', 'local', 'local_pack.json');
    const raw = await readFile(path, 'utf8');
    const pack = JSON.parse(raw) as PracticePack;
    const items = normalizeItems(pack.items);
    if (!items.length) return null;
    return { ...pack, items };
  } catch {
    return null;
  }
}

async function getAvailablePacks(): Promise<PracticePack[]> {
  const local = await loadLocalPack();
  const packs: PracticePack[] = [];
  if (local) packs.push(local);
  for (const p of defaultPacks) {
    const items = normalizeItems(p.items);
    if (items.length) packs.push({ ...p, items });
  }
  return packs;
}

const licenseInfo = {
  dataset: 'MS-ASL',
  license: 'C-UDA (Computational Use of Data Agreement)',
  url: 'https://ms-asl.cs.rochester.edu/',
  attribution:
    'MS-ASL: A Large-Scale Data Set and Benchmark for Understanding American Sign Language. BMVC 2019.',
};

app.get(`${BASE_PATH}/packs`, async (_req, res) => {
  const packs = await getAvailablePacks();
  res.json({
    packs: packs.map(({ items, ...pack }) => ({ ...pack, itemCount: items.length })),
  });
});

app.get(`${BASE_PATH}/packs/:id`, async (req, res) => {
  const packs = await getAvailablePacks();
  const pack = packs.find((entry) => entry.id === req.params.id) ?? packs[0];
  if (!pack) {
    res.status(404).json({ error: 'No packs available' });
    return;
  }
  res.json({ pack });
});

app.post(`${BASE_PATH}/practice/next`, async (req, res) => {
  const { packId, cursor } = (req.body ?? {}) as { packId?: string; cursor?: string };
  const packs = await getAvailablePacks();
  const pack = packs.find((entry) => entry.id === packId) ?? packs[0];
  if (!pack || !pack.items?.length) {
    res.status(404).json({ error: 'No items available' });
    return;
  }
  const currentIndex = pack.items.findIndex((item) => item.id === cursor);
  const nextItem = pack.items[(currentIndex + 1) % pack.items.length];
  res.json({ item: nextItem, pack: { id: pack.id, title: pack.title, level: pack.level } });
});

app.get(`${BASE_PATH}/license`, (_req, res) => {
  res.json(licenseInfo);
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[mcpServer] listening on http://localhost:${PORT}${BASE_PATH}`);
});
