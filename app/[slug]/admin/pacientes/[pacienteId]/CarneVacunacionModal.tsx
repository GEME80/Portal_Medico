"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Syringe, 
  ExternalLink, 
  Check, 
  Plus, 
  Trash2, 
  Calendar, 
  ShieldCheck, 
  X, 
  AlertCircle, 
  Zap, 
  Filter, 
  CheckCircle2, 
  MessageCircle,
  Package,
  Sparkles,
  Info
} from "lucide-react";
import { 
  AplicacionVacuna, 
  getVacunasPaciente, 
  getInventarioVacunasTenant, 
  registrarAplicacionVacuna, 
  eliminarAplicacionVacuna,
  registrarVacunaCombinada
} from "@/lib/actions/vacunas-actions";
import { 
  ESQUEMA_MATRIZ_CANONICO, 
  matchAplicacionFila, 
  getVacunasOtras, 
  FilaEsquema 
} from "@/lib/vacunas/constants";

interface CarneVacunacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: any;
  tenantSlug: string;
  tenantId?: string;
  currentUserRole?: string;
}

function getCategoriaPalette(catId: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    bcg: { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
    polio: { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
    hepb: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
    hib: { bg: "#fefce8", text: "#854d0e", border: "#fde047" },
    dtp: { bg: "#fdf2f8", text: "#9d174d", border: "#fbcfe8" },
    fiebre_amarilla: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
    srp: { bg: "#eef2ff", text: "#4338ca", border: "#c7d2fe" },
    neumococo: { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
    rotavirus: { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa" },
    varicela: { bg: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe" },
    hepa: { bg: "#ecfeff", text: "#0e7490", border: "#a5f3fc" },
    meningococo: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
    vph: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
    influenza: { bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4" },
    otras: { bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" }
  };
  return map[catId] || { bg: "#f8fafc", text: "#334155", border: "#cbd5e1" };
}

function formatearFecha(fechaStr: string) {
  if (!fechaStr) return "--";
  try {
    const parts = fechaStr.split("-");
    if (parts.length === 3) {
      return parts[2] + " / " + parts[1] + " / " + parts[0];
    }
    return fechaStr;
  } catch (e) {
    return fechaStr;
  }
}

const VACUNAS_ESPECIALES_RAPIDAS = [
  {
    nombre: "Fluarix Tetra (Influenza Anual)",
    enfermedad: "INFLUENZA (GRIPE)",
    dosis: "Refuerzo Anual",
    edad: "Cada Año",
    laboratorio: "GSK",
    icono: "💉"
  },
  {
    nombre: "Shingrix (Herpes Zóster)",
    enfermedad: "HERPES ZÓSTER",
    dosis: "1ª Dosis",
    edad: "Adultos / Indicada",
    laboratorio: "GSK",
    icono: "🦠"
  },
  {
    nombre: "Shingrix 2ª (Herpes Zóster)",
    enfermedad: "HERPES ZÓSTER",
    dosis: "2ª Dosis",
    edad: "2 a 6 meses",
    laboratorio: "GSK",
    icono: "🦠"
  },
  {
    nombre: "Qdenga (Dengue)",
    enfermedad: "DENGUE",
    dosis: "1ª Dosis",
    edad: "A partir de 4 Años",
    laboratorio: "Takeda",
    icono: "🦟"
  },
  {
    nombre: "Spikevax (COVID-19 Actualizada)",
    enfermedad: "COVID-19",
    dosis: "Dosis Actualizada",
    edad: "6 meses en adelante",
    laboratorio: "Moderna",
    icono: "🛡️"
  },
  {
    nombre: "Bexsero (Meningococo B)",
    enfermedad: "MENINGOCOCO B",
    dosis: "1ª Dosis",
    edad: "Lactantes / Niños",
    laboratorio: "GSK",
    icono: "🧪"
  }
];

export default function CarneVacunacionModal({
  isOpen,
  onClose,
  paciente,
  tenantSlug,
  tenantId,
  currentUserRole
}: CarneVacunacionModalProps) {
  const [filtroMatriz, setFiltroMatriz] = useState<"todos" | "aplicadas" | "pendientes">("todos");
  const [vacunas, setVacunas] = useState<AplicacionVacuna[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventario, setInventario] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Estados de Popups
  const [isPopupRegistroOpen, setIsPopupRegistroOpen] = useState(false);
  const [isPopupCombinadaOpen, setIsPopupCombinadaOpen] = useState(false);

  // Form State Individual (Popup)
  const [selectedInventarioId, setSelectedInventarioId] = useState<string>("");
  const [descontarStock, setDescontarStock] = useState<boolean>(true);
  const [nombreVacuna, setNombreVacuna] = useState("");
  const [enfermedadPrevenida, setEnfermedadPrevenida] = useState("");
  const [dosis, setDosis] = useState("1ra Dosis");
  const [edadAplicacion, setEdadAplicacion] = useState("");
  const [fechaAplicacion, setFechaAplicacion] = useState(new Date().toISOString().split("T")[0]);
  const [numeroLote, setNumeroLote] = useState("");
  const [laboratorio, setLaboratorio] = useState("");
  const [viaAdmin, setViaAdmin] = useState("Intramuscular");
  const [sitioAplicacion, setSitioAplicacion] = useState("Deltoides derecho");
  const [profesionalNombre, setProfesionalNombre] = useState("Dr. Carlos Torres");
  const [origen, setOrigen] = useState<"institucional" | "externo">("institucional");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State Vacuna Combinada (Hexavalente / Tetraxim)
  const [tipoCombinada, setTipoCombinada] = useState<"HEXAVALENTE" | "TETRAXIM">("HEXAVALENTE");
  const [dosisCombinada, setDosisCombinada] = useState<"1" | "2" | "3" | "ref1" | "ref2">("1");
  const [nombreComercialCombinada, setNombreComercialCombinada] = useState("Hexaxim");
  const [loteCombinada, setLoteCombinada] = useState("");
  const [laboratorioCombinada, setLaboratorioCombinada] = useState("Sanofi Pasteur");
  const [fechaCombinada, setFechaCombinada] = useState(new Date().toISOString().split("T")[0]);
  const [profesionalCombinada, setProfesionalCombinada] = useState("Dr. Carlos Torres");
  const [selectedInvCombinadaId, setSelectedInvCombinadaId] = useState<string>("");
  const [descontarStockCombinada, setDescontarStockCombinada] = useState(true);
  const [savingCombinada, setSavingCombinada] = useState(false);

  useEffect(() => {
    if (isOpen && paciente?.id) {
      loadData();
    }
  }, [isOpen, paciente?.id]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [resVacunas, resInv] = await Promise.all([
        getVacunasPaciente(paciente.id),
        tenantId ? getInventarioVacunasTenant(tenantId) : Promise.resolve({ success: true, data: [] })
      ]);

      if (resVacunas.success && resVacunas.data) {
        setVacunas(resVacunas.data);
      }
      if (resInv.success && resInv.data) {
        setInventario(resInv.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const getPublicCarneUrl = () => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    return origin + "/" + tenantSlug + "/carne/" + paciente.token_acceso;
  };

  const handleCopyLink = () => {
    const url = getPublicCarneUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = getPublicCarneUrl();
    const phone = paciente.telefono || paciente.telefono_madre || paciente.telefono_padre || paciente.telefono_acompanante || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    
    const message = encodeURIComponent(
      `Hola, le compartimos el Carnét Oficial de Vacunación Digital de *${paciente.nombres} ${paciente.apellidos || ""}* emitido por el consultorio del *Dr. Carlos Torres Martínez*:\n\n🔗 ${url}\n\nPuede consultarlo, guardarlo o descargarlo en PDF en 1 sola hoja en cualquier momento.`
    );
    
    const waUrl = cleanPhone 
      ? "https://wa.me/" + cleanPhone + "?text=" + message
      : "https://wa.me/?text=" + message;
      
    window.open(waUrl, "_blank");
  };

  // Abrir popup desde una fila específica del carnét
  const handleOpenRegistroFila = (fila: FilaEsquema) => {
    setSelectedInventarioId("");
    setNombreVacuna(fila.biologicoSugerido);
    setEnfermedadPrevenida(fila.enfermedadPrevenida);
    setDosis(fila.dosis);
    setEdadAplicacion(fila.edad);
    setNumeroLote("");
    setLaboratorio("");
    setFechaAplicacion(new Date().toISOString().split("T")[0]);
    setErrorMsg("");
    setIsPopupRegistroOpen(true);
  };

  // Abrir popup para registro general o desde inventario
  const handleOpenRegistroGeneral = () => {
    setSelectedInventarioId("");
    setNombreVacuna("");
    setEnfermedadPrevenida("");
    setDosis("1ra Dosis");
    setEdadAplicacion("");
    setNumeroLote("");
    setLaboratorio("");
    setFechaAplicacion(new Date().toISOString().split("T")[0]);
    setErrorMsg("");
    setIsPopupRegistroOpen(true);
  };

  // Al seleccionar biológico del stock en el popup
  const handleSelectInventario = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const invId = e.target.value;
    setSelectedInventarioId(invId);
    if (!invId) return;
    const item = inventario.find(i => i.id === invId);
    if (item) {
      setNombreVacuna(item.nombre);
      setEnfermedadPrevenida(item.enfermedad_prevenida || "");
      setLaboratorio(item.laboratorio || "");
      setNumeroLote(item.lote_activo || "");
      setDescontarStock(true);
    }
  };

  // Aplicar vacuna rápida (Influenza Anual, Zóster, etc.)
  const handleSelectEspecialRapida = (v: typeof VACUNAS_ESPECIALES_RAPIDAS[0]) => {
    setSelectedInventarioId("");
    setNombreVacuna(v.nombre);
    setEnfermedadPrevenida(v.enfermedad);
    setDosis(v.dosis);
    setEdadAplicacion(v.edad);
    setLaboratorio(v.laboratorio);
    // Verificar si hay match en inventario por nombre
    const invMatch = inventario.find(i => i.nombre.toLowerCase().includes(v.nombre.toLowerCase().split(" ")[0]));
    if (invMatch) {
      setSelectedInventarioId(invMatch.id);
      setNumeroLote(invMatch.lote_activo || "");
      setDescontarStock(true);
    } else {
      setNumeroLote("");
    }
  };

  const handleSubmitRegistroVacuna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreVacuna.trim()) {
      setErrorMsg("El nombre de la vacuna es requerido.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const res = await registrarAplicacionVacuna({
      paciente_id: paciente.id,
      vacuna_id: selectedInventarioId || null,
      nombre_vacuna: nombreVacuna,
      enfermedad_prevenida: enfermedadPrevenida,
      dosis,
      edad_aplicacion: edadAplicacion,
      fecha_aplicacion: fechaAplicacion,
      numero_lote: numeroLote,
      laboratorio,
      via_administracion: viaAdmin,
      sitio_aplicacion: sitioAplicacion,
      profesional_nombre: profesionalNombre,
      origen,
      observaciones,
      proxima_cita_sugerida: null,
      descontar_stock: descontarStock && !!selectedInventarioId
    }, tenantSlug);

    setSaving(false);

    if (res.success) {
      setSuccessMsg("✓ Vacuna registrada con éxito en el Carnét Digital");
      setTimeout(() => setSuccessMsg(""), 3500);
      setIsPopupRegistroOpen(false);
      loadData();
    } else {
      setErrorMsg(res.error || "No se pudo registrar la vacuna.");
    }
  };

  const handleSubmitCombinada = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCombinada(true);
    setErrorMsg("");

    const res = await registrarVacunaCombinada({
      paciente_id: paciente.id,
      tipo_combinada: tipoCombinada,
      dosis_numero: dosisCombinada,
      nombre_comercial: nombreComercialCombinada,
      fecha_aplicacion: fechaCombinada,
      numero_lote: loteCombinada,
      laboratorio: laboratorioCombinada,
      profesional_nombre: profesionalCombinada,
      origen: "institucional",
      vacuna_id: selectedInvCombinadaId || null,
      descontar_stock: descontarStockCombinada && !!selectedInvCombinadaId,
      observaciones: "Esquema combinado " + tipoCombinada
    }, tenantSlug);

    setSavingCombinada(false);

    if (res.success) {
      setSuccessMsg("✓ " + tipoCombinada + " registrada con éxito. Esquema actualizado.");
      setTimeout(() => setSuccessMsg(""), 3500);
      setIsPopupCombinadaOpen(false);
      loadData();
    } else {
      setErrorMsg(res.error || "No se pudo registrar la vacuna combinada.");
    }
  };

  const handleDeleteVacuna = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este registro de vacunación?")) return;
    setDeletingId(id);
    const res = await eliminarAplicacionVacuna(id, tenantSlug);
    setDeletingId(null);
    if (res.success) {
      loadData();
    } else {
      alert("Error al eliminar el registro.");
    }
  };

  // Emparejamiento canónico
  const { matchesMap, vacunasOtras } = useMemo(() => {
    const claimedIds = new Set<string>();
    const map = new Map<string, AplicacionVacuna>();

    for (const cat of ESQUEMA_MATRIZ_CANONICO) {
      for (const fila of cat.filas) {
        const matched = matchAplicacionFila(vacunas, fila, claimedIds);
        if (matched) {
          claimedIds.add(matched.id);
          map.set(fila.id, matched);
        }
      }
    }

    const otras = getVacunasOtras(vacunas, claimedIds);
    return { matchesMap: map, vacunasOtras: otras };
  }, [vacunas]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.7)",
      backdropFilter: "blur(6px)",
      zIndex: 1100,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "16px"
    }}>
      <div style={{
        background: "white",
        width: "100%",
        maxWidth: "1180px",
        maxHeight: "94vh",
        borderRadius: "18px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative"
      }}>
        {/* ── HEADER DEL MODAL (TÍTULO EN BLANCO Y ACCIONES DEL DOCTOR) ── */}
        <div style={{
          padding: "16px 24px",
          background: "linear-gradient(135deg, #0A4D5C 0%, #062b33 100%)",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.12)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "rgba(0, 212, 170, 0.2)",
              color: "#00D4AA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Syringe size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  color: "#ffffff"
                }}>
                  Carnét de Vacunación Pediátrica
                </h2>
                <span style={{
                  background: "rgba(0, 212, 170, 0.2)",
                  color: "#5ff2d0",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "10.5px",
                  fontWeight: 800
                }}>
                  Matriz Oficial
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "12.5px", color: "rgba(255,255,255,0.85)" }}>
                Paciente: <strong style={{ color: "#ffffff" }}>{paciente.nombres} {paciente.apellidos}</strong> • {paciente.tipo_documento} {paciente.documento} • ({vacunas.length} vacunas registradas)
              </p>
            </div>
          </div>

          {/* ACCIONES CLÍNICAS DEL DOCTOR */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={handleOpenRegistroGeneral}
              style={{
                background: "#00D4AA",
                color: "#0f172a",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 2px 8px rgba(0, 212, 170, 0.35)"
              }}
              title="Registrar vacuna desde inventario o manual"
            >
              <Plus size={15} strokeWidth={3} />
              + Registrar Vacuna
            </button>

            <button
              onClick={() => setIsPopupCombinadaOpen(true)}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.25)",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
              title="Registrar Hexaxim o Tetraxim en 1 clic"
            >
              <Zap size={14} color="#facc15" />
              ⚡ Combinada (Hexa/Tetra)
            </button>

            <button
              onClick={handleShareWhatsApp}
              style={{
                background: "#25D366",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 2px 6px rgba(37, 211, 102, 0.3)"
              }}
              title="Enviar carné oficial por WhatsApp a los padres"
            >
              <MessageCircle size={14} /> Enviar a WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              style={{
                background: copiedLink ? "#10b981" : "rgba(255,255,255,0.12)",
                color: "white",
                border: "none",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
              title="Copiar enlace del carnét"
            >
              {copiedLink ? <Check size={14} /> : <ExternalLink size={14} />}
              {copiedLink ? "¡Copiado!" : "Copiar"}
            </button>

            <a
              href={"/" + tenantSlug + "/carne/" + paciente.token_acceso}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "white",
                textDecoration: "none",
                padding: "8px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
              title="Abrir vista pública del carnét"
            >
              Ver Carnét ↗
            </a>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "white",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginLeft: "2px"
              }}
              title="Cerrar modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── BARRA DE HERRAMIENTAS Y FILTROS DEL CARNÉT ── */}
        <div style={{
          padding: "10px 24px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 700, marginRight: "4px" }}>
              Filtrar Esquema:
            </span>
            {(["todos", "aplicadas", "pendientes"] as const).map((modo) => (
              <button
                key={modo}
                onClick={() => setFiltroMatriz(modo)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "16px",
                  border: "1px solid " + (filtroMatriz === modo ? "#0A4D5C" : "#cbd5e1"),
                  background: filtroMatriz === modo ? "#0A4D5C" : "#ffffff",
                  color: filtroMatriz === modo ? "#ffffff" : "#475569",
                  fontSize: "11.5px",
                  fontWeight: filtroMatriz === modo ? 700 : 500,
                  cursor: "pointer"
                }}
              >
                {modo === "todos" ? "Todas Las Dosis" : modo === "aplicadas" ? ("Solo Aplicadas (" + vacunas.length + ")") : "Solo Pendientes"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>
              Haga clic en <strong style={{ color: "#0A4D5C" }}>+ Registrar</strong> en cualquier fila para registrar la dosis.
            </span>
          </div>
        </div>

        {/* ── CUERPO PRINCIPAL: EL CARNÉT OFICIAL DE 7 COLUMNAS ── */}
        <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1, background: "#ffffff" }}>
          {successMsg && (
            <div style={{
              background: "#ecfdf5",
              border: "1px solid #10b981",
              color: "#065f46",
              padding: "8px 14px",
              borderRadius: "8px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12.5px",
              fontWeight: 700
            }}>
              <Check size={16} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: "#fff1f2",
              border: "1px solid #f43f5e",
              color: "#9f1239",
              padding: "8px 14px",
              borderRadius: "8px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12.5px"
            }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
              <Syringe size={32} style={{ animation: "bounce 1s infinite", margin: "0 auto 12px", color: "#00D4AA" }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Cargando esquema vacunal...</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11.5px",
                lineHeight: 1.2
              }}>
                <thead>
                  <tr style={{ background: "#0A4D5C", color: "white" }}>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "left", width: "18%", color: "white" }}>
                      ME PROTEGE DE
                    </th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", width: "12%", color: "white" }}>
                      EDAD
                    </th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", width: "9%", color: "white" }}>
                      DOSIS
                    </th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", width: "13%", color: "white" }}>
                      FECHA DE APLICACIÓN
                    </th>
                    <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1", textAlign: "left", width: "21%", color: "white" }}>
                      NOMBRE
                    </th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", width: "11%", color: "white" }}>
                      NÚMERO DE LOTE
                    </th>
                    <th style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", width: "16%", color: "white" }}>
                      FIRMA / ACCIÓN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ESQUEMA_MATRIZ_CANONICO.map((cat) => {
                    const palette = getCategoriaPalette(cat.id);
                    return cat.filas.map((fila, filaIdx) => {
                      const app = matchesMap.get(fila.id);
                      const isApplied = !!app;

                      if (filtroMatriz === "aplicadas" && !isApplied) return null;
                      if (filtroMatriz === "pendientes" && isApplied) return null;

                      return (
                        <tr
                          key={fila.id}
                          style={{
                            background: isApplied ? "#f0fdf4" : filaIdx % 2 === 0 ? "#ffffff" : "#fbfcfd"
                          }}
                        >
                          {filaIdx === 0 && (
                            <td
                              rowSpan={cat.filas.length}
                              style={{
                                padding: "6px 8px",
                                fontWeight: 800,
                                verticalAlign: "middle",
                                border: "1px solid #cbd5e1",
                                background: palette.bg,
                                color: palette.text,
                                fontSize: "11px",
                                lineHeight: 1.2
                              }}
                            >
                              {cat.titulo}
                            </td>
                          )}

                          <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#334155", fontWeight: 600 }}>
                            {fila.edad}
                          </td>

                          <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 800, color: isApplied ? "#065f46" : "#0f172a" }}>
                            {fila.dosis}
                          </td>

                          <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: isApplied ? 800 : 400 }}>
                            {isApplied ? (
                              <strong style={{ color: "#0f172a" }}>
                                {formatearFecha(app.fecha_aplicacion)}
                              </strong>
                            ) : (
                              <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>-- / -- / ----</span>
                            )}
                          </td>

                          <td style={{ padding: "6px 10px", border: "1px solid #cbd5e1" }}>
                            {isApplied ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <Check size={13} color="#10b981" strokeWidth={3} />
                                <strong style={{ color: "#065f46" }}>
                                  {app.nombre_vacuna}
                                </strong>
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "10.5px" }}>
                                ({fila.biologicoSugerido})
                              </span>
                            )}
                          </td>

                          <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                            {isApplied ? (
                              <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "1px 6px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700, color: "#1e293b", border: "1px solid #e2e8f0" }}>
                                {app.numero_lote || "S/L"}
                              </span>
                            ) : (
                              <span style={{ color: "#cbd5e1" }}>--</span>
                            )}
                          </td>

                          <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                            {isApplied ? (
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#065f46", background: "#d1fae5", padding: "1px 6px", borderRadius: "4px" }}>
                                  ✓ {app.profesional_nombre || "Dr. Carlos Torres"}
                                </span>
                                <button
                                  onClick={() => handleDeleteVacuna(app.id)}
                                  disabled={deletingId === app.id}
                                  title="Eliminar registro"
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#ef4444",
                                    cursor: "pointer",
                                    padding: "2px"
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenRegistroFila(fila)}
                                style={{
                                  background: "#00D4AA",
                                  color: "#0f172a",
                                  border: "none",
                                  padding: "3px 8px",
                                  borderRadius: "5px",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  boxShadow: "0 1px 3px rgba(0, 212, 170, 0.3)"
                                }}
                              >
                                <Plus size={11} strokeWidth={3} /> Registrar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}

                  {/* SECCIÓN OTRAS VACUNAS (ZÓSTER, INFLUENZA ANUAL EXTRA, DENGUE, COVID, ETC.) */}
                  {vacunasOtras.length > 0 ? (
                    vacunasOtras.map((otra, idx) => (
                      <tr key={otra.id || idx} style={{ background: "#f0fdf4" }}>
                        {idx === 0 && (
                          <td
                            rowSpan={vacunasOtras.length}
                            style={{
                              padding: "6px 8px",
                              fontWeight: 800,
                              verticalAlign: "middle",
                              border: "1px solid #cbd5e1",
                              background: "#f1f5f9",
                              color: "#334155",
                              fontSize: "11px"
                            }}
                          >
                            OTRAS / ANUALES
                          </td>
                        )}
                        <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>{otra.edad_aplicacion || "--"}</td>
                        <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 800 }}>{otra.dosis || "Única"}</td>
                        <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 800 }}>{formatearFecha(otra.fecha_aplicacion)}</td>
                        <td style={{ padding: "6px 10px", border: "1px solid #cbd5e1", fontWeight: 800, color: "#065f46" }}>✓ {otra.nombre_vacuna}</td>
                        <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontFamily: "monospace" }}>{otra.numero_lote || "S/L"}</td>
                        <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#065f46", background: "#d1fae5", padding: "1px 6px", borderRadius: "4px" }}>
                              ✓ {otra.profesional_nombre || "Dr. Carlos Torres"}
                            </span>
                            <button
                              onClick={() => handleDeleteVacuna(otra.id)}
                              title="Eliminar registro"
                              style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px" }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr style={{ background: "#ffffff" }}>
                      <td style={{ padding: "6px 8px", fontWeight: 800, border: "1px solid #cbd5e1", background: "#f1f5f9", color: "#475569" }}>
                        OTRAS / ANUALES
                      </td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#94a3b8" }}>--</td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#94a3b8" }}>--</td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#cbd5e1" }}>-- / -- / ----</td>
                      <td style={{ padding: "6px 10px", border: "1px solid #cbd5e1", color: "#94a3b8", fontStyle: "italic", fontSize: "10.5px" }}>
                        (Zóster, Influenza Anual, Dengue, COVID-19, etc.)
                      </td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#cbd5e1" }}>--</td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                        <button
                          onClick={handleOpenRegistroGeneral}
                          style={{
                            background: "#f1f5f9",
                            color: "#0A4D5C",
                            border: "1px solid #cbd5e1",
                            padding: "3px 8px",
                            borderRadius: "5px",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          + Agregar Otra
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── FOOTER DISCRETO DEL MODAL ── */}
        <div style={{
          padding: "10px 24px",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ fontSize: "11.5px", color: "#64748b" }}>
            🔒 Carnét médico encriptado con token seguro para el paciente y acudientes.
          </span>
          <button
            onClick={onClose}
            style={{
              background: "#e2e8f0",
              color: "#334155",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Cerrar Ventana
          </button>
        </div>

        {/* ============================================================ */}
        {/* POPUP MODAL 1: REGISTRAR VACUNA INDIVIDUAL / INVENTARIO      */}
        {/* ============================================================ */}
        {isPopupRegistroOpen && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1200,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px"
          }}>
            <div style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid #cbd5e1"
            }}>
              {/* Header Popup */}
              <div style={{
                padding: "14px 20px",
                background: "#0A4D5C",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Syringe size={18} color="#00D4AA" />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>
                    Registrar Vacuna en el Carnét
                  </h3>
                </div>
                <button
                  onClick={() => setIsPopupRegistroOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body Popup */}
              <form onSubmit={handleSubmitRegistroVacuna} style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
                
                {/* 1. SELECCIÓN DESDE STOCK DEL CONSULTORIO */}
                {inventario.length > 0 && (
                  <div style={{
                    background: "#f0fdfa",
                    border: "1px solid #99f6e4",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    marginBottom: "14px"
                  }}>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "#0A4D5C", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                      <Package size={13} /> Seleccionar Biológico del Inventario del Consultorio:
                    </label>
                    <select
                      value={selectedInventarioId}
                      onChange={handleSelectInventario}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #0A4D5C",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "#ffffff",
                        color: "#0f172a"
                      }}
                    >
                      <option value="">-- Seleccionar de Stock del Consultorio (opcional) --</option>
                      {inventario.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.nombre} ({item.laboratorio || "Lab"}) • Lote: {item.lote_activo || "S/L"} • Stock: {item.stock_actual} dosis disp.
                        </option>
                      ))}
                    </select>

                    {selectedInventarioId && (
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "11.5px", color: "#065f46", fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={descontarStock}
                          onChange={(e) => setDescontarStock(e.target.checked)}
                        />
                        Descontar 1 dosis física del inventario automáticamente
                      </label>
                    )}
                  </div>
                )}

                {/* 2. ATAJOS DE VACUNAS ESPECIALES / ANUALES (ZÓSTER, INFLUENZA, DENGUE, ETC.) */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                    ⚡ Atajos para Vacunas Anuales / Especiales (Independientes de Edad):
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {VACUNAS_ESPECIALES_RAPIDAS.map((v, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectEspecialRapida(v)}
                        style={{
                          background: nombreVacuna === v.nombre ? "#0A4D5C" : "#f1f5f9",
                          color: nombreVacuna === v.nombre ? "#ffffff" : "#1e293b",
                          border: "1px solid " + (nombreVacuna === v.nombre ? "#0A4D5C" : "#cbd5e1"),
                          padding: "4px 9px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <span>{v.icono}</span>
                        <span>{v.nombre.split("(")[0].trim()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. CAMPOS DE DETALLE DE LA APLICACIÓN */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Nombre de la Vacuna / Biológico: *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombreVacuna}
                      onChange={(e) => setNombreVacuna(e.target.value)}
                      placeholder="Ej: Fluarix Tetra, Shingrix, Prevenar-13..."
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 600,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Enfermedad Prevenida:
                    </label>
                    <input
                      type="text"
                      value={enfermedadPrevenida}
                      onChange={(e) => setEnfermedadPrevenida(e.target.value)}
                      placeholder="Ej: INFLUENZA, HERPES ZÓSTER..."
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Dosis: *
                    </label>
                    <input
                      type="text"
                      required
                      value={dosis}
                      onChange={(e) => setDosis(e.target.value)}
                      placeholder="Ej: 1ª, Refuerzo Anual, Única..."
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Edad de Aplicación:
                    </label>
                    <input
                      type="text"
                      value={edadAplicacion}
                      onChange={(e) => setEdadAplicacion(e.target.value)}
                      placeholder="Ej: Cada Año, Adultos, 2º Mes..."
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Fecha de Aplicación: *
                    </label>
                    <input
                      type="date"
                      required
                      value={fechaAplicacion}
                      onChange={(e) => setFechaAplicacion(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Número de Lote:
                    </label>
                    <input
                      type="text"
                      value={numeroLote}
                      onChange={(e) => setNumeroLote(e.target.value.toUpperCase())}
                      placeholder="Ej: A21CP633A"
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Laboratorio Fabricante:
                    </label>
                    <input
                      type="text"
                      value={laboratorio}
                      onChange={(e) => setLaboratorio(e.target.value)}
                      placeholder="Ej: Sanofi, GSK, Pfizer..."
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Profesional Vacunador:
                    </label>
                    <input
                      type="text"
                      value={profesionalNombre}
                      onChange={(e) => setProfesionalNombre(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#065f46",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                {/* Footer Botones Popup */}
                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e2e8f0"
                }}>
                  <button
                    type="button"
                    onClick={() => setIsPopupRegistroOpen(false)}
                    style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      background: "#0A4D5C",
                      color: "white",
                      border: "none",
                      padding: "8px 20px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: saving ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      boxShadow: "0 2px 6px rgba(10, 77, 92, 0.25)"
                    }}
                  >
                    <Check size={15} />
                    {saving ? "Guardando..." : "Guardar y Registrar en Carnét"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* POPUP MODAL 2: REGISTRAR VACUNA COMBINADA (HEXA / TETRA)     */}
        {/* ============================================================ */}
        {isPopupCombinadaOpen && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 1200,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px"
          }}>
            <div style={{
              background: "#ffffff",
              width: "100%",
              maxWidth: "580px",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              overflow: "hidden",
              border: "1px solid #cbd5e1"
            }}>
              {/* Header Combinada */}
              <div style={{
                padding: "14px 20px",
                background: "linear-gradient(135deg, #0A4D5C 0%, #083c48 100%)",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Zap size={18} color="#facc15" />
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>
                    Registrar Vacuna Combinada Multicomponente
                  </h3>
                </div>
                <button
                  onClick={() => setIsPopupCombinadaOpen(false)}
                  style={{ background: "transparent", border: "none", color: "white", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitCombinada} style={{ padding: "18px 20px" }}>
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  marginBottom: "14px",
                  fontSize: "11.5px",
                  color: "#166534"
                }}>
                  💡 <strong>1 Solo Clic:</strong> Registra simultáneamente las 4 patologías (Polio, Hep B, Hib, DTP) y deduce solo 1 dosis física del inventario.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Tipo de Vacuna:
                    </label>
                    <select
                      value={tipoCombinada}
                      onChange={(e) => {
                        const t = e.target.value as "HEXAVALENTE" | "TETRAXIM";
                        setTipoCombinada(t);
                        setNombreComercialCombinada(t === "HEXAVALENTE" ? "Hexaxim" : "Tetraxim");
                        setDosisCombinada(t === "HEXAVALENTE" ? "1" : "ref1");
                      }}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700
                      }}
                    >
                      <option value="HEXAVALENTE">Hexavalente (Polio + HepB + Hib + DTP)</option>
                      <option value="TETRAXIM">Tetraxim (Polio + DTP Refuerzo)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Dosis a Registrar:
                    </label>
                    <select
                      value={dosisCombinada}
                      onChange={(e) => setDosisCombinada(e.target.value as any)}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700
                      }}
                    >
                      {tipoCombinada === "HEXAVALENTE" ? (
                        <>
                          <option value="1">1ª Dosis (2º Mes)</option>
                          <option value="2">2ª Dosis (4º Mes)</option>
                          <option value="3">3ª Dosis (6º Mes)</option>
                        </>
                      ) : (
                        <>
                          <option value="ref1">1er Refuerzo (18 Meses)</option>
                          <option value="ref2">2º Refuerzo (5 Años)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Fecha de Aplicación:
                    </label>
                    <input
                      type="date"
                      required
                      value={fechaCombinada}
                      onChange={(e) => setFechaCombinada(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Número de Lote:
                    </label>
                    <input
                      type="text"
                      value={loteCombinada}
                      onChange={(e) => setLoteCombinada(e.target.value.toUpperCase())}
                      placeholder="Ej: A21CP633A"
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontFamily: "monospace",
                        fontWeight: 700
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                  marginTop: "16px",
                  paddingTop: "12px",
                  borderTop: "1px solid #e2e8f0"
                }}>
                  <button
                    type="button"
                    onClick={() => setIsPopupCombinadaOpen(false)}
                    style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={savingCombinada}
                    style={{
                      background: "#0A4D5C",
                      color: "white",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 800,
                      cursor: savingCombinada ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Zap size={14} color="#facc15" />
                    {savingCombinada ? "Registrando..." : "Registrar Vacunas Combinadas"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
