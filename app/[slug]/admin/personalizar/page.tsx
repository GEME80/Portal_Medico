"use client";
import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveConfigAction, saveAlertAction } from "./actions";
import { uploadImageAction } from "../noticias/actions";
import { getOmsChartCalibrations, saveOmsChartImage } from "@/lib/actions/clinical-actions";
import { Palette, ChevronDown } from "lucide-react";

const TABS = [
  { id: "identidad", label: "Identidad & Estilos", desc: "Logo, contacto, redes, estilos" },
  { 
    id: "home_config", 
    label: "Configuración del Home", 
    desc: "Portada, doctor, pestaña extra",
    subitems: [
      { id: "home_portal", label: "Portada Principal" },
      { id: "sobre_doctor_portal", label: "Sobre el Doctor" },
      { id: "extra_portal", label: "Pestaña Extra" }
    ]
  },
  { id: "investigacion", label: "Líneas de Investigación", desc: "Gestor de tarjetas y títulos" },
  { id: "trayectoria", label: "Trayectoria Profesional", desc: "Hitos académicos y títulos" },
  { id: "graficas_oms", label: "Curvas de Crecimiento OMS", desc: "Configurar imágenes de curvas" },
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
  habilitar_menu_vacunas?: boolean;
  nombre_menu_vacunas?: string;
  vacunas_hero_titulo?: string;
  vacunas_hero_subtitulo?: string;
  vacunas_hero_descripcion?: string;
  vacunas_mitos_badge?: string;
  vacunas_mitos_prefijo?: string;
  vacunas_mitos_titulo?: string;
  vacunas_mitos_descripcion?: string;
  vacunas_inventario_titulo?: string;
}

interface Linea { id: string; icono: string; titulo: string; descripcion: string; orden: number; }
interface Hito  { id: string; anio: string; titulo: string; institucion: string; orden: number; }
interface Mito  { id: string; mito: string; respuesta: string; fuente: string; orden: number; activo: boolean; }


interface Props { params: Promise<{ slug: string }> }

