"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Post {
  id: string;
  titulo: string;
  resumen: string;
  emoji?: string;
  categoria: string;
  created_at: string;
  slug: string;
  imagen_portada_url?: string;
}

interface NewsCarouselProps {
  noticias: Post[];
  slug: string;
  accentColor: string;
}

export default function NewsCarousel({ noticias, slug, accentColor }: NewsCarouselProps) {
  if (!noticias || noticias.length === 0) {
    return null;
  }

  // If there's only one news post, render a static single banner
  if (noticias.length === 1) {
    const post = noticias[0];
    return (
      <div 
        className="banner-slider-container" 
        style={{ "--accent-color": accentColor, "--accent-color-light": `${accentColor}25` } as React.CSSProperties}
      >
        <style>{`
          .banner-slider-container {
            position: relative;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
          }
          .banner-slider-wrapper {
            overflow: hidden;
            position: relative;
            border-radius: var(--radius-2xl);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--slate-200);
          }
          .banner-slide {
            width: 100%;
            background: linear-gradient(135deg, #ffffff 0%, var(--slate-50) 100%);
            box-sizing: border-box;
          }
          .banner-slide-content {
            display: grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: 48px;
            align-items: center;
            padding: 48px;
            min-height: 400px;
          }
          .banner-text-side {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
          }
          .banner-image-side {
            position: relative;
            width: 100%;
            height: 340px;
            overflow: hidden;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-sm);
            background: var(--slate-100);
          }
          .banner-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .banner-slide:hover .banner-img {
            transform: scale(1.04);
          }
          .banner-action-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            fontWeight: 700;
            color: #ffffff;
            background: var(--accent-color);
            padding: 12px 24px;
            border-radius: var(--radius-lg);
            transition: all 0.2s ease-in-out;
            cursor: pointer;
            box-shadow: 0 4px 12px var(--accent-color-light);
          }
          .banner-slide:hover .banner-action-btn {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px var(--accent-color-light);
            filter: brightness(1.05);
          }
          @media (max-width: 992px) {
            .banner-slide-content {
              gap: 32px;
              padding: 32px;
            }
            .banner-image-side {
              height: 280px;
            }
          }
          @media (max-width: 768px) {
            .banner-slide-content {
              grid-template-columns: 1fr;
              gap: 24px;
              padding: 24px;
              min-height: auto;
            }
            .banner-image-side {
              height: 220px;
              grid-row: 1;
            }
          }
        `}</style>
        <div className="banner-slider-wrapper">
          <div className="banner-slide">
            <Link href={`/${slug}/noticias/${post.slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div className="banner-slide-content">
                <div className="banner-text-side">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      color: accentColor, 
                      background: `${accentColor}15`, 
                      padding: '4px 10px', 
                      borderRadius: '20px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {post.categoria}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                      • {new Date(post.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <h3 style={{ 
                    fontSize: 'clamp(22px, 3.5vw, 36px)', 
                    fontWeight: 900, 
                    color: '#000000', 
                    marginBottom: '16px', 
                    lineHeight: 1.2, 
                    fontFamily: 'Outfit, sans-serif',
                    letterSpacing: '-0.03em'
                  }}>
                    {post.titulo}
                  </h3>
                  <p style={{ 
                    fontSize: '15px', 
                    color: 'var(--slate-500)', 
                    marginBottom: '28px', 
                    lineHeight: 1.6
                  }}>
                    {post.resumen}
                  </p>
                  <div className="banner-action-btn">
                    Leer artículo completo <span>→</span>
                  </div>
                </div>
                <div className="banner-image-side">
                  {post.imagen_portada_url ? (
                    <img src={post.imagen_portada_url} alt={post.titulo} className="banner-img" />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "72px" }}>
                      {post.emoji || "📄"}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Setup slides array with clones for infinite loop
  // Original array: [A, B, C]
  // Cloned array: [C, A, B, C, A]
  const slides = [
    noticias[noticias.length - 1], // Clone of last item
    ...noticias,
    noticias[0], // Clone of first item
  ];

  const [currentIndex, setCurrentIndex] = useState(1);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const navigateTo = (nextIndex: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTransitionEnabled(true);
    setCurrentIndex(nextIndex);
  };

  const handleNext = () => {
    navigateTo(currentIndex + 1);
  };

  const handlePrev = () => {
    navigateTo(currentIndex - 1);
  };

  const handleDotClick = (index: number) => {
    navigateTo(index + 1);
  };

  const handleTransitionEnd = () => {
    if (currentIndex === 0) {
      // Instant jump to the last original slide
      setTransitionEnabled(false);
      setCurrentIndex(noticias.length);
    } else if (currentIndex === noticias.length + 1) {
      // Instant jump to the first original slide
      setTransitionEnabled(false);
      setCurrentIndex(1);
    }
    setIsAnimating(false);
  };

  // Autoplay Effect
  useEffect(() => {
    if (isPaused || isAnimating) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000); // Transitions every 5 seconds

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, isAnimating]);

  // Compute active dot index (0-based)
  let activeDot = currentIndex - 1;
  if (currentIndex === 0) {
    activeDot = noticias.length - 1;
  } else if (currentIndex === noticias.length + 1) {
    activeDot = 0;
  }

  return (
    <div 
      className="banner-slider-container" 
      style={{ "--accent-color": accentColor, "--accent-color-light": `${accentColor}25` } as React.CSSProperties}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <style>{`
        .banner-slider-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .banner-slider-wrapper {
          overflow: hidden;
          position: relative;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-md);
          border: 1px solid var(--slate-200);
        }
        .banner-slider-track {
          display: flex;
          width: 100%;
        }
        .banner-slide {
          flex: 0 0 100%;
          width: 100%;
          background: linear-gradient(135deg, #ffffff 0%, var(--slate-50) 100%);
          box-sizing: border-box;
        }
        .banner-slide-content {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
          padding: 48px;
          min-height: 400px;
        }
        .banner-text-side {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .banner-image-side {
          position: relative;
          width: 100%;
          height: 340px;
          overflow: hidden;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
          background: var(--slate-100);
        }
        .banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .banner-slide:hover .banner-img {
          transform: scale(1.04);
        }
        .banner-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          background: var(--accent-color);
          padding: 12px 24px;
          border-radius: var(--radius-lg);
          transition: all 0.2s ease-in-out;
          box-shadow: 0 4px 12px var(--accent-color-light);
        }
        .banner-slide:hover .banner-action-btn {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px var(--accent-color-light);
          filter: brightness(1.05);
        }
        .banner-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 1.5px solid var(--slate-200);
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          color: var(--slate-800);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-sm);
          z-index: 10;
        }
        .banner-nav-btn:hover {
          background: var(--accent-color);
          color: white;
          border-color: var(--accent-color);
          box-shadow: 0 4px 12px var(--accent-color-light);
        }
        .banner-nav-btn.prev {
          left: -24px;
        }
        .banner-nav-btn.next {
          right: -24px;
        }
        .banner-nav-btn.prev:hover {
          transform: translateY(-50%) scale(1.05);
        }
        .banner-nav-btn.next:hover {
          transform: translateY(-50%) scale(1.05);
        }
        .banner-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 24px;
        }
        .banner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--slate-300);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .banner-dot:hover {
          background: var(--slate-400);
        }
        .banner-dot.active {
          width: 24px;
          border-radius: 4px;
          background: var(--accent-color);
          box-shadow: 0 2px 8px var(--accent-color-light);
        }
        @media (max-width: 1248px) {
          .banner-nav-btn.prev {
            left: 12px;
          }
          .banner-nav-btn.next {
            right: 12px;
          }
        }
        @media (max-width: 992px) {
          .banner-slide-content {
            gap: 32px;
            padding: 32px;
          }
          .banner-image-side {
            height: 280px;
          }
        }
        @media (max-width: 768px) {
          .banner-slide-content {
            grid-template-columns: 1fr;
            gap: 24px;
            padding: 24px;
            min-height: auto;
          }
          .banner-image-side {
            height: 220px;
            grid-row: 1;
          }
        }
      `}</style>

      {/* Navigation Arrows */}
      <button className="banner-nav-btn prev" onClick={handlePrev} aria-label="Anterior">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
      <button className="banner-nav-btn next" onClick={handleNext} aria-label="Siguiente">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {/* Slider Track Wrapper */}
      <div className="banner-slider-wrapper">
        <div 
          className="banner-slider-track"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
            transition: transitionEnabled ? "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)" : "none"
          }}
        >
          {slides.map((post, idx) => (
            <div key={`${post.id}-${idx}`} className="banner-slide">
              <Link href={`/${slug}/noticias/${post.slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div className="banner-slide-content">
                  <div className="banner-text-side">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        color: accentColor, 
                        background: `${accentColor}15`, 
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {post.categoria}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>
                        • {new Date(post.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    
                    <h3 style={{ 
                      fontSize: 'clamp(22px, 3.5vw, 36px)', 
                      fontWeight: 900, 
                      color: '#000000', 
                      marginBottom: '16px', 
                      lineHeight: 1.2, 
                      fontFamily: 'Outfit, sans-serif',
                      letterSpacing: '-0.03em'
                    }}>
                      {post.titulo}
                    </h3>
                    
                    <p style={{ 
                      fontSize: '15px', 
                      color: 'var(--slate-500)', 
                      marginBottom: '28px', 
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {post.resumen}
                    </p>
                    
                    <div className="banner-action-btn">
                      Leer artículo completo <span>→</span>
                    </div>
                  </div>
                  
                  <div className="banner-image-side">
                    {post.imagen_portada_url ? (
                      <img src={post.imagen_portada_url} alt={post.titulo} className="banner-img" />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "72px" }}>
                        {post.emoji || "📄"}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="banner-dots">
        {noticias.map((_, dotIdx) => (
          <button 
            key={dotIdx}
            className={`banner-dot ${dotIdx === activeDot ? "active" : ""}`}
            onClick={() => handleDotClick(dotIdx)}
            aria-label={`Ir a la diapositiva ${dotIdx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
