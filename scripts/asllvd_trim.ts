import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';

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

interface ProcessingStats {
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

async function runFfmpeg(args: string[]): Promise<void> {
  return new Promise<void>((resolvePromise, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'pipe' });
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`ffmpeg exited with ${code}`));
    });
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

async function findRawVideoFile(
  rawDir: string,
  row: ManifestRow,
): Promise<string | null> {
  // Generate expected filename patterns
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
  const expectedName = `${clean(row.gloss)}_${clean(row.signer)}_${clean(row.token_id)}_${clean(row.view_id)}`;

  // Common video extensions
  const extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];

  for (const ext of extensions) {
    const fullPath = resolve(rawDir, expectedName + ext);
    if (await fileExists(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

function calculateTimestamp(frameNumber: number, fps: number): number {
  return frameNumber / fps;
}

function generateOutputFilename(row: ManifestRow): string {
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `asllvd_${clean(row.gloss)}_${clean(row.signer)}_${clean(row.token_id)}.mp4`;
}

async function processVideo(
  rawFile: string,
  outputFile: string,
  row: ManifestRow,
): Promise<void> {
  const startFrame = parseInt(row.start_frame);
  const endFrame = parseInt(row.end_frame);
  const nativeFps = parseFloat(row.native_fps);

  const startTime = calculateTimestamp(startFrame, nativeFps);
  const endTime = calculateTimestamp(endFrame, nativeFps);
  const duration = endTime - startTime;

  if (duration <= 0) {
    throw new Error(
      `Invalid duration: ${duration}s (start: ${startTime}s, end: ${endTime}s)`,
    );
  }

  // ffmpeg command to extract, normalize and convert
  const ffmpegArgs = [
    '-y', // Overwrite output files
    '-i',
    rawFile,
    '-ss',
    startTime.toString(),
    '-t',
    duration.toString(),
    '-vf',
    'scale=320:-1', // Scale to 320px width, maintain aspect ratio
    '-r',
    '30', // Set to 30fps
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '23', // Good quality/size balance
    '-an', // Remove audio
    outputFile,
  ];

  await runFfmpeg(ffmpegArgs);
}

async function main(): Promise<void> {
  const dataRoot = process.env.DATA_ROOT || resolve('data');
  const rawDir = resolve(dataRoot, 'raw', 'asllvd');
  const processedDir = resolve('data', 'processed', 'asllvd', 'clips');
  const manifestPath = resolve('data', 'asllvd_manifest.csv');

  console.log('[asllvd_trim] Starting video processing...');

  // Ensure output directory exists
  await ensureDir(processedDir);

  // Read and parse manifest
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

  console.log(`[asllvd_trim] ✓ Parsed ${manifestRows.length} entries from manifest`);

  // Check if raw directory exists
  if (!(await fileExists(rawDir))) {
    throw new Error(`Raw video directory does not exist: ${rawDir}`);
  }

  // Process each video
  const stats: ProcessingStats = {
    attempted: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  console.log('[asllvd_trim] Processing videos...');

  for (const row of manifestRows) {
    const outputFilename = generateOutputFilename(row);
    const outputPath = resolve(processedDir, outputFilename);

    stats.attempted++;

    try {
      // Skip if output already exists
      if (await fileExists(outputPath)) {
        console.log(`[asllvd_trim] skip exists ${outputFilename}`);
        stats.skipped++;
        continue;
      }

      // Find raw video file
      const rawFile = await findRawVideoFile(rawDir, row);
      if (!rawFile) {
        throw new Error(
          `Raw video file not found for ${row.gloss}_${row.signer}_${row.token_id}`,
        );
      }

      console.log(`[asllvd_trim] processing ${outputFilename} from ${basename(rawFile)}`);
      await processVideo(rawFile, outputPath, row);
      console.log(`[asllvd_trim] ✓ completed ${outputFilename}`);
      stats.completed++;
    } catch (err) {
      const errorMsg = `${outputFilename}: ${(err as Error).message}`;
      console.warn(`[asllvd_trim] ✗ failed ${errorMsg}`);
      stats.failed++;
      stats.errors.push(errorMsg);
    }
  }

  // Report summary
  console.log('\n[asllvd_trim] Processing Summary:');
  console.log(`  Total videos processed: ${manifestRows.length}`);
  console.log(`  Processing attempted: ${stats.attempted}`);
  console.log(`  Processing completed: ${stats.completed}`);
  console.log(`  Processing failed: ${stats.failed}`);
  console.log(`  Files skipped (existing): ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log('\n[asllvd_trim] Errors:');
    stats.errors.forEach((error) => console.log(`  - ${error}`));
  }

  console.log('\n[asllvd_trim] ✓ Video normalization complete!');
}

main().catch((e) => {
  console.error('[asllvd_trim] fatal', e);
  process.exit(1);
});
