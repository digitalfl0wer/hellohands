import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from "node:url";

const PRACTICE_DIR = 'practice';

async function main(): Promise<void> {
  const whitelistPath = resolve(PRACTICE_DIR, 'whitelist.json');
  const vocabPath = resolve(PRACTICE_DIR, 'vocab.map.json');

  const [whitelistRaw, vocabRaw] = await Promise.all([
    readFile(whitelistPath, 'utf8'),
    readFile(vocabPath, 'utf8'),
  ]);

  const whitelist = JSON.parse(whitelistRaw) as { allow: string[] };
  const vocab = JSON.parse(vocabRaw) as Record<
    string,
    { aliases?: string[]; one_handed?: boolean }
  >;

  const missing = whitelist.allow.filter((entry) => !vocab[entry]?.one_handed);

  if (missing.length > 0) {
    console.error(
      '[practice_validate_whitelist] missing one-handed metadata for:',
      missing.join(', '),
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `[practice_validate_whitelist] validated ${whitelist.allow.length} entries`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
 await main().catch((error) => {
    console.error('[practice_validate_whitelist] fatal', error);
    process.exit(1);
  });
}
