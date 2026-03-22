"use client";

import { useState } from "react";

export default function ImageCarousel({ images }) {
  const [index, setIndex] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full flex flex-col items-center">
      <img
        src={images[index]}
        alt={`Product ${index}`}
        className="w-full object-cover max-h-[700px] rounded-md shadow-md"
      />

      {images.length > 1 && (
        <div className="absolute top-1/2 w-full flex justify-between px-4 transform -translate-y-1/2">
          <button
            onClick={() => setIndex((index - 1 + images.length) % images.length)}
            className="bg-white rounded-full shadow p-2 hover:bg-gray-200"
          >
            ⬅
          </button>
          <button
            onClick={() => setIndex((index + 1) % images.length)}
            className="bg-white rounded-full shadow p-2 hover:bg-gray-200"
          >
            ➡
          </button>
        </div>
      )}
    </div>
  );
}