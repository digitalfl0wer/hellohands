import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPipelineEnv } from './_env';

type Split = 'train' | 'val' | 'test';

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function filterSplit(
  dataRoot: string,
  subset: number | undefined,
  split: Split,
): Promise<{ inCount: number; outCount: number; outPath: string }> {
  const metaPath = resolve(dataRoot, 'msasl', 'meta', `MSASL_${split}.json`);
  const filteredDir = resolve(dataRoot, 'msasl', 'filtered');
  await ensureDir(filteredDir);

  const raw = await readFile(metaPath, 'utf8').catch(() => '');
  if (!raw.trim()) {
    console.warn(`[msasl_filter] missing or empty: ${metaPath}`);
    return {
      inCount: 0,
      outCount: 0,
      outPath: join(filteredDir, `MSASL_${split}_${subset ?? 'all'}.json`),
    };
  }

  const records = JSON.parse(raw) as Array<{ label: number }>;
  const out = !subset ? records : records.filter((r) => r.label < subset);
  const outPath = join(filteredDir, `MSASL_${split}_${subset ?? 'all'}.json`);
  await ensureDir(dirname(outPath));
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n');
  return { inCount: records.length, outCount: out.length, outPath };
}

async function main(): Promise<void> {
  const env = loadPipelineEnv();
  const subset = env.SUBSET;

  console.log('[msasl_filter] start', { subset });
  const results = await Promise.all([
    filterSplit(env.DATA_ROOT, subset, 'train'),
    filterSplit(env.DATA_ROOT, subset, 'val'),
    filterSplit(env.DATA_ROOT, subset, 'test'),
  ]);

  for (const r of results) {
    console.log(`[msasl_filter] wrote ${r.outCount}/${r.inCount} → ${r.outPath}`);
  }
  console.log('[msasl_filter] done');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error('[msasl_filter] fatal', error);
    process.exit(1);
  });
}
