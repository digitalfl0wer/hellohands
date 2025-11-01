import { useEffect, useRef, useState } from 'react';
import { post } from '../gestures/gestureBus';

export function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hud, setHud] = useState<string | null>(null);
  const lastTypeRef = useRef<string | null>(null);
  const lastStableStartMsRef = useRef<number | null>(null);
  const lastPostMsRef = useRef<number>(0);
  const HOLD_MS = 2000; // require 2s steady pose
  const MIRROR = true;

  useEffect(() => {
    let animationId: number | null = null;
    let stream: MediaStream | null = null;
    let detector: any = null;
    let active = true;

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera API unavailable.');
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch((err) => {
            if (err?.name !== 'AbortError') {
              throw err;
            }
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? `${err.name ?? 'Error'}: ${err.message}`
            : 'Unable to access camera';
        setError(errorMessage);
        return;
      }

      try {
        const loadHands = async () =>
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(
              'script[data-hh-hands="1"]',
            ) as HTMLScriptElement | null;
            if (existing) return resolve();
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/hands.js';
            script.async = true;
            script.defer = true;
            (script as any).dataset.hhHands = '1';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load hands.js'));
            document.head.appendChild(script);
          });

        await loadHands();
        const HandsCtor = (window as any).Hands as
          | (new (...args: any[]) => any)
          | undefined;
        if (!HandsCtor) throw new Error('Hands constructor not found on window');

        detector = new HandsCtor({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
        });
        detector.setOptions({
          selfieMode: true,
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.6,
        });
        // Try to load drawing utils (non-fatal)
        try {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(
              'script[data-hh-draw="1"]',
            ) as HTMLScriptElement | null;
            if (existing) return resolve();
            const script = document.createElement('script');
            script.src =
              'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.4/drawing_utils.js';
            script.async = true;
            script.defer = true;
            (script as any).dataset.hhDraw = '1';
            script.onload = () => resolve();
            script.onerror = () => {
              // fallback to unpkg
              const fallback = document.createElement('script');
              fallback.src =
                'https://unpkg.com/@mediapipe/drawing_utils@0.4/drawing_utils.js';
              fallback.async = true;
              fallback.defer = true;
              (fallback as any).dataset.hhDraw = '1';
              fallback.onload = () => resolve();
              fallback.onerror = () => resolve(); // proceed without overlay
              document.head.appendChild(fallback);
            };
            document.head.appendChild(script);
          });
        } catch {}
      } catch (err) {
        const message =
          err instanceof Error
            ? `Detector init failed: ${err.message}`
            : 'Unable to initialise hand tracker.';
        setError(message);
        return;
      }

      const classifyLandmarks = (
        landmarks: any[],
      ): {
        type: 'thumbs_up' | 'open_palm' | 'point' | 'pinch';
        score: number;
      } | null => {
        const dist = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
        let best: {
          type: 'thumbs_up' | 'open_palm' | 'point' | 'pinch';
          score: number;
        } | null = null;
        for (const pts of landmarks) {
          if (!pts) continue;
          // Heuristics (lenient): tune distances a bit broader
          if (dist(pts[4], pts[8]) < 0.08) {
            const cand = { type: 'pinch' as const, score: 0.9 };
            best = !best || cand.score > best.score ? cand : best;
          }
          if (dist(pts[5], pts[17]) > 0.17) {
            const cand = { type: 'open_palm' as const, score: 0.85 };
            best = !best || cand.score > best.score ? cand : best;
          }
          const indexLong = dist(pts[8], pts[5]) > 0.16;
          const middleShort = dist(pts[12], pts[9]) < 0.17;
          if (indexLong && middleShort) {
            const cand = { type: 'point' as const, score: 0.78 };
            best = !best || cand.score > best.score ? cand : best;
          }
          if (pts[4].y < pts[5].y && middleShort) {
            const cand = { type: 'thumbs_up' as const, score: 0.72 };
            best = !best || cand.score > best.score ? cand : best;
          }
        }
        return best;
      };

      // Legacy Hands solution callback gives multiHandLandmarks
      (detector as any).onResults((results: any) => {
        try {
          const lm = results?.multiHandLandmarks ?? [];
          setHud(lm.length > 0 ? `hands: ${lm.length}` : null);

          // Draw overlay
          const canvas = overlayRef.current;
          const video = videoRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && video && ctx) {
            const container = overlayRef.current?.parentElement as HTMLElement | null;
            const cssW =
              (container?.clientWidth ?? video.clientWidth) || video.videoWidth;
            const cssH =
              (container?.clientHeight ?? video.clientHeight) || video.videoHeight;
            const dpr = Math.max(1, window.devicePixelRatio || 1);
            const targetW = Math.floor(cssW * dpr);
            const targetH = Math.floor(cssH * dpr);
            if (canvas.width !== targetW || canvas.height !== targetH) {
              canvas.width = targetW;
              canvas.height = targetH;
              canvas.style.width = `${cssW}px`;
              canvas.style.height = `${cssH}px`;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const drawConnectors = (window as any).drawConnectors;
            const drawLandmarks = (window as any).drawLandmarks;
            const HAND_CONNECTIONS = (window as any).HAND_CONNECTIONS;
            if (
              typeof drawConnectors === 'function' &&
              typeof drawLandmarks === 'function'
            ) {
              for (const pts of lm) {
                try {
                  drawConnectors(ctx, pts, HAND_CONNECTIONS, {
                    color: '#00FF66',
                    lineWidth: 5,
                  });
                  drawLandmarks(ctx, pts, {
                    color: '#FF3B3B',
                    lineWidth: 2,
                    radius: 3,
                  });
                  // Emphasize index finger joints (5-8)
                  ctx.fillStyle = '#FFD166';
                  for (const idx of [5, 6, 7, 8]) {
                    const p = pts[idx];
                    if (!p) continue;
                    ctx.beginPath();
                    ctx.arc(
                      p.x * canvas.width,
                      p.y * canvas.height,
                      idx === 8 ? 6 : 4,
                      0,
                      Math.PI * 2,
                    );
                    ctx.fill();
                  }
                } catch {}
              }
            } else {
              // Fallback: draw simple landmarks if drawing_utils not available
              const line = (a: any, b: any) => {
                ctx.beginPath();
                ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
                ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
                ctx.stroke();
              };
              const drawHand = (pts: any[]) => {
                if (!pts || pts.length < 21) return;
                ctx.strokeStyle = '#00FF66';
                ctx.lineWidth = 5;
                // Palm fan
                line(pts[0], pts[1]);
                line(pts[0], pts[5]);
                line(pts[0], pts[9]);
                line(pts[0], pts[13]);
                line(pts[0], pts[17]);
                // Fingers
                const chains = [
                  [1, 2, 3, 4], // thumb
                  [5, 6, 7, 8], // index
                  [9, 10, 11, 12], // middle
                  [13, 14, 15, 16], // ring
                  [17, 18, 19, 20], // pinky
                ];
                for (const chain of chains) {
                  for (let i = 0; i < chain.length - 1; i++) {
                    line(pts[chain[i]], pts[chain[i + 1]]);
                  }
                }

                // Landmarks
                for (let i = 0; i < pts.length; i++) {
                  const p = pts[i];
                  ctx.beginPath();
                  const r = i >= 5 && i <= 8 ? (i === 8 ? 6 : 4) : 3;
                  ctx.fillStyle = i >= 5 && i <= 8 ? '#FFD166' : '#FF3B3B';
                  ctx.arc(p.x * canvas.width, p.y * canvas.height, r, 0, Math.PI * 2);
                  ctx.fill();
                }
              };

              for (const pts of lm) drawHand(pts);
            }
          }

          const classification = classifyLandmarks(lm);
          if (classification) {
            const now = performance.now();
            if (lastTypeRef.current !== classification.type) {
              lastTypeRef.current = classification.type;
              lastStableStartMsRef.current = now;
            }

            const started = lastStableStartMsRef.current ?? now;
            const stableFor = Math.max(0, now - started);
            if (stableFor >= HOLD_MS && now - lastPostMsRef.current >= HOLD_MS) {
              post({ intent: 'gesture', ...classification });
              lastPostMsRef.current = now;
              // reset to require another hold window
              lastStableStartMsRef.current = now;
            }

            setHud(
              `${classification.type} (${Math.round(
                (classification.score || 0) * 100,
              )}%) · hold ${Math.ceil(
                Math.max(
                  0,
                  HOLD_MS -
                    (lastStableStartMsRef.current
                      ? now - lastStableStartMsRef.current
                      : 0),
                ) / 1000,
              )}s`,
            );
          } else {
            lastTypeRef.current = null;
            lastStableStartMsRef.current = null;
          }
        } catch {}
      });

      const pump = async () => {
        if (!active || !videoRef.current || !detector) {
          return;
        }

        const video = videoRef.current;
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
          await (detector as any).send({ image: video });
        }

        animationId = window.requestAnimationFrame(() => {
          void pump();
        });
      };

      animationId = window.requestAnimationFrame(() => {
        void pump();
      });
    };

    void start();

    return () => {
      active = false;
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
      stream?.getTracks().forEach((track) => track.stop());
      detector?.close?.();
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative inline-block w-full max-w-md transform -scale-x-100">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-xl shadow-lg"
        />
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full rounded-xl"
        />
      </div>
      <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">
        <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
        <span>Camera Active</span>
      </div>
      {hud ? (
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs font-semibold text-white">
          {hud}
        </div>
      ) : null}
      {error ? (
        <div className="absolute bottom-2 left-2 rounded bg-red-600/80 px-2 py-1 text-xs font-semibold text-white">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export default CameraFeed;
