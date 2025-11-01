import type { ExpectedGesture } from '../../gestures/gestureEvaluator';
export interface LessonClipAttribution {
  clipId: string;
  className: string;
  dataset: string;
  subset: string;
  split: string;
  signerId: string;
  signerLabel: string;
  source: string;
  licenseText: string;
  link: string;
}

export interface LessonClip {
  id: string;
  title: string;
  poster: string;
  video: string;
  attribution: LessonClipAttribution;
  expectedGesture?: ExpectedGesture;
}

export const SAMPLE_CLIPS: LessonClip[] = [
  {
    id: 'msasl_train_000001',
    title: 'HELLO',
    poster: '/signs/level1/hello/poster.jpg',
    video: '/signs/level1/hello/front.mp4',
    expectedGesture: 'open_palm',
    attribution: {
      clipId: 'msasl_train_000001',
      className: 'HELLO',
      dataset: 'MS-ASL',
      subset: 'MS-ASL100',
      split: 'train',
      signerId: 'S001',
      signerLabel: 'MS-ASL contributor S001',
      source: 'data/processed/msasl/clips/000/000001.mp4',
      licenseText: 'MS-ASL dataset — academic research license',
      link: 'https://ms-asl.cs.rochester.edu/dataset',
    },
  },
  // Local demo assets from /public (Level 1)
  {
    id: 'local_please_000001',
    title: 'PLEASE',
    poster: '/signs/level1/please/poster.jpg',
    video: '/signs/level1/please/front.mp4',
    expectedGesture: 'open_palm',
    attribution: {
      clipId: 'local_please_000001',
      className: 'PLEASE',
      dataset: 'Local',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/signs/level1/please/front.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'local_eat_000001',
    title: 'EAT',
    poster: '/signs/level1/eat/poster.jpg',
    video: '/signs/level1/eat/front.mp4',
    expectedGesture: 'pinch',
    attribution: {
      clipId: 'local_eat_000001',
      className: 'EAT',
      dataset: 'Local',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/signs/level1/eat/front.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'local_drink_000001',
    title: 'DRINK',
    poster: '/signs/level1/drink/poster.jpg',
    video: '/signs/level1/drink/front.mp4',
    expectedGesture: 'pinch',
    attribution: {
      clipId: 'local_drink_000001',
      className: 'DRINK',
      dataset: 'Local',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/signs/level1/drink/front.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'local_yes_000001',
    title: 'YES',
    poster: '/signs/level1/yes/poster.jpg',
    video: '/signs/level1/yes/front.mp4',
    expectedGesture: 'thumbs_up',
    attribution: {
      clipId: 'local_yes_000001',
      className: 'YES',
      dataset: 'Local',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/signs/level1/yes/front.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'local_no_000001',
    title: 'NO',
    poster: '/signs/level1/no/poster.jpg',
    video: '/signs/level1/no/front.mp4',
    expectedGesture: 'open_palm',
    attribution: {
      clipId: 'local_no_000001',
      className: 'NO',
      dataset: 'Local',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/signs/level1/no/front.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'local_stop_000001',
    title: 'STOP',
    poster: '/signs/level1/stop/poster.jpg',
    video: '/signs/level1/stop/front.mp4',
    expectedGesture: 'open_palm',
    attribution: {
      clipId: 'local_stop_000001',
      className: 'STOP',
      dataset: 'Local',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/signs/level1/stop/front.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'local_help_000001',
    title: 'HELP',
    poster: '/signs/level1/help/poster.jpg',
    video: '/signs/level1/help/front.mp4',
    expectedGesture: 'open_palm',
    attribution: {
      clipId: 'local_help_000001',
      className: 'HELP',
      dataset: 'Local',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/signs/level1/help/front.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'msasl_val_000001',
    title: 'THANK YOU',
    poster: '/signs/level1/thank-you/poster.jpg',
    video: '/signs/level1/thank-you/front.mp4',
    expectedGesture: 'open_palm',
    attribution: {
      clipId: 'msasl_val_000001',
      className: 'THANK YOU',
      dataset: 'MS-ASL',
      subset: 'MS-ASL100',
      split: 'val',
      signerId: 'S014',
      signerLabel: 'MS-ASL contributor S014',
      source: 'data/processed/msasl/clips/000/000002.mp4',
      licenseText: 'MS-ASL dataset — academic research license',
      link: 'https://ms-asl.cs.rochester.edu/dataset',
    },
  },
  {
    id: 'msasl_train_000003',
    title: 'MORE',
    poster: '/signs/level1/more/poster.jpg',
    video: '/signs/level1/more/front.mp4',
    expectedGesture: 'pinch',
    attribution: {
      clipId: 'msasl_train_000003',
      className: 'MORE',
      dataset: 'MS-ASL',
      subset: 'MS-ASL100 (sampled)',
      split: 'train',
      signerId: 'S008',
      signerLabel: 'MS-ASL contributor S008',
      source: 'Basic ASL Vocabulary for Babies (YouTube)',
      licenseText: 'MS-ASL dataset — academic research license',
      link: 'https://www.youtube.com/watch?v=htsdwxJ-fTo',
    },
  },
];
