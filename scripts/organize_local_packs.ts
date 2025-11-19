#!/usr/bin/env tsx
/**
 * Organizes local video clips into 3 practice packs based on packs.manual.json
 * Deduplicates items by sign, keeps all variants, applies gesture mappings
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

interface PackItem {
  id: string;
  sign: string;
  expectedGesture: string;
  clipUrl: string;
  variant?: number;
  posterUrl?: string;
}

interface Pack {
  packId: string;
  title: string;
  level: number;
  category: string;
  items: PackItem[];
}

interface ManualPack {
  packId: string;
  category: string;
  items: string[];
}

// Load input files
const currentPack = JSON.parse(
  readFileSync(join(ROOT, 'public/local/local_pack.json'), 'utf-8')
);
const manualPacks: ManualPack[] = JSON.parse(
  readFileSync(join(ROOT, 'practice/packs.manual.json'), 'utf-8')
);
const signGestures: Record<string, string> = JSON.parse(
  readFileSync(join(ROOT, 'practice/sign-gestures.json'), 'utf-8')
);

console.log(`📦 Loaded ${currentPack.items.length} items from local_pack.json`);

// Group items by sign
const itemsBySign = new Map<string, PackItem[]>();
for (const item of currentPack.items) {
  const sign = item.sign.toUpperCase();
  if (!itemsBySign.has(sign)) {
    itemsBySign.set(sign, []);
  }
  itemsBySign.get(sign)!.push(item);
}

console.log(`🔤 Found ${itemsBySign.size} unique signs`);
for (const [sign, items] of itemsBySign.entries()) {
  console.log(`   ${sign}: ${items.length} variant${items.length > 1 ? 's' : ''}`);
}

// Create pack structure based on manual packs
const outputPacks: Pack[] = [];

const packTitles: Record<string, { title: string; level: number }> = {
  'L1-ESSENTIALS': { title: 'Level 1 · Essentials', level: 1 },
  'L1-SOCIAL-BASICS': { title: 'Level 1 · Social Basics', level: 1 },
  'L2-INTERMEDIATE': { title: 'Level 2 · Intermediate', level: 2 },
};

for (const manualPack of manualPacks) {
  const pack: Pack = {
    packId: manualPack.packId,
    title: packTitles[manualPack.packId]?.title || manualPack.packId,
    level: packTitles[manualPack.packId]?.level || 1,
    category: manualPack.category,
    items: [],
  };

  // For each sign in this pack's definition
  for (const signName of manualPack.items) {
    const sign = signName.toUpperCase();
    const variants = itemsBySign.get(sign);

    if (variants && variants.length > 0) {
      // Add all variants with proper metadata
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const expectedGesture = signGestures[sign] || variant.expectedGesture || 'open_palm';

        pack.items.push({
          id: `${sign.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-var${i + 1}-${variant.id}`,
          sign: sign,
          expectedGesture: expectedGesture,
          clipUrl: variant.clipUrl,
          variant: i + 1,
          ...(variant.posterUrl && { posterUrl: variant.posterUrl }),
        });
      }
    }
  }

  outputPacks.push(pack);
}

// Report
console.log('\n📊 Pack Summary:');
for (const pack of outputPacks) {
  const uniqueSigns = new Set(pack.items.map((item) => item.sign)).size;
  console.log(`   ${pack.packId}: ${uniqueSigns} signs, ${pack.items.length} total items`);
}

// Write output
const outputPath = join(ROOT, 'public/local/local_packs.json');
writeFileSync(outputPath, JSON.stringify(outputPacks, null, 2), 'utf-8');
console.log(`\n✅ Wrote ${outputPath}`);

// Statistics
const totalUniqueInPacks = new Set(
  outputPacks.flatMap((p) => p.items.map((i) => i.sign))
).size;
const totalItems = outputPacks.reduce((sum, p) => sum + p.items.length, 0);
console.log(`\n📈 Total: ${totalUniqueInPacks} unique signs, ${totalItems} video clips`);

// Show what's missing
console.log('\n🔍 Coverage:');
for (const manualPack of manualPacks) {
  const expectedSigns = new Set(manualPack.items.map((s) => s.toUpperCase()));
  const availableSigns = new Set(
    outputPacks
      .find((p) => p.packId === manualPack.packId)
      ?.items.map((i) => i.sign) || []
  );

  const missing = [...expectedSigns].filter((s) => !availableSigns.has(s));
  const coverage = ((availableSigns.size / expectedSigns.size) * 100).toFixed(1);

  console.log(`   ${manualPack.packId}: ${coverage}% (${availableSigns.size}/${expectedSigns.size})`);
  if (missing.length > 0 && missing.length <= 10) {
    console.log(`      Missing: ${missing.join(', ')}`);
  } else if (missing.length > 10) {
    console.log(`      Missing: ${missing.slice(0, 10).join(', ')} ... and ${missing.length - 10} more`);
  }
}

