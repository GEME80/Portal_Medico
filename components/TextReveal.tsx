"use client";

import React, { useEffect, useRef, useState } from "react";

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number; // base delay in ms
}

export default function TextReveal({ text, className = "", delay = 0 }: TextRevealProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // Trigger once
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!text) return null;

  const words = text.split(/\s+/);

  return (
    <div
      ref={containerRef}
      className={`text-reveal-container ${className}`}
      style={{
        display: "inline-block",
        lineHeight: "inherit",
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          className="text-reveal-word-wrapper"
          style={{
            display: "inline-block",
            overflow: "hidden",
            marginRight: "0.22em",
            verticalAlign: "bottom",
            lineHeight: "1.1",
          }}
        >
          <span
            className="text-reveal-word"
            style={{
              display: "inline-block",
              transform: isInView ? "translateY(0)" : "translateY(105%)",
              opacity: isInView ? 1 : 0,
              transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease",
              transitionDelay: `${delay + i * 50}ms`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </div>
  );
}
