import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { request } from 'node:https';

const DEST = resolve('public', 'hand_landmarker.task');
const URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

async function main(): Promise<void> {
  await mkdir(resolve('public'), { recursive: true });

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const req = request(URL, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        rejectPromise(
          new Error(`HTTP ${res.statusCode} ${res.statusMessage ?? ''}`.trim()),
        );
        return;
      }

      const fileStream = createWriteStream(DEST);
      pipeline(res, fileStream)
        .then(() => resolvePromise())
        .catch(rejectPromise);
    });

    req.on('error', rejectPromise);
    req.end();
  });

  console.log(`[hand:model] downloaded ${URL} -> ${DEST}`);
}

void main().catch((error) => {
  console.error('[hand:model] failed', error.message ?? error);
  process.exit(1);
});
