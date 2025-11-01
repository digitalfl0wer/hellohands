import express from 'express';
import { DEMO_SIGN_CLIPS } from '../src/data/demoClips';

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

const practicePacks: PracticePack[] = [
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

const licenseInfo = {
  dataset: 'MS-ASL',
  license: 'C-UDA (Computational Use of Data Agreement)',
  url: 'https://ms-asl.cs.rochester.edu/',
  attribution:
    'MS-ASL: A Large-Scale Data Set and Benchmark for Understanding American Sign Language. BMVC 2019.',
};

app.get(`${BASE_PATH}/packs`, (_req, res) => {
  res.json({
    packs: practicePacks.map(({ items, ...pack }) => ({
      ...pack,
      itemCount: items.length,
    })),
  });
});

app.get(`${BASE_PATH}/packs/:id`, (req, res) => {
  const pack = practicePacks.find((entry) => entry.id === req.params.id);
  if (!pack) {
    res.status(404).json({ error: 'Pack not found' });
    return;
  }
  res.json({ pack });
});

app.post(`${BASE_PATH}/practice/next`, (req, res) => {
  const { packId, cursor } = req.body ?? {};
  const pack = practicePacks.find((entry) => entry.id === packId) ?? practicePacks[0];
  if (!pack) {
    res.status(404).json({ error: 'Pack unavailable' });
    return;
  }
  const currentIndex = pack.items.findIndex((item) => item.id === cursor);
  const nextItem = pack.items[(currentIndex + 1) % pack.items.length];
  res.json({
    item: nextItem,
    pack: { id: pack.id, title: pack.title, level: pack.level },
  });
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
