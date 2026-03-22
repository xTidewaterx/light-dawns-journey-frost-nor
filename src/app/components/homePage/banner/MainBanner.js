'use client';

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Promises } from "../atoms/Promises";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

export default function MainBanner() {
  const textRef = useRef(null);
  const revealRef = useRef(null);
  const subtextRef = useRef(null);
  const [fontStyle, setFontStyle] = useState({ fontSize: "6.5rem", lineHeight: "1.2rem" });

  useEffect(() => {
    let outerTimer, innerTimer, fadeTimer, typingInterval;

    outerTimer = setTimeout(() => {
      const source = textRef.current;
      const target = document.getElementById("navbarTextTarget");
      const logo = document.getElementById("navbarLogo");
      if (!source || !target || !logo) return;

      source.style.transition = "opacity 0.4s ease-out";
      source.style.opacity = "0";

      const clone = source.cloneNode(true);
      const sourceRect = source.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;
      const gap = 8;

      const deltaX = logoRect.right + gap + 10 - sourceRect.left;
      const deltaY = logoRect.top + logoRect.height * 0.66 - sourceRect.top - 10;

      const computedStyle = window.getComputedStyle(source);
      const originalFontSize = computedStyle.fontSize;

      Object.assign(clone.style, {
        position: "fixed",
        left: `${sourceRect.left}px`,
        top: `${sourceRect.top}px`,
        margin: "0",
        zIndex: "9999",
        fontSize: originalFontSize,
        fontWeight: "bold",
        color: "white",
        transition: "transform 1.4s ease-in-out",
        transformOrigin: "top left",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        opacity: "1",
        transform: "translate(0, 0) scale(1)",
      });

      document.body.appendChild(clone);

      requestAnimationFrame(() => {
        clone.style.transform = "translate(0, 0) scale(1)";
        clone.style.opacity = "1";

        requestAnimationFrame(() => {
          clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.2)`;
        });
      });

      fadeTimer = setTimeout(() => {
        clone.style.transition += ", opacity 0.6s ease-out";
        clone.style.opacity = "0";
      }, 1200);

      innerTimer = setTimeout(() => {
        clone.remove();
        target.style.opacity = "1";

        const lines = ["HÅNDLAGET", "I NORD-NORGE,", "TIL DEG."];
        const container = revealRef.current;
        if (!container) return;

        container.innerHTML = "";

        lines.forEach((line, i) => {
          const lineDiv = document.createElement("div");
          lineDiv.style.display = "block";
          lineDiv.style.textAlign = isMobile ? "center" : "right";
          lineDiv.style.whiteSpace = "nowrap";
          lineDiv.style.marginBottom = i < lines.length - 1 ? "0.03em" : "0";

          line.split("").forEach((char) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            span.style.opacity = "0";
            span.style.transition = "opacity 0.3s ease";
            span.style.display = "inline-block";
            lineDiv.appendChild(span);
          });

          container.appendChild(lineDiv);
        });

        let letterIndex = 0;
        const spans = container.querySelectorAll("span");
        typingInterval = setInterval(() => {
          if (letterIndex < spans.length) {
            spans[letterIndex].style.opacity = "1";
            letterIndex++;
          } else {
            clearInterval(typingInterval);
          }
        }, isMobile ? 30 : 50);

        if (subtextRef.current) {
          subtextRef.current.style.opacity = "1";
          subtextRef.current.style.transform = "translateY(0)";
        }
      }, 1400);
    }, 2000);

    return () => {
      clearTimeout(outerTimer);
      clearTimeout(innerTimer);
      clearTimeout(fadeTimer);
      clearInterval(typingInterval);
    };
  }, []);

  useEffect(() => {
    const updateFont = () => {
      const width = window.innerWidth;
      let fontSize;
      const isMobile = width <= 768; // Define mobile breakpoint

      if (isMobile) {
        fontSize = Math.max(width / 150, 3.2);
      } else if (width <= 2500) {
        fontSize = Math.max(width / 170, 2.8);
      } else {
        fontSize = Math.max((width / 140) * 0.48, 2.8);
      }
      
      // Apply 20% size reduction on phone screens
      if (isMobile) {
        fontSize *= 0.8; // Reduce by 20%
      }

      let lineHeightMultiplier;
      if (width < 768) lineHeightMultiplier = 1.02;
      else if (width < 1600) lineHeightMultiplier = 1.08;
      else lineHeightMultiplier = 1.1;

      const lineHeight = fontSize * lineHeightMultiplier;
      setFontStyle({ fontSize: `${fontSize}rem`, lineHeight: `${lineHeight}rem` });
    };

    updateFont();
    window.addEventListener("resize", updateFont);
    return () => window.removeEventListener("resize", updateFont);
  }, []);

  return (
    <div className="relative z-10">
      <div className="mainBanner-cover bg-cover bg-center w-full min-h-[50vw] sm:min-h-[40vw] md:min-h-[63vw] [@media(min-width:900px)and(max-width:1440px)]:min-h-[78vw] relative flex flex-col items-center justify-center overflow-visible">
        <Image
        //  src="https://firebasestorage.googleapis.com/v0/b/norland-a7730.appspot.com/o/products%2Fe4f4bb0f-812f-4dfc-b87b-897a088d1687?alt=media&token=b54ead1b-cbfd-40bd-b9bf-6fe98425d39a"
          src="https://firebasestorage.googleapis.com/v0/b/norland-a7730.appspot.com/o/images%2Focean%20traveller%20v%C3%A5gnes%20troms%C3%B8%20northern%20spirit.jpg?alt=media&token=19828aad-263c-4cf2-9cd4-455253c5a3d7"
          alt="Main Banner"
          fill
          priority
          className="object-cover z-0"
        />

        <h2
          ref={textRef}
          className={`${roboto.className} text-white mb-0 z-20 relative font-bold tracking-[0.04em]
                     text-6xl sm:text-8xl md:text-8xl
                     [@media(min-width:700px)and(max-width:1270px)]:text-[7rem]
                     [@media(min-width:2000px)]:text-[6rem]`}
        >
          NORYA
        </h2>

        <div className="absolute inset-0 z-30 flex items-center justify-center px-4 sm:px-8 lg:px-12">
          <div className="w-full max-w-7xl flex justify-center md:justify-end">
            <div className="w-full md:w-auto text-center md:text-right">
              <div
                ref={revealRef}
                className={`${roboto.className} p-4 md:p-0 relative font-semibold tracking-[0.02em] drop-shadow-[0_4px_14px_rgba(0,0,0,0.28)]`}
                style={{
                  color: "#ffe604ff",
                  fontSize: fontStyle.fontSize,
                  lineHeight: fontStyle.lineHeight,
                  minHeight: `calc(${fontStyle.lineHeight} * 3)`,
                  whiteSpace: "normal",
                  overflowWrap: "normal",
                  wordBreak: "keep-all",
                  textTransform: "uppercase",
                }}
              ></div>

              <p
                ref={subtextRef}
                className="mt-3 text-white/95 text-sm sm:text-base md:text-lg transition-all duration-700"
                style={{ opacity: 0, transform: "translateY(8px)" }}
              >
                Kjøp direkte fra skaperne.
              </p>

              <div className="mt-5 flex flex-wrap gap-3 justify-center md:justify-end">
                <Link
                  href="/products"
                  className="btn-banner-gold text-sm sm:text-base"
                >
                  Handle nå
                </Link>
                <Link
                  href="/sellers"
                  className="btn-scandi-secondary text-sm sm:text-base backdrop-blur-sm"
                >
                  Møt skaperne
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-0 right-0 flex flex-col justify-center items-center z-40">
          <Promises />
        </div>
      </div>
    </div>
  );
}