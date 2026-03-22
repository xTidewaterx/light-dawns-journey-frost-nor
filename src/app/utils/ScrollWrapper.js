"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";

export default function ScrollWrapper({ children }) {
  const containerRef = useRef(null);
  const [isAtTop, setIsAtTop] = useState(true);

  const onScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    setIsAtTop(scrollTop < 10);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <div ref={containerRef} className="flex flex-col flex-grow overflow-y-auto">
      {/* Keep Navbar in normal flow over the image */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          isAtTop ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <Navbar />
      </div>

      <main className="flex-grow">{children}</main>
    </div>
  );
}
