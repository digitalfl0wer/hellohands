import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const PRACTICE_DIR = 'practice';
const OUTPUT_PATH = resolve('practice', 'packs.generated.json');
const MISSING_LOG_PATH = resolve('practice', 'packs.missing.json');

async function main(): Promise<void> {
  const [whitelistRaw, packsRaw, vocabRaw] = await Promise.all([
    readFile(resolve(PRACTICE_DIR, 'whitelist.json'), 'utf8'),
    readFile(resolve(PRACTICE_DIR, 'packs.manual.json'), 'utf8'),
    readFile(resolve(PRACTICE_DIR, 'vocab.map.json'), 'utf8'),
  ]);

  const whitelist = JSON.parse(whitelistRaw) as { allow: string[] };
  const packs = JSON.parse(packsRaw) as Array<{
    packId: string;
    category: string;
    items: string[];
  }>;
  const vocab = JSON.parse(vocabRaw) as Record<
    string,
    { aliases?: string[]; one_handed?: boolean }
  >;

  const allowSet = new Set(
    whitelist.allow.map((entry) => entry.trim().toUpperCase()).filter(Boolean),
  );

  const missingReport: Array<{
    packId: string;
    removed: Array<{ item: string; reason: string }>;
  }> = [];

  const filtered = packs.map((pack) => {
    const removed: Array<{ item: string; reason: string }> = [];
    const items = pack.items.filter((value) => {
      const normalized = value.trim().toUpperCase();
      if (!allowSet.has(normalized)) {
        removed.push({ item: value, reason: 'not whitelisted' });
        return false;
      }
      const vocabEntry = vocab[normalized];
      if (!vocabEntry?.one_handed) {
        removed.push({ item: value, reason: 'missing one_handed=true flag' });
        return false;
      }
      return true;
    });

    if (removed.length > 0) {
      missingReport.push({ packId: pack.packId, removed });
    }

    return {
      ...pack,
      items,
    };
  });

  await writeFile(OUTPUT_PATH, JSON.stringify(filtered, null, 2) + '\n');
  await writeFile(
    MISSING_LOG_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        packs: missingReport,
      },
      null,
      2,
    ) + '\n',
  );

  console.log(
    `[practice_generate_packs] wrote ${filtered.length} packs to ${OUTPUT_PATH}`,
  );
  if (missingReport.length > 0) {
    console.warn(
      `[practice_generate_packs] removed ${missingReport.reduce(
        (total, entry) => total + entry.removed.length,
        0,
      )} items; see ${MISSING_LOG_PATH}`,
    );
  } else {
    console.log('[practice_generate_packs] all manual items satisfied whitelist + one-handed rule.');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main().catch((error) => {
    console.error('[practice_generate_packs] fatal', error);
    process.exit(1);
  });
}
