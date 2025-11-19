import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { getStickerAsset } from '../utils/assetRegistry';

type StickerUnlockOverlayProps = {
  stickerId: string;
  onComplete: () => void;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReduced(mediaQuery.matches);
    handler();
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reduced;
}

export function StickerUnlockOverlay({
  stickerId,
  onComplete,
}: StickerUnlockOverlayProps) {
  const [animationData, setAnimationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  const stickerAsset = getStickerAsset(stickerId as any);

  useEffect(() => {
    if (!stickerAsset) {
      console.warn(`Sticker asset not found for id: ${stickerId}`);
      onComplete();
      return;
    }

    // Load the Lottie animation data
    fetch(stickerAsset.path)
      .then((response) => response.json())
      .then((data) => {
        setAnimationData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load sticker animation:', error);
        setIsLoading(false);
        onComplete();
      });
  }, [stickerAsset, stickerId, onComplete]);

  if (isLoading || !animationData) {
    return null;
  }

  if (reducedMotion) {
    // For reduced motion, show a simple notification instead
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
        <div className="rounded-full border border-accent-lime/60 bg-accent-lime/15 px-6 py-3 text-lg font-semibold uppercase tracking-wide text-accent-lime shadow-sm">
          {stickerAsset?.title || 'Sticker'} Unlocked!
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <div className="w-80 h-80 max-w-[80vw] max-h-[80vw]">
        <Lottie
          animationData={animationData}
          loop={false}
          autoplay={true}
          onComplete={onComplete}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
}
