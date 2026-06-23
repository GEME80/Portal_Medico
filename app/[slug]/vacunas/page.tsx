import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DynamicVacunasPage({ params }: PageProps) {
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

  // Load portal configuration, vaccine myths, and inventory
  const [configRes, mitosRes, inventarioRes] = await Promise.all([
    supabase.from("configuracion_portal").select("nombre_doctor, color_primario, color_acento, email").eq("tenant_id", tenant.id).single(),
    supabase.from("mitos_vacunales").select("*").eq("tenant_id", tenant.id).eq("activo", true).order("orden"),
    supabase.from("inventario_vacunas").select("*").eq("tenant_id", tenant.id).order("nombre"),
  ]);

  const config = configRes.data;
  const mitos = mitosRes.data ?? [];
  const vacunas = inventarioRes.data ?? [];

  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(160deg, ${primaryColor}f0, ${primaryColor}cc 60%, var(--slate-900))`,
        padding: "80px 0 100px",
        position: "relative",
        overflow: "hidden",
      }} aria-label="EcoVaccine — Vacunación Segura">
        <div className="hero-bg-grid" aria-hidden="true"/>
        <div className="hero-glow-1" aria-hidden="true" style={{ opacity: 0.6 }}/>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center" style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div className="hero-kicker" style={{ display: "inline-flex", margin: "0 auto 20px" }}>
              <span className="pulse-dot"/>
              💉 EcoVaccine — Vacunación Basada en Evidencia
            </div>
            <h1 style={{
              fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900,
              color: "white", letterSpacing: "-.03em", marginBottom: "20px",
              fontFamily: "Outfit, sans-serif", lineHeight: 1.05
            }}>
              Vacunas seguras,<br/>
              <span className="hero-title-accent">niños protegidos</span>
            </h1>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,.65)", lineHeight: 1.7, marginBottom: "32px" }}>
              El {config?.nombre_doctor || "doctor"} responde con evidencia científica los mitos más comunes sobre la vacunación.
              Basado en publicaciones indexadas y guías de la OPS/OMS.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="#mitos" className="btn btn-emerald">
                Decodificador de Mitos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
              </a>
              <Link href={`/${slug}/noticias`} className="btn btn-ghost">Ver publicaciones científicas</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MYTH DECODER ────────────────────────────────────────────── */}
      {mitos.length > 0 && (
        <section className="section" id="mitos" aria-label="Decodificador de mitos sobre vacunación">
          <div className="container">
            <div className="text-center mb-8">
              <span className="badge badge-rose mb-4" style={{ display: "inline-flex" }}>
                🔍 Basado en Evidencia Molecular
              </span>
              <h2 className="section-heading">
                Decodificador de<br/>
                <span className="text-teal">Mitos Vacunales</span>
              </h2>
              <p className="section-sub mt-4" style={{ maxWidth: "560px", margin: "16px auto 0" }}>
                Respuestas detalladas a los {mitos.length} mitos más frecuentes que surgen en la consulta, con soporte científico verificable.
              </p>
            </div>

            <div className="myth-accordion" role="list">
              {mitos.map((item, i) => (
                <details className="myth-item" key={item.id || i} role="listitem">
                  <summary className="myth-summary" id={`myth-${i}`}>
                    <div className="myth-summary-left">
                      <div className="myth-number">{String(i + 1).padStart(2, "0")}</div>
                      <span>❌ Mito: &quot;{item.mito}&quot;</span>
                    </div>
                    <svg className="myth-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </summary>
                  <div className="myth-body">
                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>✅</span>
                      <p>{item.respuesta}</p>
                    </div>
                    {item.fuente && <p className="myth-source">📚 Fuente: {item.fuente}</p>}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DISPONIBILIDAD VACUNAS ─────────────────────────────────── */}
      {vacunas.length > 0 && (
        <section className="section" style={{ background: "white" }} aria-label="Disponibilidad de vacunas en inventario">
          <div className="container">
            <div className="text-center mb-8">
              <span className="badge badge-teal mb-4" style={{ display: "inline-flex" }}>Portafolio de Vacunas</span>
              <h2 className="section-heading">Vacunas Disponibles y<br/><span className="text-teal">Esquemas de Aplicación</span></h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              {vacunas.map((vac, i) => (
                <div key={vac.id || i} className="card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{
                      width: "48px", height: "48px",
                      background: "rgba(0,212,170,.1)",
                      borderRadius: "var(--radius-md)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "22px"
                    }}>💉</div>
                    <span className={`badge ${vac.stock_actual > 0 ? "badge-emerald" : "badge-rose"}`}>
                      {vac.stock_actual > 0 ? "Disponible" : "Consultar Disponibilidad"}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px", fontFamily: "Outfit, sans-serif" }}>
                    {vac.nombre}
                  </h3>
                  {vac.nombre_generico && (
                    <p style={{ fontSize: "12px", color: "var(--slate-400)", marginBottom: "8px" }}>
                      {vac.nombre_generico}
                    </p>
                  )}
                  {vac.esquema_dosis && (
                    <div style={{ fontSize: "13px", color: "var(--slate-600)", marginBottom: "4px" }}>
                      <strong>Esquema:</strong> {vac.esquema_dosis}
                    </div>
                  )}
                  {vac.laboratorio && (
                    <div style={{ fontSize: "13px", color: "var(--slate-600)", marginBottom: "12px" }}>
                      <strong>Laboratorio:</strong> {vac.laboratorio}
                    </div>
                  )}
                  {vac.descripcion && (
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.5 }}>
                      {vac.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ADMIN CTA ────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--slate-50)" }} aria-label="Sistema EcoVaccine para profesionales">
        <div className="container">
          <div style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor}88)`,
            borderRadius: "var(--radius-2xl)", padding: "60px 48px",
            display: "grid", gridTemplateColumns: "1fr auto", gap: "40px", alignItems: "center",
          }}>
            <div>
              <span className="badge mb-4" style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "white", display: "inline-flex", marginBottom: "16px" }}>
                💉 EcoVaccine POS — Solo para profesionales
              </span>
              <h2 style={{ fontSize: "28px", fontWeight: 900, color: "white", marginBottom: "12px", fontFamily: "Outfit, sans-serif" }}>
                Control de inventario vacunal
              </h2>
              <p style={{ color: "rgba(255,255,255,.8)", fontSize: "15px", lineHeight: 1.7, maxWidth: "480px" }}>
                El sistema EcoVaccine POS para registro de lotes, control de stock en tiempo real,
                alertas de reorden y trazabilidad de dosis es exclusivo del panel de administración.
              </p>
            </div>
            <Link href={`/${slug}/admin/vacunas`} className="btn btn-emerald" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
              Ir al Panel Admin
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor}88)`,
        padding: "80px 0", textAlign: "center", position: "relative", overflow: "hidden",
      }} aria-label="Consulta al Dr. Torres">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(0,212,170,.15) 0%, transparent 60%)" }}/>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: "580px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 900, color: "white", marginBottom: "16px", fontFamily: "Outfit, sans-serif" }}>
            ¿Tienes dudas sobre la vacunación de tu hijo?
          </h2>
          <p style={{ color: "rgba(255,255,255,.75)", fontSize: "16px", lineHeight: 1.7, marginBottom: "32px" }}>
            El {config?.nombre_doctor || "doctor"} atiende consultas sobre esquemas vacunales, reacciones adversas y
            contraindicaciones. La salud de tu hijo es nuestra prioridad.
          </p>
          {config?.email && (
            <a href={`mailto:${config.email}`} className="btn" style={{
              background: "white", color: primaryColor, fontWeight: 800,
              padding: "16px 36px", fontSize: "16px",
              boxShadow: "0 12px 40px rgba(0,0,0,.2)",
            }}>
              Consultar al Doctor →
            </a>
          )}
        </div>
      </section>
    </>
  );
}
