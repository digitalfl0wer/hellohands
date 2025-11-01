import { DEMO_SIGN_CLIPS } from '../../src/data/demoClips';

export type GestureType = 'thumbs_up' | 'open_palm' | 'point' | 'pinch';

export interface PracticeItem {
  id: string;
  sign: string;
  expectedGesture: GestureType;
  clipUrl: string;
  posterUrl?: string;
}

export interface PracticePack {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  items: PracticeItem[];
}

export interface LicenseInfo {
  dataset: string;
  license: string;
  url: string;
  attribution: string;
}

export const practicePacks: PracticePack[] = [
  {
    id: 'L1-ESSENTIALS',
    title: 'Level 1 · Essentials',
    level: 1,
    items: DEMO_SIGN_CLIPS.map((clip) => ({
      id: clip.sign.toLowerCase().replace(/\s+/g, '-'),
      sign: clip.sign,
      expectedGesture: clip.expectedGesture,
      clipUrl: clip.clipUrl,
      posterUrl: clip.posterUrl,
    })),
  },
];

export const licenseInfo: LicenseInfo = {
  dataset: 'MS-ASL',
  license: 'C-UDA (Computational Use of Data Agreement)',
  url: 'https://ms-asl.cs.rochester.edu/',
  attribution:
    'MS-ASL: A Large-Scale Data Set and Benchmark for Understanding American Sign Language. BMVC 2019.',
};

