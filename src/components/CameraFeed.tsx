import { useEffect, useRef, useState } from 'react';

export function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let animationId: number | null = null;
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? `${err.name ?? 'Error'}: ${err.message}`
            : 'Unable to access camera';
        setError(errorMessage);
      }

      workerRef.current = new Worker(
        new URL('../gestures/gesture.worker.ts', import.meta.url),
        {
          type: 'module',
        },
      );

      const pump = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          workerRef.current?.postMessage({ video: videoRef.current });
        }
        animationId = window.requestAnimationFrame(pump);
      };

      pump();
    };

    void start();

    return () => {
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
      workerRef.current?.terminate();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full max-w-md -scale-x-100 transform rounded-xl shadow-lg"
      />
      {error ? (
        <div className="absolute bottom-2 left-2 rounded bg-red-600/80 px-2 py-1 text-xs font-semibold text-white">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export default CameraFeed;