const compressImage = async (file: File, maxWidth = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas context"));
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const ext = file.name.split('.').pop() || 'jpg';
              const name = file.name.replace(`.${ext}`, '.jpg');
              const compressedFile = new File([blob], name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Error al comprimir la imagen"));
            }
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const defaultHeroData = {
  badge: "Infectólogo · +30 años de experiencia",
  g1_t: "15K+",
  g1_s: "Pacientes",
  g2_t: "100%",
  g2_s: "Seguro",
  hero_btn_prim: "Explorar HubMed",
  hero_btn_sec: "Ver Publicaciones",
  tray_badge: "TRAYECTORIA E INVESTIGACIÓN",
  tray_title_1: "Décadas construyendo",
  tray_title_2: "evidencia científica",
  inv_title_1: "Ciencia aplicada a la",
  inv_title_2: "prevención",
  servicios_titulo: "Programa Integral de Vacunación",
  servicios_desc: "Protección inteligente y seguimiento continuo de esquemas de vacunación.",
  servicios_c1_title: "Seguridad Total",
  servicios_c1_text: "Aplicamos los esquemas más actualizados para proteger a quienes más quiere.",
  servicios_c2_title: "Cuidado Familiar",
  servicios_c2_text: "Atención cálida y humana centrada en el bienestar integral de su familia.",
  servicios_c3_title: "Evidencia Científica",
  servicios_c3_text: "Decisiones respaldadas por publicaciones académicas y consensos globales.",
  cta_titulo: "¿Necesita una consulta?",
  cta_desc: "El doctor atiende consultas presenciales y virtuales previa programación.",
  cta_btn_text: "Contactar ahora →",
  cta_mostrar: true,

  // Configuración de la página de Servicios/FAQ
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

  // Configuración de Banner Informativo / Promocional
  vacunas_mostrar_banner: false,
  vacunas_banner_badge: "PROMOCIÓN",
  vacunas_banner_titulo: "Cuidado continuo para toda la familia",
  vacunas_banner_desc: "Agende hoy una cita de valoración integral y proteja a sus seres queridos.",
  vacunas_banner_btn_text: "Agendar Cita",
  vacunas_banner_btn_url: "",

  // New Catalog Configuration fields
  vacunas_catalog_selected_ids: [] as string[],
  vacunas_catalog_custom_items: [] as any[],
  vacunas_catalog_tipo: "dynamic",
  vacunas_catalog_imagen_url: "",
  vacunas_catalog_pdf_url: "",
  vacunas_banner_imagen_url: "",
  vacunas_banner_btn_2_text: "",
  vacunas_banner_btn_2_url: ""
};

export default function PersonalizarPage({ params }: Props) {
  const [slug, setSlug] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [activeTab, setActiveTab] = useState("identidad");
  const [activeSubTab, setActiveSubTab] = useState("info");
  const [homeMenuExpanded, setHomeMenuExpanded] = useState(true);
  const [dbKeys, setDbKeys] = useState<string[]>([]);
  const [omsCalibrations, setOmsCalibrations] = useState<Record<string, any>>({});
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
    nombre_menu_vacunas: "HubMed",
    vacunas_hero_titulo: "Vacunas seguras, niños protegidos",
    vacunas_hero_subtitulo: "HubMed — Vacunación Basada en Evidencia",
    vacunas_hero_descripcion: "El doctor responde con evidencia científica los mitos más comunes sobre la vacunación.",
    vacunas_mitos_badge: "🔍 Información y Evidencia",
    vacunas_mitos_prefijo: "Decodificador de",
    vacunas_mitos_titulo: "Mitos Vacunales",
    vacunas_mitos_descripcion: "Respuestas detalladas a las preguntas y mitos más frecuentes que surgen en la consulta.",
    vacunas_inventario_titulo: "Vacunas Disponibles y Esquemas de Aplicación"
  });
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [affiliationsList, setAffiliationsList] = useState<{ name: string; abbr: string; logo_url?: string }[]>([]);
  const [hitos, setHitos] = useState<Hito[]>([]);
  const [mitos, setMitos] = useState<Mito[]>([]);
  const [originalMitos, setOriginalMitos] = useState<Mito[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
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

      const [cfgRes, lineasRes, hitosRes, alertRes, mitosRes, inventarioRes, omsRes] = await Promise.all([
        supabase.from("configuracion_portal").select("*").eq("tenant_id", tenant.id).single(),
        supabase.from("lineas_investigacion").select("*").eq("tenant_id", tenant.id).order("orden"),
        supabase.from("hitos_timeline").select("*").eq("tenant_id", tenant.id).order("orden"),
        supabase.from("alertas_epidemiologicas").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("mitos_vacunales").select("*").eq("tenant_id", tenant.id).order("orden"),
        supabase.from("inventario_medico").select("*").eq("tenant_id", tenant.id).order("nombre"),
        getOmsChartCalibrations()
      ]);

      if (cfgRes.data) {
        setDbKeys(Object.keys(cfgRes.data));
        setConfig(prev => ({
          ...prev,
          ...cfgRes.data
        }));

        // Deserialize affiliations list from hero_subtitulo JSON string, or fall back to defaults
        if (cfgRes.data.hero_subtitulo) {
          try {
            const parsed = JSON.parse(cfgRes.data.hero_subtitulo);
            if (Array.isArray(parsed)) {
              setAffiliationsList(parsed);
            } else {
              setAffiliationsList([
                { name: "Sociedad Colombiana de Infectología", abbr: "SCI" },
                { name: "Sociedad Latinoamericana de Infectología Pediátrica", abbr: "SLIPE" },
                { name: "Organización Panamericana de la Salud", abbr: "OPS/OMS" },
                { name: "International Society for Infectious Diseases", abbr: "ISID" },
                { name: "Asociación Colombiana de Pediatría", abbr: "SCP" },
              ]);
            }
          } catch (e) {
            setAffiliationsList([
              { name: "Sociedad Colombiana de Infectología", abbr: "SCI" },
              { name: "Sociedad Latinoamericana de Infectología Pediátrica", abbr: "SLIPE" },
              { name: "Organización Panamericana de la Salud", abbr: "OPS/OMS" },
              { name: "International Society for Infectious Diseases", abbr: "ISID" },
              { name: "Asociación Colombiana de Pediatría", abbr: "SCP" },
            ]);
          }
        } else {
          setAffiliationsList([
            { name: "Sociedad Colombiana de Infectología", abbr: "SCI" },
            { name: "Sociedad Latinoamericana de Infectología Pediátrica", abbr: "SLIPE" },
            { name: "Organización Panamericana de la Salud", abbr: "OPS/OMS" },
            { name: "International Society for Infectious Diseases", abbr: "ISID" },
            { name: "Asociación Colombiana de Pediatría", abbr: "SCP" },
          ]);
        }
      }
      if (lineasRes.data) setLineas(lineasRes.data as Linea[]);
      if (hitosRes.data) setHitos(hitosRes.data as Hito[]);
      if (mitosRes.data) {
        setMitos(mitosRes.data as Mito[]);
        setOriginalMitos(mitosRes.data as Mito[]);
      }
      if (inventarioRes.data) setInventoryItems(inventarioRes.data);
      setOmsCalibrations(omsRes);

      setLoading(false);
      
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
      // Serialize affiliations list as JSON string
      const serializedAffiliations = JSON.stringify(affiliationsList);
      
      // Build payload from known DB keys (excluding reserved keys)
      const payload: Record<string, any> = {};
      const excludedKeys = ["id", "tenant_id", "created_at"];
      if (dbKeys.length > 0) {
        dbKeys.forEach(key => {
          if (key in config && !excludedKeys.includes(key)) {
            payload[key] = key === "hero_subtitulo" ? serializedAffiliations : (config as any)[key];
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
            payload[key] = key === "hero_subtitulo" ? serializedAffiliations : (config as any)[key];
          }
        });
      }

      // Also update local state
      setConfig(prev => ({ ...prev, hero_subtitulo: serializedAffiliations }));

      // Use server action (admin client) to save — avoids RLS + client 500
      const result = await saveConfigAction(tenantId, slug, payload);
      if (!result.success) {
        showToast("Error al guardar: " + result.error, "error");
      } else {
        // Sync myths database modifications
        try {
          const deletedMitos = originalMitos.filter(orig => !mitos.some(m => m.id === orig.id));
          for (const m of deletedMitos) {
            if (!m.id.startsWith("new-")) {
              const { error: delErr } = await supabase.from("mitos_vacunales").delete().eq("id", m.id);
              if (delErr) throw delErr;
            }
          }
          for (const m of mitos) {
            if (m.id.startsWith("new-")) {
              const { error: insErr } = await supabase.from("mitos_vacunales").insert({
                tenant_id: tenantId,
                mito: m.mito,
                respuesta: m.respuesta,
                fuente: m.fuente || "",
                orden: m.orden,
                activo: true
              });
              if (insErr) throw insErr;
            } else {
              const { error: updErr } = await supabase.from("mitos_vacunales").update({
                mito: m.mito,
                respuesta: m.respuesta,
                fuente: m.fuente || "",
                orden: m.orden,
                activo: true
              }).eq("id", m.id);
              if (updErr) throw updErr;
            }
          }
          // Reload myths
          const { data: updatedMitos } = await supabase.from("mitos_vacunales").select("*").eq("tenant_id", tenantId).order("orden");
          if (updatedMitos) {
            setMitos(updatedMitos as Mito[]);
            setOriginalMitos(updatedMitos as Mito[]);
          }
          showToast("✅ Cambios guardados correctamente");
        } catch (mythErr: any) {
          showToast("Error al guardar mitos/preguntas: " + mythErr.message, "error");
        }
      }
    });
  };

  const saveLineasAndConfig = () => {
    startTransition(async () => {
      try {
        const serializedAffiliations = JSON.stringify(affiliationsList);
        const payload: Record<string, any> = {};
        const excludedKeys = ["id", "tenant_id", "created_at"];
        if (dbKeys.length > 0) {
          dbKeys.forEach(key => {
            if (key in config && !excludedKeys.includes(key)) {
              payload[key] = key === "hero_subtitulo" ? serializedAffiliations : (config as any)[key];
            }
          });
        } else {
          payload["hero_badge_texto"] = config.hero_badge_texto;
        }
        
        const cfgResult = await saveConfigAction(tenantId, slug, payload);
        if (!cfgResult.success) {
          showToast("Error al guardar títulos: " + cfgResult.error, "error");
          return;
        }

        for (const l of lineas) {
          if (l.id.startsWith("new-")) {
            await supabase.from("lineas_investigacion").insert({ ...l, id: undefined, tenant_id: tenantId });
          } else {
            await supabase.from("lineas_investigacion").update(l).eq("id", l.id);
          }
        }
        showToast("✅ Líneas de investigación y títulos guardados");
      } catch (err: any) {
        showToast("Error al guardar líneas: " + err.message, "error");
      }
    });
  };

  const saveHitosAndConfig = () => {
    startTransition(async () => {
      try {
        const serializedAffiliations = JSON.stringify(affiliationsList);
        const payload: Record<string, any> = {};
        const excludedKeys = ["id", "tenant_id", "created_at"];
        if (dbKeys.length > 0) {
          dbKeys.forEach(key => {
            if (key in config && !excludedKeys.includes(key)) {
              payload[key] = key === "hero_subtitulo" ? serializedAffiliations : (config as any)[key];
            }
          });
        } else {
          payload["hero_badge_texto"] = config.hero_badge_texto;
        }
        
        const cfgResult = await saveConfigAction(tenantId, slug, payload);
        if (!cfgResult.success) {
          showToast("Error al guardar títulos: " + cfgResult.error, "error");
          return;
        }

        for (const h of hitos) {
          if (h.id.startsWith("new-")) {
            await supabase.from("hitos_timeline").insert({ ...h, id: undefined, tenant_id: tenantId });
          } else {
            await supabase.from("hitos_timeline").update(h).eq("id", h.id);
          }
        }
        showToast("✅ Trayectoria y títulos guardados");
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
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    startTransition(async () => {
      try {
        const file = await compressImage(rawFile, 800); // 800px max width for logo
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
      } catch (error: any) {
        showToast("Error al procesar logo: " + error.message, "error");
      }
    });
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    startTransition(async () => {
      try {
        const file = await compressImage(rawFile, 1200); // 1200px max width for photo
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
      } catch (error: any) {
        showToast("Error al procesar foto: " + error.message, "error");
      }
    });
  };

  const handleFotoSobreUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    startTransition(async () => {
      try {
        const file = await compressImage(rawFile, 1200);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tenantId", tenantId);
        formData.append("folder", "foto_doctor");

        const res = await uploadImageAction(formData);
        if (!res.success) {
          showToast("Error al subir foto: " + res.error, "error");
          return;
        }

        setConfig(c => {
          const currentHero = parseJSONField(c.hero_badge_texto, defaultHeroData);
          return {
            ...c,
            hero_badge_texto: JSON.stringify({ ...currentHero, foto_sobre_doctor_url: res.publicUrl || "" })
          };
        });
        showToast("✅ Foto de 'Sobre el Doctor' subida correctamente. Guarde los cambios para aplicar.");
      } catch (error: any) {
        showToast("Error al procesar foto: " + error.message, "error");
      }
    });
  };

  const parseInstitucion = (instStr: string) => {
    if (instStr && instStr.includes("|")) {
      const [name, logo] = instStr.split("|");
      return { name: name || "", logo: logo || "" };
    }
    return { name: instStr || "", logo: "" };
  };

  const handleHitoLogoUpload = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    startTransition(async () => {
      try {
        const file = await compressImage(rawFile, 400);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tenantId", tenantId);
        formData.append("folder", "logos_hitos");

        const res = await uploadImageAction(formData);
        if (!res.success) {
          showToast("Error al subir logo: " + res.error, "error");
          return;
        }

        const logoUrl = res.publicUrl || "";
        setHitos(prev => prev.map((h, idx) => {
          if (idx === i) {
            const currentName = parseInstitucion(h.institucion).name;
            return { ...h, institucion: `${currentName}|${logoUrl}` };
          }
          return h;
        }));
        showToast("✅ Logo de la institución subido. Guarde los cambios.");
      } catch (err: any) {
        showToast("Error al procesar logo: " + err.message, "error");
      }
    });
  };

  const handleAffiliationLogoUpload = async (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    startTransition(async () => {
      try {
        const file = await compressImage(rawFile, 400);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tenantId", tenantId);
        formData.append("folder", "logos_membresias");

        const res = await uploadImageAction(formData);
        if (!res.success) {
          showToast("Error al subir logo: " + res.error, "error");
          return;
        }

        const logoUrl = res.publicUrl || "";
        setAffiliationsList(prev => prev.map((a, idx) => {
          if (idx === i) {
            return { ...a, logo_url: logoUrl };
          }
          return a;
        }));
        showToast("✅ Logo de la membresía subido. Guarde los cambios.");
      } catch (err: any) {
        showToast("Error al procesar logo: " + err.message, "error");
      }
    });
  };

  const handleCatalogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    startTransition(async () => {
      try {
        const file = await compressImage(rawFile, 1200);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tenantId", tenantId);
        formData.append("folder", "catalogo");

        const res = await uploadImageAction(formData);
        if (!res.success) {
          showToast("Error al subir imagen de catálogo: " + res.error, "error");
          return;
        }

        setHeroData("vacunas_catalog_imagen_url", res.publicUrl || "");
        showToast("✅ Imagen de catálogo subida correctamente. Guarde los cambios.");
      } catch (err: any) {
        showToast("Error al procesar imagen: " + err.message, "error");
      }
    });
  };

  const handleCatalogPdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tenantId", tenantId);
        formData.append("folder", "catalogo");

        const res = await uploadImageAction(formData);
        if (!res.success) {
          showToast("Error al subir PDF de catálogo: " + res.error, "error");
          return;
        }

        setHeroData("vacunas_catalog_pdf_url", res.publicUrl || "");
        showToast("✅ PDF del catálogo subido correctamente. Guarde los cambios.");
      } catch (err: any) {
        showToast("Error al procesar PDF: " + err.message, "error");
      }
    });
  };

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    startTransition(async () => {
      try {
        const file = await compressImage(rawFile, 1200);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tenantId", tenantId);
        formData.append("folder", "banner");

        const res = await uploadImageAction(formData);
        if (!res.success) {
          showToast("Error al subir imagen de banner: " + res.error, "error");
          return;
        }

        setHeroData("vacunas_banner_imagen_url", res.publicUrl || "");
        showToast("✅ Imagen de banner subida correctamente. Guarde los cambios.");
      } catch (err: any) {
        showToast("Error al procesar imagen: " + err.message, "error");
      }
    });
  };

  const uid = () => "new-" + Math.random().toString(36).slice(2, 8);

  const parseJSONField = (field: string, defaultObj: any) => {
    try {
      if (field && field.startsWith("{")) {
        const parsed = JSON.parse(field);
        return { ...defaultObj, ...parsed };
      }
    } catch (e) {}
    if (field && !field.startsWith("{") && defaultObj === defaultHeroData) {
      return { ...defaultObj, badge: field };
    }
    return defaultObj;
  };
  
  const waData = parseJSONField(config.whatsapp, { n: config.whatsapp, t: "w" });
  const heroData = parseJSONField(config.hero_badge_texto, defaultHeroData);

  const setWaData = (n: string, t: string) => setConfig(c => ({ ...c, whatsapp: JSON.stringify({ n, t }) }));
  const setHeroData = (k: string, v: any) => setConfig(c => ({ ...c, hero_badge_texto: JSON.stringify({ ...heroData, [k]: v }) }));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "var(--slate-400)" }}>
      Cargando configuración...
    </div>
  );

  return (
    <>
      {/* TOPBAR */}
      <div className="admin-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(10, 77, 92, 0.08)",
            color: "var(--doc-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Palette size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="admin-topbar-title" style={{ margin: 0, lineHeight: 1.2 }}>Personalizar Portal</h1>
            <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "2px 0 0" }}>
              Edita el contenido y estilo visual de tu sitio público.
            </p>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="personalizar-layout">

          {/* TABS SIDEBAR */}
          <div className="sticky-subnav" style={{ background: "white", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            {TABS.map((tab) => {
              const isHomeConfig = tab.id === "home_config";
              const isSelected = activeTab === tab.id || 
                (isHomeConfig && ["home_portal", "sobre_doctor_portal", "extra_portal"].includes(activeTab));

              return (
                <div key={tab.id} style={{ borderBottom: "1px solid var(--slate-100)" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isHomeConfig) {
                        setHomeMenuExpanded(!homeMenuExpanded);
                        // Auto-select first subitem
                        setActiveTab("home_portal");
                        setActiveSubTab("hero");
                      } else {
                        setActiveTab(tab.id);
                        if (tab.id === "identidad") {
                          setActiveSubTab("info");
                        }
                      }
                    }}
                    style={{
                      display: "flex", flexDirection: "column", width: "100%", padding: "14px 18px",
                      textAlign: "left", border: "none",
                      background: isSelected ? "rgba(10,77,92,.04)" : "transparent",
                      borderLeft: isSelected ? "3px solid var(--teal-700)" : "3px solid transparent",
                      cursor: "pointer", transition: "background .15s", fontFamily: "inherit",
                    }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: isSelected ? "var(--teal-800)" : "var(--slate-700)", display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      {tab.label}
                      {isHomeConfig && (
                        <ChevronDown size={14} style={{ transform: homeMenuExpanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
                      )}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "2px" }}>{tab.desc}</span>
                  </button>

                  {/* Render Subitems if expanded */}
                  {isHomeConfig && homeMenuExpanded && tab.subitems && (
                    <div style={{ background: "var(--slate-50)", padding: "4px 0", display: "flex", flexDirection: "column" }}>
                      {tab.subitems.map((sub) => {
                        const isSubActive = activeTab === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(sub.id);
                              if (sub.id === "home_portal") {
                                setActiveSubTab("hero");
                              } else if (sub.id === "sobre_doctor_portal") {
                                setActiveSubTab("biografia");
                              } else if (sub.id === "extra_portal") {
                                setActiveSubTab("menu_portada");
                              }
                            }}
                            style={{
                              display: "flex",
                              padding: "10px 18px 10px 32px",
                              width: "100%",
                              border: "none",
                              background: isSubActive ? "rgba(10,77,92,.08)" : "transparent",
                              color: isSubActive ? "var(--teal-800)" : "var(--slate-600)",
                              fontWeight: isSubActive ? 700 : 500,
                              fontSize: "12px",
                              textAlign: "left",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              alignItems: "center",
                              gap: "8px"
                            }}
                          >
                            <span style={{ color: isSubActive ? "var(--teal-600)" : "var(--slate-400)" }}>•</span>
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* FORM PANEL */}
          <div style={{ background: "white", border: "1px solid var(--slate-200)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>

            {/* ── IDENTIDAD ─────────────────────────────────── */}
            {activeTab === "identidad" && (
              <div>
                <div style={{ padding: "24px 28px 0 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>👨‍⚕️ Identidad y Estilos</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px", marginBottom: "16px" }}>Administra logotipo, información de contacto, fotos y estilos de tu portal público.</p>
                  
                  {/* Subtabs for Identidad */}
                  <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid transparent", overflowX: "auto" }}>
                    {[{id: "info", label: "Información General"}, {id: "foto", label: "Foto y Estilos"}, {id: "alerta", label: "Alerta Epidemiológica"}].map(sub => (
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

                {activeSubTab === "info" && (
                  <div>
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
                        <Field label="Nombre de la clínica / Consultorio" id="nombre_clinica" value={config.nombre_clinica} onChange={v => setConfig(c => ({ ...c, nombre_clinica: v }))} placeholder="HubMed Medical" fullWidth />
                        
                        <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Información de Contacto</h3>
                        <Field label="Email público" id="email" value={config.email} onChange={v => setConfig(c => ({ ...c, email: v }))} placeholder="doctor@clinica.com" type="email" />
                        <Field label="Teléfono (fijo o principal)" id="telefono" value={config.telefono} onChange={v => setConfig(c => ({ ...c, telefono: v }))} placeholder="+57 300 000 0000" type="tel" />
                        <Field label="Dirección del consultorio" id="direccion" value={config.direccion} onChange={v => setConfig(c => ({ ...c, direccion: v }))} placeholder="Cra 7 # 32-16, Consultorio 401" fullWidth />
                        <Field label="Ciudad" id="ciudad" value={config.ciudad} onChange={v => setConfig(c => ({ ...c, ciudad: v }))} placeholder="Bogotá" />
                        <Field label="País" id="pais" value={config.pais} onChange={v => setConfig(c => ({ ...c, pais: v }))} placeholder="Colombia" />
                        
                        <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Chat Directo</h3>
                        <div className="form-grid form-group full-width">
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

                {activeSubTab === "foto" && (
                  <div>
                    <div className="modal-body" style={{ maxHeight: "none" }}>
                      <div className="form-grid" style={{ gap: "32px", padding: "20px 0 32px 0", borderBottom: "1px solid var(--slate-100)", marginBottom: "24px" }}>
                        
                        {/* Foto del Home */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--slate-800)" }}>Foto del Home</h4>
                          <div style={{ width: "200px", height: "200px", border: "2px dashed var(--slate-300)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)", overflow: "hidden", position: "relative" }}>
                            {config.foto_url ? (
                              <img src={config.foto_url} alt="Foto del Home" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ textAlign: "center", color: "var(--slate-400)" }}>
                                <span style={{ fontSize: "40px" }}>🏠</span>
                                <p style={{ marginTop: "8px", fontSize: "12px", fontWeight: 600 }}>Sin foto subida</p>
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <input type="file" accept="image/*" id="foto-upload-main" style={{ display: "none" }} onChange={handleFotoUpload} />
                            <label htmlFor="foto-upload-main" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "13px", padding: "8px 20px" }}>
                              {isPending ? "Subiendo..." : "Actualizar Foto"}
                            </label>
                          </div>
                        </div>

                        {/* Foto sobre el Doctor */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--slate-800)" }}>Foto sobre el Doctor</h4>
                          <div style={{ width: "200px", height: "200px", border: "2px dashed var(--slate-300)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)", overflow: "hidden", position: "relative" }}>
                            {heroData.foto_sobre_doctor_url ? (
                              <img src={heroData.foto_sobre_doctor_url} alt="Foto sobre el Doctor" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ textAlign: "center", color: "var(--slate-400)" }}>
                                <span style={{ fontSize: "40px" }}>👨‍⚕️</span>
                                <p style={{ marginTop: "8px", fontSize: "12px", fontWeight: 600 }}>Sin foto subida</p>
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: "center" }}>
                            <input type="file" accept="image/*" id="foto-upload-sobre" style={{ display: "none" }} onChange={handleFotoSobreUpload} />
                            <label htmlFor="foto-upload-sobre" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "13px", padding: "8px 20px" }}>
                              {isPending ? "Subiendo..." : "Actualizar Foto"}
                            </label>
                          </div>
                        </div>

                      </div>
                      <p style={{ fontSize: "12px", color: "var(--slate-500)", textAlign: "center", marginBottom: "32px", marginTop: "-12px" }}>Formatos recomendados: JPG, PNG. Se recomiendan fotos verticales o con el rostro centrado.</p>

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
                      </div>
                    </div>
                    <SaveBar onSave={saveConfig} isPending={isPending} />
                  </div>
                )}

                {activeSubTab === "alerta" && (
                  <div>
                    <div className="modal-body" style={{ maxHeight: "none" }}>
                      <div className="form-grid">
                        <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Banner de Alerta Epidemiológica</h3>
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
                      </div>
                    </div>
                    <SaveBar onSave={saveAlert} isPending={isPending} label="Guardar alerta y activarla" />
                  </div>
                )}
              </div>
            )}

            {/* ── PORTADA PRINCIPAL (HOME) ───────────────────── */}
            {activeTab === "home_portal" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ padding: "24px 28px 0 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>🖥️ Portada Principal (Home)</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px", marginBottom: "16px" }}>Administra los textos, estadísticas, botones y secciones de la portada de tu portal público.</p>
                  
                  {/* Subtabs */}
                  <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid transparent", overflowX: "auto" }}>
                    {[
                      { id: "hero", label: "Hero y Portada" },
                      { id: "stats", label: "Estadísticas" },
                      { id: "servicios", label: "Programa / Servicios" },
                      { id: "cta_seo", label: "CTA y SEO" }
                    ].map(sub => (
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
                  {activeSubTab === "hero" && (
                    <div className="form-grid">
                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Sección Hero</h3>
                      <Field label="Texto del badge superior" id="hero_badge" value={heroData.badge} onChange={v => setHeroData("badge", v)} placeholder="Infectólogo · +30 años de experiencia" fullWidth />
                      <Field label="Título principal del Hero" id="hero_titulo" value={config.hero_titulo} onChange={v => setConfig(c => ({ ...c, hero_titulo: v }))} placeholder="Ciencia, prevención y cuidado para cada familia" fullWidth />
                      
                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Mensajes Flotantes (Globos)</h3>
                      <div className="form-grid form-group full-width" style={{ background: "var(--slate-50)", padding: "16px", borderRadius: "12px" }}>
                        <Field label="Globo 1: Título" id="g1_t" value={heroData.g1_t} onChange={v => setHeroData("g1_t", v)} placeholder="15K+" />
                        <Field label="Globo 1: Subtítulo" id="g1_s" value={heroData.g1_s} onChange={v => setHeroData("g1_s", v)} placeholder="Pacientes" />
                        <Field label="Globo 2: Título" id="g2_t" value={heroData.g2_t} onChange={v => setHeroData("g2_t", v)} placeholder="100%" />
                        <Field label="Globo 2: Subtítulo" id="g2_s" value={heroData.g2_s} onChange={v => setHeroData("g2_s", v)} placeholder="Seguro" />
                      </div>

                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Botones del Hero</h3>
                      <Field label="Botón Principal (Ej: Explorar HubMed)" id="hero_btn_prim" value={heroData.hero_btn_prim} onChange={v => setHeroData("hero_btn_prim", v)} placeholder="Explorar HubMed" />
                      <Field label="Botón Secundario (Ej: Ver Publicaciones)" id="hero_btn_sec" value={heroData.hero_btn_sec} onChange={v => setHeroData("hero_btn_sec", v)} placeholder="Ver Publicaciones" />
                    </div>
                  )}

                  {activeSubTab === "stats" && (
                    <div className="form-grid">
                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Estadísticas del Home</h3>
                      <div className="form-grid form-group full-width">
                        <Field label="Años de experiencia" id="stat_anos" value={config.stat_anos_experiencia} onChange={v => setConfig(c => ({ ...c, stat_anos_experiencia: v }))} placeholder="30+" />
                        <Field label="Publicaciones científicas" id="stat_pub" value={config.stat_publicaciones} onChange={v => setConfig(c => ({ ...c, stat_publicaciones: v }))} placeholder="50+" />
                        <Field label="Pacientes al año" id="stat_pac" value={config.stat_pacientes_anio} onChange={v => setConfig(c => ({ ...c, stat_pacientes_anio: v }))} placeholder="2,000+" />
                        <Field label="Consultorios / Clínicas" id="stat_cons" value={config.stat_consultorios} onChange={v => setConfig(c => ({ ...c, stat_consultorios: v }))} placeholder="3" />
                      </div>
                    </div>
                  )}

                  {activeSubTab === "servicios" && (
                    <div className="form-grid">
                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Sección Programa HubMed / Servicios</h3>
                      <Field label="Título de la Sección" id="servicios_titulo" value={heroData.servicios_titulo} onChange={v => setHeroData("servicios_titulo", v)} placeholder="Programa Integral de Vacunación" fullWidth />
                      <div className="form-group full-width">
                        <label className="form-label" htmlFor="servicios_desc">Descripción de la Sección</label>
                        <textarea id="servicios_desc" className="form-textarea" value={heroData.servicios_desc} onChange={e => setHeroData("servicios_desc", e.target.value)} placeholder="Protección inteligente y seguimiento continuo..." rows={2} />
                      </div>
                      
                      <div className="form-grid form-group full-width" style={{ background: "var(--slate-50)", padding: "16px", borderRadius: "12px" }}>
                        <h4 style={{ gridColumn: "1 / -1", fontSize: "14px", fontWeight: 700, margin: 0 }}>Tarjeta 1</h4>
                        <Field label="Título Tarjeta 1" id="servicios_c1_title" value={heroData.servicios_c1_title} onChange={v => setHeroData("servicios_c1_title", v)} placeholder="Seguridad Total" />
                        <Field label="Texto Tarjeta 1" id="servicios_c1_text" value={heroData.servicios_c1_text} onChange={v => setHeroData("servicios_c1_text", v)} placeholder="Aplicamos los esquemas más actualizados..." />
                        
                        <h4 style={{ gridColumn: "1 / -1", fontSize: "14px", fontWeight: 700, margin: "8px 0 0 0" }}>Tarjeta 2</h4>
                        <Field label="Título Tarjeta 2" id="servicios_c2_title" value={heroData.servicios_c2_title} onChange={v => setHeroData("servicios_c2_title", v)} placeholder="Cuidado Familiar" />
                        <Field label="Texto Tarjeta 2" id="servicios_c2_text" value={heroData.servicios_c2_text} onChange={v => setHeroData("servicios_c2_text", v)} placeholder="Atención cálida y humana..." />
                        
                        <h4 style={{ gridColumn: "1 / -1", fontSize: "14px", fontWeight: 700, margin: "8px 0 0 0" }}>Tarjeta 3</h4>
                        <Field label="Título Tarjeta 3" id="servicios_c3_title" value={heroData.servicios_c3_title} onChange={v => setHeroData("servicios_c3_title", v)} placeholder="Evidencia Científica" />
                        <Field label="Texto Tarjeta 3" id="servicios_c3_text" value={heroData.servicios_c3_text} onChange={v => setHeroData("servicios_c3_text", v)} placeholder="Decisiones basadas en la evidencia..." />
                      </div>
                    </div>
                  )}

                  {activeSubTab === "cta_seo" && (
                    <div className="form-grid">
                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Sección CTA de Consulta</h3>
                      <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "var(--slate-50)", borderRadius: "var(--radius-lg)" }}>
                        <input type="checkbox" id="cta_mostrar" checked={heroData.cta_mostrar !== false} onChange={e => setHeroData("cta_mostrar", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                        <label htmlFor="cta_mostrar" style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-900)", cursor: "pointer" }}>Mostrar sección de consulta (CTA) en el Home</label>
                      </div>
                      <Field label="Título del CTA" id="cta_titulo" value={heroData.cta_titulo} onChange={v => setHeroData("cta_titulo", v)} placeholder="¿Necesita una consulta?" fullWidth />
                      <div className="form-group full-width">
                        <label className="form-label" htmlFor="cta_desc">Descripción del CTA</label>
                        <textarea id="cta_desc" className="form-textarea" value={heroData.cta_desc} onChange={e => setHeroData("cta_desc", e.target.value)} placeholder="El doctor atiende consultas presenciales y virtuales..." rows={2} />
                      </div>
                      <Field label="Texto del Botón CTA" id="cta_btn_text" value={heroData.cta_btn_text} onChange={v => setHeroData("cta_btn_text", v)} placeholder="Contactar ahora →" />

                      <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>SEO del Portal</h3>
                      <Field label="Meta título (Título en Google)" id="meta_titulo" value={config.meta_titulo} onChange={v => setConfig(c => ({ ...c, meta_titulo: v }))} placeholder="Dr. Carlos Torres — Infectólogo Pediatra" fullWidth />
                      <div className="form-group full-width">
                        <label className="form-label" htmlFor="meta_desc">Meta descripción (Resumen en Google)</label>
                        <textarea id="meta_desc" className="form-textarea" value={config.meta_descripcion} onChange={e => setConfig(c => ({ ...c, meta_descripcion: e.target.value }))} rows={2} placeholder="Describe el portal en 155 caracteres..." />
                      </div>
                    </div>
                  )}
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── SOBRE EL DOCTOR ──────────────────────────────── */}
            {activeTab === "sobre_doctor_portal" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ padding: "24px 28px 0 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>👨‍⚕️ Sobre el Doctor</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px", marginBottom: "16px" }}>Administra las biografías y las membresías/afiliaciones profesionales del doctor.</p>
                  
                  {/* Subtabs */}
                  <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid transparent", overflowX: "auto" }}>
                    {[
                      { id: "biografia", label: "Biografía Profesional" },
                      { id: "afiliaciones", label: "Membresías y Afiliaciones" }
                    ].map(sub => (
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
                  {activeSubTab === "biografia" && (
                    <div className="form-grid">
                      <div className="form-group full-width" style={{ marginBottom: "16px" }}>
                        <label className="form-label" htmlFor="bio_corta">Biografía corta (aparece en la portada principal)</label>
                        <textarea id="bio_corta" className="form-textarea" value={config.bio_corta} onChange={e => setConfig(c => ({ ...c, bio_corta: e.target.value }))} placeholder="Infectólogo Pediatra con más de 30 años de experiencia..." rows={3} style={{ background: "var(--slate-50)" }} />
                      </div>
                      <div className="form-group full-width" style={{ marginBottom: "24px" }}>
                        <label className="form-label" htmlFor="bio_larga">Biografía extensa (página "Sobre el Doctor")</label>
                        <textarea id="bio_larga" className="form-textarea" value={config.bio_larga} onChange={e => setConfig(c => ({ ...c, bio_larga: e.target.value }))} rows={6} placeholder="Descripción detallada de tu labor médica..." style={{ background: "var(--slate-50)" }} />
                      </div>
                    </div>
                  )}

                  {activeSubTab === "afiliaciones" && (
                    <div className="form-grid">
                      <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--slate-900)" }}>Afiliaciones (Membresías)</h4>
                            <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "4px 0 0 0" }}>Estas membresías y asociaciones aparecerán en la sección "Afiliaciones" de la página sobre el doctor y en la tarjeta de presentación.</p>
                          </div>
                          <button
                            type="button"
                            className="btn btn-emerald"
                            style={{ padding: "8px 16px", fontSize: "13px" }}
                            onClick={() => setAffiliationsList(prev => [...prev, { name: "", abbr: "" }])}
                          >
                            ＋ Agregar Membresía
                          </button>
                        </div>

                        {affiliationsList.length === 0 ? (
                          <div style={{ textAlign: "center", padding: "40px", border: "2px dashed var(--slate-200)", borderRadius: "12px", color: "var(--slate-400)" }}>
                            <span style={{ fontSize: "32px" }}>🎖️</span>
                            <p style={{ margin: "12px 0 0 0", fontSize: "13px", fontWeight: 600 }}>No hay membresías agregadas.</p>
                            <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>Haz clic en "Agregar Membresía" para añadir tu primera afiliación.</p>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {affiliationsList.map((aff, i) => (
                              <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr 2.5fr auto", gap: "16px", alignItems: "end", background: "var(--slate-50)", padding: "16px", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 700, marginBottom: 0, textAlign: "center", width: "100%" }}>Logo</label>
                                  <div style={{ width: "48px", height: "48px", border: "1px dashed var(--slate-300)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "white", overflow: "hidden", position: "relative" }}>
                                    {aff.logo_url ? (
                                      <img src={aff.logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    ) : (
                                      <span style={{ fontSize: "18px" }}>🎖️</span>
                                    )}
                                  </div>
                                  <input type="file" accept="image/*" id={`logo-aff-${i}`} style={{ display: "none" }} onChange={e => handleAffiliationLogoUpload(i, e)} />
                                  <label htmlFor={`logo-aff-${i}`} style={{ cursor: "pointer", fontSize: "10px", color: "var(--emerald-600)", fontWeight: 700, textDecoration: "underline", margin: 0 }}>
                                    Subir
                                  </label>
                                </div>
                                <div>
                                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>Abreviación</label>
                                  <input
                                    className="form-input"
                                    style={{ padding: "8px 12px", fontSize: "13px", background: "white" }}
                                    value={aff.abbr}
                                    onChange={e => setAffiliationsList(prev => prev.map((x, idx) => idx === i ? { ...x, abbr: e.target.value } : x))}
                                    placeholder="Ej: SCI"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="form-label" style={{ fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>Nombre de la Asociación</label>
                                  <input
                                    className="form-input"
                                    style={{ padding: "8px 12px", fontSize: "13px", background: "white" }}
                                    value={aff.name}
                                    onChange={e => setAffiliationsList(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                                    placeholder="Ej: Sociedad Colombiana de Infectología"
                                    required
                                  />
                                </div>
                                <div>
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ padding: "10px 14px", borderColor: "var(--rose-200)", color: "var(--rose-600)", background: "white", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    onClick={() => setAffiliationsList(prev => prev.filter((_, idx) => idx !== i))}
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <SaveBar onSave={saveConfig} isPending={isPending} />
              </div>
            )}

            {/* ── PESTAÑA EXTRA ───────────────────────────────── */}
            {activeTab === "extra_portal" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ padding: "24px 28px 0 28px", borderBottom: "1px solid var(--slate-200)" }}>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "18px" }}>✨ Pestaña Extra</h2>
                  <p style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "4px", marginBottom: "16px" }}>Configura la página adicional de catálogo comercial, mitos/verdades y banners de marketing.</p>
                  
                  {/* Subtabs */}
                  <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid transparent", overflowX: "auto" }}>
                    {[
                      { id: "menu_portada", label: "Menú y Portada" },
                      { id: "mitos", label: "Preguntas y Mitos (FAQs)" },
                      { id: "catalogo", label: "Catálogo de Servicios" },
                      { id: "banner", label: "Banner Promocional" }
                    ].map(sub => (
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
                  {activeSubTab === "menu_portada" && (
                    <div className="form-grid">
                      <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", background: "var(--emerald-50)", border: "1px solid var(--emerald-200)", borderRadius: "var(--radius-lg)" }}>
                        <input type="checkbox" id="habilitar_menu_vacunas" checked={heroData.habilitar_menu_vacunas !== false} onChange={e => setHeroData("habilitar_menu_vacunas", e.target.checked)} style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                        <label htmlFor="habilitar_menu_vacunas" style={{ fontSize: "15px", fontWeight: 700, color: "var(--emerald-900)", cursor: "pointer" }}>Habilitar página de "Servicios/Preguntas" en el menú público</label>
                      </div>

                      {heroData.habilitar_menu_vacunas !== false && (
                        <>
                          <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, marginTop: "16px", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px" }}>Configuración del Menú y Portada</h3>
                          <Field label="Nombre del botón en el menú de navegación *" id="nombre_menu_vacunas" value={heroData.nombre_menu_vacunas || "Servicios"} onChange={v => setHeroData("nombre_menu_vacunas", v)} placeholder="HubMed, Servicios, Tratamientos, etc." fullWidth />
                          <Field label="Título principal de la página *" id="vacunas_hero_titulo" value={heroData.vacunas_hero_titulo || "Vacunas seguras, niños protegidos"} onChange={v => setHeroData("vacunas_hero_titulo", v)} placeholder="Vacunas seguras, niños protegidos" fullWidth />
                          <Field label="Subtítulo de la página *" id="vacunas_hero_subtitulo" value={heroData.vacunas_hero_subtitulo || "HubMed — Vacunación Basada en Evidencia"} onChange={v => setHeroData("vacunas_hero_subtitulo", v)} placeholder="HubMed — Vacunación Basada en Evidencia" fullWidth />
                          <div className="form-group full-width">
                            <label className="form-label" htmlFor="vacunas_hero_descripcion">Descripción detallada</label>
                            <textarea id="vacunas_hero_descripcion" className="form-textarea" value={heroData.vacunas_hero_descripcion || ""} onChange={e => setHeroData("vacunas_hero_descripcion", e.target.value)} placeholder="Descripción de los servicios de vacunación o procedimientos..." rows={3} />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeSubTab === "mitos" && (
                    <div className="form-grid">
                      {heroData.habilitar_menu_vacunas === false ? (
                        <div style={{ gridColumn: "1 / -1", padding: "24px", border: "1px dashed var(--slate-300)", borderRadius: "12px", background: "var(--slate-50)", textAlign: "center", color: "var(--slate-500)" }}>
                          <span style={{ fontSize: "28px" }}>🔕</span>
                          <p style={{ marginTop: "12px", fontSize: "13px", fontWeight: 600 }}>La página extra está desactivada.</p>
                          <p style={{ fontSize: "11px", marginTop: "4px" }}>Habilite la página extra en la pestaña 'Menú y Portada' para configurar esta sección.</p>
                        </div>
                      ) : (
                        <>
                          <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input type="checkbox" id="vacunas_mostrar_mitos" checked={heroData.vacunas_mostrar_mitos !== false} onChange={e => setHeroData("vacunas_mostrar_mitos", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                            <label htmlFor="vacunas_mostrar_mitos" style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-700)", cursor: "pointer" }}>Habilitar sección de Preguntas/Mitos</label>
                          </div>

                          {heroData.vacunas_mostrar_mitos !== false && (
                            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "20px", marginTop: "8px", background: "var(--slate-50)", padding: "20px", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
                              <div className="personalizar-card-header">
                                <div>
                                  <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--slate-900)" }}>Preguntas Frecuentes / Mitos y Verdades</h4>
                                  <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "4px 0 0 0" }}>Agrega y edita las preguntas que los pacientes suelen hacer en consulta.</p>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-emerald"
                                  style={{ padding: "8px 16px", fontSize: "13px" }}
                                  onClick={() => setMitos(prev => [...prev, { id: uid(), mito: "", respuesta: "", fuente: "", orden: prev.length + 1, activo: true }])}
                                >
                                  ＋ Agregar Pregunta
                                </button>
                              </div>

                              <div className="form-grid">
                                <Field label="Badge superior de la sección *" id="vacunas_mitos_badge" value={heroData.vacunas_mitos_badge || "🔍 Información y Evidencia"} onChange={v => setHeroData("vacunas_mitos_badge", v)} placeholder="🔍 Información y Evidencia" />
                                <Field label="Prefijo del título *" id="vacunas_mitos_prefijo" value={heroData.vacunas_mitos_prefijo || "Decodificador de"} onChange={v => setHeroData("vacunas_mitos_prefijo", v)} placeholder="Decodificador de, Respuestas a, etc." />
                              </div>

                              <Field label="Título de la sección *" id="vacunas_mitos_titulo" value={heroData.vacunas_mitos_titulo || "Mitos Vacunales"} onChange={v => setHeroData("vacunas_mitos_titulo", v)} placeholder="Mitos Vacunales, Preguntas Frecuentes, etc." fullWidth />

                              <div className="form-group full-width">
                                <label className="form-label" htmlFor="vacunas_mitos_descripcion">Descripción corta de la sección *</label>
                                <textarea id="vacunas_mitos_descripcion" className="form-textarea" value={heroData.vacunas_mitos_descripcion || "Respuestas detalladas a las preguntas y mitos más frecuentes que surgen en la consulta."} onChange={e => setHeroData("vacunas_mitos_descripcion", e.target.value)} placeholder="Respuestas detalladas a las preguntas..." rows={2} />
                              </div>

                              {mitos.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "30px", border: "2px dashed var(--slate-200)", borderRadius: "12px", color: "var(--slate-400)", background: "white" }}>
                                  <span style={{ fontSize: "28px" }}>❓</span>
                                  <p style={{ margin: "8px 0 0 0", fontSize: "13px", fontWeight: 600 }}>No hay preguntas agregadas.</p>
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "350px", overflowY: "auto", paddingRight: "8px" }}>
                                  {mitos.map((item, i) => (
                                    <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "start", background: "white", padding: "16px", borderRadius: "12px", border: "1px solid var(--slate-200)" }}>
                                      <div className="form-grid" style={{ gap: "12px" }}>
                                        <div className="form-group full-width" style={{ marginBottom: 0 }}>
                                          <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>Pregunta o Mito *</label>
                                          <input
                                            className="form-input"
                                            style={{ padding: "8px 12px", fontSize: "13px" }}
                                            value={item.mito}
                                            onChange={e => setMitos(prev => prev.map((x, idx) => idx === i ? { ...x, mito: e.target.value } : x))}
                                            placeholder="Ej: ¿Las vacunas causan autismo? o Mito: 'Las vacunas tienen chips'"
                                            required
                                          />
                                        </div>
                                        <div className="form-group full-width" style={{ marginBottom: 0 }}>
                                          <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>Respuesta Científica / Explicación *</label>
                                          <textarea
                                            className="form-textarea"
                                            style={{ padding: "8px 12px", fontSize: "13px" }}
                                            value={item.respuesta}
                                            onChange={e => setMitos(prev => prev.map((x, idx) => idx === i ? { ...x, respuesta: e.target.value } : x))}
                                            placeholder="Ej: Es completamente falso. Los estudios científicos globales no muestran relación..."
                                            rows={2}
                                            required
                                          />
                                        </div>
                                        <div className="form-group full-width" style={{ marginBottom: 0 }}>
                                          <label className="form-label" style={{ fontSize: "12px", fontWeight: 700 }}>Fuente de Evidencia (Opcional)</label>
                                          <input
                                            className="form-input"
                                            style={{ padding: "8px 12px", fontSize: "13px" }}
                                            value={item.fuente}
                                            onChange={e => setMitos(prev => prev.map((x, idx) => idx === i ? { ...x, fuente: e.target.value } : x))}
                                            placeholder="Ej: Organización Mundial de la Salud (OMS)"
                                          />
                                        </div>
                                      </div>
                                      <div style={{ marginTop: "24px" }}>
                                        <button
                                          type="button"
                                          className="btn btn-outline"
                                          style={{ padding: "8px 12px", borderColor: "var(--rose-200)", color: "var(--rose-600)", background: "white", fontSize: "13px" }}
                                          onClick={() => setMitos(prev => prev.filter((_, idx) => idx !== i))}
                                        >
                                          🗑️ Eliminar
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeSubTab === "catalogo" && (
                    <div className="form-grid">
                      {heroData.habilitar_menu_vacunas === false ? (
                        <div style={{ gridColumn: "1 / -1", padding: "24px", border: "1px dashed var(--slate-300)", borderRadius: "12px", background: "var(--slate-50)", textAlign: "center", color: "var(--slate-500)" }}>
                          <span style={{ fontSize: "28px" }}>🔕</span>
                          <p style={{ marginTop: "12px", fontSize: "13px", fontWeight: 600 }}>La página extra está desactivada.</p>
                          <p style={{ fontSize: "11px", marginTop: "4px" }}>Habilite la página extra en la pestaña 'Menú y Portada' para configurar esta sección.</p>
                        </div>
                      ) : (
                        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "16px", background: "var(--slate-50)", padding: "20px", borderRadius: "12px", border: "1px solid var(--slate-200)", marginTop: "8px" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--slate-900)" }}>Configuración del Catálogo</h4>
                          
                          <div className="form-group full-width">
                            <label className="form-label" htmlFor="vacunas_catalog_tipo">Origen del Contenido del Catálogo</label>
                            <select
                              id="vacunas_catalog_tipo"
                              className="form-input"
                              style={{ padding: "6px 10px", fontSize: "12px", height: "34px", background: "white", width: "100%" }}
                              value={heroData.vacunas_catalog_tipo || "dynamic"}
                              onChange={e => setHeroData("vacunas_catalog_tipo", e.target.value)}
                            >
                              <option value="dynamic">Catálogo Interactivo de Servicios y Productos (Dinámico)</option>
                              <option value="image">Imagen Promocional del Catálogo</option>
                              <option value="pdf">Archivo PDF del Catálogo</option>
                            </select>
                          </div>

                          {heroData.vacunas_catalog_tipo === "image" && (
                            <div style={{ background: "white", padding: "20px", borderRadius: "8px", border: "1px solid var(--slate-200)", marginTop: "8px" }}>
                              <label className="form-label" style={{ fontWeight: 700 }}>Imagen Promocional del Catálogo</label>
                              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" }}>
                                <div style={{ width: "150px", height: "150px", border: "1px dashed var(--slate-300)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)", overflow: "hidden" }}>
                                  {heroData.vacunas_catalog_imagen_url ? (
                                    <img src={heroData.vacunas_catalog_imagen_url} alt="Catálogo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                  ) : (
                                    <span style={{ fontSize: "32px" }}>🖼️</span>
                                  )}
                                </div>
                                <div>
                                  <input type="file" accept="image/*" id="catalog-image-upload" style={{ display: "none" }} onChange={handleCatalogImageUpload} />
                                  <label htmlFor="catalog-image-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "13px", display: "inline-block" }}>
                                    {isPending ? "Subiendo..." : "Subir Imagen del Catálogo"}
                                  </label>
                                  {heroData.vacunas_catalog_imagen_url && (
                                    <p style={{ fontSize: "11px", color: "var(--emerald-600)", marginTop: "6px" }}>
                                      ✓ Archivo cargado: <a href={heroData.vacunas_catalog_imagen_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Ver imagen actual</a>
                                    </p>
                                  )}
                                  <p style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "6px" }}>Formatos recomendados: PNG, JPG, WebP. Se mostrará en lugar del catálogo en la vista pública.</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {heroData.vacunas_catalog_tipo === "pdf" && (
                            <div style={{ background: "white", padding: "20px", borderRadius: "8px", border: "1px solid var(--slate-200)", marginTop: "8px" }}>
                              <label className="form-label" style={{ fontWeight: 700 }}>Archivo PDF del Catálogo</label>
                              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" }}>
                                <div style={{ width: "150px", height: "150px", border: "1px dashed var(--slate-300)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)", overflow: "hidden" }}>
                                  {heroData.vacunas_catalog_pdf_url ? (
                                    <span style={{ fontSize: "48px" }}>📄</span>
                                  ) : (
                                    <span style={{ fontSize: "32px" }}>📁</span>
                                  )}
                                </div>
                                <div>
                                  <input type="file" accept="application/pdf" id="catalog-pdf-upload" style={{ display: "none" }} onChange={handleCatalogPdfUpload} />
                                  <label htmlFor="catalog-pdf-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "13px", display: "inline-block" }}>
                                    {isPending ? "Subiendo..." : "Subir Archivo PDF"}
                                  </label>
                                  {heroData.vacunas_catalog_pdf_url && (
                                    <p style={{ fontSize: "11px", color: "var(--emerald-600)", marginTop: "6px" }}>
                                      ✓ Archivo cargado: <a href={heroData.vacunas_catalog_pdf_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Descargar/Ver PDF actual</a>
                                    </p>
                                  )}
                                  <p style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "6px" }}>Formatos recomendados: PDF. Se mostrará un botón de descarga en la vista pública.</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {(heroData.vacunas_catalog_tipo === "dynamic" || !heroData.vacunas_catalog_tipo) && (
                            <>
                              <Field label="Título para la tabla de Catálogo/Inventario *" id="vacunas_inventario_titulo" value={heroData.vacunas_inventario_titulo || "Servicios Disponibles"} onChange={v => setHeroData("vacunas_inventario_titulo", v)} placeholder="Servicios Disponibles, Portafolio de Tratamientos, etc." fullWidth />

                              <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <input type="checkbox" id="vacunas_mostrar_inventario" checked={heroData.vacunas_mostrar_inventario !== false} onChange={e => setHeroData("vacunas_mostrar_inventario", e.target.checked)} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                                <label htmlFor="vacunas_mostrar_inventario" style={{ fontSize: "14px", fontWeight: 700, color: "var(--slate-700)", cursor: "pointer" }}>Habilitar catálogo de servicios/productos</label>
                              </div>

                              {heroData.vacunas_mostrar_inventario !== false && (
                                <div style={{ background: "white", padding: "20px", borderRadius: "8px", border: "1px solid var(--slate-200)", marginTop: "8px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <div>
                                      <h5 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--slate-800)" }}>Servicios del Catálogo Comercial</h5>
                                      <p style={{ fontSize: "11px", color: "var(--slate-400)", margin: "2px 0 0 0" }}>Administra los servicios comerciales. Dentro de cada servicio puedes asociar múltiples vacunas/productos configurados en tu inventario.</p>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                      <button
                                        type="button"
                                        className="btn btn-outline"
                                        style={{ padding: "6px 12px", fontSize: "12px", background: "white", borderColor: "var(--slate-300)" }}
                                        onClick={() => {
                                          const currentCustom = heroData.vacunas_catalog_custom_items || [];
                                          const newItem = { id: uid(), tipo: "servicio", nombre: "", descripcion: "", categoria: "Servicios", precio: "", productos: [] };
                                          setHeroData("vacunas_catalog_custom_items", [...currentCustom, newItem]);
                                        }}
                                      >
                                        ＋ Agregar Servicio
                                      </button>
                                    </div>
                                  </div>

                                  {(heroData.vacunas_catalog_custom_items || []).length === 0 ? (
                                    <div style={{ textAlign: "center", padding: "30px", border: "2px dashed var(--slate-200)", borderRadius: "8px", color: "var(--slate-400)", background: "white" }}>
                                      <p style={{ margin: 0, fontSize: "12px" }}>No has agregado ningún servicio al catálogo comercial aún.</p>
                                      <p style={{ margin: "4px 0 0 0", fontSize: "11px" }}>Usa el botón superior para agregar un servicio y luego asociar productos del inventario.</p>
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
                                      {(heroData.vacunas_catalog_custom_items || []).map((item: any, idx: number) => {
                                        const isProduct = item.tipo === "producto";
                                        return (
                                          <div key={item.id || idx} style={{ border: "1px solid var(--slate-200)", borderRadius: "8px", padding: "16px", background: "var(--slate-50)", position: "relative" }}>
                                            <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "8px", alignItems: "center", zIndex: 10 }}>
                                              <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: isProduct ? "rgba(16, 185, 129, 0.1)" : "rgba(79, 70, 229, 0.1)", color: isProduct ? "var(--emerald-700)" : "var(--indigo-700)" }}>
                                                {isProduct ? "📦 Producto de Inventario" : "💼 Servicio con Productos"}
                                              </span>
                                              <button
                                                type="button"
                                                style={{ background: "transparent", border: "none", color: "var(--rose-600)", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
                                                onClick={() => {
                                                  const currentCustom = heroData.vacunas_catalog_custom_items || [];
                                                  const updated = currentCustom.filter((x: any) => x.id !== item.id);
                                                  setHeroData("vacunas_catalog_custom_items", updated);
                                                }}
                                              >
                                                🗑 Eliminar
                                              </button>
                                            </div>

                                            {isProduct ? (
                                              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", width: "85%" }}>
                                                <div>
                                                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 700 }}>Seleccionar Producto del Inventario *</label>
                                                  <select
                                                    className="form-input"
                                                    style={{ padding: "6px 10px", fontSize: "12px", height: "34px", background: "white", width: "100%" }}
                                                    value={item.productoId || ""}
                                                    onChange={e => {
                                                      const currentCustom = heroData.vacunas_catalog_custom_items || [];
                                                      const updated = currentCustom.map((x: any) => x.id === item.id ? { ...x, productoId: e.target.value } : x);
                                                      setHeroData("vacunas_catalog_custom_items", updated);
                                                    }}
                                                    required
                                                  >
                                                    <option value="">-- Seleccione un Producto --</option>
                                                    {inventoryItems.map(inv => (
                                                      <option key={inv.id} value={inv.id}>
                                                        {inv.nombre} {inv.nombre_generico ? `(${inv.nombre_generico})` : ""} — {inv.laboratorio || "Sin laboratorio"}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </div>
                                                {item.productoId && (() => {
                                                  const selectedProd = inventoryItems.find(x => x.id === item.productoId);
                                                  if (!selectedProd) return null;
                                                  return (
                                                    <div style={{ marginTop: "4px", background: "white", padding: "10px", borderRadius: "6px", border: "1px solid var(--slate-200)", fontSize: "11px", color: "var(--slate-600)" }}>
                                                      <div><strong>Nombre Genérico / Subtítulo:</strong> {selectedProd.nombre_generico || "Ninguno"}</div>
                                                      <div><strong>Laboratorio / Categoría:</strong> {selectedProd.laboratorio || "Ninguno"}</div>
                                                      <div><strong>Esquema / Detalles:</strong> {selectedProd.esquema_dosis || "Ninguno"}</div>
                                                      <div><strong>Stock disponible:</strong> {selectedProd.stock_actual} unidades ({selectedProd.stock_actual > 0 ? "🟢 Disponible" : "🔴 Agotado"})</div>
                                                      {selectedProd.descripcion && <div style={{ marginTop: "4px" }}><strong>Descripción:</strong> {selectedProd.descripcion}</div>}
                                                    </div>
                                                  );
                                                })()}
                                              </div>
                                            ) : (
                                              <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "95%" }}>
                                                <div className="form-grid" style={{ gap: "8px" }}>
                                                  <div>
                                                    <label className="form-label" style={{ fontSize: "11px", fontWeight: 700 }}>Nombre del Servicio *</label>
                                                    <input
                                                      className="form-input"
                                                      style={{ padding: "6px 10px", fontSize: "12px", height: "34px", background: "white" }}
                                                      value={item.nombre || ""}
                                                      onChange={e => {
                                                        const currentCustom = heroData.vacunas_catalog_custom_items || [];
                                                        const updated = currentCustom.map((x: any) => x.id === item.id ? { ...x, nombre: e.target.value } : x);
                                                        setHeroData("vacunas_catalog_custom_items", updated);
                                                      }}
                                                      placeholder="Ej: Vacunación Infantil o Consulta de Control"
                                                      required
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="form-label" style={{ fontSize: "11px", fontWeight: 700 }}>Categoría *</label>
                                                    <input
                                                      className="form-input"
                                                      style={{ padding: "6px 10px", fontSize: "12px", height: "34px", background: "white" }}
                                                      value={item.categoria || ""}
                                                      onChange={e => {
                                                        const currentCustom = heroData.vacunas_catalog_custom_items || [];
                                                        const updated = currentCustom.map((x: any) => x.id === item.id ? { ...x, categoria: e.target.value } : x);
                                                        setHeroData("vacunas_catalog_custom_items", updated);
                                                      }}
                                                      placeholder="Ej: Vacunas, Consulta, Pediatría"
                                                      required
                                                    />
                                                  </div>
                                                  <div style={{ gridColumn: "1 / -1" }}>
                                                    <label className="form-label" style={{ fontSize: "11px", fontWeight: 700 }}>Descripción del Servicio</label>
                                                    <textarea
                                                      className="form-textarea"
                                                      style={{ padding: "6px 10px", fontSize: "12px", background: "white" }}
                                                      value={item.descripcion || ""}
                                                      onChange={e => {
                                                        const currentCustom = heroData.vacunas_catalog_custom_items || [];
                                                        const updated = currentCustom.map((x: any) => x.id === item.id ? { ...x, descripcion: e.target.value } : x);
                                                        setHeroData("vacunas_catalog_custom_items", updated);
                                                      }}
                                                      placeholder="Breve descripción del servicio o lo que incluye..."
                                                      rows={2}
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="form-label" style={{ fontSize: "11px", fontWeight: 700 }}>Precio (Opcional)</label>
                                                    <input
                                                      className="form-input"
                                                      style={{ padding: "6px 10px", fontSize: "12px", height: "34px", background: "white" }}
                                                      value={item.precio || ""}
                                                      onChange={e => {
                                                        const currentCustom = heroData.vacunas_catalog_custom_items || [];
                                                        const updated = currentCustom.map((x: any) => x.id === item.id ? { ...x, precio: e.target.value } : x);
                                                        setHeroData("vacunas_catalog_custom_items", updated);
                                                      }}
                                                      placeholder="Ej: $150.000 o Gratis"
                                                    />
                                                  </div>
                                                </div>

                                                {/* nested products selector */}
                                                <div style={{ marginTop: "12px", borderTop: "1px dashed var(--slate-300)", paddingTop: "12px" }}>
                                                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "6px", color: "var(--slate-700)" }}>
                                                    Asociar Productos del Inventario a este Servicio
                                                  </label>
                                                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                                    <select
                                                      id={`select-prod-${item.id}`}
                                                      className="form-input"
                                                      style={{ padding: "6px 10px", fontSize: "12px", height: "34px", background: "white", flex: 1 }}
                                                      defaultValue=""
                                                    >
                                                      <option value="">-- Seleccione un Producto --</option>
                                                      {inventoryItems.map(inv => (
                                                        <option key={inv.id} value={inv.id}>
                                                          {inv.nombre} {inv.nombre_generico ? `(${inv.nombre_generico})` : ""} — {inv.laboratorio || "Sin laboratorio"}
                                                        </option>
                                                      ))}
                                                    </select>
                                                    <button
                                                      type="button"
                                                      className="btn btn-emerald"
                                                      style={{ padding: "6px 12px", fontSize: "12px", whiteSpace: "nowrap" }}
                                                      onClick={() => {
                                                        const selectEl = document.getElementById(`select-prod-${item.id}`) as HTMLSelectElement;
                                                        const selectedProdId = selectEl?.value;
                                                        if (!selectedProdId) return;

                                                        const currentCustom = heroData.vacunas_catalog_custom_items || [];
                                                        const updated = currentCustom.map((x: any) => {
                                                          if (x.id === item.id) {
                                                            const currentProds = x.productos || [];
                                                            if (currentProds.includes(selectedProdId)) return x;
                                                            return { ...x, productos: [...currentProds, selectedProdId] };
                                                          }
                                                          return x;
                                                        });
                                                        setHeroData("vacunas_catalog_custom_items", updated);
                                                        if (selectEl) selectEl.value = "";
                                                      }}
                                                    >
                                                      ＋ Asociar
                                                    </button>
                                                  </div>

                                                  {/* List of associated products */}
                                                  {(!item.productos || item.productos.length === 0) ? (
                                                    <p style={{ fontSize: "11px", color: "var(--slate-400)", margin: 0, fontStyle: "italic" }}>
                                                      No hay productos de inventario asociados a este servicio.
                                                    </p>
                                                  ) : (
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                                                      {item.productos.map((prodId: string) => {
                                                        const prod = inventoryItems.find((x: any) => x.id === prodId);
                                                        if (!prod) return null;
                                                        return (
                                                          <div key={prodId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--slate-200)" }}>
                                                            <div style={{ fontSize: "11px", color: "var(--slate-700)" }}>
                                                              <strong>{prod.nombre}</strong> {prod.nombre_generico ? `(${prod.nombre_generico})` : ""} — <span style={{ color: "var(--slate-400)" }}>{prod.laboratorio || "Sin laboratorio"}</span>
                                                            </div>
                                                            <button
                                                              type="button"
                                                              style={{ background: "transparent", border: "none", color: "var(--rose-600)", cursor: "pointer", fontSize: "10px", fontWeight: 700 }}
                                                              onClick={() => {
                                                                const currentCustom = heroData.vacunas_catalog_custom_items || [];
                                                                const updated = currentCustom.map((x: any) => {
                                                                  if (x.id === item.id) {
                                                                    return { ...x, productos: (x.productos || []).filter((id: string) => id !== prodId) };
                                                                  }
                                                                  return x;
                                                                });
                                                                setHeroData("vacunas_catalog_custom_items", updated);
                                                              }}
                                                            >
                                                              Desasociar
                                                            </button>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeSubTab === "banner" && (
                    <div className="form-grid">
                      {heroData.habilitar_menu_vacunas === false ? (
                        <div style={{ gridColumn: "1 / -1", padding: "24px", border: "1px dashed var(--slate-300)", borderRadius: "12px", background: "var(--slate-50)", textAlign: "center", color: "var(--slate-500)" }}>
                          <span style={{ fontSize: "28px" }}>🔕</span>
                          <p style={{ marginTop: "12px", fontSize: "13px", fontWeight: 600 }}>La página extra está desactivada.</p>
                          <p style={{ fontSize: "11px", marginTop: "4px" }}>Habilite la página extra en la pestaña 'Menú y Portada' para configurar esta sección.</p>
                        </div>
                      ) : (
                        <>
                          <div className="form-group full-width" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px", background: "var(--emerald-50)", border: "1px solid var(--emerald-200)", borderRadius: "var(--radius-lg)" }}>
                            <input type="checkbox" id="vacunas_mostrar_banner" checked={heroData.vacunas_mostrar_banner === true} onChange={e => setHeroData("vacunas_mostrar_banner", e.target.checked)} style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                            <label htmlFor="vacunas_mostrar_banner" style={{ fontSize: "15px", fontWeight: 700, color: "var(--emerald-900)", cursor: "pointer" }}>Habilitar banner promocional personalizado</label>
                          </div>

                          {heroData.vacunas_mostrar_banner && (
                            <>
                              <Field label="Texto del Badge del Banner" id="vacunas_banner_badge" value={heroData.vacunas_banner_badge || "PROMOCIÓN"} onChange={v => setHeroData("vacunas_banner_badge", v)} placeholder="Ej: PROMOCIÓN, AGENDAR CITA, etc." />
                              <Field label="Título del Banner *" id="vacunas_banner_titulo" value={heroData.vacunas_banner_titulo || ""} onChange={v => setHeroData("vacunas_banner_titulo", v)} placeholder="Ej: Consulta Especializada y Valoración Integral" />
                              <div className="form-group full-width">
                                <label className="form-label" htmlFor="vacunas_banner_desc">Descripción del Banner *</label>
                                <textarea id="vacunas_banner_desc" className="form-textarea" value={heroData.vacunas_banner_desc || ""} onChange={e => setHeroData("vacunas_banner_desc", e.target.value)} placeholder="Ej: Agende hoy mismo una valoración para su familia..." rows={2} />
                              </div>
                              
                              <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--slate-200)", gridColumn: "1 / -1" }}>
                                <label className="form-label" style={{ fontWeight: 700 }}>Imagen Promocional del Banner</label>
                                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "8px" }}>
                                  <div style={{ width: "120px", height: "120px", border: "1px dashed var(--slate-300)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--slate-50)", overflow: "hidden" }}>
                                    {heroData.vacunas_banner_imagen_url ? (
                                      <img src={heroData.vacunas_banner_imagen_url} alt="Promoción" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                    ) : (
                                      <span style={{ fontSize: "32px" }}>🎁</span>
                                    )}
                                  </div>
                                  <div>
                                    <input type="file" accept="image/*" id="banner-image-upload" style={{ display: "none" }} onChange={handleBannerImageUpload} />
                                    <label htmlFor="banner-image-upload" className="btn btn-outline" style={{ cursor: "pointer", fontSize: "13px", display: "inline-block" }}>
                                      {isPending ? "Subiendo..." : "Subir Imagen Promocional"}
                                    </label>
                                    <p style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "6px" }}>Formatos recomendados: PNG, JPG, WebP. Se mostrará al lado del texto.</p>
                                  </div>
                                </div>
                              </div>

                              <div className="form-grid" style={{ gridColumn: "1 / -1" }}>
                                <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--slate-200)" }}>
                                  <h5 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--slate-800)" }}>Configuración de Botón Principal (Botón 1)</h5>
                                  <Field label="Texto del Botón 1 *" id="vacunas_banner_btn_text" value={heroData.vacunas_banner_btn_text || "Agendar Cita"} onChange={v => setHeroData("vacunas_banner_btn_text", v)} placeholder="Ej: Agendar Cita, Contactar, etc." />
                                  <Field label="Enlace del Botón 1 (Opcional)" id="vacunas_banner_btn_url" value={heroData.vacunas_banner_btn_url || ""} onChange={v => setHeroData("vacunas_banner_btn_url", v)} placeholder="Dejar vacío para usar WhatsApp" />
                                </div>
                                <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--slate-200)" }}>
                                  <h5 style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 12px 0", color: "var(--slate-800)" }}>Configuración de Botón Secundario (Botón 2 - Opcional)</h5>
                                  <Field label="Texto del Botón 2" id="vacunas_banner_btn_2_text" value={heroData.vacunas_banner_btn_2_text || ""} onChange={v => setHeroData("vacunas_banner_btn_2_text", v)} placeholder="Ej: Ver Servicios, Más Información, etc." />
                                  <Field label="Enlace del Botón 2" id="vacunas_banner_btn_2_url" value={heroData.vacunas_banner_btn_2_url || ""} onChange={v => setHeroData("vacunas_banner_btn_2_url", v)} placeholder="URL del sitio o recurso externo" />
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}
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
                  <div className="form-grid" style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid var(--slate-200)" }}>
                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, margin: "0 0 8px 0" }}>Configuración del Título de Sección</h3>
                    <Field label="Título Línea 1" id="inv_title_1" value={heroData.inv_title_1} onChange={v => setHeroData("inv_title_1", v)} placeholder="Ciencia aplicada a la" />
                    <Field label="Título Línea 2" id="inv_title_2" value={heroData.inv_title_2} onChange={v => setHeroData("inv_title_2", v)} placeholder="prevención" />
                  </div>

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
                <SaveBar onSave={saveLineasAndConfig} isPending={isPending} label="Guardar líneas de investigación y títulos" />
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
                  <div className="form-grid" style={{ marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid var(--slate-200)" }}>
                    <h3 style={{ gridColumn: "1 / -1", fontSize: "15px", fontWeight: 700, margin: "0 0 8px 0" }}>Configuración del Título de Sección</h3>
                    <Field label="Texto del Badge" id="tray_badge" value={heroData.tray_badge} onChange={v => setHeroData("tray_badge", v)} placeholder="TRAYECTORIA E INVESTIGACIÓN" fullWidth />
                    <Field label="Título Línea 1" id="tray_title_1" value={heroData.tray_title_1} onChange={v => setHeroData("tray_title_1", v)} placeholder="Décadas construyendo" />
                    <Field label="Título Línea 2" id="tray_title_2" value={heroData.tray_title_2} onChange={v => setHeroData("tray_title_2", v)} placeholder="evidencia científica" />
                  </div>

                  {hitos.length === 0 && <div className="empty-state"><div className="empty-state-icon">🎓</div><div className="empty-state-title">Sin hitos registrados</div></div>}
                  {hitos.map((h, i) => {
                    const parsedInst = parseInstitucion(h.institucion);
                    return (
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
                            <input className="form-input" value={parsedInst.name} onChange={e => setHitos(hs => hs.map((x, j) => j === i ? { ...x, institucion: `${e.target.value}|${parseInstitucion(x.institucion).logo}` } : x))} placeholder="Hospital Garrahan, Buenos Aires" />
                          </div>
                          <div className="form-group full-width" style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "4px" }}>
                            <div style={{ width: "48px", height: "48px", border: "1px dashed var(--slate-300)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "white", overflow: "hidden", flexShrink: 0 }}>
                              {parsedInst.logo ? (
                                <img src={parsedInst.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }} />
                              ) : (
                                <span style={{ fontSize: "20px" }}>🎓</span>
                              )}
                            </div>
                            <div>
                              <input type="file" accept="image/*" id={`logo-hito-${i}`} style={{ display: "none" }} onChange={e => handleHitoLogoUpload(i, e)} />
                              <label htmlFor={`logo-hito-${i}`} className="btn btn-outline" style={{ cursor: "pointer", fontSize: "12px", padding: "6px 12px", display: "inline-block", margin: 0 }}>
                                {isPending ? "Subiendo..." : "Subir Logo de la Institución"}
                              </label>
                              {parsedInst.logo && (
                                <button
                                  type="button"
                                  className="btn btn-link"
                                  style={{ color: "var(--rose-600)", fontSize: "12px", marginLeft: "12px", padding: 0, border: "none", background: "transparent", cursor: "pointer", textDecoration: "underline" }}
                                  onClick={() => setHitos(hs => hs.map((x, j) => j === i ? { ...x, institucion: parseInstitucion(x.institucion).name } : x))}
                                >
                                  Quitar logo
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <button type="button" className="action-btn action-btn-danger" style={{ marginTop: "16px" }} onClick={() => setHitos(hs => hs.filter((_, j) => j !== i))}>🗑 Eliminar Hito</button>
                      </div>
                    );
                  })}
                </div>
                <SaveBar onSave={saveHitosAndConfig} isPending={isPending} label="Guardar trayectoria y títulos" />
              </div>
            )}
            {activeTab === "graficas_oms" && (
              <div className="card tab-pane">
                <div className="card-header">
                  <h2 className="card-title">📈 Gráficas de Crecimiento OMS</h2>
                  <p className="card-desc">Personaliza las imágenes de fondo de las curvas de crecimiento utilizadas en las historias clínicas. Las imágenes recomendadas son capturas limpias de las cuadrículas oficiales de la OMS.</p>
                </div>
                <div className="card-body">
                  <div className="form-grid">
                    {[
                      { id: "peso_talla_ninos_0_2", title: "Peso para la Talla (Niños 0-2 años)" },
                      { id: "peso_edad_ninos_0_2", title: "Peso para la Edad (Niños 0-2 años)" },
                      { id: "peso_talla_ninas_0_2", title: "Peso para la Talla (Niñas 0-2 años)" },
                      { id: "peso_edad_ninas_0_2", title: "Peso para la Edad (Niñas 0-2 años)" },
                    ].map(chart => {
                      const currentUrl = omsCalibrations?.[chart.id]?.image_url;
                      return (
                        <div key={chart.id} style={{ border: "1px solid var(--slate-200)", padding: "16px", borderRadius: "8px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 8px 0" }}>{chart.title}</h3>
                            <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "0 0 12px 0" }}>Elige una imagen clara (jpg/png) de la gráfica oficial.</p>
                            <input 
                              type="file" 
                              id={`upload-${chart.id}`}
                              style={{ display: "none" }}
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                startTransition(async () => {
                                  try {
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    formData.append("tenantId", tenantId);
                                    formData.append("folder", "oms_charts");
                                    const res = await uploadImageAction(formData);
                                    if (res.success && res.publicUrl) {
                                      await saveOmsChartImage(chart.id, res.publicUrl);
                                      setOmsCalibrations(prev => ({
                                        ...prev,
                                        [chart.id]: { ...(prev[chart.id] || {}), image_url: res.publicUrl }
                                      }));
                                      showToast("Imagen subida y guardada exitosamente");
                                    } else {
                                      showToast(res.error || "Error al subir la imagen", "error");
                                    }
                                  } catch (error: any) {
                                    showToast(error.message, "error");
                                  }
                                });
                              }}
                            />
                            <label htmlFor={`upload-${chart.id}`} className="btn btn-outline" style={{ display: "inline-block", cursor: "pointer", fontSize: "12px" }}>
                              {isPending ? "Subiendo..." : "Subir Nueva Imagen"}
                            </label>
                          </div>
                          <div style={{ width: "160px", height: "100px", background: "var(--slate-100)", border: "1px dashed var(--slate-300)", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {currentUrl ? (
                              <img src={currentUrl} alt={chart.title} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            ) : (
                              <span style={{ fontSize: "11px", color: "var(--slate-500)", textAlign: "center", padding: "8px" }}>Usando imagen por defecto</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
