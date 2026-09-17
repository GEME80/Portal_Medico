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

  // Estados del Popup Unificado de Registro
  const [isPopupRegistroOpen, setIsPopupRegistroOpen] = useState(false);

  // Form State Vacuna (Individual / Inventario)
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

  // Modo Vacuna Combinada (Multicomponente Hexavalente / Tetraxim) integrado
  const [esCombinada, setEsCombinada] = useState<boolean>(false);
  const [tipoCombinada, setTipoCombinada] = useState<"HEXAVALENTE" | "TETRAXIM">("HEXAVALENTE");
  const [dosisCombinada, setDosisCombinada] = useState<"1" | "2" | "3" | "ref1" | "ref2">("1");

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

      if (resVacunas.success) {
        setVacunas(resVacunas.data || []);
      }
      if (resInv.success) {
        setInventario(resInv.data || []);
      }
    } catch (err: any) {
      setErrorMsg("Error al cargar la información del carnét.");
    } finally {
      setLoading(false);
    }
  };

  const getPublicCarneUrl = () => {
    if (typeof window === "undefined") return "";
    const token = paciente.token_acceso || paciente.id;
    return `${window.location.origin}/${tenantSlug}/carne/${token}`;
  };

  const handleCopyLink = () => {
    const url = getPublicCarneUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const carnetUrl = getPublicCarneUrl();
    const phone = paciente.telefono || paciente.telefono_madre || paciente.telefono_padre || paciente.telefono_contacto || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Hola, le compartimos el Carnét Oficial de Vacunación Digital de *${paciente.nombres} ${paciente.apellidos || ""}* emitido por el consultorio del *Dr. Carlos Torres Martínez*:\n\n🔗 ${carnetUrl}\n\nPuede consultarlo, guardarlo o descargarlo en PDF en 1 sola hoja en cualquier momento.`
    );
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
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
    setEsCombinada(false);

    // Búsqueda inteligente de correspondencia en el inventario de vacunas
    const query = fila.biologicoSugerido.toLowerCase();
    const invMatch = inventario.find(i => {
      const nom = i.nombre.toLowerCase();
      return nom.includes(query) || query.includes(nom);
    });

    if (invMatch) {
      setSelectedInventarioId(invMatch.id);
      setNombreVacuna(invMatch.nombre);
      setLaboratorio(invMatch.laboratorio || "");
      setNumeroLote(invMatch.lote_activo || "");
      if (invMatch.via_admin) setViaAdmin(invMatch.via_admin);
      setDescontarStock(true);
    }

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
    setEsCombinada(false);
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
      setEnfermedadPrevenida(item.enfermedad || item.nombre_generico || "");
      setLaboratorio(item.laboratorio || "");
      setNumeroLote(item.lote_activo || "");
      if (item.via_admin) setViaAdmin(item.via_admin);
      setDescontarStock(true);

      // Si es una vacuna combinada común (Hexavalente o Tetraxim), sugerir esquema combinado
      const isHexa = item.nombre.toLowerCase().includes("hexa");
      const isTetra = item.nombre.toLowerCase().includes("tetra") && !item.nombre.toLowerCase().includes("fluarix");
      if (isHexa) {
        setEsCombinada(true);
        setTipoCombinada("HEXAVALENTE");
      } else if (isTetra) {
        setEsCombinada(true);
        setTipoCombinada("TETRAXIM");
      }
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

    if (esCombinada) {
      const res = await registrarVacunaCombinada({
        paciente_id: paciente.id,
        tipo_combinada: tipoCombinada,
        dosis_numero: dosisCombinada,
        nombre_comercial: nombreVacuna.trim() || (tipoCombinada === "HEXAVALENTE" ? "Hexaxim" : "Tetraxim"),
        fecha_aplicacion: fechaAplicacion,
        numero_lote: numeroLote,
        laboratorio: laboratorio || "Sanofi Pasteur",
        profesional_nombre: profesionalNombre,
        origen,
        vacuna_id: selectedInventarioId || null,
        descontar_stock: descontarStock && !!selectedInventarioId,
        observaciones: observaciones || `Esquema combinado ${tipoCombinada}`
      }, tenantSlug);

      setSaving(false);

      if (res.success) {
        setSuccessMsg(`✓ Vacuna combinada ${tipoCombinada} registrada con éxito. Esquema actualizado.`);
        setTimeout(() => setSuccessMsg(""), 4000);
        setIsPopupRegistroOpen(false);
        loadData();
      } else {
        setErrorMsg(res.error || "No se pudo registrar la vacuna combinada.");
      }
      return;
    }

    const res = await registrarAplicacionVacuna({
      paciente_id: paciente.id,
      vacuna_id: selectedInventarioId || null,
      nombre_vacuna: nombreVacuna.trim(),
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
                
                {/* 1. SELECCIÓN DESDE STOCK DEL CONSULTORIO (ÚNICAMENTE VACUNAS / BIOLÓGICOS) */}
                {inventario.length > 0 && (
                  <div style={{
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    borderRadius: "10px",
                    padding: "12px",
                    marginBottom: "14px"
                  }}>
                    <label style={{ fontSize: "11px", fontWeight: 800, color: "#166534", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <Package size={14} color="#16a34a" /> Biológico Disponible en Inventario (Auto-completar todo):
                    </label>
                    <select
                      value={selectedInventarioId}
                      onChange={handleSelectInventario}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "6px",
                        border: "1px solid #16a34a",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: "#ffffff",
                        color: "#0f172a"
                      }}
                    >
                      <option value="">-- Seleccionar Vacuna de Stock del Consultorio --</option>
                      {inventario.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.nombre} ({item.laboratorio || "Sin laboratorio"}) • Lote: {item.lote_activo || "S/L"} • Stock: {item.stock_actual} dosis disp.
                        </option>
                      ))}
                    </select>

                    {selectedInventarioId && (
                      <div style={{
                        marginTop: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "8px",
                        background: "#ffffff",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #bbf7d0"
                      }}>
                        <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                          ✓ Biológico cargado: {laboratorio ? `${laboratorio} • ` : ""}Lote: {numeroLote || "Sin lote"}
                        </span>
                        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#166534", fontWeight: 700, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={descontarStock}
                            onChange={(e) => setDescontarStock(e.target.checked)}
                          />
                          Descontar 1 dosis física automáticamente
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ESQUEMA COMBINADO INTELIGENTE (HEXAVALENTE / TETRAXIM) */}
                <div style={{
                  background: esCombinada ? "#eff6ff" : "#f8fafc",
                  border: "1px solid " + (esCombinada ? "#93c5fd" : "#e2e8f0"),
                  borderRadius: "10px",
                  padding: "10px 12px",
                  marginBottom: "14px",
                  transition: "all 0.2s ease"
                }}>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: esCombinada ? "#1e40af" : "#475569",
                    cursor: "pointer",
                    userSelect: "none"
                  }}>
                    <input
                      type="checkbox"
                      checked={esCombinada}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setEsCombinada(checked);
                        if (checked && !nombreVacuna) {
                          setNombreVacuna("Hexaxim");
                          setLaboratorio("Sanofi Pasteur");
                        }
                      }}
                      style={{ width: "16px", height: "16px", accentColor: "#2563eb" }}
                    />
                    <Zap size={14} color={esCombinada ? "#2563eb" : "#94a3b8"} />
                    Aplicar como Vacuna Combinada Multicomponente (Hexavalente / Tetraxim)
                  </label>

                  {esCombinada && (
                    <div style={{ marginTop: "10px", borderTop: "1px solid #bfdbfe", paddingTop: "10px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 700, color: "#1e3a8a", display: "block", marginBottom: "3px" }}>
                            Tipo de Combinada:
                          </label>
                          <select
                            value={tipoCombinada}
                            onChange={(e) => {
                              const t = e.target.value as "HEXAVALENTE" | "TETRAXIM";
                              setTipoCombinada(t);
                              if (t === "HEXAVALENTE") {
                                setNombreVacuna("Hexaxim");
                                setLaboratorio("Sanofi Pasteur");
                              } else {
                                setNombreVacuna("Tetraxim");
                                setLaboratorio("Sanofi Pasteur");
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #93c5fd",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: "#ffffff"
                            }}
                          >
                            <option value="HEXAVALENTE">Hexavalente (Polio + HepB + Hib + DTPa)</option>
                            <option value="TETRAXIM">Tetraxim (Polio + Hib + DTPa)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 700, color: "#1e3a8a", display: "block", marginBottom: "3px" }}>
                            Dosis / Momento:
                          </label>
                          <select
                            value={dosisCombinada}
                            onChange={(e) => setDosisCombinada(e.target.value as any)}
                            style={{
                              width: "100%",
                              padding: "6px 8px",
                              borderRadius: "6px",
                              border: "1px solid #93c5fd",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: "#ffffff"
                            }}
                          >
                            {tipoCombinada === "HEXAVALENTE" ? (
                              <>
                                <option value="1">1ª Dosis — 2º Mes de Vida</option>
                                <option value="2">2ª Dosis — 4º Mes de Vida</option>
                                <option value="3">3ª Dosis — 6º Mes de Vida</option>
                              </>
                            ) : (
                              <>
                                <option value="ref1">1er Refuerzo — 18 Meses de Vida</option>
                                <option value="ref2">2do Refuerzo — 5 Años</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      <div style={{
                        background: "#dbeafe",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "11px",
                        color: "#1e40af",
                        fontWeight: 600
                      }}>
                        ℹ️ Esta aplicación impactará y registrará automáticamente las 4 filas correspondientes en el carnét digital.
                      </div>
                    </div>
                  )}
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
                      placeholder="Ej: Pentavalente, Neumococo, Hexaxim..."
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
                      Laboratorio Fabricante:
                    </label>
                    <input
                      type="text"
                      value={laboratorio}
                      onChange={(e) => setLaboratorio(e.target.value)}
                      placeholder="Ej: Sanofi, GSK, Pfizer, MSD..."
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
                      Número de Lote:
                    </label>
                    <input
                      type="text"
                      value={numeroLote}
                      onChange={(e) => setNumeroLote(e.target.value.toUpperCase())}
                      placeholder="Ej: AHB4920A"
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
                      Enfermedad Prevenida:
                    </label>
                    <input
                      type="text"
                      value={enfermedadPrevenida}
                      onChange={(e) => setEnfermedadPrevenida(e.target.value)}
                      placeholder="Ej: Hepatitis B, Meningitis, Difteria..."
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

                  {!esCombinada && (
                    <>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                          Dosis: *
                        </label>
                        <input
                          type="text"
                          required
                          value={dosis}
                          onChange={(e) => setDosis(e.target.value)}
                          placeholder="Ej: 1ª, 2ª, 3ª, Refuerzo, Única..."
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
                          placeholder="Ej: Recién Nacido, 2º Mes, 4º Mes..."
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
                    </>
                  )}

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
                      Vía de Administración:
                    </label>
                    <select
                      value={viaAdmin}
                      onChange={(e) => setViaAdmin(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 600,
                        boxSizing: "border-box"
                      }}
                    >
                      <option value="Intramuscular">Intramuscular</option>
                      <option value="Subcutánea">Subcutánea</option>
                      <option value="Oral">Oral</option>
                      <option value="Intradérmica">Intradérmica</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "3px" }}>
                      Sitio de Aplicación:
                    </label>
                    <input
                      type="text"
                      value={sitioAplicacion}
                      onChange={(e) => setSitioAplicacion(e.target.value)}
                      placeholder="Ej: Deltoides derecho, Vasto externo..."
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
                    {saving ? "Guardando..." : (esCombinada ? "Guardar Vacuna Combinada" : "Guardar y Registrar en Carnét")}
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
