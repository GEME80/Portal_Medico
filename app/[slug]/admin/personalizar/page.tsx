"use client";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveConfigAction, saveAlertAction } from "./actions";
import { uploadImageAction } from "../noticias/actions";

const TABS = [
  { id: "identidad", label: "👨‍⚕️ Identidad", desc: "Logo, nombre, clínica" },
  { id: "contacto", label: "📞 Contacto y Redes", desc: "Datos generales y chat" },
  { id: "foto", label: "📸 Foto del Doctor", desc: "Imagen principal del Home" },
  { id: "hero", label: "🖼️ Config. del Home", desc: "Textos, bio, SEO, estilos" },
  { id: "investigacion", label: "🔬 Líneas Invest.", desc: "Gestor de tarjetas" },
  { id: "trayectoria", label: "🎓 Trayectoria", desc: "Hitos académicos" },
  { id: "adicional", label: "⚙️ Pestaña Extra", desc: "Menú público de portafolio" },
];

interface Config {
  nombre_doctor: string; titulo_doctor: string; especialidad: string;
  nombre_clinica: string; logo_url: string; foto_url?: string; bio_corta: string; bio_larga: string;
  hero_titulo: string; hero_subtitulo: string; hero_badge_texto: string;
  stat_anos_experiencia: string; stat_publicaciones: string;
  stat_pacientes_anio: string; stat_consultorios: string;
  email: string; telefono: string; whatsapp: string;
  direccion: string; ciudad: string; pais: string;
  linkedin_url: string; instagram_url: string;
  color_primario: string; color_acento: string;
  meta_titulo: string; meta_descripcion: string;
  // new settings:
  habilitar_menu_vacunas?: boolean;
  nombre_menu_vacunas?: string;
  vacunas_hero_titulo?: string;
  vacunas_hero_subtitulo?: string;
  vacunas_hero_descripcion?: string;
  vacunas_mitos_titulo?: string;
  vacunas_inventario_titulo?: string;
}

interface Linea { id: string; icono: string; titulo: string; descripcion: string; orden: number; }
interface Hito  { id: string; anio: string; titulo: string; institucion: string; orden: number; }

interface Props { params: Promise<{ slug: string }> }

