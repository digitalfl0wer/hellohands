import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

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

interface PackDefinition {
  packId: string;
  category: string;
  items: string[];
}

interface PackCoverage {
  packId: string;
  category: string;
  total: number;
  covered: number;
  percentage: number;
  missing: string[];
  available: string[];
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readLabelsFile(labelsPath: string): Promise<Label[]> {
  if (!(await fileExists(labelsPath))) {
    console.log(`[asllvd_packs] Warning: labels file not found at ${labelsPath}`);
    return [];
  }

  const content = await readFile(labelsPath, 'utf8');
  const lines = content
    .trim()
    .split('\n')
    .filter((line) => line.trim());

  const labels: Label[] = [];
  for (const line of lines) {
    try {
      const label = JSON.parse(line) as Label;
      labels.push(label);
    } catch (err) {
      console.warn(`[asllvd_packs] Warning: failed to parse label line: ${line}`);
    }
  }

  return labels;
}

async function scanProcessedClips(clipsDir: string): Promise<Set<string>> {
  const clips = new Set<string>();

  if (!(await fileExists(clipsDir))) {
    console.log(`[asllvd_packs] Warning: clips directory not found at ${clipsDir}`);
    return clips;
  }

  const files = await readdir(clipsDir);
  for (const file of files) {
    if (file.endsWith('.mp4')) {
      // Extract gloss from filename: asllvd_{gloss}_{signer}_{token_id}.mp4
      const parts = basename(file, '.mp4').split('_');
      if (parts.length >= 2) {
        const gloss = parts[1].toUpperCase();
        clips.add(gloss);
      }
    }
  }

  return clips;
}

function analyzePackCoverage(
  manualPacks: PackDefinition[],
  availableGlosses: Set<string>,
  labelsByGloss: Map<string, Label[]>,
): PackCoverage[] {
  return manualPacks.map((pack) => {
    const available = pack.items.filter((gloss) => availableGlosses.has(gloss));
    const missing = pack.items.filter((gloss) => !availableGlosses.has(gloss));

    return {
      packId: pack.packId,
      category: pack.category,
      total: pack.items.length,
      covered: available.length,
      percentage: (available.length / pack.items.length) * 100,
      missing,
      available,
    };
  });
}

function generatePacksFromCoverage(
  manualPacks: PackDefinition[],
  coverage: PackCoverage[],
): PackDefinition[] {
  return manualPacks
    .map((pack, index) => ({
      packId: pack.packId,
      category: pack.category,
      items: coverage[index].available, // Only include available items
    }))
    .filter((pack) => pack.items.length > 0); // Only include packs with content
}

function printSummary(
  availableGlosses: Set<string>,
  labels: Label[],
  coverage: PackCoverage[],
  generatedPacks: PackDefinition[],
): void {
  console.log('\n' + '='.repeat(70));
  console.log('📊 ASLLVD PACK BUILDING SUMMARY');
  console.log('='.repeat(70));

  // Generation statistics
  console.log('\n📈 Generation Statistics:');
  console.log(`   Total available glosses: ${availableGlosses.size}`);
  console.log(`   Total labels generated: ${labels.length}`);
  console.log(`   Pack definitions created: ${generatedPacks.length}`);

  // Pack coverage analysis
  console.log('\n📦 Pack Coverage Analysis:');
  let totalItems = 0;
  let totalCovered = 0;

  for (const packCoverage of coverage) {
    totalItems += packCoverage.total;
    totalCovered += packCoverage.covered;

    const status =
      packCoverage.percentage >= 90 ? '✅' : packCoverage.percentage >= 75 ? '⚠️' : '❌';

    console.log(`   ${status} ${packCoverage.packId}:`);
    console.log(
      `      Coverage: ${packCoverage.covered}/${packCoverage.total} items (${packCoverage.percentage.toFixed(1)}%)`,
    );
    console.log(
      `      Available: [${packCoverage.available.slice(0, 5).join(', ')}${packCoverage.available.length > 5 ? '...' : ''}]`,
    );

    if (packCoverage.missing.length > 0) {
      console.log(
        `      Missing: [${packCoverage.missing.slice(0, 5).join(', ')}${packCoverage.missing.length > 5 ? '...' : ''}]`,
      );
    }
  }

  // Overall performance
  const overallCoverage = totalItems > 0 ? (totalCovered / totalItems) * 100 : 0;
  const minimumCoverage = 90.0;

  console.log('\n🎯 Overall Performance:');
  const overallStatus =
    overallCoverage >= 90 ? '✅' : overallCoverage >= 75 ? '⚠️' : '❌';
  console.log(`   ${overallStatus} Overall Coverage: ${overallCoverage.toFixed(1)}%`);

  if (overallCoverage >= minimumCoverage) {
    console.log('   🏆 Meets production requirements (≥90% coverage)');
  } else {
    console.log('   🔧 Below production threshold - more content needed');
  }

  console.log('\n📁 Output Files Generated:');
  console.log('   ├── labels.jsonl - Dataset metadata with checksums');
  console.log(
    '   └── packs.generated.json - Pack definitions matching available content',
  );

  console.log('\n' + '='.repeat(70));
  console.log('✨ ASLLVD Pack Building Complete!');
  console.log('='.repeat(70));
}

async function main(): Promise<void> {
  const processedDir = resolve('data', 'processed', 'asllvd');
  const clipsDir = resolve(processedDir, 'clips');
  const labelsPath = resolve(processedDir, 'labels.jsonl');
  const manualPacksPath = resolve('practice', 'packs.manual.json');
  const generatedPacksPath = resolve('practice', 'packs.generated.json');

  console.log('[asllvd_packs] 🚀 Building ASLLVD pack definitions...');

  // Read manual pack definitions (our template)
  let manualPacks: PackDefinition[] = [];
  if (await fileExists(manualPacksPath)) {
    const content = await readFile(manualPacksPath, 'utf8');
    manualPacks = JSON.parse(content);
    console.log(`[asllvd_packs] ✓ Loaded ${manualPacks.length} manual pack definitions`);
  } else {
    throw new Error(`Manual packs file not found: ${manualPacksPath}`);
  }

  // Scan available clips
  const availableGlosses = await scanProcessedClips(clipsDir);
  console.log(
    `[asllvd_packs] ✓ Found ${availableGlosses.size} unique glosses in clips directory`,
  );

  // Read labels file for additional metadata
  const labels = await readLabelsFile(labelsPath);
  console.log(`[asllvd_packs] ✓ Loaded ${labels.length} labels from labels.jsonl`);

  // Group labels by gloss for quick lookup
  const labelsByGloss = new Map<string, Label[]>();
  for (const label of labels) {
    const glossLabels = labelsByGloss.get(label.class_name) || [];
    glossLabels.push(label);
    labelsByGloss.set(label.class_name, glossLabels);
  }

  // Analyze coverage
  const coverage = analyzePackCoverage(manualPacks, availableGlosses, labelsByGloss);

  // Generate pack definitions with only available items
  const generatedPacks = generatePacksFromCoverage(manualPacks, coverage);

  // Write generated packs
  await writeFile(generatedPacksPath, JSON.stringify(generatedPacks, null, 2));
  console.log(`[asllvd_packs] ✓ Generated packs written to ${generatedPacksPath}`);

  // Print comprehensive summary
  printSummary(availableGlosses, labels, coverage, generatedPacks);

  console.log('[asllvd_packs] ✓ Pack building complete!');
}

main().catch((e) => {
  console.error('[asllvd_packs] fatal', e);
  process.exit(1);
});
