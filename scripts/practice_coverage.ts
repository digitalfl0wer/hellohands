import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function main(): Promise<void> {
  const labelsPath = resolve('data', 'processed', 'msasl', 'labels.jsonl');
  const whitelistPath = resolve('practice', 'whitelist.json');

  const [labelsRaw, whitelistRaw] = await Promise.all([
    readFile(labelsPath, 'utf8').catch(() => ''),
    readFile(whitelistPath, 'utf8'),
  ]);

  const whitelist = JSON.parse(whitelistRaw) as { allow: string[] };
  const present = new Set<string>();

  if (labelsRaw.trim().length > 0) {
    for (const line of labelsRaw.trim().split('\n')) {
      if (!line) continue;
      const parsed = JSON.parse(line) as { class_name: string };
      present.add(parsed.class_name);
    }
  }

  const missing = whitelist.allow.filter((entry) => !present.has(entry));

  if (missing.length > 0) {
    console.warn('[practice_coverage] Missing clips for:', missing.join(', '));
  } else {
    console.log('[practice_coverage] All whitelist entries covered.');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error('[practice_coverage] fatal', error);
    process.exit(1);
  });
}
