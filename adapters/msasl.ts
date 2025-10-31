import { readFile } from 'node:fs/promises';

export interface MsaslSourceRecord {
  id?: number;
  label: number;
  text: string;
  signer_id: number;
  url: string;
  start_time?: number;
  end_time?: number;
  box?: [number, number, number, number];
  subset?: string;
  split?: 'train' | 'val' | 'test';
  file?: string;
  clean_text?: string;
}

export interface UnifiedLabel {
  id: string;
  dataset: 'msasl';
  subset: string;
  split: 'train' | 'val' | 'test';
  path: string;
  label: number;
  class_name: string;
  signer_id: string;
  start: number;
  end: number;
  box?: [number, number, number, number];
}

export interface LoadOptions {
  subsetName: string;
  split: 'train' | 'val' | 'test';
  jsonPath: string;
}

/**
 * Reads a MS-ASL JSON file and returns the parsed records.
 * The result is intentionally unfiltered; downstream scripts can
 * supply their own predicates and transformations.
 */
export async function loadMsaslSplit(options: LoadOptions): Promise<MsaslSourceRecord[]> {
  const contents = await readFile(options.jsonPath, 'utf8');
  const parsed = JSON.parse(contents) as MsaslSourceRecord[];

  return parsed;
}

/**
 * Normalises a MS-ASL entry into the shared `UnifiedLabel` shape.
 * Downstream consumers are expected to provide resolved media paths.
 */
export function toUnifiedLabel(params: {
  record: MsaslSourceRecord;
  subsetName: string;
  split: 'train' | 'val' | 'test';
  mediaPath: string;
}): UnifiedLabel {
  const { record, subsetName, split, mediaPath } = params;

  return {
    id: `msasl_${split}_${(record.id || 0).toString().padStart(6, '0')}`,
    dataset: 'msasl',
    subset: subsetName,
    split,
    path: mediaPath,
    label: record.label,
    class_name: record.text || record.clean_text || '',
    signer_id: record.signer_id.toString(),
    start: record.start_time ?? 0,
    end: record.end_time ?? record.start_time ?? 0,
    box: record.box,
  };
}

export function isValidMsaslRecord(value: unknown): value is MsaslSourceRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as any;
  return (
    typeof v.label === 'number' &&
    typeof v.text === 'string' &&
    typeof v.signer_id === 'number' &&
    typeof v.url === 'string'
  );
}
