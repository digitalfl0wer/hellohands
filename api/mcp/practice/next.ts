import { practicePacks } from '../_data';

type Body = { packId?: string; cursor?: string };

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const rawBody: Body | string | undefined = req.body as any;
  let body: Body | undefined;
  try {
    body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  } catch {
    body = undefined;
  }

  const packId = body?.packId;
  const cursor = body?.cursor;

  const pack = practicePacks.find((entry) => entry.id === packId) ?? practicePacks[0];
  if (!pack) {
    res.status(404).json({ error: 'Pack unavailable' });
    return;
  }

  const currentIndex = pack.items.findIndex((item) => item.id === cursor);
  const nextItem = pack.items[(currentIndex + 1) % pack.items.length];
  res.status(200).json({
    item: nextItem,
    pack: { id: pack.id, title: pack.title, level: pack.level },
  });
}


