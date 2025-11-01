import type { DemoClipAttribution, DemoSignClip } from '../../data/demoClips';
import { DEMO_SIGN_CLIPS, DEMO_SIGN_CLIP_MAP } from '../../data/demoClips';
import type { PracticeItem } from '../../services/practiceApi';

export type LessonClipAttribution = DemoClipAttribution;

export interface LessonClip extends DemoSignClip {
  poster: string;
  video: string;
}

export const SAMPLE_CLIPS: LessonClip[] = DEMO_SIGN_CLIPS.map((clip) => ({
  ...clip,
  poster: clip.posterUrl,
  video: clip.clipUrl,
}));

type LessonClipOverrides = Partial<
  Pick<
    LessonClip,
    | 'id'
    | 'title'
    | 'sign'
    | 'clipUrl'
    | 'posterUrl'
    | 'poster'
    | 'video'
    | 'expectedGesture'
    | 'attribution'
  >
>;

const FALLBACK_ATTRIBUTION = (sign: string, src: string): LessonClipAttribution => ({
  clipId: `practice-${sign}`,
  className: sign,
  dataset: 'Local Demo',
  subset: 'Practice',
  split: 'demo',
  signerId: 'LOCAL',
  signerLabel: 'Local demo asset',
  source: src,
  licenseText: 'Local demo asset',
  link: '#',
});

const buildLessonClip = (
  clip: DemoSignClip,
  overrides: LessonClipOverrides = {},
): LessonClip => {
  const overrideClipUrl = overrides.clipUrl ?? overrides.video ?? clip.clipUrl;
  const overridePosterUrl = overrides.posterUrl ?? overrides.poster ?? clip.posterUrl;
  return {
    ...clip,
    id: overrides.id ?? clip.id,
    title: overrides.title ?? clip.title,
    sign: overrides.sign ?? clip.sign,
    expectedGesture: overrides.expectedGesture ?? clip.expectedGesture,
    clipUrl: overrideClipUrl,
    posterUrl: overridePosterUrl,
    attribution: overrides.attribution ?? clip.attribution,
    poster: overrides.poster ?? overridePosterUrl,
    video: overrides.video ?? overrideClipUrl,
  };
};

export const LESSON_CLIP_MAP = new Map<string, LessonClip>(
  SAMPLE_CLIPS.map((clip) => [clip.sign, clip]),
);

export const lessonClipsFromPracticeItems = (items?: PracticeItem[]): LessonClip[] => {
  if (!items?.length) {
    return SAMPLE_CLIPS;
  }
  const seen = new Set<string>();
  const clips: LessonClip[] = [];
  for (const item of items) {
    const clipUrl = item.clipUrl?.trim();
    if (!clipUrl) continue;
    const dedupeKey =
      clipUrl.toLowerCase() ||
      item.id?.trim().toLowerCase() ||
      item.sign.trim().toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const normalizedSign = item.sign.trim().toUpperCase();
    const base = DEMO_SIGN_CLIP_MAP.get(normalizedSign);
    if (base) {
      clips.push(
        buildLessonClip(base, {
          id: item.id ?? base.id,
          clipUrl,
          video: clipUrl,
          posterUrl: item.posterUrl ?? base.posterUrl,
          poster: item.posterUrl ?? base.posterUrl,
          expectedGesture: item.expectedGesture ?? base.expectedGesture,
        }),
      );
      continue;
    }
    clips.push({
      id: item.id ?? normalizedSign.toLowerCase(),
      title: normalizedSign,
      sign: normalizedSign,
      clipUrl,
      posterUrl: item.posterUrl ?? '',
      expectedGesture: item.expectedGesture,
      attribution: FALLBACK_ATTRIBUTION(normalizedSign, clipUrl),
      poster: item.posterUrl ?? '',
      video: clipUrl,
    });
  }
  return clips.length ? clips : SAMPLE_CLIPS;
};
