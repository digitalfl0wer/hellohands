import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });

export interface PipelineEnv {
  DATA_ROOT: string;
  VIDEO_FPS: number;
  VIDEO_SIZE: number;
  DOWNLOAD_RETRIES: number;
  SUBSET?: number;
}

export function loadPipelineEnv(): PipelineEnv {
  const {
    DATA_ROOT = '',
    VIDEO_FPS = '30',
    VIDEO_SIZE = '256',
    DOWNLOAD_RETRIES = '3',
    SUBSET,
  } = process.env;

  if (!DATA_ROOT) {
    throw new Error('DATA_ROOT must be defined in your environment.');
  }

  return {
    DATA_ROOT,
    VIDEO_FPS: Number(VIDEO_FPS),
    VIDEO_SIZE: Number(VIDEO_SIZE),
    DOWNLOAD_RETRIES: Number(DOWNLOAD_RETRIES),
    SUBSET: SUBSET ? Number(SUBSET) : undefined,
  };
}
