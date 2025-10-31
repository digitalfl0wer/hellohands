export interface LessonClip {
  id: string;
  title: string;
  poster: string;
  video: string;
}

export const SAMPLE_CLIPS: LessonClip[] = [
  {
    id: 'msasl_train_000001',
    title: 'HELLO',
    poster: '/signs/level1/hello/poster.jpg',
    video: '/signs/level1/hello/front.mp4',
  },
  {
    id: 'msasl_train_000002',
    title: 'THANK YOU',
    poster: '/signs/level1/thank-you/poster.jpg',
    video: '/signs/level1/thank-you/front.mp4',
  },
  {
    id: 'msasl_train_000003',
    title: 'MORE',
    poster: '/signs/level1/more/poster.jpg',
    video: '/signs/level1/more/front.mp4',
  },
];
