import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const PRACTICE_DIR = 'practice';
const OUTPUT_PATH = resolve('practice', 'packs.generated.json');

async function main(): Promise<void> {
  const [whitelistRaw, packsRaw] = await Promise.all([
    readFile(resolve(PRACTICE_DIR, 'whitelist.json'), 'utf8'),
    readFile(resolve(PRACTICE_DIR, 'packs.manual.json'), 'utf8'),
  ]);

  const whitelist = JSON.parse(whitelistRaw) as { allow: string[] };
  const packs = JSON.parse(packsRaw) as Array<{
    packId: string;
    category: string;
    items: string[];
  }>;

  const filtered = packs.map((pack) => ({
    ...pack,
    items: pack.items.filter((value) => whitelist.allow.includes(value)),
  }));

  await writeFile(OUTPUT_PATH, JSON.stringify(filtered, null, 2) + '\n');

  console.log(
    `[practice_generate_packs] wrote ${filtered.length} packs to ${OUTPUT_PATH}`,
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[practice_generate_packs] fatal', error);
    process.exit(1);
  });
}
