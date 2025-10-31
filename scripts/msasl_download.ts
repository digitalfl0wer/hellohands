// scripts/msasl_download.ts
import { appendFile, mkdir, readFile, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { basename, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

import { loadPipelineEnv } from './_env';

/* ----------------------------- helpers ----------------------------- */

const hasProto = (s: string) => /^https?:\/\//i.test(s);

function buildSourceUrl(item: any): string | null {
  // Prefer explicit url/source, else derive from youtube_id
  const raw = (item?.url ?? item?.source ?? null) as string | null;
  const viaId = item?.youtube_id ? `https://www.youtube.com/watch?v=${item.youtube_id}` : null;
  return raw ?? viaId;
}

function normalizeUrl(input: string): string {
  if (!input) throw new Error('empty url');
  return hasProto(input) ? input : `https://${input}`;
}

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

/* ----------------------- download implementations ----------------------- */

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

function isYouTube(u: string) {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return h.includes('youtube.com') || h.includes('youtu.be');
  } catch {
    return false;
  }
}

async function downloadYouTube(url: string, destPath: string, retries: number) {
  await ensureDir(resolve(destPath, '..'));
  let attempt = 0;
  for (;;) {
    attempt++;
    const proc = spawn('yt-dlp', ['--no-playlist', '-f', 'mp4', '-o', destPath, url], {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    const code: number = await new Promise((res) => proc.on('close', res as any));
    if (code === 0) return;

    if (attempt > retries) throw new Error(`yt-dlp failed (code ${code})`);
    const backoff = Math.min(2000 * attempt, 8000);
    console.warn(`[msasl_download] yt-dlp retry ${attempt}/${retries} …`);
    await new Promise((r) => setTimeout(r, backoff));
  }
}

/* ----------------------------- core logic ----------------------------- */

async function processSplit(
  envRoot: string,
  subset: number | undefined,
  split: Split,
  retries: number,
) {
  const filteredPath = resolve(envRoot, 'msasl', 'filtered', `MSASL_${split}_${subset ?? 'all'}.json`);
  const raw = await readFile(filteredPath, 'utf8').catch(() => '');
  if (!raw.trim()) {
    console.warn(`[msasl_download] missing filtered: ${filteredPath}`);
    return { count: 0, downloaded: 0 };
  }

  const records = JSON.parse(raw) as Array<any>;
  const clipsDir = resolve(envRoot, 'msasl', 'clips');

  let downloaded = 0;
  for (let i = 0; i < records.length; i++) {
    const rec = records[i] ?? {};
    const recordId = computeRecordId(split, i);
    const idPadded = String(recordId).padStart(6, '0');
    const outPath = resolve(clipsDir, `${idPadded}.mp4`);

    // Skip if already present and non-zero
    if (await fileExistsNonZero(outPath)) {
      console.log(`[msasl_download] skip exists ${basename(outPath)}`);
      continue;
    }

    // Build + normalize source URL
    const src0 = buildSourceUrl(rec);
    if (!src0) {
      console.warn(`[msasl_download] skip: no url/youtube_id for rec#${i}`);
      await writeFailedCsv(envRoot, `${recordId},${split},NO_URL`);
      continue;
    }

    let url = '';
    try {
      url = normalizeUrl(src0);
      // Optional strict validation:
      // new URL(url);
    } catch {
      console.warn(`[msasl_download] skip bad url: ${src0}`);
      await writeFailedCsv(envRoot, `${recordId},${split},BAD_URL,${JSON.stringify(src0)}`);
      continue;
    }

    try {
      if (isYouTube(url)) {
        await downloadYouTube(url, outPath, retries);
      } else {
        await downloadToFile(url, outPath, retries);
      }
      downloaded++;
      console.log(`[msasl_download] ok ${basename(outPath)}`);
    } catch (err: any) {
      console.warn(`[msasl_download] fail rec#${i} → ${basename(outPath)} :: ${err?.message ?? err}`);
      await writeFailedCsv(envRoot, `${recordId},${split},${url}`);
    }
  }

  return { count: records.length, downloaded };
}

async function main() {
  // Pull paths from your shared env helper
  const env = await loadPipelineEnv();
  // Prefer explicit processed root if available; fallback to conventional tree
  const envRoot =
    (env && (env.processedRoot || env.root)) ??
    resolve('data', 'processed');

  const subsetStr = process.env.SUBSET ?? 'all';
  const subset = subsetStr === 'all' ? undefined : Number(subsetStr);
  const retries = Number(process.env.RETRIES ?? 3);

  console.log('[msasl_download] start', { retries, subset: subset ?? 'all' });

  const splits: Split[] = ['train', 'val', 'test'];
  let total = 0,
    done = 0;

  for (const s of splits) {
    const { count, downloaded } = await processSplit(envRoot, subset, s, retries);
    total += count;
    done += downloaded;
  }

  console.log(`[msasl_download] finished ${done}/${total} files`);
}

/* ------------------------------ entrypoint ------------------------------ */

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error('[msasl_download] fatal', error);
    process.exit(1);
  });
}




// import { appendFile, mkdir, readFile, stat } from 'node:fs/promises';
// import { createWriteStream } from 'node:fs';
// import { basename, extname, join, resolve } from 'node:path';
// import { Readable } from 'node:stream';
// import { pipeline } from 'node:stream/promises';
// import { pathToFileURL } from 'node:url';

// import { loadPipelineEnv } from './_env';


// // helpers (top of file)
// const hasProto = (s: string) => /^https?:\/\//i.test(s);

