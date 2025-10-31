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
}

export const SAMPLE_CLIPS: LessonClip[] = [
  {
    id: 'msasl_train_000001',
    title: 'HELLO',
    poster: '/signs/level1/hello/poster.jpg',
    video: '/signs/level1/hello/front.mp4',
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
  {
    id: 'msasl_val_000001',
    title: 'THANK YOU',
    poster: '/signs/level1/thank-you/poster.jpg',
    video: '/signs/level1/thank-you/front.mp4',
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
