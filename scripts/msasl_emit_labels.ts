import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { loadMsaslSplit, toUnifiedLabel } from '../adapters/msasl';
import { loadPipelineEnv } from './_env';

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function main(): Promise<void> {
  const env = loadPipelineEnv();
  const subset = env.SUBSET ?? 100;

  const processedDir = resolve('data', 'processed', 'msasl');
  const labelsPath = resolve(processedDir, 'labels.jsonl');
  await ensureDir(processedDir);

  const splits: Array<'train' | 'val' | 'test'> = ['train', 'val', 'test'];
  const lines: string[] = [];

  for (const split of splits) {
    const filteredPath = resolve(
      env.DATA_ROOT,
      'msasl',
      'filtered',
      `MSASL_${split}_${subset}.json`,
    );

    const raw = await readFile(filteredPath, 'utf8').catch(() => '');
    if (!raw.trim()) {
      console.warn(`[msasl_emit_labels] missing filtered: ${filteredPath}`);
      continue;
    }
    const records = JSON.parse(raw) as Awaited<ReturnType<typeof loadMsaslSplit>>;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i] as any;
      // Add an ID field based on the index and split
      const recordId = parseInt(
        `${split === 'train' ? 1 : split === 'val' ? 2 : 3}${String(i).padStart(5, '0')}`,
      );
      rec.id = recordId;

      // Media path convention (clip files are grouped by zero-padded id blocks)
      const idPadded = String(recordId).padStart(6, '0');
      const shard = idPadded.slice(0, 3);
      const mediaRel = `data/processed/msasl/clips/${shard}/${idPadded}.mp4`;
      const unified = toUnifiedLabel({
        record: rec as any,
        subsetName: `MS-ASL${subset}`,
        split,
        mediaPath: mediaRel,
      });
      lines.push(JSON.stringify(unified));
    }
  }

  await writeFile(labelsPath, lines.join('\n') + (lines.length ? '\n' : ''));
  console.log(`[msasl_emit_labels] wrote ${lines.length} lines → ${labelsPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error('[msasl_emit_labels] fatal', error);
    process.exit(1);
  });
}
