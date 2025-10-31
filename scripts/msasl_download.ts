import { appendFile, mkdir, readFile, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

import { loadPipelineEnv } from './_env';

type Split = 'train' | 'val' | 'test';

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

function computeRecordId(split: Split, index: number): number {
  const splitCode = split === 'train' ? 1 : split === 'val' ? 2 : 3;
  return parseInt(`${splitCode}${String(index).padStart(5, '0')}`);
}

async function fileExistsNonZero(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.size > 0;
  } catch {
    return false;
  }
}

async function writeFailedCsv(root: string, row: string): Promise<void> {
  const failedPath = resolve(root, 'msasl', 'failed.csv');
  await ensureDir(resolve(root, 'msasl'));
  await appendFile(failedPath, row + '\n');
}

async function downloadToFile(url: string, destPath: string, retries: number): Promise<void> {
  let attempt = 0;
  for (;;) {
    try {
      const resp = await fetch(url);
      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`);
      }
      await ensureDir(resolve(destPath, '..'));
      const nodeStream = Readable.fromWeb(resp.body as any);
      await pipeline(nodeStream, createWriteStream(destPath));
      return;
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      const backoff = Math.min(2000 * attempt, 8000);
      console.warn(`[msasl_download] retry ${attempt}/${retries} after error: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}

async function processSplit(envRoot: string, subset: number | undefined, split: Split, retries: number) {
  const filteredPath = resolve(envRoot, 'msasl', 'filtered', `MSASL_${split}_${subset ?? 'all'}.json`);
  const raw = await readFile(filteredPath, 'utf8').catch(() => '');
  if (!raw.trim()) {
    console.warn(`[msasl_download] missing filtered: ${filteredPath}`);
    return { count: 0, downloaded: 0 };
  }
  const records = JSON.parse(raw) as Array<{ url: string }>;
  let downloaded = 0;
  for (let i = 0; i < records.length; i++) {
    const rec = records[i] as any;
    const recordId = computeRecordId(split, i);
    const idPadded = String(recordId).padStart(6, '0');
    const srcUrl = rec.url;
    const ext = extname(new URL(srcUrl).pathname) || '.mp4';
    const destDir = resolve(envRoot, 'msasl', 'raw');
    const destPath = join(destDir, `${idPadded}${ext}`);

    if (await fileExistsNonZero(destPath)) {
      console.log(`[msasl_download] skip exists ${basename(destPath)}`);
      continue;
    }

    try {
      await downloadToFile(srcUrl, destPath, retries);
      downloaded += 1;
      console.log(`[msasl_download] ok → ${basename(destPath)}`);
    } catch (err) {
      console.error(`[msasl_download] fail id=${idPadded} url=${srcUrl} reason=${(err as Error).message}`);
      await writeFailedCsv(envRoot, `${recordId},${JSON.stringify(srcUrl)},${split},${(err as Error).message.replace(/\s+/g, ' ')}`);
    }
  }

  return { count: records.length, downloaded };
}

async function main(): Promise<void> {
  const env = loadPipelineEnv();
  console.log('[msasl_download] start', { retries: env.DOWNLOAD_RETRIES, subset: env.SUBSET ?? 'all' });
  await ensureDir(resolve(env.DATA_ROOT, 'msasl', 'raw'));
  const splits: Split[] = ['train', 'val', 'test'];
  for (const split of splits) {
    const r = await processSplit(env.DATA_ROOT, env.SUBSET, split, env.DOWNLOAD_RETRIES);
    console.log(`[msasl_download] ${split}: downloaded ${r.downloaded}/${r.count}`);
  }
  console.log('[msasl_download] done');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error('[msasl_download] fatal', error);
    process.exit(1);
  });
}
