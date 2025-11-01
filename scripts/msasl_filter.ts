import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPipelineEnv } from './_env';
import { loadMsaslSplit, MsaslSourceRecord } from '../adapters/msasl';

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
  const outPath = join(filteredDir, `MSASL_${split}_${subset ?? 'all'}.json`);

  const records = await loadMsaslSplit({
    jsonPath: metaPath,
    subsetName: subset ? `MS-ASL${subset}` : 'MS-ASL',
    split,
  }).catch(() => [] as MsaslSourceRecord[]);

  if (!records.length) {
    console.warn(`[msasl_filter] missing or empty: ${metaPath}`);
    await ensureDir(dirname(outPath));
    await writeFile(outPath, '[]\n');
    return { inCount: 0, outCount: 0, outPath };
  }

  const filtered = (!subset
    ? records
    : records.filter((r) => typeof r.label === 'number' && r.label < subset)
  ).map((record) => ({
    id: record.id ?? null,
    label: record.label,
    class_name: (record.text ?? record.clean_text ?? '').trim().toUpperCase(),
    signer_id: record.signer_id,
    url: record.url,
    start_time: record.start_time ?? null,
    end_time: record.end_time ?? null,
  }));

  filtered.sort((a, b) => {
    if (a.label !== b.label) return a.label - b.label;
    const signerA = Number(a.signer_id);
    const signerB = Number(b.signer_id);
    if (Number.isFinite(signerA) && Number.isFinite(signerB) && signerA !== signerB) {
      return signerA - signerB;
    }
    return String(a.class_name).localeCompare(String(b.class_name));
  });

  await ensureDir(dirname(outPath));
  await writeFile(outPath, JSON.stringify(filtered, null, 2) + '\n');
  return { inCount: records.length, outCount: filtered.length, outPath };
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
