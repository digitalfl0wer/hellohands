import { practicePacks } from '../../_data';

export default function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const id = (req.query?.id ?? '').toString();
  const pack = practicePacks.find((entry) => entry.id === id);
  if (!pack) {
    res.status(404).json({ error: 'Pack not found' });
    return;
  }
  res.status(200).json({ pack });
}


