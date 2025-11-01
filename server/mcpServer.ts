import express from 'express';

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
