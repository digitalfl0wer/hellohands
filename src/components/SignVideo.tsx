import { useEffect, useRef } from 'react';

type SignVideoProps = {
  src: string;
  poster?: string;
  autoPlay?: boolean;
};

export function SignVideo({ src, poster, autoPlay = true }: SignVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Force reload on src change and try to play inline (Safari/iOS quirks)
    el.src = src;
    el.load();
    const playAttempt = () => el.play().catch(() => {});
    if (autoPlay) {
      // Try on metadata and canplay to increase chances
      el.addEventListener('loadedmetadata', playAttempt, { once: true });
      el.addEventListener('canplay', playAttempt, { once: true });
      // Fallback attempt after microtask
      queueMicrotask(playAttempt);
    }
    return () => {
      el.pause();
      el.removeAttribute('src');
      el.load();
    };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      preload="auto"
      autoPlay={autoPlay}
      controls
      onError={(e) =>
        console.warn('video error:', (e.target as HTMLVideoElement)?.currentSrc)
      }
      className="w-full rounded-xl border border-zinc-800 bg-zinc-900"
      poster={poster}
      src={src}
    >
      Your browser can’t play this video.
    </video>
  );
}

export default SignVideo;
