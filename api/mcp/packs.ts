import { practicePacks } from './_data';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const packs = practicePacks.map(({ items, ...pack }) => ({
    ...pack,
    itemCount: items.length,
  }));

  res.status(200).json({ packs });
}


