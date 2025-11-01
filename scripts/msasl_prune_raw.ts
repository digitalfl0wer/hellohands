import { readdir, rm, stat } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';

type Row = {
  class_name: string;
  url?: string;
  youtube_id?: string;
};

function targetFilename(row: Row): string | null {
  if (row.youtube_id) return `${row.youtube_id}.mp4`;
  if (row.url) {
    const base = basename(row.url.split('?')[0]);
    return base || null;
  }
  return null;
}

async function main(): Promise<void> {
  const dataRoot = process.env.DATA_ROOT || resolve(process.env.HOME || '', 'datasets');
  const rawDir = resolve(dataRoot, 'msasl', 'raw');
  const perClassCap = Number(process.env.PER_CLASS ?? '0'); // 0 = unlimited
  const keep = new Set<string>();
  const perClassCounts = new Map<string, number>();

  const pickPath = resolve('data', 'tmp', 'pick.json');
  const raw = await readFile(pickPath, 'utf8');
  const rows = JSON.parse(raw) as Row[];

  for (const row of rows) {
    const name = row.class_name?.toUpperCase?.();
    if (!name) continue;
    if (perClassCap > 0) {
      const c = perClassCounts.get(name) ?? 0;
      if (c >= perClassCap) continue;
      perClassCounts.set(name, c + 1);
    }
    const fname = targetFilename(row);
    if (fname) keep.add(fname);
  }

  const entries = await readdir(rawDir).catch(() => [] as string[]);
  let removed = 0;
  let kept = 0;
  for (const f of entries) {
    const ext = extname(f).toLowerCase();
    if (ext !== '.mp4' && ext !== '.webm' && ext !== '.mov' && ext !== '.mkv') continue;
    if (keep.has(f)) {
      kept += 1;
      continue;
    }
    try {
      await rm(resolve(rawDir, f));
      removed += 1;
      // eslint-disable-next-line no-console
      console.log('[prune] removed', f);
    } catch {
      // ignore
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[prune] kept=${kept} removed=${removed} in ${rawDir}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('[prune] fatal', e);
  process.exit(1);
});
