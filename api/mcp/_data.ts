export type GestureType = 'thumbs_up' | 'open_palm' | 'point' | 'pinch';

export interface PracticeItem {
  id: string;
  sign: string;
  expectedGesture: GestureType;
  clipUrl: string;
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
    items: [
      {
        id: 'hello',
        sign: 'HELLO',
        expectedGesture: 'open_palm',
        clipUrl: '/signs/level1/hello/front.mp4',
      },
      {
        id: 'thank-you',
        sign: 'THANK YOU',
        expectedGesture: 'open_palm',
        clipUrl: '/signs/level1/thank-you/front.mp4',
      },
      {
        id: 'yes',
        sign: 'YES',
        expectedGesture: 'thumbs_up',
        clipUrl: '/signs/level1/yes/front.mp4',
      },
      {
        id: 'no',
        sign: 'NO',
        expectedGesture: 'point',
        clipUrl: '/signs/level1/no/front.mp4',
      },
      {
        id: 'more',
        sign: 'MORE',
        expectedGesture: 'pinch',
        clipUrl: '/signs/level1/more/front.mp4',
      },
    ],
  },
];

export const licenseInfo: LicenseInfo = {
  dataset: 'MS-ASL',
  license: 'C-UDA (Computational Use of Data Agreement)',
  url: 'https://ms-asl.cs.rochester.edu/',
  attribution:
    'MS-ASL: A Large-Scale Data Set and Benchmark for Understanding American Sign Language. BMVC 2019.',
};


