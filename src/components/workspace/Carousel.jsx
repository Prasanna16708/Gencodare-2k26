import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Radio, Eye } from 'lucide-react';

export default function Carousel({ items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const total = items.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay (every 3 seconds of interval unless paused)
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, total, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (!items || items.length === 0) {
    return (
      <div className="liquid-glass hud-corner p-8 text-center text-silver-muted font-mono text-xs border border-white/10 mb-8">
        NO BROADCAST TRANSMISSIONS ACTIVE
      </div>
    );
  }

  const currentItem = items[currentIndex] || items[0];

  return (
    <div
      className="relative w-full mb-10 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container Frame */}
      <div className="liquid-glass hud-corner overflow-hidden rounded-xl border border-[var(--silver-border)] shadow-[0_10px_35px_rgba(0,0,0,0.7)] relative aspect-[16/7] sm:aspect-[21/8] min-h-[220px] sm:min-h-[300px]">
        
        {/* Background Slide Image */}
        <div className="absolute inset-0 bg-black">
          <img
            src={currentItem.imageUrl}
            alt={currentItem.title || 'Broadcast Slide'}
            className="w-full h-full object-cover object-center opacity-90 transition-opacity duration-700 filter contrast-105"
            loading="lazy"
          />
          {/* Cyber Glass Dark Overlay & Scanline */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030705] via-[#030705]/50 to-transparent" />
          <div className="scanline-sweep opacity-50" />
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-[var(--green-primary)]/50 text-green text-[11px] font-mono mb-2 w-fit">
            <Radio size={12} className="animate-pulse" />
            <span>COMMAND ANNOUNCEMENT {currentIndex + 1} / {total}</span>
          </div>

          <h2 className="font-hud text-xl sm:text-3xl font-extrabold text-silver-bright mb-1 tracking-wide">
            {currentItem.title}
          </h2>

          {currentItem.caption && (
            <p className="text-silver-main text-xs sm:text-sm font-mono max-w-2xl bg-black/40 px-2 py-1 rounded inline-block">
              {currentItem.caption}
            </p>
          )}
        </div>

        {/* Previous Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 border border-white/20 hover:border-[var(--green-primary)] text-silver-bright flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Next Button */}
        {total > 1 && (
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 border border-white/20 hover:border-[var(--green-primary)] text-silver-bright flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Indicator Dots */}
        {total > 1 && (
          <div className="absolute bottom-3 right-6 z-20 flex items-center gap-1.5 max-w-[180px] sm:max-w-xs overflow-x-auto px-1 py-1 rounded bg-black/40 backdrop-blur-sm border border-white/10">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full shrink-0 transition-all duration-300 ${
                  currentIndex === idx
                    ? 'w-6 bg-[var(--green-primary)] shadow-[0_0_8px_#00FF66]'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
