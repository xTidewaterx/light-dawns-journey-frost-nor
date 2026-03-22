"use client";
import { useState } from "react";

export default function ProductGallery({ images = [] }) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-start">
      {/* Big image preview */}
      <div>
        <img
          src={`${selectedImage}?w=1200&q=85&fm=webp`}
          alt="Main Preview"
          className="w-full h-[500px] object-cover rounded-lg shadow-lg"
        />
      </div>

      {/* Thumbnail list */}
      <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={`${img}?w=300&q=60&fm=webp`}
            alt={`Thumb ${idx + 1}`}
            loading="lazy"
            decoding="async"
            onClick={() => setSelectedImage(img)}
            className={`cursor-pointer object-cover h-[120px] w-full rounded-lg shadow-sm border-2 ${
              selectedImage === img ? "border-sky-700" : "border-transparent"
            } hover:scale-105 transition`}
          />
        ))}
      </div>
    </div>
  );
}