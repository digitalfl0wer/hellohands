import { createWriteStream } from 'node:fs';
import { mkdir, readFile, readdir, stat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { createHash } from 'node:crypto';

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

interface PackDefinition {
  packId: string;
  category: string;
  items: string[];
}

interface Label {
  id: string;
  dataset: string;
  subset: string;
  split: string;
  path: string;
  label: number;
  class_name: string;
  signer_id: string;
  start: number;
  end: number;
  poster_path?: string;
  checksum?: string;
  poster_checksum?: string;
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

async function calculateChecksum(filePath: string): Promise<string> {
  const fileBuffer = await readFile(filePath);
  return createHash('sha256').update(fileBuffer).digest('hex');
}

function parseCSV(content: string): ManifestRow[] {
  const lines = content.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('Empty manifest file');
  }

  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row: any = {};
    header.forEach((col, i) => {
      row[col] = values[i]?.trim() || '';
    });
    return row as ManifestRow;
  });
}

function generateClipFilename(row: ManifestRow): string {
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `asllvd_${clean(row.gloss)}_${clean(row.signer)}_${clean(row.token_id)}.mp4`;
}

function generatePosterFilename(clipFilename: string): string {
  return clipFilename.replace('.mp4', '.png');
}

async function getVideoDuration(videoPath: string): Promise<number> {
  const { spawn } = await import('node:child_process');
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

function getPackForGloss(
  gloss: string,
  packs: PackDefinition[],
): { subset: string; label: number } | null {
  for (const pack of packs) {
    const index = pack.items.indexOf(gloss);
    if (index !== -1) {
      return {
        subset: pack.category,
        label: index,
      };
    }
  }
  return null;
}

async function main(): Promise<void> {
  const processedDir = resolve('data', 'processed', 'asllvd');
  const clipsDir = resolve(processedDir, 'clips');
  const postersDir = resolve(processedDir, 'posters');
  const labelsPath = resolve(processedDir, 'labels.jsonl');
  const manifestPath = resolve('data', 'asllvd_manifest.csv');
  const packsPath = resolve('practice', 'packs.manual.json');

  console.log('[asllvd_labels] Generating labels...');

  await ensureDir(processedDir);

  // Read manifest
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

  console.log(`[asllvd_labels] ✓ Parsed ${manifestRows.length} entries from manifest`);

  // Read pack definitions
  let packsContent: string;
  try {
    packsContent = await readFile(packsPath, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read packs file: ${packsPath}`);
  }

  let packs: PackDefinition[];
  try {
    packs = JSON.parse(packsContent);
  } catch (err) {
    throw new Error(`Failed to parse packs: ${(err as Error).message}`);
  }

  console.log(`[asllvd_labels] ✓ Loaded ${packs.length} pack definitions`);

  // Create labels output stream
  const labelsStream = createWriteStream(labelsPath);

  let processedCount = 0;
  let skippedCount = 0;

  // Process each manifest entry
  for (const row of manifestRows) {
    const clipFilename = generateClipFilename(row);
    const posterFilename = generatePosterFilename(clipFilename);
    const clipPath = resolve(clipsDir, clipFilename);
    const posterPath = resolve(postersDir, posterFilename);

    // Check if clip exists
    if (!(await fileExists(clipPath))) {
      console.log(`[asllvd_labels] skip missing ${clipFilename}`);
      skippedCount++;
      continue;
    }

    // Get pack info for this gloss
    const packInfo = getPackForGloss(row.gloss.toUpperCase(), packs);
    if (!packInfo) {
      console.log(`[asllvd_labels] skip unlisted ${row.gloss} (not in any pack)`);
      skippedCount++;
      continue;
    }

    try {
      // Get video duration
      const duration = await getVideoDuration(clipPath);

      // Calculate checksums
      const clipChecksum = await calculateChecksum(clipPath);
      let posterChecksum: string | undefined;
      if (await fileExists(posterPath)) {
        posterChecksum = await calculateChecksum(posterPath);
      }

      // Generate label entry
      const label: Label = {
        id: `asllvd_${row.gloss}_${row.signer}_${row.token_id}`,
        dataset: 'asllvd',
        subset: packInfo.subset,
        split: 'train', // All ASLLVD data is training data
        path: `data/processed/asllvd/clips/${clipFilename}`,
        label: packInfo.label,
        class_name: row.gloss.toUpperCase(),
        signer_id: row.signer,
        start: 0,
        end: duration,
        checksum: clipChecksum,
      };

      // Add poster info if available
      if (posterChecksum) {
        label.poster_path = `data/processed/asllvd/posters/${posterFilename}`;
        label.poster_checksum = posterChecksum;
      }

      // Write label to JSONL
      labelsStream.write(JSON.stringify(label) + '\n');

      console.log(`[asllvd_labels] ✓ processed ${label.class_name} (${label.subset})`);
      processedCount++;
    } catch (err) {
      console.warn(`[asllvd_labels] ✗ failed ${clipFilename}: ${(err as Error).message}`);
      skippedCount++;
    }
  }

  // Close the output stream
  labelsStream.end();

  // Report summary
  console.log('\n[asllvd_labels] Labels Generation Summary:');
  console.log(`  Total manifest entries: ${manifestRows.length}`);
  console.log(`  Labels generated: ${processedCount}`);
  console.log(`  Entries skipped: ${skippedCount}`);
  console.log(`  Labels file: ${labelsPath}`);

  // Report pack coverage
  console.log('\n[asllvd_labels] Pack Coverage:');
  for (const pack of packs) {
    const packLabels = manifestRows.filter((row) =>
      pack.items.includes(row.gloss.toUpperCase()),
    );
    const coverage = (packLabels.length / pack.items.length) * 100;
    console.log(
      `  ${pack.packId}: ${packLabels.length}/${pack.items.length} items (${coverage.toFixed(1)}%)`,
    );
  }

  console.log('\n[asllvd_labels] ✓ Labels generation complete!');
}

main().catch((e) => {
  console.error('[asllvd_labels] fatal', e);
  process.exit(1);
});