export default function PersonalizarPage({ params }: Props) {
  const [slug, setSlug] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [activeTab, setActiveTab] = useState("identidad");
  const [activeSubTab, setActiveSubTab] = useState("textos");
  const [dbKeys, setDbKeys] = useState<string[]>([]);
  const [config, setConfig] = useState<Config>({
    nombre_doctor: "", titulo_doctor: "", especialidad: "",
    nombre_clinica: "", logo_url: "", bio_corta: "", bio_larga: "",
    hero_titulo: "", hero_subtitulo: "", hero_badge_texto: "",
    stat_anos_experiencia: "", stat_publicaciones: "", stat_pacientes_anio: "", stat_consultorios: "",
    email: "", telefono: "", whatsapp: "", direccion: "", ciudad: "", pais: "Colombia",
    linkedin_url: "", instagram_url: "",
    color_primario: "#0A4D5C", color_acento: "#00D4AA",
    meta_titulo: "", meta_descripcion: "",
    habilitar_menu_vacunas: true,
    nombre_menu_vacunas: "EcoVaccine",
    vacunas_hero_titulo: "Vacunas seguras, niños protegidos",
    vacunas_hero_subtitulo: "EcoVaccine — Vacunación Basada en Evidencia",
    vacunas_hero_descripcion: "El doctor responde con evidencia científica los mitos más comunes sobre la vacunación.",
    vacunas_mitos_titulo: "Mitos Vacunales",
    vacunas_inventario_titulo: "Vacunas Disponibles y Esquemas de Aplicación"
  });
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [hitos, setHitos] = useState<Hito[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  // Alertas variables
  const [alertId, setAlertId] = useState<string | null>(null);
  const [alertTitulo, setAlertTitulo] = useState("");
  const [alertDescripcion, setAlertDescripcion] = useState("");
  const [alertNivel, setAlertNivel] = useState<"info" | "warning" | "critical">("warning");
  const [alertActiva, setAlertActiva] = useState(false);

  const supabase = createClient();

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);
      const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", p.slug).single();
      if (!tenant) return;
      setTenantId(tenant.id);

      const [cfgRes, lineasRes, hitosRes, alertRes] = await Promise.all([
        supabase.from("configuracion_portal").select("*").eq("tenant_id", tenant.id).single(),
        supabase.from("lineas_investigacion").select("*").eq("tenant_id", tenant.id).order("orden"),
        supabase.from("hitos_timeline").select("*").eq("tenant_id", tenant.id).order("orden"),
        supabase.from("alertas_epidemiologicas").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      ]);

      if (cfgRes.data) {
        setDbKeys(Object.keys(cfgRes.data));
        setConfig(prev => ({
          ...prev,
          ...cfgRes.data
        }));
      }
      if (lineasRes.data) setLineas(lineasRes.data as Linea[]);
      if (hitosRes.data) setHitos(hitosRes.data as Hito[]);
      
      if (alertRes.data) {
        setAlertId(alertRes.data.id);
        setAlertTitulo(alertRes.data.titulo);
        setAlertDescripcion(alertRes.data.descripcion || "");
        setAlertNivel(alertRes.data.nivel || "warning");
        setAlertActiva(alertRes.data.activa);
      }
      setLoading(false);
    });
  }, []);

  const saveConfig = () => {
    startTransition(async () => {
      // Build payload from known DB keys (excluding reserved keys)
      const payload: Record<string, any> = {};
      const excludedKeys = ["id", "tenant_id", "created_at"];
      if (dbKeys.length > 0) {
        dbKeys.forEach(key => {
          if (key in config && !excludedKeys.includes(key)) {
            payload[key] = (config as any)[key];
          }
        });
      } else {
        // Fallback to safe core columns if dbKeys wasn't populated
        const safeKeys = [
          "nombre_doctor", "titulo_doctor", "especialidad", "foto_url",
          "nombre_clinica", "logo_url", "bio_corta", "bio_larga",
          "hero_titulo", "hero_subtitulo", "hero_badge_texto",
          "stat_anos_experiencia", "stat_publicaciones", "stat_pacientes_anio", "stat_consultorios",
          "email", "telefono", "whatsapp", "direccion", "ciudad", "pais",
          "linkedin_url", "instagram_url", "color_primario", "color_acento",
          "meta_titulo", "meta_descripcion",
          "habilitar_menu_vacunas", "nombre_menu_vacunas",
          "vacunas_hero_titulo", "vacunas_hero_subtitulo", "vacunas_hero_descripcion",
          "vacunas_mitos_titulo", "vacunas_inventario_titulo"
        ];
        safeKeys.forEach(key => {
          if (key in config && !excludedKeys.includes(key)) {
            payload[key] = (config as any)[key];
          }
        });
      }

      // Use server action (admin client) to save — avoids RLS + client 500
      const result = await saveConfigAction(tenantId, slug, payload);
      if (!result.success) {
        showToast("Error al guardar: " + result.error, "error");
      } else {
        showToast("✅ Cambios guardados correctamente");
      }
    });
  };

  const saveLineas = () => {
    startTransition(async () => {
      try {
        for (const l of lineas) {
          if (l.id.startsWith("new-")) {
            await supabase.from("lineas_investigacion").insert({ ...l, id: undefined, tenant_id: tenantId });
          } else {
            await supabase.from("lineas_investigacion").update(l).eq("id", l.id);
          }
        }
        showToast("✅ Líneas de investigación guardadas");
      } catch (err: any) {
        showToast("Error al guardar líneas: " + err.message, "error");
      }
    });
  };

  const saveHitos = () => {
    startTransition(async () => {
      try {
        for (const h of hitos) {
          if (h.id.startsWith("new-")) {
            await supabase.from("hitos_timeline").insert({ ...h, id: undefined, tenant_id: tenantId });
          } else {
            await supabase.from("hitos_timeline").update(h).eq("id", h.id);
          }
        }
        showToast("✅ Trayectoria guardada");
      } catch (err: any) {
        showToast("Error al guardar trayectoria: " + err.message, "error");
      }
    });
  };

  const saveAlert = () => {
    startTransition(async () => {
      const result = await saveAlertAction(tenantId, slug, alertId, {
        titulo: alertTitulo,
        descripcion: alertDescripcion,
        nivel: alertNivel,
        activa: alertActiva,
      });
      if (!result.success) {
        showToast("Error al guardar alerta: " + result.error, "error");
      } else {
        if (result.alertId && !alertId) setAlertId(result.alertId);
        showToast("✅ Alerta epidemiológica guardada correctamente");
      }
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("folder", "logo");

      const res = await uploadImageAction(formData);
      if (!res.success) {
        showToast("Error al subir logo: " + res.error, "error");
        return;
      }

      setConfig(c => ({ ...c, logo_url: res.publicUrl || "" }));
      showToast("✅ Logotipo subido correctamente. Guarde los cambios para aplicar.");
    });
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantId", tenantId);
      formData.append("folder", "foto_doctor");

      const res = await uploadImageAction(formData);
      if (!res.success) {
        showToast("Error al subir foto: " + res.error, "error");
        return;
      }

      setConfig(c => ({ ...c, foto_url: res.publicUrl || "" }));
      showToast("✅ Foto subida correctamente. Guarde los cambios para aplicar.");
    });
  };

  const uid = () => "new-" + Math.random().toString(36).slice(2, 8);

  const parseJSONField = (field: string, defaultObj: any) => {
    try {
      if (field && field.startsWith("{")) return JSON.parse(field);
    } catch (e) {}
    return defaultObj;
  };
  
  const waData = parseJSONField(config.whatsapp, { n: config.whatsapp, t: "w" });
  const heroData = parseJSONField(config.hero_badge_texto, { badge: config.hero_badge_texto, g1_t: "15K+", g1_s: "Pacientes", g2_t: "100%", g2_s: "Seguro" });

  const setWaData = (n: string, t: string) => setConfig(c => ({ ...c, whatsapp: JSON.stringify({ n, t }) }));
  const setHeroData = (k: string, v: string) => setConfig(c => ({ ...c, hero_badge_texto: JSON.stringify({ ...heroData, [k]: v }) }));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "var(--slate-400)" }}>
      Cargando configuración...
    </div>
  );

  return (
    <>
      {/* TOPBAR */}
      <div className="admin-topbar" style={{ position: "sticky", top: 0, zIndex: 30, background: "#fff", borderBottom: "1px solid var(--slate-200)" }}>
        <div>
          <h1 className="admin-topbar-title">🎨 Personalizar Portal</h1>
          <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>
            Edita el contenido y estilo visual de tu sitio público.
          </p>
        </div>
        <div className="admin-topbar-right">
          <button onClick={saveConfig} className="btn btn-primary" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar todo"}
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "24px", alignItems: "start" }}>

          {/* TABS SIDEBAR */}
          <div style={{ background: "white", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-xl)", overflow: "hidden", position: "sticky", top: "88px" }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", flexDirection: "column", width: "100%", padding: "14px 18px",
                  textAlign: "left", border: "none", borderBottom: "1px solid var(--slate-100)",
                  background: activeTab === tab.id ? "rgba(10,77,92,.06)" : "transparent",
                  borderLeft: activeTab === tab.id ? "3px solid var(--teal-700)" : "3px solid transparent",
                  cursor: "pointer", transition: "background .15s", fontFamily: "inherit",
                }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: activeTab === tab.id ? "var(--teal-800)" : "var(--slate-700)" }}>
                  {tab.label}
                </span>
                <span style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "2px" }}>{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* FORM PANEL */}
          <div style={{ background: "white", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>

            {/* ── IDENTIDAD ─────────────────────────────────── */}
            {activeTab === "identidad" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>👨‍⚕️ Identidad de Marca</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Información básica, nombres y logotipos.</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <div className="form-group full-width" style={{ borderBottom: "1px solid var(--slate-100)", paddingBottom: "24px", marginBottom: "8px" }}>
                      <label className="form-label" style={{ fontWeight: 700 }}>Logotipo</label>
                      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" }}>
                        <div style={{ width: "80px", height: "80px", border: "1px dashed var(--slate-300)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)", overflow: "hidden" }}>
                          {config.logo_url ? <img src={config.logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: "28px" }}>🛡️</span>}
                        </div>
                        <div>
                          <input type="file" accept="image/*" id="logo-upload" style={{ display: "none" }} onChange={handleLogoUpload} />
                          <label htmlFor="logo-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "13px", display: "inline-block" }}>{isPending ? "Subiendo..." : "Subir Logotipo"}</label>
                        </div>
                      </div>
                    </div>
                    <Field label="Nombre del doctor *" id="nombre_doctor" value={config.nombre_doctor} onChange={v => setConfig(c => ({ ...c, nombre_doctor: v }))} placeholder="Dr. Carlos Torres Martínez" />
                    <Field label="Título / Especialidad corta *" id="titulo_doctor" value={config.titulo_doctor} onChange={v => setConfig(c => ({ ...c, titulo_doctor: v }))} placeholder="Infectólogo Pediatra" />
                    <Field label="Especialidad completa" id="especialidad" value={config.especialidad} onChange={v => setConfig(c => ({ ...c, especialidad: v }))} placeholder="Infectología Pediátrica y Vacunología Clínica" fullWidth />
                    <Field label="Nombre de la clínica / Consultorio" id="nombre_clinica" value={config.nombre_clinica} onChange={v => setConfig(c => ({ ...c, nombre_clinica: v }))} placeholder="EcoVaccine Medical" fullWidth />
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── CONTACTO Y REDES ─────────────────────────────────── */}
            {activeTab === "contacto" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>📞 Información de Contacto</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Datos públicos para comunicación con pacientes.</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <Field label="Email público" id="email" value={config.email} onChange={v => setConfig(c => ({ ...c, email: v }))} placeholder="doctor@clinica.com" type="email" />
                    <Field label="Teléfono (fijo o principal)" id="telefono" value={config.telefono} onChange={v => setConfig(c => ({ ...c, telefono: v }))} placeholder="+57 300 000 0000" type="tel" />
                    <Field label="Dirección del consultorio" id="direccion" value={config.direccion} onChange={v => setConfig(c => ({ ...c, direccion: v }))} placeholder="Cra 7 # 32-16, Consultorio 401" fullWidth />
                    <Field label="Ciudad" id="ciudad" value={config.ciudad} onChange={v => setConfig(c => ({ ...c, ciudad: v }))} placeholder="Bogotá" />
                    <Field label="País" id="pais" value={config.pais} onChange={v => setConfig(c => ({ ...c, pais: v }))} placeholder="Colombia" />
                    
                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Chat Directo</h3>
                    <div className="form-group full-width" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label className="form-label">Canal de Atención</label>
                        <select className="form-input" value={waData.t} onChange={e => setWaData(waData.n, e.target.value)} style={{ background: "white" }}>
                          <option value="w">WhatsApp</option>
                          <option value="t">Telegram</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Número / Usuario de contacto</label>
                        <input className="form-input" value={waData.n} onChange={e => setWaData(e.target.value, waData.t)} placeholder="+57300... o @usuario" />
                      </div>
                    </div>

                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Redes Sociales Profesionales</h3>
                    <Field label="LinkedIn URL" id="linkedin" value={config.linkedin_url} onChange={v => setConfig(c => ({ ...c, linkedin_url: v }))} placeholder="https://linkedin.com/in/..." fullWidth />
                    <Field label="Instagram URL" id="instagram" value={config.instagram_url} onChange={v => setConfig(c => ({ ...c, instagram_url: v }))} placeholder="https://instagram.com/..." fullWidth />
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── FOTO DEL DOCTOR ─────────────────────────────────── */}
            {activeTab === "foto" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>📸 Foto Principal</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Esta será la imagen principal que verá el paciente al ingresar al inicio (Home) de tu portal.</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none", display: "flex", flexDirection: "column", gap: "24px", alignItems: "center", padding: "40px 24px" }}>
                  <div style={{ width: "300px", height: "300px", border: "2px dashed var(--slate-300)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)", overflow: "hidden", position: "relative" }}>
                    {config.foto_url ? (
                      <img src={config.foto_url} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ textAlign: "center", color: "var(--slate-400)" }}>
                        <span style={{ fontSize: "48px" }}>👨‍⚕️</span>
                        <p style={{ marginTop: "12px", fontSize: "13px", fontWeight: 600 }}>Sin foto subida</p>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <input type="file" accept="image/*" id="foto-upload-main" style={{ display: "none" }} onChange={handleFotoUpload} />
                    <label htmlFor="foto-upload-main" className="btn btn-primary" style={{ cursor: "pointer", fontSize: "14px", padding: "12px 32px" }}>
                      {isPending ? "Subiendo..." : "Actualizar Foto"}
                    </label>
                    <p style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "12px" }}>Formatos recomendados: JPG, PNG. Relación de aspecto vertical u orientada al centro.</p>
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── HERO Y CONFIGURACION DEL HOME ──────────────────────── */}
            {activeTab === "hero" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ padding: "24px 28px 0 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🖼️ Configuración del Home (Hero)</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px", marginBottom: "16px" }}>Administra los textos, estadísticas, biografías y estilos que componen la portada de tu portal.</p>
                  
                  {/* Subtabs */}
                  <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid transparent", overflowX: "auto" }}>
                    {[{id: "textos", label: "Textos y Globos"}, {id: "estadisticas", label: "Estadísticas"}, {id: "biografia", label: "Biografía"}, {id: "seo", label: "SEO"}, {id: "estilos", label: "Estilos y Alerta"}].map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setActiveSubTab(sub.id)}
                        style={{
                          padding: "10px 16px",
                          background: activeSubTab === sub.id ? "var(--slate-100)" : "transparent",
                          border: "none",
                          borderTopLeftRadius: "8px", borderTopRightRadius: "8px",
                          fontSize: "13px", fontWeight: 700,
                          color: activeSubTab === sub.id ? "var(--slate-900)" : "var(--slate-500)",
                          cursor: "pointer", transition: "background .2s, color .2s"
                        }}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-body" style={{ maxHeight: "none", flex: 1 }}>
                  {activeSubTab === "textos" && (
                    <div className="form-grid">
                      <Field label="Texto del badge superior" id="hero_badge" value={heroData.badge} onChange={v => setHeroData("badge", v)} placeholder="Infectólogo · +30 años de experiencia" fullWidth />
                      <Field label="Título principal del Hero" id="hero_titulo" value={config.hero_titulo} onChange={v => setConfig(c => ({ ...c, hero_titulo: v }))} placeholder="Ciencia, prevención y cuidado para cada familia" fullWidth />
                      
                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Mensajes Flotantes (Globos)</h3>
                      <div className="form-group full-width" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--slate-50)", padding: "16px", borderRadius: "12px" }}>
                        <Field label="Globo 1: Título" id="g1_t" value={heroData.g1_t} onChange={v => setHeroData("g1_t", v)} placeholder="15K+" />
                        <Field label="Globo 1: Subtítulo" id="g1_s" value={heroData.g1_s} onChange={v => setHeroData("g1_s", v)} placeholder="Pacientes" />
                        <Field label="Globo 2: Título" id="g2_t" value={heroData.g2_t} onChange={v => setHeroData("g2_t", v)} placeholder="100%" />
                        <Field label="Globo 2: Subtítulo" id="g2_s" value={heroData.g2_s} onChange={v => setHeroData("g2_s", v)} placeholder="Seguro" />
                      </div>
                    </div>
                  )}

                  {activeSubTab === "estadisticas" && (
                    <div className="form-grid">
                      <Field label="Años de experiencia" id="stat_anos" value={config.stat_anos_experiencia} onChange={v => setConfig(c => ({ ...c, stat_anos_experiencia: v }))} placeholder="30+" />
                      <Field label="Publicaciones científicas" id="stat_pub" value={config.stat_publicaciones} onChange={v => setConfig(c => ({ ...c, stat_publicaciones: v }))} placeholder="50+" />
                      <Field label="Pacientes al año" id="stat_pac" value={config.stat_pacientes_anio} onChange={v => setConfig(c => ({ ...c, stat_pacientes_anio: v }))} placeholder="2,000+" />
                      <Field label="Consultorios / Clínicas" id="stat_cons" value={config.stat_consultorios} onChange={v => setConfig(c => ({ ...c, stat_consultorios: v }))} placeholder="3" />
                    </div>
                  )}

                  {activeSubTab === "biografia" && (
                    <div className="form-grid">
                      <div className="form-group full-width" style={{ marginBottom: "16px" }}>
                        <label className="form-label" htmlFor="bio_corta">Biografía corta (aparece en la portada principal)</label>
                        <textarea id="bio_corta" className="form-textarea" value={config.bio_corta} onChange={e => setConfig(c => ({ ...c, bio_corta: e.target.value }))} placeholder="Infectólogo Pediatra con más de 30 años de experiencia..." rows={3} style={{ background: "var(--slate-50)" }} />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label" htmlFor="bio_larga">Biografía extensa (página "Sobre el Doctor")</label>
                        <textarea id="bio_larga" className="form-textarea" value={config.bio_larga} onChange={e => setConfig(c => ({ ...c, bio_larga: e.target.value }))} rows={6} placeholder="Descripción detallada de tu labor médica..." style={{ background: "var(--slate-50)" }} />
                      </div>
                    </div>
                  )}

                  {activeSubTab === "seo" && (
                    <div className="form-grid">
                      <div className="form-group full-width" style={{ marginBottom: "16px" }}>
                        <p style={{ fontSize: "13px", color: "var(--slate-500)", marginBottom: "16px" }}>Estos datos optimizan cómo te ven los pacientes cuando buscan en Google.</p>
                        <Field label="Meta título (Título en Google)" id="meta_titulo" value={config.meta_titulo} onChange={v => setConfig(c => ({ ...c, meta_titulo: v }))} placeholder="Dr. Torres — Infectólogo Pediatra | EcoVaccine" fullWidth />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label" htmlFor="meta_desc">Meta descripción (Resumen en Google)</label>
                        <textarea id="meta_desc" className="form-textarea" value={config.meta_descripcion} onChange={e => setConfig(c => ({ ...c, meta_descripcion: e.target.value }))} rows={3} placeholder="Describe el portal en 155 caracteres para mejorar tu SEO..." />
                      </div>
                    </div>
                  )}

                  {activeSubTab === "estilos" && (
                    <div className="form-grid">
                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Paleta de Colores</h3>
                      <div className="form-group">
                        <label className="form-label">Color Primario (Fondos y menú)</label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input type="color" value={config.color_primario} onChange={e => setConfig(c => ({ ...c, color_primario: e.target.value }))} style={{ width: "44px", height: "44px", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-sm)", cursor: "pointer", padding: 0 }} />
                          <span style={{ fontSize: "13px", color: "var(--slate-600)", fontFamily: "monospace" }}>{config.color_primario}</span>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Color de Acento (Botones y enlaces)</label>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <input type="color" value={config.color_acento} onChange={e => setConfig(c => ({ ...c, color_acento: e.target.value }))} style={{ width: "44px", height: "44px", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-sm)", cursor: "pointer", padding: 0 }} />
                          <span style={{ fontSize: "13px", color: "var(--slate-600)", fontFamily: "monospace" }}>{config.color_acento}</span>
                        </div>
                      </div>

                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "24px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Banner de Alerta Epidemiológica</h3>
                      <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input type="checkbox" id="alert_activa" checked={alertActiva} onChange={e => setAlertActiva(e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                        <label htmlFor="alert_activa" style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-900)", cursor: "pointer" }}>Mostrar banner de alerta en todo el portal público</label>
                      </div>
                      <Field label="Título de la alerta *" id="alert_titulo" value={alertTitulo} onChange={setAlertTitulo} placeholder="Ej: Brote de Sarampión" fullWidth />
                      <div className="form-group full-width">
                        <label className="form-label" htmlFor="alert_descripcion">Descripción detallada</label>
                        <textarea id="alert_descripcion" className="form-textarea" value={alertDescripcion} onChange={e => setAlertDescripcion(e.target.value)} placeholder="Recomendaciones..." rows={2} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="alert_nivel">Nivel de Alerta</label>
                        <select id="alert_nivel" className="form-input" value={alertNivel} onChange={e => setAlertNivel(e.target.value as any)} style={{ height: "46px", background: "white", cursor: "pointer" }}>
                          <option value="info">🔵 Informativa</option>
                          <option value="warning">🟡 Advertencia</option>
                          <option value="critical">🔴 Peligro Inminente</option>
                        </select>
                      </div>
                      
                      <div style={{ gridColumn: "1 / -1", marginTop: "16px" }}>
                        <button type="button" className="btn btn-outline" onClick={saveAlert} disabled={isPending}>Guardar alerta y activarla</button>
                      </div>
                    </div>
                  )}
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── LÍNEAS DE INVESTIGACIÓN ───────────────────── */}
            {activeTab === "investigacion" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🔬 Líneas de Investigación</h2>
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Tarjetas que aparecen destacadas en el Home.</p>
                  </div>
                  <button type="button" className="btn btn-emerald" style={{ fontSize: "13px" }} onClick={() => setLineas(l => [...l, { id: uid(), icono: "🔬", titulo: "", descripcion: "", orden: l.length + 1 }])}>＋ Agregar Línea</button>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  {lineas.length === 0 && <div className="empty-state"><div className="empty-state-icon">🔬</div><div className="empty-state-title">No has agregado líneas de investigación</div></div>}
                  {lineas.map((l, i) => (
                    <div key={l.id} style={{ border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Ícono (Emoji)</label>
                          <input className="form-input" value={l.icono} onChange={e => setLineas(ls => ls.map((x, j) => j === i ? { ...x, icono: e.target.value } : x))} placeholder="🔬" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Título *</label>
                          <input className="form-input" value={l.titulo} onChange={e => setLineas(ls => ls.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x))} placeholder="Vacunología Clínica" required />
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label">Breve Descripción</label>
                          <textarea className="form-textarea" value={l.descripcion} onChange={e => setLineas(ls => ls.map((x, j) => j === i ? { ...x, descripcion: e.target.value } : x))} rows={2} />
                        </div>
                      </div>
                      <button type="button" className="action-btn action-btn-danger" style={{ marginTop: "8px" }} onClick={() => setLineas(ls => ls.filter((_, j) => j !== i))}>🗑 Eliminar Tarjeta</button>
                    </div>
                  ))}
                </div>
                <SaveBar onSave={saveLineas} isPending={isPending} label="Guardar líneas de investigación" />
              </div>
            )}

            {/* ── TRAYECTORIA ACADÉMICA ──────────────────────────────────── */}
            {activeTab === "trayectoria" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🎓 Trayectoria Académica</h2>
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Hitos cronológicos que aparecen en tu línea de tiempo.</p>
                  </div>
                  <button type="button" className="btn btn-emerald" style={{ fontSize: "13px" }} onClick={() => setHitos(h => [...h, { id: uid(), anio: "", titulo: "", institucion: "", orden: h.length + 1 }])}>＋ Agregar Hito</button>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  {hitos.length === 0 && <div className="empty-state"><div className="empty-state-icon">🎓</div><div className="empty-state-title">Sin hitos registrados</div></div>}
                  {hitos.map((h, i) => (
                    <div key={h.id} style={{ border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Año *</label>
                          <input className="form-input" value={h.anio} onChange={e => setHitos(hs => hs.map((x, j) => j === i ? { ...x, anio: e.target.value } : x))} placeholder="2002" inputMode="numeric" required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Título *</label>
                          <input className="form-input" value={h.titulo} onChange={e => setHitos(hs => hs.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x))} placeholder="Fellowship en Infectología" required />
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label">Institución</label>
                          <input className="form-input" value={h.institucion} onChange={e => setHitos(hs => hs.map((x, j) => j === i ? { ...x, institucion: e.target.value } : x))} placeholder="Hospital Garrahan, Buenos Aires" />
                        </div>
                      </div>
                      <button type="button" className="action-btn action-btn-danger" style={{ marginTop: "8px" }} onClick={() => setHitos(hs => hs.filter((_, j) => j !== i))}>🗑 Eliminar Hito</button>
                    </div>
                  ))}
                </div>
                <SaveBar onSave={saveHitos} isPending={isPending} label="Guardar hitos de trayectoria" />
              </div>
            )}

            {/* ── PESTAÑA EXTRA (INVENTARIO/VACUNAS) ────────────────────── */}
            {activeTab === "adicional" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>⚙️ Pestaña de Servicios o Vacunas</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Habilita y personaliza la página secundaria (donde se exponen tus inventarios y servicios públicos).</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", background: "var(--emerald-50)", border: "1px solid var(--emerald-200)", borderRadius: "var(--radius-lg)" }}>
                      <input type="checkbox" id="habilitar_menu_vacunas" checked={config.habilitar_menu_vacunas !== false} onChange={e => setConfig(c => ({ ...c, habilitar_menu_vacunas: e.target.checked }))} style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                      <label htmlFor="habilitar_menu_vacunas" style={{ fontSize: "15px", fontWeight: 700, color: "var(--emerald-900)", cursor: "pointer" }}>Habilitar página de "Vacunas/Servicios" en el menú público</label>
                    </div>

                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Configuración del Menú y Portada</h3>
                    <Field label="Nombre del botón en el menú de navegación *" id="nombre_menu_vacunas" value={config.nombre_menu_vacunas || "EcoVaccine"} onChange={v => setConfig(c => ({ ...c, nombre_menu_vacunas: v }))} placeholder="EcoVaccine, Servicios, Tratamientos, etc." fullWidth />
                    <Field label="Título principal de la página *" id="vacunas_hero_titulo" value={config.vacunas_hero_titulo || "Vacunas seguras, niños protegidos"} onChange={v => setConfig(c => ({ ...c, vacunas_hero_titulo: v }))} placeholder="Vacunas seguras, niños protegidos" fullWidth />
                    <Field label="Subtítulo de la página *" id="vacunas_hero_subtitulo" value={config.vacunas_hero_subtitulo || "EcoVaccine — Vacunación Basada en Evidencia"} onChange={v => setConfig(c => ({ ...c, vacunas_hero_subtitulo: v }))} placeholder="EcoVaccine — Vacunación Basada en Evidencia" fullWidth />
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="vacunas_hero_descripcion">Descripción detallada</label>
                      <textarea id="vacunas_hero_descripcion" className="form-textarea" value={config.vacunas_hero_descripcion || ""} onChange={e => setConfig(c => ({ ...c, vacunas_hero_descripcion: e.target.value }))} placeholder="Descripción de los servicios de vacunación o procedimientos..." rows={3} />
                    </div>

                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Títulos de Secciones</h3>
                    <Field label="Título para la sección de Preguntas/Mitos *" id="vacunas_mitos_titulo" value={config.vacunas_mitos_titulo || "Mitos Vacunales"} onChange={v => setConfig(c => ({ ...c, vacunas_mitos_titulo: v }))} placeholder="Mitos Vacunales, Preguntas Frecuentes, etc." />
                    <Field label="Título para la tabla de Catálogo/Inventario *" id="vacunas_inventario_titulo" value={config.vacunas_inventario_titulo || "Vacunas Disponibles y Esquemas de Aplicación"} onChange={v => setConfig(c => ({ ...c, vacunas_inventario_titulo: v }))} placeholder="Procedimientos Disponibles, Portafolio, etc." />
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}
          </div>
        </div>
      </div>

{/* TOAST */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type === "success" ? "success" : "error"}`}>
            {toast.msg}
          </div>
        </div>
      )}
    </>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────
function Field({ label, id, value, onChange, placeholder, type = "text", fullWidth = false }: {
  label: string; id: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
  type?: string; fullWidth?: boolean;
}) {
  return (
    <div className={`form-group${fullWidth ? " full-width" : ""}`}>
      <label className="form-label" htmlFor={id}>{label}</label>
      <input id={id} type={type} className="form-input" value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
    </div>
  );
}

function SaveBar({ onSave, isPending, label = "Guardar cambios" }: {
  onSave: () => void; isPending: boolean; label?: string;
}) {
  return (
    <div style={{ padding: "16px 28px", borderTop: "1px solid var(--slate-200)", background: "var(--slate-50)", display: "flex", justifyContent: "flex-end" }}>
      <button type="button" className="btn btn-primary" onClick={onSave} disabled={isPending} style={{ minWidth: "160px" }}>
        {isPending ? "Guardando..." : `✓ ${label}`}
      </button>
    </div>
  );
}
