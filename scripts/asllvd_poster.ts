import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';

interface PosterStats {
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

async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v',
      'quiet',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      videoPath,
    ]);

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        if (isNaN(duration)) {
          reject(new Error('Failed to parse video duration'));
        } else {
          resolve(duration);
        }
      } else {
        reject(new Error(`ffprobe exited with ${code}`));
      }
    });
  });
}

async function generatePoster(clipPath: string, posterPath: string): Promise<void> {
  // Get video duration to extract frame from middle of the sign
  const duration = await getVideoDuration(clipPath);
  const midTime = duration / 2;

  // Extract frame from middle of the video
  const ffmpegArgs = [
    '-y', // Overwrite output files
    '-i',
    clipPath,
    '-ss',
    midTime.toString(),
    '-vframes',
    '1',
    '-q:v',
    '2', // High quality JPEG
    '-f',
    'image2',
    posterPath,
  ];

  await runFfmpeg(ffmpegArgs);
}

function getClipFiles(clipsDir: string): Promise<string[]> {
  return readdir(clipsDir).then((files) =>
    files
      .filter((file) => extname(file).toLowerCase() === '.mp4')
      .map((file) => resolve(clipsDir, file)),
  );
}

function generatePosterFilename(clipPath: string): string {
  const clipName = basename(clipPath, '.mp4');
  return `${clipName}.png`;
}

async function main(): Promise<void> {
  const processedDir = resolve('data', 'processed', 'asllvd');
  const clipsDir = resolve(processedDir, 'clips');
  const postersDir = resolve(processedDir, 'posters');

  console.log('[asllvd_poster] Generating posters...');

  // Ensure directories exist
  await ensureDir(postersDir);

  // Check if clips directory exists
  if (!(await fileExists(clipsDir))) {
    throw new Error(`Clips directory does not exist: ${clipsDir}`);
  }

  // Get all clip files
  const clipFiles = await getClipFiles(clipsDir);

  if (clipFiles.length === 0) {
    console.log('[asllvd_poster] No clip files found to process');
    return;
  }

  console.log(`[asllvd_poster] Found ${clipFiles.length} clip files to process`);

  const stats: PosterStats = {
    attempted: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  // Process each clip
  for (const clipPath of clipFiles) {
    const clipName = basename(clipPath);
    const posterFilename = generatePosterFilename(clipPath);
    const posterPath = resolve(postersDir, posterFilename);

    stats.attempted++;

    try {
      // Skip if poster already exists
      if (await fileExists(posterPath)) {
        console.log(`[asllvd_poster] skip exists ${posterFilename}`);
        stats.skipped++;
        continue;
      }

      console.log(`[asllvd_poster] generating ${posterFilename} from ${clipName}`);
      await generatePoster(clipPath, posterPath);
      console.log(`[asllvd_poster] ✓ completed ${posterFilename}`);
      stats.completed++;
    } catch (err) {
      const errorMsg = `${posterFilename}: ${(err as Error).message}`;
      console.warn(`[asllvd_poster] ✗ failed ${errorMsg}`);
      stats.failed++;
      stats.errors.push(errorMsg);
    }
  }

  // Report summary
  console.log('\n[asllvd_poster] Processing Summary:');
  console.log(`  Total clips processed: ${clipFiles.length}`);
  console.log(`  Poster generation attempted: ${stats.attempted}`);
  console.log(`  Poster generation completed: ${stats.completed}`);
  console.log(`  Poster generation failed: ${stats.failed}`);
  console.log(`  Files skipped (existing): ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log('\n[asllvd_poster] Errors:');
    stats.errors.forEach((error) => console.log(`  - ${error}`));
  }

  console.log('\n[asllvd_poster] ✓ Poster generation complete!');
}

main().catch((e) => {
  console.error('[asllvd_poster] fatal', e);
  process.exit(1);
});
