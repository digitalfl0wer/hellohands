import { ReactNode, useState } from 'react';
import { useLessonStore } from '../state/useLessonStore';

interface CardStackProps {
  children?: ReactNode[];
  className?: string;
  renderChild?: (
    child: ReactNode,
    index: number,
    mode: 'full' | 'corner',
    selected?: boolean,
  ) => ReactNode;
}

export function CardStack({
  children = [],
  className = '',
  renderChild,
}: CardStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const kidMode = useLessonStore((state) => state.kidMode);

  const totalCards = children.length;

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div
      className={`relative w-full border border-white/10 rounded-2xl p-8 shadow-lg ring-1 ring-white/10 ${kidMode ? 'bg-transparent' : 'bg-gradient-to-br from-surface-900 via-surface-800 to-surface-900'} ${className}`}
    >
      <div className="relative flex items-center justify-center min-h-[300px]">
        {children.map((child, index) => {
          // Calculate position relative to active card
          const relativeIndex = index - activeIndex;
          const absRelativeIndex = Math.abs(relativeIndex);

          // Position cards in a fan layout centered on active card
          // Limit maximum offset to keep cards within container bounds
          const rawOffset = relativeIndex * 160; // Increased space between cards
          const maxOffset = 240; // Maximum distance from center (adjustable)
          const baseOffset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));
          const scale = Math.max(0.8, 1 - absRelativeIndex * 0.15); // Scale down distant cards (less aggressive)
          const rotation = relativeIndex * 2; // Reduced rotation for fan effect
          const opacity = Math.max(0.4, 1 - absRelativeIndex * 0.2); // Fade distant cards (less aggressive)

          // Z-index: active card on top, then decrease with distance
          const zIndex = 10 - absRelativeIndex;

          const isSelected = index === activeIndex;
          const renderedChild = renderChild
            ? renderChild(child, index, 'full', isSelected)
            : child;

          return (
            <div
              key={index}
              className={`absolute transition-all duration-500 ease-out cursor-pointer ${
                index === activeIndex ? 'z-20' : 'z-10'
              }`}
              style={{
                transform: `translateX(${baseOffset}px) scale(${scale}) rotate(${rotation}deg)`,
                opacity,
                zIndex,
              }}
              onClick={() => handleCardClick(index)}
            >
              <div className="w-96 h-80">
                {' '}
                {/* Reduced height from 448px to 320px */}
                {renderedChild}
              </div>
            </div>
          );
        })}

        {/* Navigation arrows */}
        {totalCards > 1 && (
          <>
            <button
              onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="absolute right-4 bottom-6 z-30 p-3 rounded-full bg-surface-800/90 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-surface-600 shadow-lg"
            >
              <span className="text-2xl text-text-primary">←</span>
            </button>
            <button
              onClick={() => setActiveIndex(Math.min(totalCards - 1, activeIndex + 1))}
              disabled={activeIndex === totalCards - 1}
              className="absolute left-4 bottom-6 z-30 p-3 rounded-full bg-surface-800/90 hover:bg-surface-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-surface-600 shadow-lg"
            >
              <span className="text-2xl text-text-primary">→</span>
            </button>
          </>
        )}

        {/* Card indicators */}
        {totalCards > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {children.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === activeIndex ? 'bg-accent-teal' : 'bg-surface-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
