import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { toUnifiedLabel } from '../adapters/msasl';
import { loadPipelineEnv } from './_env';

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

type FilteredRecord = {
  id: number | null;
  label: number;
  class_name: string;
  signer_id: number | string;
  url: string;
  start_time?: number | null;
  end_time?: number | null;
};

const SPLITS: Array<'train' | 'val' | 'test'> = ['train', 'val', 'test'];

async function main(): Promise<void> {
  const env = loadPipelineEnv();
  const subsetValue = env.SUBSET;
  const subsetSuffix = subsetValue ?? 'all';
  const subsetName = subsetValue ? `MS-ASL${subsetValue}` : 'MS-ASL';

  const processedDir = resolve('data', 'processed', 'msasl');
  const labelsPath = resolve(processedDir, 'labels.jsonl');
  await ensureDir(processedDir);

  const lines: string[] = [];

  for (const split of SPLITS) {
    const filteredPath = resolve(
      env.DATA_ROOT,
      'msasl',
      'filtered',
      `MSASL_${split}_${subsetSuffix}.json`,
    );

    const raw = await readFile(filteredPath, 'utf8').catch(() => '');
    if (!raw.trim()) {
      console.warn(`[msasl_emit_labels] missing filtered: ${filteredPath}`);
      continue;
    }

    const records = JSON.parse(raw) as FilteredRecord[];

    for (let i = 0; i < records.length; i++) {
      const recordId = computeRecordId(split, i, records[i]?.id ?? null);
      const idPadded = recordId.toString().padStart(6, '0');
      const shard = idPadded.slice(0, 3);
      const mediaRel = `data/processed/msasl/clips/${shard}/${idPadded}.mp4`;

      const unified = toUnifiedLabel({
        record: {
          ...records[i],
          id: recordId,
          start_time: records[i]?.start_time ?? undefined,
          end_time: records[i]?.end_time ?? undefined,
        } as any,
        subsetName,
        split,
        mediaPath: mediaRel,
      });
      lines.push(JSON.stringify(unified));
    }
  }

  await ensureDir(dirname(labelsPath));
  await writeFile(labelsPath, lines.join('\n') + (lines.length ? '\n' : ''));
  console.log(`[msasl_emit_labels] wrote ${lines.length} lines → ${labelsPath}`);
}

function computeRecordId(
  split: 'train' | 'val' | 'test',
  index: number,
  existing: number | null,
): number {
  if (existing && Number.isFinite(existing)) {
    return existing;
  }
  const prefix = split === 'train' ? '1' : split === 'val' ? '2' : '3';
  return Number(`${prefix}${String(index).padStart(5, '0')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error('[msasl_emit_labels] fatal', error);
    process.exit(1);
  });
}
