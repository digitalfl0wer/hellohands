import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type LabelRow = {
  id: string;
  dataset: string;
  subset: string;
  split: 'train' | 'val' | 'test';
  path: string;
  label: number;
  class_name: string;
  signer_id: string;
  start: number;
  end: number;
};

async function main(): Promise<void> {
  const labelsPath = resolve('data', 'processed', 'msasl', 'labels.jsonl');
  const outPath = resolve('data', 'processed', 'msasl', 'summary.json');
  const raw = await readFile(labelsPath, 'utf8').catch(() => '');
  if (!raw.trim()) {
    console.warn(`[msasl_stats] missing labels: ${labelsPath}`);
    return;
  }

  let total = 0;
  const perClass: Record<string, number> = {};
  const perSigner: Record<string, number> = {};
  const durations: number[] = [];
  const bySplit: Record<'train' | 'val' | 'test', number> = { train: 0, val: 0, test: 0 };

  for (const line of raw.trim().split('\n')) {
    if (!line) continue;
    const row = JSON.parse(line) as LabelRow;
    total += 1;
    perClass[row.class_name] = (perClass[row.class_name] ?? 0) + 1;
    perSigner[row.signer_id] = (perSigner[row.signer_id] ?? 0) + 1;
    durations.push(Math.max(0, (row.end ?? 0) - (row.start ?? 0)));
    bySplit[row.split] += 1;
  }

  const histoBuckets = [0, 1, 2, 3, 5, 8, 13];
  const durationHist: Record<string, number> = {};
  for (const d of durations) {
    const bucket = histoBuckets.find((b) => d <= b) ?? 'gt13';
    const key = typeof bucket === 'number' ? `<=${bucket}s` : bucket;
    durationHist[key] = (durationHist[key] ?? 0) + 1;
  }

  const summary = {
    total,
    bySplit,
    perClass,
    perSignerTop10: Object.entries(perSigner)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    durationHist,
  };

  await writeFile(outPath, JSON.stringify(summary, null, 2) + '\n');
  console.log(`[msasl_stats] wrote summary → ${outPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error('[msasl_stats] fatal', error);
    process.exit(1);
  });
}