// function buildSourceUrl(item: any): string | null {
//   // prefer explicit url, else derive from youtube_id
//   const raw = (item.url ?? item.source ?? null) as string | null;
//   const viaId = item.youtube_id ? `https://www.youtube.com/watch?v=${item.youtube_id}` : null;
//   return raw ?? viaId;
// }

// function normalizeUrl(input: string): string {
//   if (!input) throw new Error("empty url");
//   return hasProto(input) ? input : `https://${input}`;
// }

// type Split = 'train' | 'val' | 'test';

// async function ensureDir(path: string): Promise<void> {
//   await mkdir(path, { recursive: true });
// }

// function computeRecordId(split: Split, index: number): number {
//   const splitCode = split === 'train' ? 1 : split === 'val' ? 2 : 3;
//   return parseInt(`${splitCode}${String(index).padStart(5, '0')}`);
// }

// async function fileExistsNonZero(path: string): Promise<boolean> {
//   try {
//     const s = await stat(path);
//     return s.size > 0;
//   } catch {
//     return false;
//   }
// }

// async function writeFailedCsv(root: string, row: string): Promise<void> {
//   const failedPath = resolve(root, 'msasl', 'failed.csv');
//   await ensureDir(resolve(root, 'msasl'));
//   await appendFile(failedPath, row + '\n');
// }

// async function downloadToFile(
//   url: string,
//   destPath: string,
//   retries: number,
// ): Promise<void> {
//   let attempt = 0;
//   for (;;) {
//     try {
//       const resp = await fetch(url);
//       if (!resp.ok || !resp.body) {
//         throw new Error(`HTTP ${resp.status}`);
//       }
//       await ensureDir(resolve(destPath, '..'));
//       const nodeStream = Readable.fromWeb(resp.body as any);
//       await pipeline(nodeStream, createWriteStream(destPath));
//       return;
//     } catch (err) {
//       attempt += 1;
//       if (attempt > retries) throw err;
//       const backoff = Math.min(2000 * attempt, 8000);
//       console.warn(
//         `[msasl_download] retry ${attempt}/${retries} after error: ${(err as Error).message}`,
//       );
//       await new Promise((r) => setTimeout(r, backoff));
//     }
//   }
// }

// async function processSplit(
//   envRoot: string,
//   subset: number | undefined,
//   split: Split,
//   retries: number,
// ) {
//   const filteredPath = resolve(
//     envRoot,
//     'msasl',
//     'filtered',
//     `MSASL_${split}_${subset ?? 'all'}.json`,
//   );
//   const raw = await readFile(filteredPath, 'utf8').catch(() => '');
//   if (!raw.trim()) {
//     console.warn(`[msasl_download] missing filtered: ${filteredPath}`);
//     return { count: 0, downloaded: 0 };
//   }
//   const records = JSON.parse(raw) as Array<{ url: string }>;
//   let downloaded = 0;
//   for (let i = 0; i < records.length; i++) {
//     const rec = records[i] as any;
//     const recordId = computeRecordId(split, i);
//     const idPadded = String(recordId).padStart(6, '0');
//     const srcUrl = rec.url;
//     const ext = extname(new URL(srcUrl).pathname) || '.mp4';
//     const destDir = resolve(envRoot, 'msasl', 'raw');
//     const destPath = join(destDir, `${idPadded}${ext}`);

//     if (await fileExistsNonZero(destPath)) {
//       console.log(`[msasl_download] skip exists ${basename(destPath)}`);
//       continue;
//     }

//     try {
//       await downloadToFile(srcUrl, destPath, retries);
//       downloaded += 1;
//       console.log(`[msasl_download] ok → ${basename(destPath)}`);
//     } catch (err) {
//       console.error(
//         `[msasl_download] fail id=${idPadded} url=${srcUrl} reason=${(err as Error).message}`,
//       );
//       await writeFailedCsv(
//         envRoot,
//         `${recordId},${JSON.stringify(srcUrl)},${split},${(err as Error).message.replace(/\s+/g, ' ')}`,
//       );
//     }
//   }

//   return { count: records.length, downloaded };
// }

// async function main(): Promise<void> {
//   const env = loadPipelineEnv();
//   console.log('[msasl_download] start', {
//     retries: env.DOWNLOAD_RETRIES,
//     subset: env.SUBSET ?? 'all',
//   });
//   await ensureDir(resolve(env.DATA_ROOT, 'msasl', 'raw'));
//   const splits: Split[] = ['train', 'val', 'test'];
//   for (const split of splits) {
//     const r = await processSplit(env.DATA_ROOT, env.SUBSET, split, env.DOWNLOAD_RETRIES);
//     console.log(`[msasl_download] ${split}: downloaded ${r.downloaded}/${r.count}`);
//   }
//   console.log('[msasl_download] done');
// }

// // inside processSplit(...)
// const src = buildSourceUrl(item);
// if (!src) {
//   console.warn("[msasl_download] skip: no url/youtube_id for", item?.class_name ?? "(unknown)");
//   return;
// }

// let urlStr = "";
// try {
//   urlStr = normalizeUrl(src);
//   // new URL(urlStr); // optional validation; not strictly required for yt-dlp
// } catch (e) {
//   console.warn("[msasl_download] skip bad url:", src);
//   return;
// }

// // ...then pass `urlStr` to your downloader
// await downloadOne(urlStr, outPath);

// // if (import.meta.url === pathToFileURL(process.argv[1]).href) {
// //   await main().catch((error) => {
// //     console.error('[msasl_download] fatal', error);
// //     process.exit(1);
// //   });
// // }
