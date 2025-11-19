import { mkdir, readFile, writeFile, cp, readdir, stat } from 'node:fs/promises';
import { basename, dirname, resolve, join } from 'node:path';

type Row = {
  class_name: string;
  url?: string;
  youtube_id?: string;
};

const EXPECTED: Record<string, 'thumbs_up' | 'open_palm' | 'point' | 'pinch'> = {
  YES: 'thumbs_up',
  NO: 'open_palm',
  WHERE: 'point',
  EAT: 'pinch',
  DRINK: 'pinch',
  MORE: 'pinch',
  HELLO: 'open_palm',
  'THANK YOU': 'open_palm',
  STOP: 'open_palm',
  HELP: 'open_palm',
  PLEASE: 'open_palm',
};

async function main(): Promise<void> {
  const dataRoot = process.env.DATA_ROOT || resolve(process.env.HOME || '', 'datasets');
  const rawDirA = resolve(dataRoot, 'msasl', 'raw');
  const rawDirB = resolve(dataRoot, 'processed', 'msasl', 'raw');
  const outDir = resolve('public', 'local');
  const perClassCap = Number(process.env.PER_CLASS ?? '3');
  const minItems = Number(process.env.MIN_ITEMS ?? '10');

  const pickPath = resolve('data', 'tmp', 'pick.json');
  const raw = await readFile(pickPath, 'utf8');
  const rows = JSON.parse(raw) as Row[];

  const want = new Set<string>();
  for (const r of rows) {
    const s = r.class_name?.toUpperCase?.();
    if (s) want.add(s);
  }

  const items: Array<{
    id: string;
    sign: string;
    expectedGesture: any;
    clipUrl: string;
  }> = [];
  const counts = new Map<string, number>();

  await mkdir(outDir, { recursive: true });

  // Build mapping by scanning filtered JSONs to recover url/youtube_id → filename
  const filteredDir = resolve(dataRoot, 'msasl', 'filtered');
  try {
    const entries = await readdir(filteredDir);
    const jsonFiles = entries.filter((f) => f.endsWith('.json'));
    for (const f of jsonFiles) {
      const p = join(filteredDir, f);
      const s = await stat(p).catch(() => null);
      if (!s || !s.isFile()) continue;
      const body = await readFile(p, 'utf8').catch(() => '');
      if (!body.trim()) continue;
      let arr: Row[] = [];
      try {
        arr = JSON.parse(body) as Row[];
      } catch {
        continue;
      }
      for (const row of arr) {
        const sign = row.class_name?.toUpperCase?.();
        if (!sign || !want.has(sign)) continue;
        const c = counts.get(sign) ?? 0;
        if (perClassCap > 0 && c >= perClassCap) continue;
        const fname = row.youtube_id
          ? `${row.youtube_id}.mp4`
          : row.url
            ? basename(row.url.split('?')[0])
            : null;
        if (!fname) continue;
        const trySrc = [resolve(rawDirA, fname), resolve(rawDirB, fname)];
        const dst = resolve(outDir, sign, fname);
        await mkdir(dirname(dst), { recursive: true });
        try {
          try {
            await cp(trySrc[0], dst, { force: true });
          } catch {
            await cp(trySrc[1], dst, { force: true });
          }
        } catch {
          continue;
        }
        counts.set(sign, c + 1);
        items.push({
          id: `${sign}-${fname}`,
          sign,
          expectedGesture: EXPECTED[sign] ?? 'open_palm',
          clipUrl: `/local/${sign}/${fname}`,
        });
      }
    }
  } catch {
    // ignore if filtered dir missing
  }

  // Fallback pass: infer from pick_urls.txt if nothing was copied yet
  if (items.length === 0) {
    try {
      const urlsTxt = await readFile(resolve('data', 'tmp', 'pick_urls.txt'), 'utf8');
      const urlLines = urlsTxt
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      // Index-pair fallback: align urls with rows order
      const limit = Math.min(rows.length, urlLines.length);
      for (let i = 0; i < limit; i++) {
        const row = rows[i];
        const u = urlLines[i];
        const sign = row.class_name?.toUpperCase?.();
        if (!sign || !want.has(sign)) continue;
        const c = counts.get(sign) ?? 0;
        if (perClassCap > 0 && c >= perClassCap) continue;
        let fname: string | null = null;
        try {
          const url = new URL(u);
          const host = url.hostname.toLowerCase();
          if (host.includes('youtube.com') || host.includes('youtu.be')) {
            // Prefer v param; fallback to pathname last segment
            const vid =
              url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop();
            if (vid) fname = `${vid}.mp4`;
          } else {
            fname = basename(u.split('?')[0]);
          }
        } catch {
          fname = basename(u.split('?')[0]);
        }
        if (!fname) continue;
        const trySrc = [resolve(rawDirA, fname), resolve(rawDirB, fname)];
        const dst = resolve(outDir, sign, fname);
        await mkdir(dirname(dst), { recursive: true });
        try {
          try {
            await cp(trySrc[0], dst, { force: true });
          } catch {
            await cp(trySrc[1], dst, { force: true });
          }
        } catch {
          continue;
        }
        counts.set(sign, c + 1);
        items.push({
          id: `${sign}-${fname}`,
          sign,
          expectedGesture: EXPECTED[sign] ?? 'open_palm',
          clipUrl: `/local/${sign}/${fname}`,
        });
      }
    } catch {
      // ignore
    }
  }

  // Final fallback: top up with any available local files referenced in labels.jsonl
  if (items.length < minItems) {
    try {
      const labelsPath = resolve('data', 'processed', 'msasl', 'labels.jsonl');
      const text = await readFile(labelsPath, 'utf8');
      const seenIds = new Set(items.map((it) => it.id));
      for (const line of text.split('\n')) {
        if (items.length >= minItems) break;
        const trimmed = line.trim();
        if (!trimmed) continue;
        let obj: any;
        try {
          obj = JSON.parse(trimmed);
        } catch {
          continue;
        }
        const sign: string | undefined = obj.class_name?.toUpperCase?.();
        if (!sign) continue;
        const fname: string | null = obj.youtube_id
          ? `${obj.youtube_id}.mp4`
          : obj.url
            ? basename(String(obj.url).split('?')[0])
            : null;
        if (!fname) continue;
        const id = `${sign}-${fname}`;
        if (seenIds.has(id)) continue;
        const srcA = resolve(rawDirA, fname);
        const srcB = resolve(rawDirB, fname);
        const dst = resolve(outDir, sign, fname);
        try {
          await mkdir(dirname(dst), { recursive: true });
          try {
            await cp(srcA, dst, { force: true });
          } catch {
            await cp(srcB, dst, { force: true });
          }
        } catch {
          continue;
        }
        seenIds.add(id);
        items.push({
          id,
          sign,
          expectedGesture: EXPECTED[sign] ?? 'open_palm',
          clipUrl: `/local/${sign}/${fname}`,
        });
      }
    } catch {
      // ignore if labels missing
    }
  }

  const pack = {
    id: 'L1-LOCAL',
    title: 'Local · Picks',
    level: 1,
    items,
  };

  await mkdir(resolve('data', 'tmp'), { recursive: true });
  await writeFile(
    resolve('data', 'tmp', 'local_pack.json'),
    JSON.stringify(pack, null, 2),
  );
  await writeFile(
    resolve('public', 'local', 'local_pack.json'),
    JSON.stringify(pack, null, 2),
  );
  // eslint-disable-next-line no-console
  console.log(
    `[publish] wrote ${items.length} items to public/local and data/tmp/local_pack.json`,
  );
}

main().catch((e) => {
  console.error('[publish] fatal', e);
  process.exit(1);
});
