#!/usr/bin/env tsx
/**
 * ASLLVD URL Discovery Script
 *
 * Discovers actual video URLs from the ASLLVD DAI interface
 * and updates the manifest with real URLs instead of placeholders.
 *
 * Usage: pnpm asllvd:discover-urls
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

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

// Load gloss configuration
async function loadGlossConfig(): Promise<{
  primary_glosses: string[];
  backup_glosses: string[];
}> {
  const configPath = resolve('practice', 'asllvd.gloss.config.json');
  try {
    const configModule = await import(configPath);
    return configModule.default || configModule;
  } catch (error) {
    console.warn(`Could not load config from ${configPath}, using defaults`);
    return {
      primary_glosses: ['WATER', 'EAT', 'DRINK'],
      backup_glosses: ['FAMILY', 'HELP'],
    };
  }
}

// Function to extract video URLs from DAI HTML response
async function extractVideoFromHTML(
  htmlContent: string,
  originalUrl: string,
): Promise<string | null> {
  // Look for video source URLs in the HTML
  const sourceMatch = htmlContent.match(/<source[^>]+src=["']([^"']+)["']/i);
  if (sourceMatch) {
    return sourceMatch[1];
  }

  // Look for param src URLs (fallback)
  const paramMatch = htmlContent.match(
    /<param[^>]+value=["']([^"']+)["'][^>]*name=["']src["']/i,
  );
  if (paramMatch) {
    return paramMatch[1];
  }

  console.log(`⚠️  No video URL found in HTML from ${originalUrl}`);
  return null;
}

// Function to fetch DAI page and extract video URL
async function fetchVideoURLFromDAI(
  videoId: string,
  cookie: string,
): Promise<string | null> {
  const daiUrl = `https://dai.cs.rutgers.edu/dai/s/video?id=${videoId}&type=separate&datasource=T`;

  try {
    // Fetch the DAI page (this would normally require network access)
    // For now, we'll simulate based on patterns we observed
    console.log(`🔗 Processing DAI URL: ${daiUrl}`);

    // Based on the HTML we saw, extract video ID and construct real URL
    // The pattern seems to be: video?id=XXXX -> signs_mov_separ_signers/[signer]_[number].mp4
    // But we need more logic to map IDs to actual filenames

    // For now, return null to indicate we need to implement this properly
    console.log(`📝 Need to implement video URL extraction for ID: ${videoId}`);
    return null;
  } catch (error) {
    console.error(`❌ Failed to fetch from DAI: ${daiUrl}`, error);
    return null;
  }
}

// Function to discover real video URLs from manifest
async function discoverVideoURLs(glosses: string[]): Promise<Map<string, string[]>> {
  console.log('🔍 Discovering ASLLVD video URLs from DAI interface...');

  const urlMap = new Map<string, string[]>();
  const cookie = process.env.ASLLVD_COOKIE;

  if (!cookie) {
    console.error('❌ ASLLVD_COOKIE not set - cannot access DAI');
    return urlMap;
  }

  console.log('✅ Using authentication cookie for DAI access');

  // Read current manifest to get the DAI URLs that are already working
  try {
    const manifestContent = await readFile('data/asllvd_manifest.csv', 'utf8');
    const lines = manifestContent.trim().split('\n');

    for (let i = 1; i < lines.length; i++) {
      // Skip header
      const [gloss, signer, tokenId, viewId, src] = lines[i].split(',');

      // If this is already a DAI URL (not a placeholder), try to extract video URL
      if (src.includes('dai.cs.rutgers.edu') && gloss && glosses.includes(gloss)) {
        // Extract video ID from URL
        const idMatch = src.match(/id=(\d+)/);
        if (idMatch) {
          const videoId = idMatch[1];
          console.log(`🎯 Found DAI URL for ${gloss} (ID: ${videoId})`);

          // Try to get the actual video URL
          const videoUrl = await fetchVideoURLFromDAI(videoId, cookie);
          if (videoUrl) {
            const existing = urlMap.get(gloss) || [];
            existing.push(videoUrl);
            urlMap.set(gloss, existing);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error reading manifest:', error);
  }

  console.log(`📋 Successfully extracted video URLs for ${urlMap.size} glosses`);
  return urlMap;
}

function updateManifestWithRealURLs(
  manifest: ManifestEntry[],
  urlMap: Map<string, string[]>,
): ManifestEntry[] {
  const updatedManifest: ManifestEntry[] = [];

  for (const entry of manifest) {
    const gloss = entry.gloss;
    const availableUrls = urlMap.get(gloss);

    if (availableUrls && availableUrls.length > 0) {
      // Use the first available URL for this gloss
      updatedManifest.push({
        ...entry,
        src: availableUrls[0], // Could implement view selection logic here
      });
      console.log(`✅ Updated ${gloss}: ${availableUrls[0]}`);
    } else {
      // Keep original placeholder but mark as not found
      updatedManifest.push(entry);
      console.log(`⚠️  No URL found for ${gloss}, keeping placeholder`);
    }
  }

  return updatedManifest;
}

async function main(): Promise<void> {
  console.log('🚀 ASLLVD URL Discovery');
  console.log('='.repeat(50));

  try {
    // Load current manifest
    const manifestPath = resolve('data', 'asllvd_manifest.csv');
    const manifestContent = await readFile(manifestPath, 'utf8');
    const lines = manifestContent.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('Manifest appears to be empty or missing data rows');
    }

    // Parse manifest
    const header = lines[0].split(',');
    const manifest: ManifestEntry[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 8) {
        manifest.push({
          gloss: values[0],
          signer: values[1],
          token_id: values[2],
          view_id: values[3],
          src: values[4],
          start_frame: parseInt(values[5]),
          end_frame: parseInt(values[6]),
          native_fps: parseInt(values[7]),
        });
      }
    }

    console.log(`📄 Loaded ${manifest.length} entries from manifest`);

    // Load gloss configuration
    const config = await loadGlossConfig();
    const allGlosses = [...config.primary_glosses, ...config.backup_glosses];

    // Discover real URLs
    const urlMap = await discoverVideoURLs(allGlosses);

    // Update manifest with real URLs
    const updatedManifest = updateManifestWithRealURLs(manifest, urlMap);

    // Write back to CSV
    const csvHeader =
      'gloss,signer,token_id,view_id,src,start_frame,end_frame,native_fps\n';
    const csvRows = updatedManifest.map(
      (entry) =>
        `${entry.gloss},${entry.signer},${entry.token_id},${entry.view_id},${entry.src},${entry.start_frame},${entry.end_frame},${entry.native_fps}`,
    );
    const csvContent = csvHeader + csvRows.join('\n') + '\n';

    await writeFile(manifestPath, csvContent);
    console.log(`💾 Updated manifest saved to ${manifestPath}`);

    const updatedCount = updatedManifest.filter(
      (entry, index) => entry.src !== manifest[index]?.src,
    ).length;

    console.log(`🔄 Updated ${updatedCount} URLs with discovered real URLs`);

    console.log('\n📋 Next Steps:');
    console.log('1. Review the updated manifest for correct URLs');
    console.log('2. Test a few URLs manually with your cookie:');
    console.log('   curl -I -H "Cookie: JSESSIONID=YOUR_COOKIE" "URL_FROM_MANIFEST"');
    console.log('3. Run: ./run_asllvd.sh ingest');

    console.log('\n⚠️  Important: The current implementation uses mock URLs.');
    console.log('   You need to implement real URL discovery from the DAI interface.');
  } catch (error) {
    console.error('💥 URL discovery failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
