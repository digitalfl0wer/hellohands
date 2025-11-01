import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as readline from 'node:readline';

async function run() {
  const labelsPath = resolve('data', 'processed', 'msasl', 'labels.jsonl');
  const whitelistPath = resolve('practice', 'whitelist.json');
  const packsPath = resolve('practice', 'packs.manual.json');

  // Read whitelist
  const allow = JSON.parse(readFileSync(whitelistPath, 'utf8')).allow as string[];

  // Count present clips per class_name from labels.jsonl
  const counts = new Map<string, number>();
  const rl = readline.createInterface({
    input: createReadStream(labelsPath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const s = line.trim();
    if (!s) continue;
    try {
      const j = JSON.parse(s);
      const k = String(j.class_name);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    } catch {
      /* ignore malformed lines */
    }
  }

  // Intersect with whitelist and pick top 20 by count
  const present = allow
    .filter((name) => counts.has(name))
    .map((name) => ({ name, cnt: counts.get(name)! }))
    .sort((a, b) => b.cnt - a.cnt)
    .slice(0, 20)
    .map((x) => x.name);

  // If fewer than 20, just take remaining present (still deduped)
  if (present.length < 20) {
    const extras = [...counts.entries()]
      .filter(([name]) => !present.includes(name))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20 - present.length)
      .map(([name]) => name);
    present.push(...extras);
  }

  // Append new pack
  const packs = JSON.parse(readFileSync(packsPath, 'utf8'));
  packs.push({ id: 'L1-ESSENTIALS-DEMO', category: 'essentials', items: present });
  writeFileSync(packsPath, JSON.stringify(packs, null, 2));

  console.log('[autofill] L1-ESSENTIALS-DEMO items (' + present.length + '):');
  console.log(present.join(', '));
}

run().catch((e) => {
  console.error('[autofill] fatal', e);
  process.exit(1);
});
