"use client";
import { useState } from "react";
import Image from "next/image";

export default function ImageCarousel({ images, productName }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) return null;

  const safeName = productName || "Product";

  const goToPrevious = () => {
    setCurrentIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const goToNext = () => {
    setCurrentIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  const openFullscreen = () => setIsFullscreen(true);
  const closeFullscreen = () => setIsFullscreen(false);

  const makeBlur = (color = "#f3f4f6") => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='100%' height='100%' fill='${color}'/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {images.length > 1 && (
            <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:w-[84px] sm:max-h-[76vh] sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:gap-2 sm:pb-0 sm:pr-1">
              {images.map((src, idx) => {
                const isActive = idx === currentIndex;

                return (
                  <button
                    key={`${src}-${idx}`}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Show image ${idx + 1}`}
                    className={`relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-xl border transition sm:w-24 md:w-[76px] ${
                      isActive ? "border-slate-900" : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`${safeName} thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 639px) 96px, 76px"
                      draggable={false}
                    />
                  </button>
                );
              })}
            </div>
          )}

          <div className="order-1 min-w-0 flex-1 sm:order-2">
            <div className="group relative w-full aspect-[2/3] max-h-[85vh] overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
              <button
                onClick={openFullscreen}
                className="absolute inset-0 block cursor-zoom-in"
                type="button"
                aria-label="Open full-screen image"
              >
                <Image
                  src={images[currentIndex]}
                  alt={`${safeName} image ${currentIndex + 1}`}
                  fill
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={makeBlur()}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 76vw, 42vw"
                  draggable={false}
                />
              </button>

              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm border border-slate-300 bg-white/90 shadow hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button
                    onClick={goToNext}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm border border-slate-300 bg-white/90 shadow hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white text-2xl p-2 bg-black/50 rounded-full"
            aria-label="Close full-screen"
          >
            ✕
          </button>
          <div className="relative w-full h-full max-w-4xl max-h-[90vh]">
            <Image
              src={images[currentIndex]}
              alt={`${safeName} image ${currentIndex + 1}`}
              fill
              className="object-contain"
              placeholder="blur"
              blurDataURL={makeBlur()}
              sizes="100vw"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow hover:bg-white"
                >
                  ←
                </button>
                <button
                  onClick={goToNext}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow hover:bg-white"
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
