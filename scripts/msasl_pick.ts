import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';

type Row = {
  id?: number | string;
  class_name: string;
  split?: 'train' | 'val' | 'test';
  url?: string; // if present
  youtube_id?: string; // or this
  clip?: string; // optional local path
};

const want = new Set(
  (process.env.CLASSES ?? 'WATER,EAT,DRINK')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean),
);

const split = (process.env.SPLIT ?? 'all').toLowerCase();

async function main(): Promise<void> {
  const labelsPath = resolve('data', 'processed', 'msasl', 'labels.jsonl');
  const raw = await readFile(labelsPath, 'utf8');
  const out: Row[] = [];
  const perClassCap = Number(process.env.PER_CLASS ?? '0'); // 0 = unlimited
  const perClassCounts = new Map<string, number>();

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as Row;
    const name = row.class_name?.toUpperCase();
    if (!name || !want.has(name)) continue;
    if (split !== 'all' && row.split && row.split !== (split as any)) continue;
    if (perClassCap > 0) {
      const c = perClassCounts.get(name) ?? 0;
      if (c >= perClassCap) continue;
      perClassCounts.set(name, c + 1);
    }
    out.push(row);
  }

  await mkdir(resolve('data', 'tmp'), { recursive: true });
  // 1) compact JSON list
  await writeFile(resolve('data', 'tmp', 'pick.json'), JSON.stringify(out, null, 2));
  // 2) plain text URLs (if present)
  let urls = out
    .map(
      (r) =>
        r.url ?? (r.youtube_id ? `https://www.youtube.com/watch?v=${r.youtube_id}` : ''),
    )
    .filter(Boolean);
  // Fallback: try DATA_ROOT/msasl/filtered sources if labels.jsonl had no URLs
  if (urls.length === 0) {
    const dataRoot = process.env.DATA_ROOT || resolve(process.env.HOME || '', 'datasets');
    const filteredDir = resolve(dataRoot, 'msasl', 'filtered');
    try {
      const entries = await readdir(filteredDir);
      const jsonFiles = entries.filter((f) => f.endsWith('.json'));
      const wantUpper = want;
      const collected: Row[] = [];
      for (const f of jsonFiles) {
        const p = join(filteredDir, f);
        const s = await stat(p).catch(() => null);
        if (!s || !s.isFile()) continue;
        const rawJson = await readFile(p, 'utf8').catch(() => '');
        if (!rawJson.trim()) continue;
        let arr: Row[] = [];
        try {
          arr = JSON.parse(rawJson) as Row[];
        } catch {
          continue;
        }
        for (const row of arr) {
          const name =
            row.class_name?.toUpperCase?.() || (row as any).label_text?.toUpperCase?.();
          if (!name || !wantUpper.has(name)) continue;
          if (split !== 'all' && row.split && row.split !== (split as any)) continue;
          collected.push(row);
        }
      }
      urls = collected
        .map(
          (r) =>
            r.url ??
            (r.youtube_id ? `https://www.youtube.com/watch?v=${r.youtube_id}` : ''),
        )
        .filter(Boolean);
    } catch {
      // ignore fallback errors; we'll just emit empty urls
    }
  }

  await writeFile(resolve('data', 'tmp', 'pick_urls.txt'), urls.join('\n'));

  // eslint-disable-next-line no-console
  console.log(
    `[pick] selected ${out.length} items for: ${[...want].join(', ')} (split=${split})`,
  );
  // eslint-disable-next-line no-console
  console.log('• data/tmp/pick.json');
  // eslint-disable-next-line no-console
  console.log(`• data/tmp/pick_urls.txt (${urls.length} urls)`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
