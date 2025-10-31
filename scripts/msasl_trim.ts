import { access, mkdir, readFile, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
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

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fileExistsNonZero(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.size > 0;
  } catch {
    return false;
  }
}

async function resolveRawPath(root: string, idPadded: string): Promise<string | null> {
  const candidates = ['.mp4', '.webm', '.mov', '.mkv', '.avi'];
  for (const ext of candidates) {
    const p = resolve(root, 'msasl', 'raw', `${idPadded}${ext}`);
    if (await pathExists(p)) return p;
  }
  return null;
}

async function ffmpegTrim(input: string, output: string, fps: number, size: number) {
  await ensureDir(resolve(output, '..'));
  return new Promise<void>((resolvePromise, reject) => {
    const args = [
      '-y',
      '-i',
      input,
      '-an',
      '-vf',
      `fps=${fps},scale=${size}:-2:flags=lanczos`,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      output,
    ];
    const proc = spawn('ffmpeg', args, { stdio: 'ignore' });
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`ffmpeg exited with ${code}`));
    });
  });
}

async function processSplit(
  envRoot: string,
  subset: number | undefined,
  split: Split,
  fps: number,
  size: number,
) {
  const filteredPath = resolve(
    envRoot,
    'msasl',
    'filtered',
    `MSASL_${split}_${subset ?? 'all'}.json`,
  );
  const raw = await readFile(filteredPath, 'utf8').catch(() => '');
  if (!raw.trim()) {
    console.warn(`[msasl_trim] missing filtered: ${filteredPath}`);
    return { count: 0, trimmed: 0 };
  }
  const records = JSON.parse(raw) as any[];
  let trimmed = 0;
  for (let i = 0; i < records.length; i++) {
    const recordId = computeRecordId(split, i);
    const idPadded = String(recordId).padStart(6, '0');
    const shard = idPadded.slice(0, 3);
    const inputPath = await resolveRawPath(envRoot, idPadded);
    if (!inputPath) {
      console.warn(`[msasl_trim] raw not found for ${idPadded}`);
      continue;
    }
    const outputPath = resolve(
      'data',
      'processed',
      'msasl',
      'clips',
      shard,
      `${idPadded}.mp4`,
    );
    if (await fileExistsNonZero(outputPath)) {
      // skip completed
      continue;
    }
    try {
      await ffmpegTrim(inputPath, outputPath, fps, size);
      trimmed += 1;
      console.log(`[msasl_trim] ok → ${shard}/${idPadded}.mp4`);
    } catch (err) {
      console.error(`[msasl_trim] fail id=${idPadded} reason=${(err as Error).message}`);
    }
  }
  return { count: records.length, trimmed };
}

async function main(): Promise<void> {
  const env = loadPipelineEnv();
  console.log('[msasl_trim] start', {
    fps: env.VIDEO_FPS,
    size: env.VIDEO_SIZE,
    subset: env.SUBSET ?? 'all',
  });
  await ensureDir(resolve('data', 'processed', 'msasl', 'clips'));
  const splits: Split[] = ['train', 'val', 'test'];
  for (const split of splits) {
    const r = await processSplit(
      env.DATA_ROOT,
      env.SUBSET,
      split,
      env.VIDEO_FPS,
      env.VIDEO_SIZE,
    );
    console.log(`[msasl_trim] ${split}: trimmed ${r.trimmed}/${r.count}`);
  }
  console.log('[msasl_trim] done');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error('[msasl_trim] fatal', error);
    process.exit(1);
  });
}
