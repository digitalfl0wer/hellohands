import { createWriteStream } from 'node:fs';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import https from 'node:https';

interface ManifestRow {
  gloss: string;
  signer: string;
  token_id: string;
  view_id: string;
  src: string;
  start_frame: string;
  end_frame: string;
  native_fps: string;
}

interface DownloadStats {
  attempted: number;
  completed: number;
  failed: number;
  skipped: number;
  errors: string[];
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

async function downloadHttp(
  url: string,
  outPath: string,
  cookie?: string,
): Promise<void> {
  await ensureDir(resolve(outPath, '..'));
  await new Promise<void>((resolvePromise, reject) => {
    const file = createWriteStream(outPath);
    const headers: Record<string, string> = {};
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    https
      .get(url, { headers }, (res) => {
        if (res.statusCode === 401) {
          reject(new Error('Authentication failed - invalid cookie'));
          return;
        }
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

function parseCSV(content: string): ManifestRow[] {
  const lines = content.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('Empty manifest file');
  }

  const header = lines[0].split(',');
  const expectedColumns = [
    'gloss',
    'signer',
    'token_id',
    'view_id',
    'src',
    'start_frame',
    'end_frame',
    'native_fps',
  ];

  for (const col of expectedColumns) {
    if (!header.includes(col)) {
      throw new Error(`Missing required column: ${col}`);
    }
  }

  return lines.slice(1).map((line, index) => {
    const values = line.split(',');
    if (values.length !== header.length) {
      throw new Error(
        `Row ${index + 2}: Expected ${header.length} columns, got ${values.length}`,
      );
    }

    const row: any = {};
    header.forEach((col, i) => {
      row[col] = values[i].trim();
    });

    return row as ManifestRow;
  });
}

function getViewPriority(viewId: string): number {
  // Canonical view selection: front A/B > side
  const lower = viewId.toLowerCase();
  if (lower.includes('front') || lower.includes('a') || lower.includes('b')) {
    return 1; // High priority
  }
  if (lower.includes('side')) {
    return 2; // Lower priority
  }
  return 3; // Lowest priority
}

function selectBestViews(rows: ManifestRow[]): ManifestRow[] {
  // Group by token_id and select best view for each
  const groupedByToken = new Map<string, ManifestRow[]>();

  for (const row of rows) {
    const key = row.token_id;
    if (!groupedByToken.has(key)) {
      groupedByToken.set(key, []);
    }
    groupedByToken.get(key)!.push(row);
  }

  const selected: ManifestRow[] = [];

  for (const [tokenId, tokenRows] of groupedByToken) {
    // Sort by view priority (lower number = higher priority)
    const sortedViews = tokenRows.sort(
      (a, b) => getViewPriority(a.view_id) - getViewPriority(b.view_id),
    );

    // Select the best view
    selected.push(sortedViews[0]);
  }

  return selected;
}

function generateFilename(row: ManifestRow): string {
  // Generate consistent filename: {gloss}_{signer}_{token_id}_{view_id}.mp4
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${clean(row.gloss)}_${clean(row.signer)}_${clean(row.token_id)}_${clean(row.view_id)}.mp4`;
}

async function testAuth(cookie: string): Promise<boolean> {
  try {
    // Test authentication with a small request
    await new Promise<void>((resolve, reject) => {
      const testReq = https.request(
        {
          hostname: 'www.bu.edu',
          path: '/asllvd/',
          method: 'HEAD',
          headers: { Cookie: cookie },
        },
        (res) => {
          if (res.statusCode === 401) {
            reject(new Error('Authentication failed'));
          } else {
            resolve();
          }
        },
      );

      testReq.on('error', reject);
      testReq.end();
    });
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  // Environment setup
  const dataRoot = process.env.DATA_ROOT || resolve('data');
  const rawDir = resolve(dataRoot, 'raw', 'asllvd');
  const manifestPath = resolve('data', 'asllvd_manifest.csv');
  const cookie = process.env.ASLLVD_COOKIE;

  console.log('[asllvd_fetch] Starting ASLLVD dataset ingestion...');

  // 1. Verify ASLLVD_COOKIE is set
  if (!cookie) {
    throw new Error('ASLLVD_COOKIE environment variable required');
  }
  console.log('[asllvd_fetch] ✓ ASLLVD_COOKIE is set');

  // 2. Test authentication
  console.log('[asllvd_fetch] Testing authentication...');
  const authValid = await testAuth(cookie);
  if (!authValid) {
    throw new Error('Authentication failed - invalid or expired cookie');
  }
  console.log('[asllvd_fetch] ✓ Authentication successful');

  // 3. Read and parse manifest
  console.log('[asllvd_fetch] Reading manifest...');
  let manifestContent: string;
  try {
    manifestContent = await readFile(manifestPath, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read manifest file: ${manifestPath}`);
  }

  let manifestRows: ManifestRow[];
  try {
    manifestRows = parseCSV(manifestContent);
  } catch (err) {
    throw new Error(`Failed to parse manifest: ${(err as Error).message}`);
  }

  console.log(`[asllvd_fetch] ✓ Parsed ${manifestRows.length} entries from manifest`);

  // 4. Apply canonical view selection
  const selectedRows = selectBestViews(manifestRows);
  console.log(
    `[asllvd_fetch] ✓ Selected ${selectedRows.length} videos after view selection`,
  );

  // 5. Ensure output directory exists
  await ensureDir(rawDir);
  console.log(`[asllvd_fetch] ✓ Output directory ready: ${rawDir}`);

  // 6. Download videos
  console.log('[asllvd_fetch] Starting downloads...');

  const stats: DownloadStats = {
    attempted: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  for (const row of selectedRows) {
    const filename = generateFilename(row);
    const outPath = resolve(rawDir, filename);

    stats.attempted++;

    try {
      // Skip if file already exists
      if (await fileExists(outPath)) {
        console.log(`[asllvd_fetch] skip exists ${filename}`);
        stats.skipped++;
        continue;
      }

      console.log(`[asllvd_fetch] downloading ${filename} from ${row.src}`);
      await downloadHttp(row.src, outPath, cookie);
      console.log(`[asllvd_fetch] ✓ completed ${filename}`);
      stats.completed++;
    } catch (err) {
      const errorMsg = `${filename}: ${(err as Error).message}`;
      console.warn(`[asllvd_fetch] ✗ failed ${errorMsg}`);
      stats.failed++;
      stats.errors.push(errorMsg);
    }
  }

  // 7. Report summary
  console.log('\n[asllvd_fetch] Download Summary:');
  console.log(`  Total videos processed: ${selectedRows.length}`);
  console.log(`  Downloads attempted: ${stats.attempted}`);
  console.log(`  Downloads completed: ${stats.completed}`);
  console.log(`  Downloads failed: ${stats.failed}`);
  console.log(`  Files skipped (existing): ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log('\n[asllvd_fetch] Errors:');
    stats.errors.forEach((error) => console.log(`  - ${error}`));
  }

  console.log('\n[asllvd_fetch] ✓ Ingestion pipeline complete!');
}

main().catch((e) => {
  console.error('[asllvd_fetch] fatal', e);
  process.exit(1);
});
