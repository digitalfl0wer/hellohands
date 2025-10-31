import { loadPipelineEnv } from './_env';

async function main(): Promise<void> {
  const env = loadPipelineEnv();

  console.log(
    [
      '[msasl_trim]',
      `fps=${env.VIDEO_FPS}`,
      `size=${env.VIDEO_SIZE}`,
      'TODO: invoke ffmpeg to trim and standardise downloaded clips.',
    ].join(' '),
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error('[msasl_trim] fatal', error);
    process.exit(1);
  });
}
