"use client";

import React, { useEffect, useState, useRef } from "react";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number; // base delay in ms
}

export default function TextReveal({ text, className = "", delay = 100 }: TextRevealProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView || !text) return;

    let timer: NodeJS.Timeout;
    let currentIndex = 0;
    
    const startTimeout = setTimeout(() => {
      timer = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(timer);
        }
      }, 35); // 35ms per character for natural flow
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(timer);
    };
  }, [isInView, text, delay]);

  return (
    <span ref={containerRef} className={className} style={{ position: "relative" }}>
      {/* Visual typewriter reveal */}
      <span aria-hidden="true">{displayedText}</span>
      {isInView && displayedText.length < text.length && (
        <span className="typewriter-cursor" style={{
          display: "inline-block",
          width: "3px",
          height: "1em",
          background: "currentColor",
          marginLeft: "2px",
          verticalAlign: "middle",
          animation: "blink 1s step-end infinite"
        }} />
      )}
      {/* Hidden full text for SEO & Accessibility */}
      <span className="sr-only" style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0
      }}>{text}</span>
    </span>
  );
}
