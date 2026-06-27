import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import CanvasParticles from "@/components/CanvasParticles";
import ArticleContent from "@/components/ArticleContent";

interface PageProps {
  params: Promise<{ slug: string; postSlug: string }>;
}

export default async function NoticiasPostDetailPage({ params }: PageProps) {
  const { slug, postSlug } = await params;
  const supabase = await createClient();

  // Load tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nombre")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) notFound();

  // Load article
  const { data: post } = await supabase
    .from("noticias_posts")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("slug", postSlug)
    .eq("publicado", true)
    .single();

  if (!post) notFound();

  // Load configuration for colors/branding
  const { data: config } = await supabase
    .from("configuracion_portal")
    .select("color_primario, color_acento, nombre_doctor")
    .eq("tenant_id", tenant.id)
    .single();

  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  return (
    <>
      <section style={{
        background: `linear-gradient(160deg, ${primaryColor}f0, ${primaryColor}cc 60%, var(--slate-900))`,
        padding: "60px 0 80px",
        position: "relative",
        overflow: "hidden",
      }} aria-label="Cabecera del artículo">
        <div className="hero-bg-grid" aria-hidden="true" />
        <CanvasParticles />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <Link href={`/${slug}/noticias`} className="back-to-news-link" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              marginBottom: "32px"
            }}>
              ← Volver a publicaciones
            </Link>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
              <span className="badge badge-teal">{post.categoria}</span>
              <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                📅 {new Date(post.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>

            <h1 style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              color: "white",
              lineHeight: 1.2,
              fontFamily: "Outfit, sans-serif",
              marginBottom: "24px"
            }}>
              {post.titulo}
            </h1>

            {post.resumen && (
              <p style={{
                fontSize: "18px",
                lineHeight: 1.6,
                color: "rgba(255, 255, 255, 0.8)",
                fontWeight: 500,
                borderLeft: `4px solid ${accentColor}`,
                paddingLeft: "16px"
              }}>
                {post.resumen}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "white" }} aria-label="Contenido del artículo">
        <div className="container">
          <article style={{
            maxWidth: "800px",
            margin: "0 auto",
            fontSize: "17px",
            lineHeight: 1.8,
            color: "var(--slate-800)"
          }}>
            {post.imagen_portada_url && (
              <div style={{
                position: "relative",
                width: "100%",
                height: "clamp(250px, 45vh, 450px)",
                borderRadius: "var(--radius-xl)",
                overflow: "hidden",
                boxShadow: "var(--shadow-md)",
                marginBottom: "36px",
                border: "1px solid var(--slate-100)"
              }}>
                <img
                  src={post.imagen_portada_url}
                  alt={post.titulo}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 0", borderBottom: "1px solid var(--slate-100)", marginBottom: "32px" }}>
              <div style={{ fontSize: "32px" }}>{post.emoji || "📄"}</div>
              <div>
                <div style={{ fontSize: "12px", color: "var(--slate-400)", fontWeight: 600, textTransform: "uppercase" }}>Escrito por</div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)" }}>{config?.nombre_doctor || "Dr. Carlos Torres"}</div>
              </div>
            </div>

            <ArticleContent content={post.contenido_markdown || ""} />

            {post.infografia_url && (
              <div style={{ margin: "36px 0", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--slate-100)", boxShadow: "var(--shadow-sm)" }}>
                <img src={post.infografia_url} alt="Infografía" style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            )}

            {post.url_referencia && (
              <div style={{ marginTop: "36px", padding: "20px 24px", background: "var(--slate-50)", borderRadius: "var(--radius-lg)", border: "1px solid var(--slate-200)" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-500)", textTransform: "uppercase", letterSpacing: ".05em" }}>Fuente de referencia</span>
                <a href={post.url_referencia} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", fontSize: "15px", fontWeight: 600, color: "var(--teal-700)", textDecoration: "none" }}>
                  Más información →
                </a>
              </div>
            )}
          </article>
        </div>
      </section>
    </>
  );
}
