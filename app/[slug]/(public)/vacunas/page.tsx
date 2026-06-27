import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import CanvasParticles from "@/components/CanvasParticles";
import TextReveal from "@/components/TextReveal";

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
    supabase.from("configuracion_portal").select("*").eq("tenant_id", tenant.id).single(),
    supabase.from("mitos_vacunales").select("*").eq("tenant_id", tenant.id).eq("activo", true).order("orden"),
    supabase.from("inventario_medico").select("*").eq("tenant_id", tenant.id).order("nombre"),
  ]);

  const config = configRes.data;
  const mitos = mitosRes.data ?? [];
  const vacunas = inventarioRes.data ?? [];

  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  // Parse chat url for WhatsApp
  let waData = { n: config?.whatsapp || config?.telefono, t: "w" };
  if (config?.whatsapp && config.whatsapp.startsWith("{")) {
    try { waData = JSON.parse(config.whatsapp); } catch (e) {}
  }
  const chatUrl = waData.t === "t" 
    ? `https://t.me/${waData.n?.replace(/[^a-zA-Z0-9_]/g, "")}` 
    : `https://wa.me/${waData.n?.replace(/[^0-9]/g, "")}`;

  // Parse configuration from hero_badge_texto JSON
  let heroData = {
    habilitar_menu_vacunas: true,
    nombre_menu_vacunas: "HubMed",
    vacunas_hero_titulo: "Vacunas seguras, niños protegidos",
    vacunas_hero_subtitulo: "HubMed — Vacunación Basada en Evidencia",
    vacunas_hero_descripcion: "El doctor responde con evidencia científica los mitos más comunes sobre la vacunación.",
    vacunas_mitos_badge: "🔍 Información y Evidencia",
    vacunas_mitos_prefijo: "Decodificador de",
    vacunas_mitos_titulo: "Mitos Vacunales",
    vacunas_mitos_descripcion: "Respuestas detalladas a las preguntas y mitos más frecuentes que surgen en la consulta.",
    vacunas_inventario_titulo: "Vacunas Disponibles y Esquemas de Aplicación",
    vacunas_mostrar_mitos: true,
    vacunas_mostrar_inventario: true,
    vacunas_mostrar_banner: false,
    vacunas_banner_badge: "PROMOCIÓN",
    vacunas_banner_titulo: "Cuidado continuo para toda la familia",
    vacunas_banner_desc: "Agende hoy una cita de valoración integral y proteja a sus seres queridos.",
    vacunas_banner_btn_text: "Agendar Cita",
    vacunas_banner_btn_url: "",
    vacunas_catalog_tipo: "dynamic",
    vacunas_catalog_imagen_url: "",
    vacunas_catalog_pdf_url: "",
    vacunas_banner_imagen_url: "",
    vacunas_banner_btn_2_text: "",
    vacunas_banner_btn_2_url: "",
    vacunas_catalog_selected_ids: [] as string[],
    vacunas_catalog_custom_items: [] as any[]
  };

  if (config?.hero_badge_texto) {
    try {
      const parsed = JSON.parse(config.hero_badge_texto);
      if (parsed) {
        heroData = { ...heroData, ...parsed };
      }
    } catch (e) {}
  }

  if (heroData.habilitar_menu_vacunas === false) {
    notFound();
  }

  // Dynamic values
  const heroTitulo = heroData.vacunas_hero_titulo;
  const heroSubtitulo = heroData.vacunas_hero_subtitulo;
  const heroDescripcion = heroData.vacunas_hero_descripcion;
  const mitosBadge = heroData.vacunas_mitos_badge || "🔍 Información y Evidencia";
  const mitosPrefijo = heroData.vacunas_mitos_prefijo || "Decodificador de";
  const mitosTitulo = heroData.vacunas_mitos_titulo;
  const mitosDescripcion = heroData.vacunas_mitos_descripcion || "Respuestas detalladas a las preguntas y mitos más frecuentes que surgen en la consulta.";
  const inventarioTitulo = heroData.vacunas_inventario_titulo;

  const catalogConfigItems = heroData.vacunas_catalog_custom_items || [];
  const processedServices = catalogConfigItems.map((item: any) => {
    if (item.tipo === "producto") {
      const vac = vacunas.find(v => v.id === item.productoId);
      if (!vac) return null;
      return {
        id: item.id,
        tipo: "producto",
        nombre: vac.nombre,
        categoria: vac.laboratorio || "Inventario",
        descripcion: vac.descripcion || "",
        precio: "",
        disponible: vac.stock_actual > 0,
        subtitulo: vac.nombre_generico || "",
        detalles: vac.esquema_dosis || "",
        isCustom: false,
        associatedProducts: []
      };
    } else {
      // Find all associated product details
      const associatedProducts = (item.productos || []).map((prodId: string) => {
        const vac = vacunas.find(v => v.id === prodId);
        if (!vac) return null;
        return {
          id: vac.id,
          nombre: vac.nombre,
          subtitulo: vac.nombre_generico || "",
          categoria: vac.laboratorio || "Inventario",
          descripcion: vac.descripcion || "",
          detalles: vac.esquema_dosis || "",
          disponible: vac.stock_actual > 0
        };
      }).filter(Boolean);

      return {
        id: item.id,
        tipo: "servicio",
        nombre: item.nombre,
        categoria: item.categoria || "Servicios",
        descripcion: item.descripcion || "",
        precio: item.precio || "",
        isCustom: true,
        associatedProducts
      };
    }
  }).filter(Boolean) as any[];

  // Dynamic CTAs based on specialty/theme
  const isVaccineTheme = (heroData.nombre_menu_vacunas || "").toLowerCase().includes("vacun");
  const ctaHeading = isVaccineTheme 
    ? "¿Tienes dudas sobre la vacunación de tu hijo?" 
    : `¿Tiene alguna duda o consulta con el ${config?.nombre_doctor || "doctor"}?`;
  const ctaText = isVaccineTheme
    ? `El ${config?.nombre_doctor || "doctor"} atiende consultas sobre esquemas vacunales, reacciones adversas y contraindicaciones. La salud de tu hijo es nuestra prioridad.`
    : `El ${config?.nombre_doctor || "doctor"} atiende consultas personalizadas presenciales y virtuales. Su salud y bienestar es nuestra prioridad.`;

  const showRightColumn = !!heroData.vacunas_mostrar_banner;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .hero-grid-responsive {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          .hero-left-column {
            text-align: center !important;
            align-items: center !important;
          }
          .hero-left-column .hero-kicker {
            align-self: center !important;
          }
          .hero-left-column .btn-container {
            justify-content: center !important;
          }
        }
        .commercial-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--slate-150);
          position: relative;
          overflow: hidden;
        }
        .commercial-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 212, 170, 0.3);
          border-color: transparent;
        }
        .commercial-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(0, 212, 170, 0.03) 0%, rgba(10, 77, 92, 0.02) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .commercial-card:hover::before {
          opacity: 1;
        }
        .btn-hover-effect {
          transition: all 0.3s ease;
        }
        .commercial-card:hover .btn-hover-effect {
          transform: scale(1.02);
          box-shadow: 0 8px 20px rgba(0, 212, 170, 0.3);
        }
      `}} />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="vacunas-hero-section" style={{
        background: `linear-gradient(160deg, ${primaryColor}f0, ${primaryColor}cc 60%, var(--slate-900))`,
        position: "relative",
        overflow: "hidden",
      }} aria-label={heroData.nombre_menu_vacunas || "HubMed"}>
        <CanvasParticles />
        <div className="hero-bg-grid" aria-hidden="true" style={{ zIndex: 0 }}/>
        <div className="hero-glow-1" aria-hidden="true" style={{ opacity: 0.6, zIndex: 0 }}/>
        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: "1400px" }}>
          <div className="hero-grid-responsive" style={{
            display: "grid",
            gridTemplateColumns: showRightColumn ? "1fr 1.2fr" : "1fr",
            gap: "48px",
            alignItems: "center",
          }}>
            {/* Left Column - Hero Texts */}
            <div className="hero-left-column" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div className="hero-kicker" style={{ display: "inline-flex", marginBottom: "20px", alignSelf: "flex-start" }}>
                <span className="pulse-dot"/>
                {heroSubtitulo}
              </div>
              <h1 style={{
                fontSize: "clamp(34px, 4.5vw, 56px)", fontWeight: 900,
                color: "white", letterSpacing: "-.03em", marginBottom: "20px",
                fontFamily: "Outfit, sans-serif", lineHeight: 1.1
              }}>
                <TextReveal text={heroTitulo} />
              </h1>
              <p style={{ fontSize: "16px", color: "rgba(255,255,255,.75)", lineHeight: 1.7, marginBottom: "32px" }}>
                {heroDescripcion}
              </p>

            </div>

            {/* Right Column - Promotional Card */}
            {showRightColumn && (
              <div className="promo-card">
                {heroData.vacunas_banner_badge && (
                  <span className="badge" style={{
                    background: "var(--emerald-500)",
                    border: "none",
                    color: "white",
                    width: "fit-content",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.1em"
                  }}>
                    {heroData.vacunas_banner_badge}
                  </span>
                )}
                <div>
                  <h3 style={{
                    fontSize: "32px",
                    fontWeight: 800,
                    color: "white",
                    fontFamily: "Outfit, sans-serif",
                    lineHeight: 1.25,
                    marginBottom: "8px"
                  }}>
                    {heroData.vacunas_banner_titulo}
                  </h3>
                  <p style={{
                    color: "rgba(255, 255, 255, 0.95)",
                    fontSize: "18px",
                    lineHeight: 1.6
                  }}>
                    {heroData.vacunas_banner_desc}
                  </p>
                </div>
                
                {heroData.vacunas_banner_imagen_url && (
                  <div className="promo-card-image-wrap">
                    <img 
                      src={heroData.vacunas_banner_imagen_url} 
                      alt={heroData.vacunas_banner_titulo} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
                  {(heroData.vacunas_banner_btn_text || !heroData.vacunas_banner_btn_2_text) && (
                    <a 
                      href={heroData.vacunas_banner_btn_url || chatUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-emerald" 
                      style={{ flex: 1, textAlign: "center", justifyContent: "center", padding: "12px 20px" }}
                    >
                      {heroData.vacunas_banner_btn_text || "Agendar Cita"}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: "6px" }}>
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </a>
                  )}
                  {heroData.vacunas_banner_btn_2_text && (
                    <a 
                      href={heroData.vacunas_banner_btn_2_url || "#"} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-ghost" 
                      style={{ 
                        flex: 1, 
                        border: "1px solid rgba(255, 255, 255, 0.3)", 
                        color: "white", 
                        textAlign: "center", 
                        justifyContent: "center",
                        padding: "12px 20px"
                      }}
                    >
                      {heroData.vacunas_banner_btn_2_text}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CATALOGO DE SERVICIOS ─────────────────────────────────── */}
      {heroData.vacunas_mostrar_inventario !== false && (
        <section className="section" style={{ background: "white" }} aria-label="Catálogo de Servicios">
          <div className="container">
            <div className="text-center mb-8">
              <span className="badge badge-teal mb-4" style={{ display: "inline-flex" }}>Portafolio / Servicios</span>
              <h2 className="section-heading">{inventarioTitulo}</h2>
            </div>

            {/* Conditionally render based on vacunas_catalog_tipo */}
            {heroData.vacunas_catalog_tipo === "image" && heroData.vacunas_catalog_imagen_url ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto", maxWidth: "900px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                <img
                  src={heroData.vacunas_catalog_imagen_url}
                  alt="Portafolio de Servicios"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
            ) : heroData.vacunas_catalog_tipo === "pdf" && heroData.vacunas_catalog_pdf_url ? (
              <div style={{ 
                background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}15)`,
                border: `1px solid ${primaryColor}20`,
                borderRadius: "20px",
                padding: "48px 32px",
                textAlign: "center",
                maxWidth: "600px",
                margin: "0 auto"
              }}>
                <div style={{ fontSize: "64px", marginBottom: "20px" }}>📄</div>
                <h3 style={{ fontSize: "22px", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: primaryColor, marginBottom: "12px" }}>
                  Portafolio de Servicios (PDF)
                </h3>
                <p style={{ color: "var(--slate-600)", fontSize: "15px", lineHeight: 1.6, marginBottom: "30px", maxWidth: "460px", margin: "0 auto 30px" }}>
                  Descargue nuestro catálogo completo de vacunas y servicios profesionales para consultarlo en cualquier momento.
                </p>
                <a
                  href={heroData.vacunas_catalog_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-emerald"
                  style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "12px 28px", fontSize: "15px", fontWeight: 700 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  Descargar Catálogo PDF
                </a>
              </div>
            ) : processedServices.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                {processedServices.map((item, i) => {
                  if (item.tipo === "producto") {
                    const waText = encodeURIComponent(`Hola, me interesa consultar la disponibilidad del producto: *${item.nombre}*`);
                    const itemChatUrl = `${chatUrl}${chatUrl.includes("?") ? "&" : "?"}text=${waText}`;
                    return (
                      <div key={item.id || i} className="card commercial-card" style={{ padding: "24px", display: "flex", flexDirection: "column", borderRadius: "16px", background: "white" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", position: "relative", zIndex: 2 }}>
                          <span className="badge badge-emerald">📦 Producto</span>
                          <span style={{ 
                            display: "inline-flex", alignItems: "center", gap: "6px", 
                            background: item.disponible ? "var(--emerald-500)" : "var(--rose-500)", 
                            color: "white", padding: "4px 12px", borderRadius: "20px", 
                            fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em",
                            boxShadow: item.disponible ? "0 4px 12px rgba(0, 212, 170, 0.4)" : "none"
                          }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white", animation: item.disponible ? "pulse 2s infinite" : "none" }}></span>
                            {item.disponible ? "DISPONIBLE" : "CONSULTAR"}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "20px", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: "var(--slate-900)", marginBottom: "8px" }}>
                          {item.nombre}
                        </h3>
                        {item.subtitulo && <p style={{ fontSize: "13px", color: "var(--slate-500)", marginBottom: "8px" }}>{item.subtitulo}</p>}
                        {item.categoria && <p style={{ fontSize: "13px", color: "var(--slate-600)" }}><strong>Categoría/Lab:</strong> {item.categoria}</p>}
                        {item.detalles && <p style={{ fontSize: "13px", color: "var(--slate-600)" }}><strong>Detalles:</strong> {item.detalles}</p>}
                        {item.descripcion && <p style={{ fontSize: "14px", color: "var(--slate-600)", marginTop: "8px" }}>{item.descripcion}</p>}
                        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--slate-100)" }}>
                          <a href={itemChatUrl} target="_blank" rel="noopener noreferrer" className="btn btn-emerald btn-hover-effect" style={{ display: "inline-flex", padding: "10px 20px", position: "relative", zIndex: 2 }}>
                            Consultar Disponibilidad
                          </a>
                        </div>
                      </div>
                    );
                  }

                  // It's a Service
                  const waText = encodeURIComponent(`Hola, me interesa consultar el servicio: *${item.nombre}*${item.precio ? ` (${item.precio})` : ""}`);
                  const serviceChatUrl = `${chatUrl}${chatUrl.includes("?") ? "&" : "?"}text=${waText}`;

                  return (
                    <div key={item.id || i} className="card commercial-card" style={{ padding: "32px", borderRadius: "20px", background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px", position: "relative", zIndex: 2 }}>
                        <span className="badge badge-teal" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          💼 {item.categoria}
                        </span>
                        {item.precio && (
                          <span style={{ fontSize: "18px", color: "var(--emerald-600)", fontWeight: 800 }}>
                            {item.precio}
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: "24px", fontWeight: 800, fontFamily: "Outfit, sans-serif", color: "var(--slate-900)", marginBottom: "12px" }}>
                        {item.nombre}
                      </h3>

                      {item.descripcion && (
                        <p style={{ fontSize: "15px", color: "var(--slate-600)", lineHeight: 1.6, marginBottom: "20px", maxWidth: "800px" }}>
                          {item.descripcion}
                        </p>
                      )}

                      {/* Associated products list */}
                      {item.associatedProducts && item.associatedProducts.length > 0 ? (
                        <div style={{ marginTop: "24px", borderTop: "1px solid var(--slate-100)", paddingTop: "24px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--slate-400)", marginBottom: "16px" }}>
                            Productos y Vacunas Relacionadas
                          </h4>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                            {item.associatedProducts.map((prod: any, pIdx: number) => {
                              const prodWaText = encodeURIComponent(`Hola, me interesa consultar disponibilidad para: *${prod.nombre}* (en el servicio *${item.nombre}*)`);
                              const prodChatUrl = `${chatUrl}${chatUrl.includes("?") ? "&" : "?"}text=${prodWaText}`;

                              return (
                                <div className="commercial-card" key={prod.id || pIdx} style={{ background: "var(--slate-50)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", height: "100%" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", position: "relative", zIndex: 2 }}>
                                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.1)", color: "var(--emerald-700)" }}>
                                      {prod.categoria || "Vacuna"}
                                    </span>
                                    <span style={{ fontSize: "11px", fontWeight: 800, color: prod.disponible ? "var(--emerald-600)" : "var(--rose-500)", display: "flex", alignItems: "center", gap: "4px" }}>
                                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: prod.disponible ? "var(--emerald-500)" : "var(--rose-500)", animation: prod.disponible ? "pulse 2s infinite" : "none" }}></span>
                                      {prod.disponible ? "DISPONIBLE" : "CONSULTAR"}
                                    </span>
                                  </div>
                                  <h5 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "6px", fontFamily: "Outfit, sans-serif" }}>
                                    {prod.nombre}
                                  </h5>
                                  {prod.subtitulo && (
                                    <div style={{ fontSize: "12px", color: "var(--slate-500)", marginBottom: "8px", fontStyle: "italic" }}>
                                      {prod.subtitulo}
                                    </div>
                                  )}
                                  {prod.detalles && (
                                    <div style={{ fontSize: "12px", color: "var(--slate-600)", marginBottom: "6px" }}>
                                      <strong>Dosis:</strong> {prod.detalles}
                                    </div>
                                  )}
                                  {prod.descripcion && (
                                    <p style={{ fontSize: "12px", color: "var(--slate-500)", lineHeight: 1.5, marginBottom: "16px" }}>
                                      {prod.descripcion}
                                    </p>
                                  )}
                                  <div style={{ marginTop: "auto", paddingTop: "8px" }}>
                                    <a
                                      href={prodChatUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-emerald btn-hover-effect"
                                      style={{
                                        display: "flex",
                                        width: "100%",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        fontSize: "12px",
                                        fontWeight: 700,
                                        background: "transparent",
                                        border: `2px solid ${accentColor}`,
                                        color: accentColor,
                                        cursor: "pointer",
                                        position: "relative",
                                        zIndex: 2
                                      }}
                                    >
                                      Consultar Disponibilidad
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--slate-100)", position: "relative", zIndex: 2 }}>
                          <a href={serviceChatUrl} target="_blank" rel="noopener noreferrer" className="btn btn-emerald btn-hover-effect" style={{ display: "inline-flex", padding: "10px 24px" }}>
                            Consultar Servicio
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-400)" }}>
                <p>No hay servicios ni productos disponibles en este momento.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── MYTH DECODER ────────────────────────────────────────────── */}
      {heroData.vacunas_mostrar_mitos !== false && mitos.length > 0 && (
        <section className="section" id="mitos" aria-label="Decodificador de mitos" style={{ background: "var(--slate-50)" }}>
          <div className="container">
            <div className="text-center mb-8">
              <span className="badge badge-rose mb-4" style={{ display: "inline-flex" }}>
                {mitosBadge}
                {mitos.length > 0 && (
                  <span style={{
                    marginLeft: "8px",
                    background: "rgba(244, 63, 94, 0.15)",
                    borderRadius: "10px",
                    padding: "1px 7px",
                    fontSize: "10px",
                    fontWeight: 800,
                  }}>
                    {mitos.length} {mitos.length === 1 ? "tema" : "temas"}
                  </span>
                )}
              </span>
              <h2 className="section-heading">
                {mitosPrefijo && <>{mitosPrefijo}<br/></>}
                <span style={{ color: accentColor }}>{mitosTitulo}</span>
              </h2>
              <p className="section-sub mt-4" style={{ maxWidth: "560px", margin: "16px auto 0" }}>
                {mitosDescripcion}
              </p>
            </div>

            <div className="myth-accordion" role="list">
              {mitos.map((item, i) => {
                const isMyth = item.mito.toLowerCase().includes("mito");
                const isFuenteUrl = item.fuente && (item.fuente.startsWith("http://") || item.fuente.startsWith("https://") || item.fuente.startsWith("www."));
                return (
                  <details className="myth-item" key={item.id || i} role="listitem">
                    <summary className="myth-summary" id={`myth-${i}`}>
                      <div className="myth-summary-left">
                        {/* Semantic SVG icon */}
                        <div className="myth-icon" aria-hidden="true">
                          {isMyth ? (
                            // Shield with X — debunked myth
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                              <path d="M9 12l2 2 4-4"/>
                            </svg>
                          ) : (
                            // Light bulb — insight / question
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.74V17H8v-2.26A7 7 0 0 1 12 2z"/>
                            </svg>
                          )}
                        </div>
                        <span>{isMyth ? `"${item.mito.replace(/^mito:?\s*/i, "")}"` : item.mito}</span>
                      </div>
                      <svg className="myth-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </summary>

                    {/* Smooth animation wrapper */}
                    <div className="myth-body-wrapper">
                      <div className="myth-body-inner">
                        <div className="myth-body">
                          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "12px" }}>
                            <span style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>{isMyth ? "✅" : "💡"}</span>
                            <p style={{ margin: 0 }}>{item.respuesta}</p>
                          </div>
                          {item.fuente && (
                            isFuenteUrl ? (
                              <a
                                href={item.fuente.startsWith("www.") ? `https://${item.fuente}` : item.fuente}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="myth-source"
                              >
                                📚 Fuente: {item.fuente}
                              </a>
                            ) : (
                              <span className="myth-source">📚 Fuente: {item.fuente}</span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </section>
      )}

    </>
  );
}
