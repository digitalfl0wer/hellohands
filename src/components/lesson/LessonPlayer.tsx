import { useEffect, useRef } from 'react';

interface LessonPlayerProps {
  poster: string;
  videoSrc: string;
  title: string;
  kidMode?: boolean;
  onReplay: () => void;
  onSlowMo: () => void;
  onNext: () => void;
}

export function LessonPlayer({
  poster,
  videoSrc,
  title,
  kidMode = false,
  onReplay,
  onSlowMo,
  onNext,
}: LessonPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    void video.load();
  }, [videoSrc]);

  const handleReplay = () => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 1;
      video.currentTime = 0;
      void video.play();
    }
    onReplay();
  };

  const handleSlowMo = () => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = 0.6;
      video.currentTime = 0;
      void video.play();
    }
    onSlowMo();
  };

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
          poster={poster}
          ref={videoRef}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support video playback.
        </video>
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
}
