"use client";
import { useState } from "react";
import Link from "next/link";

interface Post {
  id: string;
  slug: string;
  emoji: string;
  category: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  featured: boolean;
}

interface NoticiasListProps {
  tenantSlug: string;
  nombreDoctor: string;
  primaryColor: string;
  accentColor: string;
  posts: Post[];
}

const CATEGORIES = ["Todos", "Académico", "Prevención", "Epidemiología", "EcoVaccine"];

export default function NoticiasList({
  tenantSlug,
  nombreDoctor,
  primaryColor,
  accentColor,
  posts
}: NoticiasListProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // We set the first post as featured if it's the "Todos" filter
  const processedPosts = posts.map((p, idx) => ({
    ...p,
    featured: selectedCategory === "Todos" && idx === 0
  }));

  const filteredPosts = processedPosts.filter(p => {
    if (selectedCategory === "Todos") return true;
    return p.category === selectedCategory;
  });

  const featuredPost = filteredPosts.find(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(160deg, ${primaryColor}f0, ${primaryColor}cc 60%, var(--slate-900))`,
        padding: "80px 0 80px",
        position: "relative",
        overflow: "hidden",
      }} aria-label="Publicaciones y noticias">
        <div className="hero-bg-grid" aria-hidden="true"/>
        <div className="hero-glow-1" aria-hidden="true" style={{ opacity: 0.4 }}/>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center" style={{ maxWidth: "640px", margin: "0 auto" }}>
            <span className="hero-kicker" style={{ display: "inline-flex", margin: "0 auto 20px" }}>
              <span className="pulse-dot"/>
              Publicaciones Científicas
            </span>
            <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "white", letterSpacing: "-.03em", marginBottom: "16px", fontFamily: "Outfit, sans-serif", lineHeight: 1.1 }}>
              Artículos, alertas<br/>
              <span className="hero-title-accent">y boletines</span>
            </h1>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,.6)", lineHeight: 1.7 }}>
              Investigación académica, alertas epidemiológicas y actualizaciones de salud pública publicadas por el {nombreDoctor}.
            </p>
          </div>
        </div>
      </section>

      {/* ── FILTERS ─────────────────────────────────────────────────── */}
      <div style={{ background: "white", borderBottom: "1px solid var(--slate-200)", padding: "16px 0", position: "sticky", top: "72px", zIndex: 50 }}>
        <div className="container">
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
            {CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-full)",
                  border: selectedCategory === cat ? "none" : "1px solid var(--slate-200)",
                  background: selectedCategory === cat ? primaryColor : "transparent",
                  color: selectedCategory === cat ? "white" : "var(--slate-600)",
                  fontWeight: 600, fontSize: "13px", whiteSpace: "nowrap",
                  cursor: "pointer", transition: "all .2s",
                  fontFamily: "inherit",
                }}
              >{cat}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── POSTS GRID ──────────────────────────────────────────────── */}
      <section className="section" aria-label="Lista de publicaciones">
        <div className="container">
          {filteredPosts.length === 0 ? (
            <div className="empty-state" style={{ padding: "80px 0" }}>
              <div className="empty-state-icon">📄</div>
              <div className="empty-state-title">Sin publicaciones</div>
              <div className="empty-state-sub">No hay artículos disponibles en esta categoría en este momento.</div>
            </div>
          ) : (
            <>
              {/* Featured article */}
              {featuredPost && (
                <Link href={`/${tenantSlug}/noticias/${featuredPost.slug}`} style={{ textDecoration: "none" }}>
                  <article style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    background: "white", border: "1px solid var(--slate-200)",
                    borderRadius: "var(--radius-xl)", overflow: "hidden",
                    marginBottom: "32px", transition: "box-shadow .25s, border-color .25s",
                    cursor: "pointer",
                  }}
                    className="featured-article"
                  >
                    <div style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor}dd)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "80px", padding: "48px",
                    }} aria-hidden="true">{featuredPost.emoji}</div>
                    <div style={{ padding: "40px" }}>
                      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
                        <span className="badge badge-emerald" style={{ background: primaryColor, color: "white" }}>
                          ⭐ Artículo Destacado
                        </span>
                        <span className="badge badge-teal">{featuredPost.category}</span>
                      </div>
                      <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--slate-900)", marginBottom: "12px", fontFamily: "Outfit, sans-serif", lineHeight: 1.3 }}>
                        {featuredPost.title}
                      </h2>
                      <p style={{ fontSize: "14px", color: "var(--slate-500)", lineHeight: 1.7, marginBottom: "20px" }}>
                        {featuredPost.excerpt}
                      </p>
                      <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--slate-400)" }}>
                        <span>📅 {featuredPost.date}</span>
                        <span>⏱ {featuredPost.readTime} de lectura</span>
                      </div>
                    </div>
                  </article>
                </Link>
              )}

              {/* Grid of regular articles */}
              {regularPosts.length > 0 && (
                <div className="news-grid">
                  {regularPosts.map((post) => (
                    <article className="news-card" key={post.id}>
                      <div className="news-card-img" role="img" aria-hidden="true" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}>
                        <span style={{ fontSize: "56px" }}>{post.emoji}</span>
                      </div>
                      <div className="news-card-body">
                        <div className="news-card-meta">
                          <span className="badge badge-teal" style={{ background: `${primaryColor}12`, color: primaryColor }}>
                            {post.category}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--slate-400)" }}>{post.readTime}</span>
                        </div>
                        <h3 className="news-card-title">{post.title}</h3>
                        <p className="news-card-excerpt">{post.excerpt}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11px", color: "var(--slate-400)" }}>{post.date}</span>
                          <Link href={`/${tenantSlug}/noticias/${post.slug}`} className="news-card-link" style={{ color: primaryColor }}>
                            Leer
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
