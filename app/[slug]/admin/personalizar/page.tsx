"use client";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveConfigAction, saveAlertAction } from "./actions";
import { uploadImageAction } from "../noticias/actions";

const TABS = [
  { id: "identidad",     label: "👨‍⚕️ Identidad",      desc: "Logo, doctor y clínica" },
  { id: "hero",          label: "🖼️ Hero",             desc: "Sección principal" },
  { id: "stats",         label: "📊 Estadísticas",     desc: "Contadores del home" },
  { id: "contacto",      label: "📞 Contacto",          desc: "Email, teléfono, ciudad" },
  { id: "especialidad",  label: "💉 Menú / Especialidad", desc: "Configurar EcoVaccine" },
  { id: "alertas",       label: "🔔 Alerta Global",    desc: "Banner de aviso" },
  { id: "investigacion", label: "🔬 Investigación",     desc: "Líneas de investigación" },
  { id: "timeline",      label: "🎓 Trayectoria",       desc: "Hitos académicos" },
];

interface Config {
  nombre_doctor: string; titulo_doctor: string; especialidad: string;
  nombre_clinica: string; logo_url: string; bio_corta: string; bio_larga: string;
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

  const uid = () => "new-" + Math.random().toString(36).slice(2, 8);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "var(--slate-400)" }}>
      Cargando configuración...
    </div>
  );

  return (
    <>
      {/* TOPBAR */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-topbar-title">🎨 Personalizar Portal</h1>
          <p style={{ fontSize: "12px", color: "var(--slate-50)", marginTop: "2px" }}>
            Edita cómo se ve tu portal público en{" "}
            <a href={`/${slug}`} target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--teal-600)", textDecoration: "underline" }}>
              /{slug}
            </a>
          </p>
        </div>
        <div className="admin-topbar-right">
          <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: "13px" }}>
            👁 Ver portal
          </a>
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
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>👨‍⚕️ Identidad del Doctor y Clínica</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Esta información aparece en el hero y en la sección "Sobre el Doctor".</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    {/* Logo upload field */}
                    <div className="form-group full-width" style={{ borderBottom: "1px solid var(--slate-100)", paddingBottom: "24px", marginBottom: "8px" }}>
                      <label className="form-label" style={{ fontWeight: 700 }}>Logo de la Clínica o Doctor</label>
                      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" }}>
                        <div style={{
                          width: "80px", height: "80px",
                          border: "1px dashed var(--slate-300)",
                          borderRadius: "12px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "var(--slate-50)", overflow: "hidden"
                        }}>
                          {config.logo_url ? (
                            <img src={config.logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: "28px" }}>🛡️</span>
                          )}
                        </div>
                        <div>
                          <input type="file" accept="image/*" id="logo-upload" style={{ display: "none" }} onChange={handleLogoUpload} />
                          <label htmlFor="logo-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "13px", display: "inline-block" }}>
                            {isPending ? "Subiendo..." : "Subir Logotipo"}
                          </label>
                          <p style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "6px" }}>Formatos recomendados: PNG o SVG con fondo transparente. Máx 500KB.</p>
                        </div>
                      </div>
                    </div>

                    <Field label="Nombre del doctor *" id="nombre_doctor" value={config.nombre_doctor} onChange={v => setConfig(c => ({ ...c, nombre_doctor: v }))} placeholder="Dr. Carlos Torres Martínez" />
                    <Field label="Título / Especialidad corta *" id="titulo_doctor" value={config.titulo_doctor} onChange={v => setConfig(c => ({ ...c, titulo_doctor: v }))} placeholder="Infectólogo Pediatra" />
                    <Field label="Especialidad completa" id="especialidad" value={config.especialidad} onChange={v => setConfig(c => ({ ...c, especialidad: v }))} placeholder="Infectología Pediátrica y Vacunología Clínica" />
                    <Field label="Nombre de la clínica" id="nombre_clinica" value={config.nombre_clinica} onChange={v => setConfig(c => ({ ...c, nombre_clinica: v }))} placeholder="EcoVaccine Medical" />
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="bio_corta">Biografía corta (aparece en el hero)</label>
                      <textarea id="bio_corta" className="form-textarea" value={config.bio_corta}
                        onChange={e => setConfig(c => ({ ...c, bio_corta: e.target.value }))}
                        placeholder="Infectólogo Pediatra con más de 30 años de experiencia..." rows={3} />
                    </div>
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="bio_larga">Biografía completa (página Sobre el Doctor)</label>
                      <textarea id="bio_larga" className="form-textarea" value={config.bio_larga}
                        onChange={e => setConfig(c => ({ ...c, bio_larga: e.target.value }))}
                        rows={5} placeholder="Descripción detallada..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Color primario</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={config.color_primario}
                          onChange={e => setConfig(c => ({ ...c, color_primario: e.target.value }))}
                          style={{ width: "44px", height: "44px", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-sm)", cursor: "pointer" }} />
                        <span style={{ fontSize: "13px", color: "var(--slate-600)", fontFamily: "monospace" }}>{config.color_primario}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Color de acento</label>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input type="color" value={config.color_acento}
                          onChange={e => setConfig(c => ({ ...c, color_acento: e.target.value }))}
                          style={{ width: "44px", height: "44px", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-sm)", cursor: "pointer" }} />
                        <span style={{ fontSize: "13px", color: "var(--slate-600)", fontFamily: "monospace" }}>{config.color_acento}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── HERO ──────────────────────────────────────── */}
            {activeTab === "hero" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🖼️ Sección Hero (portada)</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>El texto grande que ven los visitantes al entrar al portal.</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <Field label="Texto del badge (credencial)" id="hero_badge" value={config.hero_badge_texto} onChange={v => setConfig(c => ({ ...c, hero_badge_texto: v }))} placeholder="Infectólogo · +30 años de experiencia" fullWidth />
                    <Field label="Título principal del hero" id="hero_titulo" value={config.hero_titulo} onChange={v => setConfig(c => ({ ...c, hero_titulo: v }))} placeholder="Ciencia, prevención y cuidado para cada familia" fullWidth />
                    <Field label="Subtítulo / acento (aparece en color)" id="hero_sub" value={config.hero_subtitulo} onChange={v => setConfig(c => ({ ...c, hero_subtitulo: v }))} placeholder="Vacunación basada en evidencia" fullWidth />
                    <Field label="Meta título (SEO)" id="meta_titulo" value={config.meta_titulo} onChange={v => setConfig(c => ({ ...c, meta_titulo: v }))} placeholder="Dr. Torres — Infectólogo Pediatra | EcoVaccine" fullWidth />
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="meta_desc">Meta descripción (SEO)</label>
                      <textarea id="meta_desc" className="form-textarea" value={config.meta_descripcion}
                        onChange={e => setConfig(c => ({ ...c, meta_descripcion: e.target.value }))}
                        rows={3} placeholder="Describe el portal en 155 caracteres para Google..." />
                      <span className="form-hint">{config.meta_descripcion.length}/155 caracteres</span>
                    </div>
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── STATS ─────────────────────────────────────── */}
            {activeTab === "stats" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>📊 Estadísticas del Hero</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Los 4 contadores que aparecen en el hero. Usa texto como "30+" o "2,000+".</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <Field label="Años de experiencia" id="stat_anos" value={config.stat_anos_experiencia} onChange={v => setConfig(c => ({ ...c, stat_anos_experiencia: v }))} placeholder="30+" />
                    <Field label="Publicaciones científicas" id="stat_pub" value={config.stat_publicaciones} onChange={v => setConfig(c => ({ ...c, stat_publicaciones: v }))} placeholder="50+" />
                    <Field label="Pacientes al año" id="stat_pac" value={config.stat_pacientes_anio} onChange={v => setConfig(c => ({ ...c, stat_pacientes_anio: v }))} placeholder="2,000+" />
                    <Field label="Consultorios" id="stat_cons" value={config.stat_consultorios} onChange={v => setConfig(c => ({ ...c, stat_consultorios: v }))} placeholder="3" />
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── CONTACTO ──────────────────────────────────── */}
            {activeTab === "contacto" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>📞 Información de Contacto</h2>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <Field label="Email" id="email" value={config.email} onChange={v => setConfig(c => ({ ...c, email: v }))} placeholder="doctor@clinica.com" type="email" />
                    <Field label="Teléfono" id="telefono" value={config.telefono} onChange={v => setConfig(c => ({ ...c, telefono: v }))} placeholder="+57 300 000 0000" type="tel" />
                    <Field label="WhatsApp" id="whatsapp" value={config.whatsapp} onChange={v => setConfig(c => ({ ...c, whatsapp: v }))} placeholder="+57 300 000 0000" type="tel" />
                    <Field label="Ciudad" id="ciudad" value={config.ciudad} onChange={v => setConfig(c => ({ ...c, ciudad: v }))} placeholder="Bogotá" />
                    <Field label="País" id="pais" value={config.pais} onChange={v => setConfig(c => ({ ...c, pais: v }))} placeholder="Colombia" />
                    <Field label="Dirección" id="direccion" value={config.direccion} onChange={v => setConfig(c => ({ ...c, direccion: v }))} placeholder="Cra 7 # 32-16, Consultorio 401" fullWidth />
                    <Field label="LinkedIn URL" id="linkedin" value={config.linkedin_url} onChange={v => setConfig(c => ({ ...c, linkedin_url: v }))} placeholder="https://linkedin.com/in/..." fullWidth />
                    <Field label="Instagram URL" id="instagram" value={config.instagram_url} onChange={v => setConfig(c => ({ ...c, instagram_url: v }))} placeholder="https://instagram.com/..." fullWidth />
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── MENÚ / ESPECIALIDAD ──────────────────────── */}
            {activeTab === "especialidad" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>💉 Pestaña de Especialidad (EcoVaccine / Servicios)</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Configura la pestaña de inventario de acuerdo a tu especialidad médica.</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input 
                        type="checkbox" 
                        id="habilitar_menu_vacunas" 
                        checked={config.habilitar_menu_vacunas !== false} 
                        onChange={e => setConfig(c => ({ ...c, habilitar_menu_vacunas: e.target.checked }))}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <label htmlFor="habilitar_menu_vacunas" style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-900)", cursor: "pointer" }}>
                        Habilitar pestaña de portafolio / inventario pública
                      </label>
                    </div>

                    <Field 
                      label="Nombre de la pestaña en el menú *" 
                      id="nombre_menu_vacunas" 
                      value={config.nombre_menu_vacunas || "EcoVaccine"} 
                      onChange={v => setConfig(c => ({ ...c, nombre_menu_vacunas: v }))} 
                      placeholder="EcoVaccine, Servicios, Tratamientos, etc." 
                      fullWidth 
                    />
                    <Field 
                      label="Título Hero de la página *" 
                      id="vacunas_hero_titulo" 
                      value={config.vacunas_hero_titulo || "Vacunas seguras, niños protegidos"} 
                      onChange={v => setConfig(c => ({ ...c, vacunas_hero_titulo: v }))} 
                      placeholder="Vacunas seguras, niños protegidos" 
                      fullWidth 
                    />
                    <Field 
                      label="Subtítulo Hero de la página *" 
                      id="vacunas_hero_subtitulo" 
                      value={config.vacunas_hero_subtitulo || "EcoVaccine — Vacunación Basada en Evidencia"} 
                      onChange={v => setConfig(c => ({ ...c, vacunas_hero_subtitulo: v }))} 
                      placeholder="EcoVaccine — Vacunación Basada en Evidencia" 
                      fullWidth 
                    />
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="vacunas_hero_descripcion">Descripción Hero de la página</label>
                      <textarea 
                        id="vacunas_hero_descripcion" 
                        className="form-textarea" 
                        value={config.vacunas_hero_descripcion || ""} 
                        onChange={e => setConfig(c => ({ ...c, vacunas_hero_descripcion: e.target.value }))}
                        placeholder="Descripción detallada de la página de portafolio..." 
                        rows={3} 
                      />
                    </div>
                    <Field 
                      label="Título de la sección de preguntas/mitos *" 
                      id="vacunas_mitos_titulo" 
                      value={config.vacunas_mitos_titulo || "Mitos Vacunales"} 
                      onChange={v => setConfig(c => ({ ...c, vacunas_mitos_titulo: v }))} 
                      placeholder="Mitos Vacunales, Preguntas Frecuentes, etc." 
                      fullWidth 
                    />
                    <Field 
                      label="Título de la sección de disponibilidad/esquemas *" 
                      id="vacunas_inventario_titulo" 
                      value={config.vacunas_inventario_titulo || "Vacunas Disponibles y Esquemas de Aplicación"} 
                      onChange={v => setConfig(c => ({ ...c, vacunas_inventario_titulo: v }))} 
                      placeholder="Procedimientos Disponibles, Portafolio, etc." 
                      fullWidth 
                    />
                  </div>
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── ALERTA EPIDEMIOLÓGICA ──────────────────────── */}
            {activeTab === "alertas" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🔔 Alerta Epidemiológica Global</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Configura un banner de advertencia epidemiológica que se muestra globalmente debajo del menú.</p>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  <div className="form-grid">
                    <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input 
                        type="checkbox" 
                        id="alert_activa" 
                        checked={alertActiva} 
                        onChange={e => setAlertActiva(e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                      <label htmlFor="alert_activa" style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-900)", cursor: "pointer" }}>
                        Activar banner de alerta global en el portal
                      </label>
                    </div>

                    <Field 
                      label="Título de la alerta *" 
                      id="alert_titulo" 
                      value={alertTitulo} 
                      onChange={setAlertTitulo} 
                      placeholder="Ej: Brote de Sarampión registrado en la región Andina" 
                      fullWidth 
                    />

                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="alert_descripcion">Descripción detallada</label>
                      <textarea 
                        id="alert_descripcion" 
                        className="form-textarea" 
                        value={alertDescripcion}
                        onChange={e => setAlertDescripcion(e.target.value)}
                        placeholder="Recomendaciones para los pacientes, síntomas sospechosos, etc." 
                        rows={3} 
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="alert_nivel">Nivel de Alerta</label>
                      <select 
                        id="alert_nivel" 
                        className="form-input" 
                        value={alertNivel} 
                        onChange={e => setAlertNivel(e.target.value as any)}
                        style={{ height: "46px", background: "white", cursor: "pointer" }}
                      >
                        <option value="info">🔵 Informativa (Info)</option>
                        <option value="warning">🟡 Advertencia (Warning)</option>
                        <option value="critical">🔴 Peligro Inminente (Critical)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <SaveBar onSave={saveAlert} isPending={isPending} label="Guardar alerta" />
              </div>
            )}

            {/* ── LÍNEAS DE INVESTIGACIÓN ───────────────────── */}
            {activeTab === "investigacion" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🔬 Líneas de Investigación</h2>
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Tarjetas que aparecen en el home.</p>
                  </div>
                  <button type="button" className="btn btn-emerald" style={{ fontSize: "13px" }}
                    onClick={() => setLineas(l => [...l, { id: uid(), icono: "🔬", titulo: "", descripcion: "", orden: l.length + 1 }])}>
                    ＋ Agregar
                  </button>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  {lineas.length === 0 && <div className="empty-state"><div className="empty-state-icon">🔬</div><div className="empty-state-title">Sin líneas aún</div></div>}
                  {lineas.map((l, i) => (
                    <div key={l.id} style={{ border: "1px solid var(--slate-200)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "16px" }}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">Ícono (emoji)</label>
                          <input className="form-input" value={l.icono} onChange={e => setLineas(ls => ls.map((x, j) => j === i ? { ...x, icono: e.target.value } : x))} placeholder="🔬" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Título *</label>
                          <input className="form-input" value={l.titulo} onChange={e => setLineas(ls => ls.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x))} placeholder="Vacunología Clínica" required />
                        </div>
                        <div className="form-group full-width">
                          <label className="form-label">Descripción</label>
                          <textarea className="form-textarea" value={l.descripcion} onChange={e => setLineas(ls => ls.map((x, j) => j === i ? { ...x, descripcion: e.target.value } : x))} rows={2} />
                        </div>
                      </div>
                      <button type="button" className="action-btn action-btn-danger" style={{ marginTop: "8px" }}
                        onClick={() => setLineas(ls => ls.filter((_, j) => j !== i))}>
                        🗑 Eliminar
                      </button>
                    </div>
                  ))}
                </div>
                <SaveBar onSave={saveLineas} isPending={isPending} label="Guardar líneas" />
              </div>
            )}

            {/* ── TIMELINE ──────────────────────────────────── */}
            {activeTab === "timeline" && (
              <div>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--slate-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🎓 Trayectoria Académica</h2>
                    <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px" }}>Hitos que aparecen en el timeline del home.</p>
                  </div>
                  <button type="button" className="btn btn-emerald" style={{ fontSize: "13px" }}
                    onClick={() => setHitos(h => [...h, { id: uid(), anio: "", titulo: "", institucion: "", orden: h.length + 1 }])}>
                    ＋ Agregar
                  </button>
                </div>
                <div className="modal-body" style={{ maxHeight: "none" }}>
                  {hitos.length === 0 && <div className="empty-state"><div className="empty-state-icon">🎓</div><div className="empty-state-title">Sin hitos aún</div></div>}
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
                      <button type="button" className="action-btn action-btn-danger" style={{ marginTop: "8px" }}
                        onClick={() => setHitos(hs => hs.filter((_, j) => j !== i))}>
                        🗑 Eliminar
                      </button>
                    </div>
                  ))}
                </div>
                <SaveBar onSave={saveHitos} isPending={isPending} label="Guardar trayectoria" />
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
