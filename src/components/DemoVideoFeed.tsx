type DemoVideoFeedProps = {
  label?: string;
};

export function DemoVideoFeed({ label = 'Demo mode' }: DemoVideoFeedProps) {
  return (
    <div className="relative w-full max-w-md">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-surface-900/80">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full"
          src="/local/HELLO/FBimL8-ND3E.mp4"
        >
          Your browser can’t play this demo video.
        </video>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
      <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-teal">
        {label}
      </div>
    </div>
  );
}


