import type { ExpectedGesture } from '../gestures/gestureEvaluator';

export interface DemoClipAttribution {
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

export interface DemoSignClip {
  id: string;
  sign: string;
  title: string;
  clipUrl: string;
  posterUrl: string;
  expectedGesture: ExpectedGesture;
  attribution: DemoClipAttribution;
}

export const DEMO_SIGN_CLIPS: DemoSignClip[] = [
  {
    id: 'demo_hello_fwgl9fjp',
    sign: 'HELLO',
    title: 'HELLO',
    clipUrl: '/local/HELLO/FwGL9FjFpYI.mp4',
    posterUrl: '/signs/level1/hello/poster.jpg',
    expectedGesture: 'open_palm',
    attribution: {
      clipId: 'demo_hello_fwgl9fjp',
      className: 'HELLO',
      dataset: 'Local Demo',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/local/HELLO/FwGL9FjFpYI.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'demo_please_rmuydgrt',
    sign: 'PLEASE',
    title: 'PLEASE',
    clipUrl: '/local/PLEASE/RMUydgQr9TE.mp4',
    posterUrl: '/signs/level1/please/poster.jpg',
    expectedGesture: 'open_palm',
    attribution: {
      clipId: 'demo_please_rmuydgrt',
      className: 'PLEASE',
      dataset: 'Local Demo',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/local/PLEASE/RMUydgQr9TE.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'demo_eat_2qlsmxdr',
    sign: 'EAT',
    title: 'EAT',
    clipUrl: '/local/EAT/2qLS_mXdrh8.mp4',
    posterUrl: '/signs/level1/eat/poster.jpg',
    expectedGesture: 'pinch',
    attribution: {
      clipId: 'demo_eat_2qlsmxdr',
      className: 'EAT',
      dataset: 'Local Demo',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/local/EAT/2qLS_mXdrh8.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'demo_drink_k8t0ze',
    sign: 'DRINK',
    title: 'DRINK',
    clipUrl: '/local/DRINK/K8T0-zeB3jc.mp4',
    posterUrl: '/signs/level1/drink/poster.jpg',
    expectedGesture: 'pinch',
    attribution: {
      clipId: 'demo_drink_k8t0ze',
      className: 'DRINK',
      dataset: 'Local Demo',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/local/DRINK/K8T0-zeB3jc.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'demo_yes_exkqirn',
    sign: 'YES',
    title: 'YES',
    clipUrl: '/local/YES/exk-qIRNw7Y.mp4',
    posterUrl: '/signs/level1/yes/poster.jpg',
    expectedGesture: 'thumbs_up',
    attribution: {
      clipId: 'demo_yes_exkqirn',
      className: 'YES',
      dataset: 'Local Demo',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/local/YES/exk-qIRNw7Y.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'demo_no_2tqmvwo',
    sign: 'NO',
    title: 'NO',
    clipUrl: '/local/NO/2TQMVwOkHWw.mp4',
    posterUrl: '/signs/level1/no/poster.jpg',
    expectedGesture: 'point',
    attribution: {
      clipId: 'demo_no_2tqmvwo',
      className: 'NO',
      dataset: 'Local Demo',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/local/NO/2TQMVwOkHWw.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
  {
    id: 'demo_help_hbqa1zg',
    sign: 'HELP',
    title: 'HELP',
    clipUrl: '/local/HELP/HBQaI1ZG-LU.mp4',
    posterUrl: '/signs/level1/help/poster.jpg',
    expectedGesture: 'open_palm',
    attribution: {
      clipId: 'demo_help_hbqa1zg',
      className: 'HELP',
      dataset: 'Local Demo',
      subset: 'Level1',
      split: 'demo',
      signerId: 'LOCAL',
      signerLabel: 'Local demo asset',
      source: '/public/local/HELP/HBQaI1ZG-LU.mp4',
      licenseText: 'Local demo asset',
      link: '#',
    },
  },
];

export const DEMO_SIGN_CLIP_MAP = new Map<string, DemoSignClip>(
  DEMO_SIGN_CLIPS.map((clip) => [clip.sign, clip]),
);
