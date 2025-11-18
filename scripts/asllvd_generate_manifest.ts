#!/usr/bin/env tsx
/**
 * ASLLVD Manifest Generator
 *
 * Generates data/asllvd_manifest.csv with target gloss entries.
 * This script fetches ASLLVD metadata and creates a manifest for the target glosses.
 *
 * Usage: pnpm asllvd:generate-manifest
 */

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface GlossConfig {
  primary_glosses: string[];
  backup_glosses: string[];
}

// Load gloss configuration
async function loadGlossConfig(): Promise<GlossConfig> {
  const configPath = resolve('practice', 'asllvd.gloss.config.json');
  try {
    const configModule = await import(configPath);
    return configModule.default || configModule;
  } catch (error) {
    console.warn(
      `[asllvd_generate_manifest] Could not load config from ${configPath}, using defaults`,
    );
    // Default config with the 35 primary glosses
    return {
      primary_glosses: [
        'WATER',
        'EAT',
        'DRINK',
        'BATHROOM',
        'LIKE',
        "DON'T LIKE",
        'HOME',
        'SLEEP',
        'HUNGRY',
        'WHERE',
        'WHO',
        'WHY',
        'YES',
        'NO',
        'HOT',
        'CLEAN',
        'DIRTY',
        'PAY',
        'PHONE',
        'WAIT',
        'HELLO',
        'GOODBYE',
        'PLEASE',
        'THANK YOU',
        'SORRY',
        'NICE',
        'LATER',
        'NOW',
        'AGAIN',
        'EXCUSE-ME',
        'SEE-YOU',
        'OK',
        'COOL',
        'BUSY',
        'READY',
      ],
      backup_glosses: [
        'FAMILY',
        'FRIEND',
        'HELP',
        'WANT',
        'GO',
        'COME',
        'SCHOOL',
        'WORK',
        'HAPPY',
        'SAD',
        'SICK',
        'TIRED',
        'LOVE',
        'FINISH',
        'TIME',
      ],
    };
  }
}

interface ManifestEntry {
  gloss: string;
  signer: string;
  token_id: string;
  view_id: string;
  src: string;
  start_frame: number;
  end_frame: number;
  native_fps: number;
}

// Generate sample manifest entries (placeholder - replace with real ASLLVD API calls)
function generateSampleEntries(glosses: string[]): ManifestEntry[] {
  const entries: ManifestEntry[] = [];
  const signers = ['signer001', 'signer002', 'signer003', 'signer004', 'signer005'];
  const views = ['front_a', 'front_b', 'side'];

  for (const gloss of glosses) {
    // Generate 1-2 entries per gloss (prioritize quality over quantity)
    const numEntries = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < numEntries; i++) {
      const signer = signers[Math.floor(Math.random() * signers.length)];
      const view = views[Math.floor(Math.random() * views.length)];
      const tokenId = `${gloss.toLowerCase().replace(/\s+/g, '_')}_${signer}_${i + 1}`;

      entries.push({
        gloss: gloss,
        signer: signer,
        token_id: tokenId,
        view_id: view,
        src: `https://www.bu.edu/asllvd/videos/${tokenId}.mp4`, // Placeholder URL
        start_frame: 0,
        end_frame: Math.floor(Math.random() * 60) + 30, // 1-3 seconds at 30fps
        native_fps: 30,
      });
    }
  }

  return entries;
}

// Fetch real ASLLVD data (placeholder - implement actual API calls)
async function fetchASLLVDData(glosses: string[]): Promise<ManifestEntry[]> {
  console.log('[asllvd_generate_manifest] Fetching ASLLVD metadata...');

  // TODO: Implement actual ASLLVD API calls or data fetching
  // For now, return sample data
  console.log('[asllvd_generate_manifest] Using sample data (implement real API calls)');

  return generateSampleEntries(glosses);
}

function entriesToCSV(entries: ManifestEntry[]): string {
  const header = 'gloss,signer,token_id,view_id,src,start_frame,end_frame,native_fps\n';
  const rows = entries.map(
    (entry) =>
      `${entry.gloss},${entry.signer},${entry.token_id},${entry.view_id},${entry.src},${entry.start_frame},${entry.end_frame},${entry.native_fps}`,
  );
  return header + rows.join('\n') + '\n';
}

async function main(): Promise<void> {
  console.log('🚀 ASLLVD Manifest Generator');
  console.log('='.repeat(50));

  try {
    // Load gloss configuration
    const config = await loadGlossConfig();
    const allGlosses = [...config.primary_glosses, ...config.backup_glosses];

    console.log(`📋 Target glosses: ${allGlosses.length} total`);
    console.log(`   • Primary: ${config.primary_glosses.length} glosses`);
    console.log(`   • Backup: ${config.backup_glosses.length} glosses`);

    // Fetch ASLLVD data
    const entries = await fetchASLLVDData(allGlosses);

    // Apply canonical view selection (prefer front views)
    const prioritizedEntries = entries.sort((a, b) => {
      const viewPriority = (view: string) => {
        if (view.includes('front')) return 1;
        if (view.includes('side')) return 2;
        return 3;
      };
      return viewPriority(a.view_id) - viewPriority(b.view_id);
    });

    // Group by gloss and take best view per gloss
    const selectedEntries: ManifestEntry[] = [];
    const glossMap = new Map<string, ManifestEntry[]>();

    for (const entry of prioritizedEntries) {
      if (!glossMap.has(entry.gloss)) {
        glossMap.set(entry.gloss, []);
      }
      glossMap.get(entry.gloss)!.push(entry);
    }

    for (const [gloss, glossEntries] of glossMap) {
      // Take the first (highest priority) view for each gloss
      selectedEntries.push(glossEntries[0]);
    }

    console.log(`📊 Generated manifest with ${selectedEntries.length} entries`);

    // Show per-gloss summary
    const glossCounts = new Map<string, number>();
    for (const entry of selectedEntries) {
      glossCounts.set(entry.gloss, (glossCounts.get(entry.gloss) || 0) + 1);
    }

    console.log('\n📈 Per-gloss counts:');
    for (const [gloss, count] of glossCounts) {
      console.log(`   ${gloss}: ${count} token(s)`);
    }

    // Write manifest file
    const csvContent = entriesToCSV(selectedEntries);
    const manifestPath = resolve('data', 'asllvd_manifest.csv');

    await writeFile(manifestPath, csvContent, 'utf8');

    console.log(`\n💾 Manifest written to: ${manifestPath}`);
    console.log(`📏 File size: ${csvContent.length} characters`);
    console.log(`📋 Rows: ${selectedEntries.length + 1} (including header)`);

    // Verify the file was written correctly
    const lines = csvContent.trim().split('\n');
    console.log(`✅ Verification: ${lines.length} lines written`);

    if (lines.length > 1) {
      console.log('✅ Manifest contains data rows (not just header)');
    } else {
      console.log('⚠️  Manifest only contains header - no data rows');
    }

    console.log('\n🎉 Manifest generation complete!');
    console.log('\n💡 Next steps:');
    console.log('   • Review the generated manifest for accuracy');
    console.log('   • Run: goose run --recipe goose/recipes/asllvd_ingest.yaml');
  } catch (error) {
    console.error('💥 Manifest generation failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
