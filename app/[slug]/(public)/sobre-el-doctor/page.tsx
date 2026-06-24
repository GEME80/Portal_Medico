import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import CanvasParticles from "@/components/CanvasParticles";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicSobreElDoctorPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Load tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nombre")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) notFound();

  // Load configuration, timeline milestones, and news
  const [configRes, hitosRes, noticiasRes] = await Promise.all([
    supabase.from("configuracion_portal").select("*").eq("tenant_id", tenant.id).single(),
    supabase.from("hitos_timeline").select("*").eq("tenant_id", tenant.id).order("orden"),
    supabase.from("noticias_posts").select("id,titulo,resumen,emoji,categoria,created_at,slug").eq("tenant_id", tenant.id).eq("publicado", true).order("created_at", { ascending: false }).limit(5),
  ]);

  const config = configRes.data;
  const hitos = hitosRes.data ?? [];
  const publicaciones = noticiasRes.data ?? [];

  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  let waData = { n: config?.whatsapp || config?.telefono, t: "w" };
  if (config?.whatsapp && config.whatsapp.startsWith("{")) {
    try { waData = JSON.parse(config.whatsapp); } catch (e) {}
  }
  const chatUrl = waData.t === "t" 
    ? `https://t.me/${waData.n?.replace(/[^a-zA-Z0-9_]/g, "")}` 
    : `https://wa.me/${waData.n?.replace(/[^0-9]/g, "")}`;

  // Parse affiliations from DB config or fallback to static defaults
  let affiliations = [
    { name: "Sociedad Colombiana de Infectología", abbr: "SCI" },
    { name: "Sociedad Latinoamericana de Infectología Pediátrica", abbr: "SLIPE" },
    { name: "Organización Panamericana de la Salud", abbr: "OPS/OMS" },
    { name: "International Society for Infectious Diseases", abbr: "ISID" },
    { name: "Asociación Colombiana de Pediatría", abbr: "SCP" },
  ];
  if (config?.hero_subtitulo) {
    try {
      const parsed = JSON.parse(config.hero_subtitulo);
      if (Array.isArray(parsed)) {
        affiliations = parsed;
      }
    } catch (e) {}
  }

  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <section
        style={{
          background: `linear-gradient(160deg, ${primaryColor}f0, ${primaryColor}cc 60%, var(--slate-900))`,
          padding: "80px 0 100px",
          position: "relative",
          overflow: "hidden",
        }}
        aria-label="Perfil del doctor"
      >
        {/* Canvas particles background */}
        <CanvasParticles />

        <div className="hero-bg-grid" aria-hidden="true"/>
        <div className="hero-glow-1" aria-hidden="true" style={{ opacity: 0.5 }}/>

        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "64px", alignItems: "center" }}>
            {/* Photo */}
            <div className="animate-left" style={{ position: "relative" }}>
              <div style={{
                borderRadius: "var(--radius-2xl)",
                overflow: "hidden",
                boxShadow: "0 40px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.08)",
              }}>
                <Image
                  src={config?.foto_url || "/doctor-torres.png"}
                  alt={config?.nombre_doctor || "Dr. Carlos Torres Martínez"}
                  width={460}
                  height={460}
                  priority
                  style={{ width: "100%", height: "460px", objectFit: "cover", objectPosition: "center top" }}
                />
              </div>
              {/* Floating card */}
              {affiliations.length > 0 && (
                <div style={{
                  position: "absolute", bottom: "24px", left: "-24px",
                  background: "rgba(255,255,255,.10)", backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,.18)", borderRadius: "var(--radius-lg)",
                  padding: "14px 18px", color: "white",
                  boxShadow: "0 8px 32px rgba(0,0,0,.3)",
                }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,.6)", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Miembro activo</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>
                    {affiliations.map(a => a.abbr).filter(Boolean).join(" · ")}
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="animate-right delay-200" style={{ color: "white" }}>
              <div className="hero-kicker" style={{ marginBottom: "20px" }}>
                <span className="pulse-dot"/>
                Perfil Académico y Clínico
              </div>
              <h1 className="hero-title" style={{ marginBottom: "12px", color: "#ffffff" }}>
                {config?.nombre_doctor || "Dr. Carlos Torres"}
              </h1>
              <p style={{ fontSize: "18px", color: accentColor, fontWeight: 700, marginBottom: "20px", fontFamily: "Outfit, sans-serif" }}>
                {config?.titulo_doctor || "Infectólogo Pediatra"} · {config?.especialidad || "Vacunólogo Clínico"}
              </p>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,.65)", lineHeight: 1.75, marginBottom: "32px" }}>
                {config?.bio_larga || config?.bio_corta || "Trayectoria dedicada a la infectología y el bienestar de los pacientes."}
              </p>

              {/* Social Networks of the Doctor */}
              {(config?.linkedin_url || config?.instagram_url) && (
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  {config?.linkedin_url && (
                    <a
                      href={config.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="doctor-social-link"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect x="2" y="9" width="4" height="12" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                    </a>
                  )}
                  {config?.instagram_url && (
                    <a
                      href={config.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="doctor-social-link"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── CREDENTIALS timeline ────────────────────────────────────────── */}
      {hitos.length > 0 && (
        <section className="section" aria-label="Trayectoria y Hitos" style={{ padding: "80px 0 40px", background: "var(--white)" }}>
          <div className="container">
            <div className="text-center mb-8">
              <span className="badge badge-teal mb-4" style={{ display: "inline-flex" }}>Formación Académica</span>
              <h2 className="section-heading">Formación y<br/><span className="text-teal">hitos académicos</span></h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {hitos.map((hito, i) => (
                <div key={hito.id || i} className="card" style={{ padding: "24px" }}>
                  <div style={{
                    width: "52px", height: "52px",
                    background: "linear-gradient(135deg, var(--teal-50), var(--teal-100))",
                    borderRadius: "var(--radius-md)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "24px", marginBottom: "16px"
                  }}>🎓</div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: primaryColor, fontFamily: "Outfit, sans-serif", marginBottom: "4px" }}>
                    {hito.anio}
                  </div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", fontFamily: "Outfit, sans-serif" }}>
                    {hito.titulo}
                  </h3>
                  {hito.institucion && (
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.5 }}>
                      {hito.institucion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Parallelized Sections: Investigaciones & Afiliaciones ────────────────── */}
      <section className="section" style={{ background: "var(--white)", borderTop: "1px solid var(--slate-100)", padding: "80px 0" }} aria-label="Estudios e Investigaciones">
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "48px" }}>
            {/* Left Column: Publications */}
            <div>
              {publicaciones.length > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
                    <div>
                      <span className="badge badge-emerald mb-3" style={{ display: "inline-flex" }}>Publicaciones Seleccionadas</span>
                      <h2 className="section-heading" style={{ fontSize: "clamp(24px, 3.5vw, 32px)", margin: 0 }}>Investigación científica<br/><span className="text-teal">publicada</span></h2>
                    </div>
                    <Link href={`/${slug}/noticias`} className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "13px" }}>Ver todas →</Link>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {publicaciones.map((pub, i) => (
                      <div key={pub.id || i} className="soft-card" style={{ display: "flex", gap: "20px", alignItems: "flex-start", padding: "24px" }}>
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
                          <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.5 }}>{pub.resumen}</p>
                          <Link href={`/${slug}/noticias/${pub.slug}`} style={{ display: "inline-block", marginTop: "12px", fontSize: "13px", fontWeight: 700, color: primaryColor }}>
                            Leer publicación →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Affiliations */}
            <div>
              {affiliations.length > 0 && (
                <>
                  <div style={{ marginBottom: "32px" }}>
                    <span className="badge badge-teal mb-3" style={{ display: "inline-flex" }}>Membresías</span>
                    <h2 className="section-heading" style={{ fontSize: "clamp(24px, 3.5vw, 32px)", margin: 0 }}>Afiliaciones<br/><span className="text-teal">internacionales</span></h2>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {affiliations.map((a, i) => (
                      <div key={i} className="soft-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px", cursor: "default" }}>
                        <span style={{
                          background: primaryColor, color: "white",
                          padding: "6px 12px", borderRadius: "var(--radius-sm)",
                          fontSize: "12px", fontWeight: 800, fontFamily: "Outfit, sans-serif",
                          letterSpacing: ".04em", flexShrink: 0,
                        }}>{a.abbr}</span>
                        <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-700)", margin: 0, fontFamily: "Outfit, sans-serif" }}>{a.name}</h3>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
