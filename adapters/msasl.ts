import { readFile } from 'node:fs/promises';

export interface MsaslSourceRecord {
  id?: number;
  label: number;
  text?: string;
  clean_text?: string;
  label_text?: string;
  class_name?: string;
  signer_id: number | string;
  url: string;
  start_time?: number | string;
  end_time?: number | string;
  box?: [number, number, number, number];
  subset?: string;
  split?: 'train' | 'val' | 'test';
  file?: string;
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

  return parsed.filter(isValidMsaslRecord).map((record) => normalizeMsaslRecord(record));
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

  const className = deriveClassName(record);
  const startTime = toNumber(record.start_time) ?? 0;
  const endTimeRaw = toNumber(record.end_time);
  const endTime = endTimeRaw !== undefined ? Math.max(endTimeRaw, startTime) : startTime;
  const signer = typeof record.signer_id === 'number' ? record.signer_id : Number(record.signer_id);

  return {
    id: `msasl_${split}_${(record.id || 0).toString().padStart(6, '0')}`,
    dataset: 'msasl',
    subset: subsetName,
    split,
    path: mediaPath,
    label: record.label,
    class_name: className,
    signer_id: Number.isFinite(signer) ? String(signer) : 'unknown',
    start: startTime,
    end: endTime,
    box: record.box,
  };
}

export function isValidMsaslRecord(value: unknown): value is MsaslSourceRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as any;
  return (
    typeof v.label === 'number' &&
    (typeof v.text === 'string' || typeof v.clean_text === 'string' || typeof v.label_text === 'string') &&
    (typeof v.signer_id === 'number' || typeof v.signer_id === 'string') &&
    typeof v.url === 'string'
  );
}

function normalizeMsaslRecord(record: MsaslSourceRecord): MsaslSourceRecord {
  const copy = { ...record };
  if (typeof copy.signer_id === 'string') {
    const parsed = Number(copy.signer_id);
    copy.signer_id = Number.isFinite(parsed) ? parsed : -1;
  }
  if (typeof copy.start_time === 'string') {
    copy.start_time = Number(copy.start_time) || undefined;
  }
  if (typeof copy.end_time === 'string') {
    copy.end_time = Number(copy.end_time) || undefined;
  }
  return copy;
}

function deriveClassName(record: MsaslSourceRecord): string {
  const raw =
    record.text ??
    record.clean_text ??
    record.label_text ??
    record.class_name ??
    '';
  return raw.trim().toUpperCase();
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
