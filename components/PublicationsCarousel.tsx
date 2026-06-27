"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Post {
  id: string;
  titulo: string;
  resumen: string;
  emoji?: string;
  categoria: string;
  created_at: string;
  slug: string;
}

interface PublicationsCarouselProps {
  publicaciones: Post[];
  slug: string;
  primaryColor: string;
  accentColor: string;
}

export default function PublicationsCarousel({
  publicaciones,
  slug,
  primaryColor,
  accentColor,
}: PublicationsCarouselProps) {
  if (!publicaciones || publicaciones.length === 0) return null;

  // Single publication fallback (no slider needed)
  if (publicaciones.length === 1) {
    const pub = publicaciones[0];
    return (
      <Link 
        href={`/${slug}/noticias/${pub.slug}`} 
        style={{ textDecoration: "none", width: "100%", display: "block" }}
      >
        <style>{`
          .pub-card-single {
            display: flex;
            gap: 20px;
            align-items: flex-start;
            padding: 24px;
            background: var(--slate-50);
            border: 1px solid var(--slate-100);
            border-radius: var(--radius-md);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
          }
          .pub-card-single:hover {
            border-color: ${accentColor} !important;
            box-shadow: 0 4px 20px ${accentColor}25;
            transform: translateY(-2px);
          }
        `}</style>
        <div className="pub-card-single">
          <div style={{
            fontSize: "13px", fontWeight: 800, color: "var(--teal-700)",
            fontFamily: "Outfit, sans-serif", letterSpacing: ".04em",
            background: "var(--teal-50)", padding: "6px 12px",
            borderRadius: "var(--radius-sm)", flexShrink: 0,
          }}>
            {pub.created_at ? new Date(pub.created_at).getFullYear() : "Reciente"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: "6px" }}>
              <span className={`badge ${
                pub.categoria === "Académico" ? "badge-teal" :
                pub.categoria === "Epidemiología" ? "badge-rose" : "badge-emerald"
              }`}>{pub.categoria}</span>
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px", fontFamily: "Outfit, sans-serif", lineHeight: 1.4 }}>
              {pub.titulo}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.5, margin: 0 }}>{pub.resumen}</p>
            <span style={{ display: "inline-block", marginTop: "12px", fontSize: "13px", fontWeight: 700, color: primaryColor }}>
              Leer publicación →
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Setup vertical clones (for 3 visible items)
  const slides = [
    publicaciones[publicaciones.length - 1], // Clone of last item
    ...publicaciones,
    publicaciones[0], // Clone of first item
    publicaciones[1] || publicaciones[0], // Clone of second item
    publicaciones[2] || publicaciones[0], // Clone of third item
  ];

  const [currentIndex, setCurrentIndex] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const visibleCards = Math.min(3, publicaciones.length);

  const navigateTo = (nextIndex: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTransitionEnabled(true);
    setCurrentIndex(nextIndex);
  };

  const handleNext = () => {
    navigateTo(currentIndex + 1);
  };

  const handleDotClick = (index: number) => {
    navigateTo(index + 1);
  };

  const handleTransitionEnd = () => {
    if (currentIndex === 0) {
      setTransitionEnabled(false);
      setCurrentIndex(publicaciones.length);
    } else if (currentIndex === publicaciones.length + 1) {
      setTransitionEnabled(false);
      setCurrentIndex(1);
    }
    setIsAnimating(false);
  };

  // Autoplay effect
  useEffect(() => {
    if (isPaused || isAnimating) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4000); // Shift every 4 seconds

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, isAnimating]);

  // Active dot index
  let activeDot = currentIndex - 1;
  if (currentIndex === 0) {
    activeDot = publicaciones.length - 1;
  } else if (currentIndex === publicaciones.length + 1) {
    activeDot = 0;
  }

  return (
    <div 
      className="publications-carousel-container"
      style={{ 
        "--accent-color": accentColor, 
        "--accent-color-light": `${accentColor}25`,
        "--wrapper-height": `${visibleCards * 180}px`
      } as React.CSSProperties}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style>{`
        .publications-carousel-container {
          position: relative;
          width: 100%;
          padding-right: 28px; /* Room for dots on the right */
          box-sizing: border-box;
        }
        .publications-carousel-wrapper {
          overflow: hidden;
          position: relative;
          height: var(--wrapper-height);
          border-radius: var(--radius-md);
          --slide-height-px: 180px;
        }
        .publications-carousel-track {
          display: flex;
          flex-direction: column;
        }
        .publications-carousel-slide {
          height: var(--slide-height-px);
          box-sizing: border-box;
          padding: 6px 0;
          display: flex;
          align-items: center;
        }
        .pub-card {
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pub-card:hover {
          border-color: var(--accent-color) !important;
          box-shadow: 0 4px 20px var(--accent-color-light);
          transform: translateY(-2px);
        }
        .publications-carousel-dots {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 10;
        }
        .pub-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--slate-300);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pub-dot:hover {
          background: var(--slate-400);
        }
        .pub-dot.active {
          height: 24px;
          border-radius: 4px;
          background: var(--accent-color);
          box-shadow: 0 2px 8px var(--accent-color-light);
        }
        @media (max-width: 768px) {
          .publications-carousel-wrapper {
            height: 210px;
            --slide-height-px: 210px;
          }
          .publications-carousel-slide {
            padding: 0;
          }
        }
      `}</style>

      {/* Slider Track Wrapper */}
      <div className="publications-carousel-wrapper">
        <div 
          className="publications-carousel-track"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translate3d(0, calc(-1 * ${currentIndex} * var(--slide-height-px)), 0)`,
            transition: transitionEnabled ? "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)" : "none"
          }}
        >
          {slides.map((pub, idx) => (
            <div key={`${pub.id}-${idx}`} className="publications-carousel-slide">
              <Link 
                href={`/${slug}/noticias/${pub.slug}`} 
                style={{ textDecoration: "none", width: "100%", height: "100%", display: "block" }}
              >
                <div className="soft-card pub-card" style={{ 
                  display: "flex", 
                  gap: "20px", 
                  alignItems: "flex-start", 
                  padding: "20px 24px",
                  width: "100%",
                  height: "100%",
                  boxSizing: "border-box",
                  background: "var(--slate-50)",
                  border: "1px solid var(--slate-100)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden"
                }}>
                  <div style={{
                    fontSize: "13px", 
                    fontWeight: 800, 
                    color: "var(--teal-700)",
                    fontFamily: "Outfit, sans-serif", 
                    letterSpacing: ".04em",
                    background: "var(--teal-50)", 
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)", 
                    flexShrink: 0,
                  }}>
                    {pub.created_at ? new Date(pub.created_at).getFullYear() : "Reciente"}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
                    <div style={{ marginBottom: "6px" }}>
                      <span className={`badge ${
                        pub.categoria === "Académico" ? "badge-teal" :
                        pub.categoria === "Epidemiología" ? "badge-rose" : "badge-emerald"
                      }`}>{pub.categoria}</span>
                    </div>
                    <h3 style={{ 
                      fontSize: "15px", 
                      fontWeight: 700, 
                      color: "var(--slate-900)", 
                      marginBottom: "4px", 
                      fontFamily: "Outfit, sans-serif", 
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {pub.titulo}
                    </h3>
                    <p style={{ 
                      fontSize: "13px", 
                      color: "var(--slate-500)", 
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      margin: 0,
                      flex: 1
                    }}>{pub.resumen}</p>
                    <span 
                      style={{ 
                        display: "inline-block", 
                        marginTop: "8px", 
                        fontSize: "13px", 
                        fontWeight: 700, 
                        color: primaryColor
                      }}
                    >
                      Leer publicación →
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="publications-carousel-dots">
        {publicaciones.map((_, dotIdx) => (
          <button 
            key={dotIdx}
            className={`pub-dot ${dotIdx === activeDot ? "active" : ""}`}
            onClick={() => handleDotClick(dotIdx)}
            aria-label={`Ir a publicación ${dotIdx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
