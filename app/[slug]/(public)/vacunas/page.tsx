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
    supabase.from("configuracion_portal").select("*").eq("tenant_id", tenant.id).single(),
    supabase.from("mitos_vacunales").select("*").eq("tenant_id", tenant.id).eq("activo", true).order("orden"),
    supabase.from("inventario_vacunas").select("*").eq("tenant_id", tenant.id).order("nombre"),
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
    vacunas_mitos_titulo: "Mitos Vacunales",
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
  const mitosTitulo = heroData.vacunas_mitos_titulo;
  const inventarioTitulo = heroData.vacunas_inventario_titulo;

  const selectedInventoryIds = heroData.vacunas_catalog_selected_ids || [];
  const filteredVacunas = vacunas.filter(vac => selectedInventoryIds.includes(vac.id));
  const customServices = heroData.vacunas_catalog_custom_items || [];

  const mappedInventory = filteredVacunas.map(vac => ({
    id: vac.id,
    nombre: vac.nombre,
    subtitulo: vac.nombre_generico || "",
    categoria: vac.laboratorio || "Inventario",
    descripcion: vac.descripcion || "",
    detalles: vac.esquema_dosis || "",
    disponible: vac.stock_actual > 0,
    precio: "",
    isCustom: false
  }));

  const mappedCustom = customServices.map((srv: any) => ({
    id: srv.id,
    nombre: srv.nombre,
    subtitulo: "",
    categoria: srv.categoria || "Servicio",
    descripcion: srv.descripcion || "",
    detalles: "",
    disponible: true,
    precio: srv.precio || "",
    isCustom: true
  }));

  const allCatalogItems = [...mappedInventory, ...mappedCustom];

  // Dynamic CTAs based on specialty/theme
  const isVaccineTheme = (heroData.nombre_menu_vacunas || "").toLowerCase().includes("vacun");
  const ctaHeading = isVaccineTheme 
    ? "¿Tienes dudas sobre la vacunación de tu hijo?" 
    : `¿Tiene alguna duda o consulta con el ${config?.nombre_doctor || "doctor"}?`;
  const ctaText = isVaccineTheme
    ? `El ${config?.nombre_doctor || "doctor"} atiende consultas sobre esquemas vacunales, reacciones adversas y contraindicaciones. La salud de tu hijo es nuestra prioridad.`
    : `El ${config?.nombre_doctor || "doctor"} atiende consultas personalizadas presenciales y virtuales. Su salud y bienestar es nuestra prioridad.`;

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(160deg, ${primaryColor}f0, ${primaryColor}cc 60%, var(--slate-900))`,
        padding: "80px 0 100px",
        position: "relative",
        overflow: "hidden",
      }} aria-label={heroData.nombre_menu_vacunas || "HubMed"}>
        <div className="hero-bg-grid" aria-hidden="true"/>
        <div className="hero-glow-1" aria-hidden="true" style={{ opacity: 0.6 }}/>
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="text-center" style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div className="hero-kicker" style={{ display: "inline-flex", margin: "0 auto 20px" }}>
              <span className="pulse-dot"/>
              {heroSubtitulo}
            </div>
            <h1 style={{
              fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900,
              color: "white", letterSpacing: "-.03em", marginBottom: "20px",
              fontFamily: "Outfit, sans-serif", lineHeight: 1.05
            }}>
              {heroTitulo}
            </h1>
            <p style={{ fontSize: "17px", color: "rgba(255,255,255,.65)", lineHeight: 1.7, marginBottom: "32px" }}>
              {heroDescripcion}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              {heroData.vacunas_mostrar_mitos !== false && mitos.length > 0 && (
                <a href="#mitos" className="btn btn-emerald">
                  Ver Detalles
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                </a>
              )}
              <Link href={`/${slug}/noticias`} className="btn btn-ghost">Ver publicaciones científicas</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── MYTH DECODER ────────────────────────────────────────────── */}
      {heroData.vacunas_mostrar_mitos !== false && mitos.length > 0 && (
        <section className="section" id="mitos" aria-label="Decodificador de mitos">
          <div className="container">
            <div className="text-center mb-8">
              <span className="badge badge-rose mb-4" style={{ display: "inline-flex" }}>
                🔍 Información y Evidencia
              </span>
              <h2 className="section-heading">
                Decodificador de<br/>
                <span style={{ color: accentColor }}>{mitosTitulo}</span>
              </h2>
              <p className="section-sub mt-4" style={{ maxWidth: "560px", margin: "16px auto 0" }}>
                Respuestas detalladas a las preguntas y mitos más frecuentes que surgen en la consulta.
              </p>
            </div>

            <div className="myth-accordion" role="list">
              {mitos.map((item, i) => {
                const isMyth = item.mito.toLowerCase().includes("mito");
                return (
                  <details className="myth-item" key={item.id || i} role="listitem">
                    <summary className="myth-summary" id={`myth-${i}`}>
                      <div className="myth-summary-left">
                        <div className="myth-number">{String(i + 1).padStart(2, "0")}</div>
                        <span>{isMyth ? `❌ Mito: "${item.mito.replace(/^mito:?\s*/i, "")}"` : `❓ ${item.mito}`}</span>
                      </div>
                      <svg className="myth-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </summary>
                    <div className="myth-body">
                      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
                        <span style={{ fontSize: "16px", flexShrink: 0 }}>{isMyth ? "✅" : "💡"}</span>
                        <p>{item.respuesta}</p>
                      </div>
                      {item.fuente && <p className="myth-source">📚 Fuente: {item.fuente}</p>}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── CATALOGO DE SERVICIOS ─────────────────────────────────── */}
      {heroData.vacunas_mostrar_inventario !== false && (
        <section className="section" style={{ background: "white" }} aria-label="Catálogo de Servicios">
          <div className="container">
            <div className="text-center mb-8">
              <span className="badge badge-teal mb-4" style={{ display: "inline-flex" }}>Portafolio / Servicios</span>
              <h2 className="section-heading">{inventarioTitulo}</h2>
            </div>

            {/* Dynamic Catalog */}
            {(heroData.vacunas_catalog_tipo || "dynamic") === "dynamic" && (
              allCatalogItems.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
                  {allCatalogItems.map((item, i) => {
                    const waText = encodeURIComponent(`Hola, me interesa consultar la disponibilidad del servicio/producto: *${item.nombre}*${item.precio ? ` (${item.precio})` : ""}`);
                    const itemChatUrl = `${chatUrl}${chatUrl.includes("?") ? "&" : "?"}text=${waText}`;

                    return (
                      <div key={item.id || i} className="card" style={{ padding: "24px", display: "flex", flexDirection: "column", height: "100%", transition: "all 0.3s ease", border: "1px solid var(--slate-100)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                          <div style={{
                            width: "48px", height: "48px",
                            background: `${accentColor}15`,
                            borderRadius: "var(--radius-md)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "22px",
                            color: accentColor
                          }}>
                            {item.isCustom ? "💼" : "📦"}
                          </div>
                          <span className={`badge ${item.disponible ? "badge-emerald" : "badge-rose"}`}>
                            {item.disponible ? "Disponible" : "Consultar Disponibilidad"}
                          </span>
                        </div>
                        
                        <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px", fontFamily: "Outfit, sans-serif", color: "var(--slate-900)" }}>
                          {item.nombre}
                        </h3>
                        
                        {item.subtitulo && (
                          <p style={{ fontSize: "12px", color: "var(--slate-400)", marginBottom: "8px" }}>
                            {item.subtitulo}
                          </p>
                        )}
                        
                        {item.categoria && (
                          <div style={{ fontSize: "13px", color: "var(--slate-600)", marginBottom: "6px" }}>
                            <strong>Categoría:</strong> {item.categoria}
                          </div>
                        )}
                        
                        {item.detalles && (
                          <div style={{ fontSize: "13px", color: "var(--slate-600)", marginBottom: "6px" }}>
                            <strong>Detalles:</strong> {item.detalles}
                          </div>
                        )}
                        
                        {item.precio && (
                          <div style={{ fontSize: "14px", color: "var(--emerald-600)", fontWeight: 700, marginBottom: "8px" }}>
                            Precio: {item.precio}
                          </div>
                        )}
                        
                        {item.descripcion && (
                          <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.5, marginBottom: "16px" }}>
                            {item.descripcion}
                          </p>
                        )}
                        
                        <div style={{ marginTop: "auto", paddingTop: "12px" }}>
                          <a 
                            href={itemChatUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-emerald" 
                            style={{ 
                              display: "flex", 
                              width: "100%", 
                              justifyContent: "center", 
                              alignItems: "center", 
                              padding: "10px 16px", 
                              fontSize: "13px",
                              fontWeight: 700,
                              background: "transparent",
                              border: `2px solid ${accentColor}`,
                              color: accentColor,
                              cursor: "pointer",
                              transition: "all 0.2s ease"
                            }}
                          >
                            Consultar Disponibilidad
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-400)" }}>
                  <p>No hay servicios ni productos disponibles en este momento.</p>
                </div>
              )
            )}

            {/* Image Catalog */}
            {heroData.vacunas_catalog_tipo === "image" && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                {heroData.vacunas_catalog_imagen_url ? (
                  <div style={{
                    maxWidth: "900px",
                    width: "100%",
                    borderRadius: "20px",
                    overflow: "hidden",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    border: "1px solid var(--slate-100)"
                  }}>
                    <img 
                      src={heroData.vacunas_catalog_imagen_url} 
                      alt={inventarioTitulo} 
                      style={{ width: "100%", height: "auto", display: "block" }} 
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-400)", border: "2px dashed var(--slate-200)", borderRadius: "16px", width: "100%" }}>
                    <p>La imagen del catálogo no ha sido cargada aún por el administrador.</p>
                  </div>
                )}
              </div>
            )}

            {/* PDF Catalog */}
            {heroData.vacunas_catalog_tipo === "pdf" && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
                {heroData.vacunas_catalog_pdf_url ? (
                  <div style={{
                    maxWidth: "600px",
                    width: "100%",
                    background: "white",
                    border: "1px solid var(--slate-200)",
                    borderRadius: "24px",
                    padding: "48px 32px",
                    textAlign: "center",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.04)"
                  }}>
                    <div style={{
                      width: "80px", height: "80px",
                      background: "rgba(16,185,129,0.1)",
                      borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "36px",
                      margin: "0 auto 24px"
                    }}>📄</div>
                    <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "12px", fontFamily: "Outfit, sans-serif" }}>
                      Documento Informativo / Catálogo Completo
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--slate-500)", lineHeight: 1.6, marginBottom: "32px" }}>
                      Descargue o visualice el catálogo detallado con toda la información sobre nuestros productos, servicios y tratamientos.
                    </p>
                    <a 
                      href={heroData.vacunas_catalog_pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-emerald" 
                      style={{ display: "inline-flex", padding: "14px 28px" }}
                    >
                      Descargar Catálogo (PDF)
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: "8px" }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                      </svg>
                    </a>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-400)", border: "2px dashed var(--slate-200)", borderRadius: "16px", width: "100%" }}>
                    <p>El documento PDF del catálogo no ha sido cargado aún por el administrador.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── CUSTOM DYNAMIC BANNER ─────────────────────────────────── */}
      {heroData.vacunas_mostrar_banner && (
        <section className="section" style={{ background: "var(--slate-50)" }} aria-label={heroData.vacunas_banner_titulo}>
          <div className="container">
            <div style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor}88)`,
              borderRadius: "var(--radius-2xl)", 
              padding: heroData.vacunas_banner_imagen_url ? "40px" : "60px 48px",
              display: "grid", 
              gridTemplateColumns: heroData.vacunas_banner_imagen_url ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr auto", 
              gap: "40px", 
              alignItems: "center",
              overflow: "hidden"
            }}>
              <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
                {heroData.vacunas_banner_badge && (
                  <span className="badge mb-4" style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)", color: "white", display: "inline-flex", marginBottom: "16px", width: "fit-content" }}>
                    {heroData.vacunas_banner_badge}
                  </span>
                )}
                <h2 style={{ fontSize: "28px", fontWeight: 900, color: "white", marginBottom: "12px", fontFamily: "Outfit, sans-serif" }}>
                  {heroData.vacunas_banner_titulo}
                </h2>
                <p style={{ color: "rgba(255,255,255,.8)", fontSize: "15px", lineHeight: 1.7, maxWidth: "520px", marginBottom: "24px" }}>
                  {heroData.vacunas_banner_desc}
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {(heroData.vacunas_banner_btn_text || !heroData.vacunas_banner_btn_2_text) && (
                    <a href={heroData.vacunas_banner_btn_url || chatUrl} target="_blank" rel="noopener noreferrer" className="btn btn-emerald" style={{ whiteSpace: "nowrap" }}>
                      {heroData.vacunas_banner_btn_text || "Agendar Cita"}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: "6px" }}>
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </a>
                  )}
                  {heroData.vacunas_banner_btn_2_text && (
                    <a href={heroData.vacunas_banner_btn_2_url || "#"} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ whiteSpace: "nowrap", border: "1px solid rgba(255,255,255,0.4)", color: "white" }}>
                      {heroData.vacunas_banner_btn_2_text}
                    </a>
                  )}
                </div>
              </div>
              
              {heroData.vacunas_banner_imagen_url && (
                <div style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center",
                  height: "260px",
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                  background: "rgba(255,255,255,0.05)"
                }}>
                  <img 
                    src={heroData.vacunas_banner_imagen_url} 
                    alt="Promoción" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}


    </>
  );
}
