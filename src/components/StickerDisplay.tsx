import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { getStickerAsset } from '../utils/assetRegistry';

type StickerDisplayProps = {
  stickerId: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
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

export function StickerDisplay({
  stickerId,
  size = 'medium',
  className = '',
}: StickerDisplayProps) {
  const [animationData, setAnimationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const reducedMotion = usePrefersReducedMotion();

  const stickerAsset = getStickerAsset(stickerId as any);

  useEffect(() => {
    if (!stickerAsset) {
      console.warn(`Sticker asset not found for id: ${stickerId}`);
      setIsLoading(false);
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
      });
  }, [stickerAsset, stickerId]);

  if (isLoading || !animationData) {
    // Show a placeholder while loading
    return (
      <div
        className={`bg-surface-700/50 rounded-full flex items-center justify-center ${className}`}
        style={{
          width: size === 'small' ? '2rem' : size === 'large' ? '4rem' : '3rem',
          height: size === 'small' ? '2rem' : size === 'large' ? '4rem' : '3rem',
        }}
      >
        <div className="w-2 h-2 bg-accent-teal/50 rounded-full animate-pulse" />
      </div>
    );
  }

  if (reducedMotion) {
    // For reduced motion, show a static representation
    return (
      <div
        className={`bg-accent-teal/20 border border-accent-teal/40 rounded-full flex items-center justify-center text-sm ${className}`}
        style={{
          width: size === 'small' ? '2rem' : size === 'large' ? '4rem' : '3rem',
          height: size === 'small' ? '2rem' : size === 'large' ? '4rem' : '3rem',
        }}
      >
        {stickerAsset?.title?.[0] || '★'}
      </div>
    );
  }

  const dimension = size === 'small' ? '2rem' : size === 'large' ? '4rem' : '3rem';

  return (
    <div className={className} style={{ width: dimension, height: dimension }}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
