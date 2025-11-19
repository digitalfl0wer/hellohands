import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

interface LessonPlayerProps {
  poster: string;
  videoSrc: string;
  title: string;
  kidMode?: boolean;
  paused?: boolean;
  onReplay: () => void;
  onSlowMo: () => void;
  onNext: () => void;
}

export interface LessonPlayerHandle {
  replay(): void;
  playSlow(): void;
  pause(): void;
  resume(): void;
}

export const LessonPlayer = forwardRef<LessonPlayerHandle, LessonPlayerProps>(
  (
    {
      poster,
      videoSrc,
      title,
      kidMode = false,
      paused = false,
      onReplay,
      onSlowMo,
      onNext,
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const handleReplay = () => {
      const video = videoRef.current;
      if (video) {
        video.playbackRate = 1;
        video.currentTime = 0;
        void video.play().catch(() => {});
      }
      onReplay();
    };

    const handleSlowMo = () => {
      const video = videoRef.current;
      if (video) {
        video.playbackRate = 0.6;
        video.currentTime = 0;
        void video.play().catch(() => {});
      }
      onSlowMo();
    };

    const handlePause = () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
      }
    };

    const handleResume = () => {
      const video = videoRef.current;
      if (video) {
        video.playbackRate = 1;
        void video.play().catch(() => {});
      }
    };

    useImperativeHandle(ref, () => ({
      replay: handleReplay,
      playSlow: handleSlowMo,
      pause: handlePause,
      resume: handleResume,
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (paused) {
        video.pause();
      }
    }, [paused]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = true; // allow autoplay without gesture
      video.pause();
      void video.load();
      void video.play().catch(() => {});
    }, [videoSrc]);

    return (
      <section className="space-y-md">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <span className="text-xs uppercase tracking-wide text-text-muted">
            Playback controls
          </span>
        </header>
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-surface-800/60">
          <video
            aria-label={`Tutorial clip for ${title}`}
            className="block h-full w-full"
            controls
            playsInline
            muted
            autoPlay
            preload="metadata"
            poster={poster}
            ref={videoRef}
            onError={() => setLoadError(`Failed to load: ${videoSrc}`)}
            onCanPlay={() => setLoadError(null)}
          >
            <source src={videoSrc} type="video/mp4" />
            Your browser does not support video playback.
          </video>
          {loadError ? (
            <div className="absolute right-2 top-2 rounded bg-rose-500/60 px-2 py-1 text-[11px] font-semibold text-white">
              {loadError}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-sm">
          <button
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-surface-700/40 px-md py-2 text-sm font-semibold text-text-primary transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
            onClick={handleReplay}
            type="button"
          >
            {kidMode ? 'Again!' : 'Replay'}
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-surface-700/40 px-md py-2 text-sm font-semibold text-text-primary transition hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-sky"
            onClick={handleSlowMo}
            type="button"
          >
            {kidMode ? 'Slower' : 'Slow-mo'}
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full bg-accent-lime px-md py-2 text-sm font-semibold text-surface-900 transition hover:bg-accent-teal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-rose"
            onClick={onNext}
            type="button"
          >
            {kidMode ? 'Next sign' : 'Next'}
          </button>
        </div>
      </section>
    );
  },
);

LessonPlayer.displayName = 'LessonPlayer';
