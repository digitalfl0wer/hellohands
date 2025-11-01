import { createWriteStream } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import https from 'node:https';

function isYouTube(u: string): boolean {
  try {
    const h = new URL(u).hostname.toLowerCase();
    return h.includes('youtube.com') || h.includes('youtu.be');
  } catch {
    return false;
  }
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadHttp(url: string, outPath: string): Promise<void> {
  await ensureDir(resolve(outPath, '..'));
  await new Promise<void>((resolvePromise, reject) => {
    const file = createWriteStream(outPath);
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolvePromise()));
      })
      .on('error', (err) => reject(err));
  });
}

async function downloadYouTube(url: string, destDir: string): Promise<void> {
  await ensureDir(destDir);
  await new Promise<void>((resolvePromise, reject) => {
    const proc = spawn(
      'yt-dlp',
      ['-f', 'b[ext=mp4]', '-o', resolve(destDir, '%(id)s.%(ext)s'), url],
      { stdio: 'inherit' },
    );
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`yt-dlp exited with ${code}`));
    });
  });
}

async function main(): Promise<void> {
  const dataRoot = process.env.DATA_ROOT || resolve(process.env.HOME || '', 'datasets');
  const rawDir = resolve(dataRoot, 'msasl', 'raw');
  const urlsPath = resolve('data', 'tmp', 'pick_urls.txt');
  const contents = await readFile(urlsPath, 'utf8');
  const lines = contents
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!lines.length) {
    console.log('[msasl_fetch] No URLs found in data/tmp/pick_urls.txt');
    return;
  }

  await ensureDir(rawDir);

  for (const u of lines) {
    try {
      if (isYouTube(u)) {
        console.log(`[msasl_fetch] yt-dlp ${u}`);
        await downloadYouTube(u, rawDir);
      } else if (u.startsWith('http')) {
        const out = resolve(rawDir, basename(u.split('?')[0]));
        if (await fileExists(out)) {
          console.log(`[msasl_fetch] skip exists ${basename(out)}`);
          continue;
        }
        console.log(`[msasl_fetch] http ${u}`);
        await downloadHttp(u, out);
      }
    } catch (err) {
      console.warn('[msasl_fetch] failed', u, (err as Error).message);
    }
  }

  console.log('[msasl_fetch] done');
}

main().catch((e) => {
  console.error('[msasl_fetch] fatal', e);
  process.exit(1);
});
