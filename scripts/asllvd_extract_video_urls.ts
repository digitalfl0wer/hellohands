#!/usr/bin/env tsx
/**
 * ASLLVD Video URL Extractor
 *
 * Extracts actual video URLs from downloaded HTML files and updates manifest
 * Usage: pnpm asllvd:extract-video-urls
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
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

// Extract video URL from HTML content
function extractVideoUrlFromHTML(htmlContent: string): string | null {
  // Look for video source URLs in the HTML
  const sourceMatch = htmlContent.match(/<source[^>]+src=["']([^"']+\.mp4[^"']*)["']/i);
  if (sourceMatch) {
    return sourceMatch[1];
  }

  // Look for param src URLs (fallback)
  const paramMatch = htmlContent.match(
    /<param[^>]+value=["']([^"']+\.mp4[^"']*)["'][^>]*name=["']src["']/i,
  );
  if (paramMatch) {
    return paramMatch[1];
  }

  return null;
}

// Process downloaded HTML files and extract video URLs
async function extractVideoURLsFromDownloads(): Promise<Map<string, string>> {
  const rawDir = resolve('data', 'raw', 'asllvd');
  const urlMap = new Map<string, string>();

  console.log('🔍 Scanning downloaded files for video URLs...');

  try {
    const files = await readdir(rawDir);

    for (const file of files) {
      if (file.endsWith('.mp4')) {
        const filePath = resolve(rawDir, file);

        try {
          const content = await readFile(filePath, 'utf8');

          // Check if this is actually HTML (not a real video)
          if (content.includes('<html') || content.includes('<HTML')) {
            const videoUrl = extractVideoUrlFromHTML(content);

            if (videoUrl) {
              // Extract filename without extension for mapping
              const baseName = file.replace('.mp4', '');
              urlMap.set(baseName, videoUrl);
              console.log(`✅ Extracted URL for ${baseName}: ${videoUrl}`);
            } else {
              console.log(`⚠️  No video URL found in ${file}`);
            }
          }
        } catch (error) {
          console.log(`⚠️  Could not read ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error scanning download directory:', error);
  }

  console.log(`📋 Found ${urlMap.size} video URLs in downloaded files`);
  return urlMap;
}

// Update manifest with extracted video URLs
async function updateManifestWithExtractedURLs(
  urlMap: Map<string, string>,
): Promise<void> {
  const manifestPath = resolve('data', 'asllvd_manifest.csv');

  console.log('📝 Updating manifest with extracted video URLs...');

  try {
    const manifestContent = await readFile(manifestPath, 'utf8');
    const lines = manifestContent.trim().split('\n');

    let updatedCount = 0;

    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 5) {
        const [gloss, signer, tokenId, viewId] = parts;

        // Create filename that matches our downloaded files
        const filename =
          `${gloss.toLowerCase().replace(/\s+/g, '_')}_${signer}_${tokenId}_${viewId}`.replace(
            /[^a-zA-Z0-9_-]/g,
            '_',
          );

        // Check if we have an extracted URL for this file
        const extractedUrl = urlMap.get(filename);
        if (extractedUrl) {
          // Update the URL in the manifest
          parts[4] = extractedUrl; // src column
          lines[i] = parts.join(',');
          updatedCount++;
          console.log(`🔄 Updated ${filename}: ${extractedUrl}`);
        }
      }
    }

    // Write back the updated manifest
    const updatedContent = lines.join('\n') + '\n';
    await writeFile(manifestPath, updatedContent);

    console.log(`✅ Updated ${updatedCount} URLs in manifest`);
  } catch (error) {
    console.error('❌ Error updating manifest:', error);
  }
}

async function main(): Promise<void> {
  console.log('🎬 ASLLVD Video URL Extractor');
  console.log('='.repeat(50));

  try {
    // Extract video URLs from downloaded HTML files
    const urlMap = await extractVideoURLsFromDownloads();

    if (urlMap.size === 0) {
      console.log('⚠️  No video URLs found in downloaded files');
      console.log(
        '   Make sure you have run the ingest step first: ./run_asllvd.sh ingest',
      );
      return;
    }

    // Update manifest with extracted URLs
    await updateManifestWithExtractedURLs(urlMap);

    console.log('\n🎯 Next Steps:');
    console.log('1. Review the updated manifest to ensure URLs look correct');
    console.log('2. Test a few URLs manually:');
    console.log('   curl -I -H "Cookie: JSESSIONID=YOUR_COOKIE" "EXTRACTED_URL"');
    console.log('3. Re-run ingest to download actual videos: ./run_asllvd.sh ingest');
    console.log('4. Then proceed with normalize: ./run_asllvd.sh normalize');

    console.log('\n🎉 URL extraction complete!');
  } catch (error) {
    console.error('💥 Extraction failed:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
