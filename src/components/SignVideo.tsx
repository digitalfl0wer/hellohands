import { useEffect, useRef, useState } from 'react';

type SignVideoProps = {
  src: string;
  poster?: string;
  autoPlay?: boolean;
};

export function SignVideo({ src, poster, autoPlay = true }: SignVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    setFailed(false);
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
    failed ? (
      poster ? (
        <img
          src={poster}
          alt="Sign demonstration"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 object-cover"
        />
      ) : (
        <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
          Video unavailable
        </div>
      )
    ) : (
      <video
        ref={videoRef}
        playsInline
        muted
        preload="auto"
        autoPlay={autoPlay}
        controls
        onError={(e) => {
          console.warn('video error:', (e.target as HTMLVideoElement)?.currentSrc);
          setFailed(true);
        }}
        onStalled={() => setFailed(true)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-900"
        poster={poster}
        src={src}
      >
        Your browser can’t play this video.
      </video>
    )
  );
}

export default SignVideo;
