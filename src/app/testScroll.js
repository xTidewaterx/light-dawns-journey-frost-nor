'use client';
import { useEffect } from "react";

export default function TestScroll() {
  useEffect(() => {
    const handleScroll = () => {
      console.log("scrollY:", window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    console.log("✅ Scroll listener attached");

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ height: "3000px", background: "linear-gradient(white, gray)" }}>
      <h1 style={{ position: "fixed", top: 20, left: 20 }}>Scroll down and check console</h1>
    </div>
  );
}
