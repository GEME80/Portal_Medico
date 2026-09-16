"use client";

import { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Code2,
  Table as TableIcon,
  Filter,
  BookOpen,
  X,
  Building2,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileCheck
} from "lucide-react";
import {
  generarJSONRipsOficial,
  validarReglasRips,
  RipsPrestadorConfig,
  RipsOficialJSON
} from "@/lib/rips/generator";

interface DiagnosticoItem {
  codigo?: string;
  descripcion?: string;
  tipoDiagnosticoPrincipal?: string;
}

interface ProcedimientoItem {
  codigo?: string;
  descripcion?: string;
}

interface DemograficoSnapshot {
  documento?: string;
  tipo_documento?: string;
  nombres?: string;
  apellidos?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  municipio_codigo?: string;
}

interface FacturacionData {
  numAutorizacion?: string | null;
}

export interface HistoriaItem {
  id: string;
  created_at: string;
  estado: string;
  impresion_diagnostica?: DiagnosticoItem[];
  procedimientos?: ProcedimientoItem[];
  snapshot_demografico?: DemograficoSnapshot;
  facturacion?: FacturacionData;
  pacientes?: {
    id: string;
    documento: string;
    tipo_documento: string;
    nombres: string;
    apellidos: string;
    fecha_nacimiento?: string;
    genero?: string;
    sexo?: string;
  };
}

interface RipsManagerProps {
  tenantSlug: string;
  tenantName: string;
  historias: HistoriaItem[];
  ripsConfig?: RipsPrestadorConfig;
}

export default function RipsManager({
  tenantSlug,
  tenantName,
  historias,
  ripsConfig = {}
}: RipsManagerProps) {
  // Preset dates
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth);
  const [fechaFin, setFechaFin] = useState(todayStr);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"tabla" | "json">("tabla");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTab, setManualTab] = useState<"que_es" | "flujo" | "glosario" | "faq">("que_es");
  const [mostrarAuditDetalle, setMostrarAuditDetalle] = useState(false);

  // Preset temporal
  const setPreset = (preset: "este_mes" | "mes_anterior" | "ultimos_30" | "anio") => {
    const now = new Date();
    if (preset === "este_mes") {
      setFechaInicio(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
      setFechaFin(now.toISOString().split("T")[0]);
    } else if (preset === "mes_anterior") {
      const firstPast = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastPast = new Date(now.getFullYear(), now.getMonth(), 0);
      setFechaInicio(firstPast.toISOString().split("T")[0]);
      setFechaFin(lastPast.toISOString().split("T")[0]);
    } else if (preset === "ultimos_30") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFechaInicio(d.toISOString().split("T")[0]);
      setFechaFin(now.toISOString().split("T")[0]);
    } else if (preset === "anio") {
      setFechaInicio(new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]);
      setFechaFin(now.toISOString().split("T")[0]);
    }
  };

  // Filtrar historias por rango de fecha
  const filteredHistorias = useMemo(() => {
    return historias.filter((h) => {
      const f = h.created_at.split("T")[0];
      return (!fechaInicio || f >= fechaInicio) && (!fechaFin || f <= fechaFin);
    });
  }, [historias, fechaInicio, fechaFin]);

  // Clasificación: Solo historias cerradas son aptas para MinSalud MUV
  const aptasParaRips = useMemo(() => {
    return filteredHistorias.filter((h) => h.estado === "cerrado");
  }, [filteredHistorias]);

  const enBorrador = useMemo(() => {
    return filteredHistorias.filter((h) => h.estado !== "cerrado");
  }, [filteredHistorias]);

  const cumplimientoPorcentaje = useMemo(() => {
    if (filteredHistorias.length === 0) return 100;
    return Math.round((aptasParaRips.length / filteredHistorias.length) * 100);
  }, [aptasParaRips, filteredHistorias]);

  // Validación de Reglas de Negocio MinSalud MUV
  const validacionMuv = useMemo(() => {
    return validarReglasRips(filteredHistorias, ripsConfig);
  }, [filteredHistorias, ripsConfig]);

  // Estado de Habilitación REPS
  const repsValido = Boolean(
    ripsConfig.codigoPrestador &&
    ripsConfig.codigoPrestador.trim().length === 12 &&
    ripsConfig.numDocumentoIdObligado
  );

  // Generar estructura oficial MinSalud (Resolución 2275 de 2023 / Res. 000948 de 2026)
  const jsonRipsOficial: RipsOficialJSON = useMemo(() => {
    return generarJSONRipsOficial(aptasParaRips, ripsConfig, {
      nombre: tenantName,
      slug: tenantSlug
    });
  }, [aptasParaRips, ripsConfig, tenantName, tenantSlug]);

  const handleDownload = () => {
    if (aptasParaRips.length === 0) {
      alert("No hay atenciones cerradas en el rango seleccionado para exportar.");
      return;
    }
    const jsonString = JSON.stringify(jsonRipsOficial, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const docObligado = ripsConfig.numDocumentoIdObligado || tenantSlug;
    a.download = `RIPS_${docObligado}_${fechaInicio}_al_${fechaFin}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    const jsonString = JSON.stringify(jsonRipsOficial, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ── TOPBAR STICKY ── */}
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
            <FileSpreadsheet size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="admin-topbar-title" style={{ margin: 0, lineHeight: 1.2 }}>
              Reportes RIPS & MinSalud 2026
            </h1>
            <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "2px 0 0" }}>
              Resolución 2275 de 2023 & Res. 000948 / 2026 · Interoperabilidad MUV / FEV
            </p>
          </div>
        </div>

        <div className="admin-topbar-right" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setManualOpen(true)}
            className="doc-btn doc-btn-ghost"
            style={{
              padding: "7px 14px",
              fontSize: "12.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid var(--doc-border)"
            }}
          >
            <BookOpen size={14} style={{ color: "var(--doc-primary)" }} />
            <span>Guía RIPS 2026</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={aptasParaRips.length === 0}
            className="doc-btn doc-btn-accent"
            style={{
              opacity: aptasParaRips.length === 0 ? 0.5 : 1,
              cursor: aptasParaRips.length === 0 ? "not-allowed" : "pointer",
              padding: "8px 16px",
              fontSize: "13px"
            }}
          >
            <Download size={14} />
            <span>Descargar RIPS JSON ({aptasParaRips.length})</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        {/* ── HEADER DE SECCIÓN CON ACCIONES ─────────────────────────── */}
        <div className="doc-dashboard-header" style={{ marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <h1 className="doc-welcome-title" style={{ margin: 0 }}>
                Generador y Validador RIPS
              </h1>
              <span className="rips-compliance-badge rips-badge-ready">
                <ShieldCheck size={14} /> Res. 2275 / 2023 & Res. 000948 / 2026
              </span>
            </div>
            <p className="doc-welcome-sub">
              Soporte reglamentario de atenciones para {tenantName} · Validador MUV (SISPRO) y Facturación Electrónica DIAN.
            </p>
          </div>

          <div className="doc-quick-actions" style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setManualOpen(true)}
              className="doc-btn doc-btn-ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                border: "1px solid var(--doc-border)",
                background: "white"
              }}
            >
              <BookOpen size={16} style={{ color: "var(--doc-primary)" }} />
              <span>Manual de Apoyo & Flujo</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={aptasParaRips.length === 0}
              className="doc-btn doc-btn-accent"
              style={{ opacity: aptasParaRips.length === 0 ? 0.5 : 1, cursor: aptasParaRips.length === 0 ? "not-allowed" : "pointer" }}
            >
              <Download size={16} />
              <span>Descargar RIPS Oficial ({aptasParaRips.length})</span>
            </button>
          </div>
        </div>

        {/* ── TARJETA DE ESTADO DE HABILITACIÓN REPS ─────────────────────── */}
        <div style={{
          marginBottom: "24px",
          padding: "16px 20px",
          borderRadius: "var(--doc-radius-lg)",
          background: repsValido ? "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(0, 212, 170, 0.08) 100%)" : "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.1) 100%)",
          border: repsValido ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: repsValido ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              color: repsValido ? "#059669" : "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              {repsValido ? <ShieldCheck size={22} /> : <Building2 size={22} />}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: repsValido ? "#065f46" : "#92400e" }}>
                  {repsValido ? "Habilitación REPS Configurada y Lista" : "Configuración de Habilitación Incompleta"}
                </span>
                <span style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  background: repsValido ? "#059669" : "#d97706",
                  color: "white"
                }}>
                  {repsValido ? "Conforme MUV" : "Acción requerida"}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: repsValido ? "#047857" : "#b45309" }}>
                {repsValido ? (
                  <>
                    Código REPS: <strong style={{ fontFamily: "monospace" }}>{ripsConfig.codigoPrestador}</strong> · Obligado a facturar: <strong style={{ fontFamily: "monospace" }}>{ripsConfig.numDocumentoIdObligado}</strong> · Servicio REPS: <strong>{ripsConfig.codigoServicio || 302}</strong> · DANE: <strong>{ripsConfig.codigoMunicipio || "11001"}</strong>
                  </>
                ) : (
                  "Para que el Ministerio de Salud (MUV) acepte tus archivos y puedas facturar ante la DIAN, necesitas configurar tu Código REPS de 12 dígitos y NIT."
                )}
              </p>
            </div>
          </div>

          <a
            href={`/${tenantSlug}/admin/personalizar?tab=rips_habilitacion`}
            className="doc-btn"
            style={{
              background: repsValido ? "white" : "var(--doc-primary)",
              color: repsValido ? "var(--doc-primary)" : "white",
              border: repsValido ? "1px solid rgba(16, 185, 129, 0.4)" : "none",
              padding: "8px 16px",
              fontSize: "12.5px",
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>{repsValido ? "Modificar Datos REPS" : "Configurar Habilitación Ahora"}</span>
            <ArrowRight size={14} />
          </a>
        </div>

        {/* ── KPIS DE CUMPLIMIENTO SANITARIO ──────────────────────────── */}
        <div className="rips-kpi-grid">
          <div className="rips-kpi-box">
            <div className="rips-kpi-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
              <CheckCircle2 size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="rips-kpi-number" style={{ color: "#059669" }}>{aptasParaRips.length}</div>
              <div className="rips-kpi-label">Atenciones Listas (Cerradas)</div>
            </div>
          </div>

          <div className="rips-kpi-box">
            <div className="rips-kpi-icon" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
              <AlertCircle size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="rips-kpi-number" style={{ color: enBorrador.length > 0 ? "#d97706" : "var(--doc-text-muted)" }}>
                {enBorrador.length}
              </div>
              <div className="rips-kpi-label">Borradores (Sin Cierre Legal)</div>
            </div>
          </div>

          <div className="rips-kpi-box">
            <div className="rips-kpi-icon" style={{ background: "rgba(10, 77, 92, 0.1)", color: "var(--doc-primary)" }}>
              <FileText size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="rips-kpi-number">{filteredHistorias.length}</div>
              <div className="rips-kpi-label">Total Folios en Periodo</div>
            </div>
          </div>

          <div className="rips-kpi-box">
            <div className="rips-kpi-icon" style={{ background: "rgba(0, 212, 170, 0.12)", color: "#047857" }}>
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>
            <div>
              <div className="rips-kpi-number" style={{ color: cumplimientoPorcentaje === 100 ? "#059669" : "#d97706" }}>
                {cumplimientoPorcentaje}%
              </div>
              <div className="rips-kpi-label">Tasa de Conformidad</div>
            </div>
          </div>
        </div>

        {/* ── FILTROS Y CONTROLES TEMPORALES ──────────────────────────── */}
        <div className="rips-card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={16} style={{ color: "var(--doc-primary)" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--doc-text-primary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Rango de Consulta
              </span>
            </div>

            {/* Presets rápidos */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={() => setPreset("este_mes")} className="doc-btn doc-btn-ghost" style={{ padding: "6px 12px", fontSize: "12px" }}>
                Este Mes
              </button>
              <button onClick={() => setPreset("mes_anterior")} className="doc-btn doc-btn-ghost" style={{ padding: "6px 12px", fontSize: "12px" }}>
                Mes Anterior
              </button>
              <button onClick={() => setPreset("ultimos_30")} className="doc-btn doc-btn-ghost" style={{ padding: "6px 12px", fontSize: "12px" }}>
                Últimos 30 días
              </button>
              <button onClick={() => setPreset("anio")} className="doc-btn doc-btn-ghost" style={{ padding: "6px 12px", fontSize: "12px" }}>
                Todo el Año
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--doc-text-secondary)", marginBottom: "6px" }}>
                Fecha Inicial
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "var(--doc-radius-md)",
                    border: "1px solid var(--doc-border)",
                    fontSize: "13.5px",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "var(--doc-text-primary)"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--doc-text-secondary)", marginBottom: "6px" }}>
                Fecha Final
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "var(--doc-radius-md)",
                    border: "1px solid var(--doc-border)",
                    fontSize: "13.5px",
                    outline: "none",
                    fontFamily: "inherit",
                    color: "var(--doc-text-primary)"
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── PRE-VALIDADOR DE REGLAS DE NEGOCIO MUV ──────────────────── */}
          <div style={{
            marginTop: "16px",
            padding: "14px 18px",
            borderRadius: "var(--doc-radius-md)",
            background: validacionMuv.valido ? "var(--doc-success-light)" : "var(--doc-warning-light)",
            border: validacionMuv.valido ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(245, 158, 11, 0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {validacionMuv.valido ? (
                  <CheckCircle2 size={18} style={{ color: "#059669", flexShrink: 0 }} />
                ) : (
                  <AlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0 }} />
                )}
                <div style={{ fontSize: "13px", color: validacionMuv.valido ? "#065f46" : "#92400e" }}>
                  <strong>{validacionMuv.valido ? "Pre-Validador MUV: 100% Conforme" : "Pre-Validador MUV: Advertencias Detectadas"}</strong> — {validacionMuv.valido ? "Todas las reglas de estructura y codificación para el validador SISPRO están cumplidas." : `${validacionMuv.errores.length} observación(es) antes de transmitir al validador.`}
                </div>
              </div>

              {validacionMuv.errores.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMostrarAuditDetalle(!mostrarAuditDetalle)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#b45309",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  {mostrarAuditDetalle ? "Ocultar observaciones" : `Ver observaciones (${validacionMuv.errores.length})`}
                </button>
              )}
            </div>

            {mostrarAuditDetalle && validacionMuv.errores.length > 0 && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed rgba(245, 158, 11, 0.3)" }}>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "#78350f", lineHeight: 1.6 }}>
                  {validacionMuv.errores.map((err, idx) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>
                      <strong style={{ color: err.tipo === "error" ? "#dc2626" : "#b45309" }}>
                        [{err.tipo.toUpperCase()}]
                      </strong>{" "}
                      {err.mensaje}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── VISTA DUAL: TABLA DE PRE-VISUALIZACIÓN O JSON RAW ──────── */}
        <div className="rips-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--doc-border)",
            background: "#fafafa",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={() => setActiveTab("tabla")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "var(--doc-radius-sm)",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "tabla" ? "#ffffff" : "transparent",
                  color: activeTab === "tabla" ? "var(--doc-primary)" : "var(--doc-text-secondary)",
                  boxShadow: activeTab === "tabla" ? "var(--doc-shadow-sm)" : "none"
                }}
              >
                <TableIcon size={15} />
                <span>Vista Tabular ({aptasParaRips.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("json")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "var(--doc-radius-sm)",
                  fontSize: "13px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "json" ? "#ffffff" : "transparent",
                  color: activeTab === "json" ? "var(--doc-primary)" : "var(--doc-text-secondary)",
                  boxShadow: activeTab === "json" ? "var(--doc-shadow-sm)" : "none"
                }}
              >
                <Code2 size={15} />
                <span>Estructura Oficial JSON MinSalud</span>
              </button>
            </div>

            {activeTab === "json" && (
              <button
                onClick={handleCopyJSON}
                className="doc-btn doc-btn-ghost"
                style={{ padding: "6px 12px", fontSize: "12px", background: "white", border: "1px solid var(--doc-border)" }}
              >
                {copied ? <Check size={14} style={{ color: "#059669" }} /> : <Copy size={14} />}
                <span>{copied ? "Copiado" : "Copiar JSON"}</span>
              </button>
            )}
          </div>

          {activeTab === "tabla" ? (
            <div style={{ overflowX: "auto" }}>
              {aptasParaRips.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--doc-text-muted)" }}>
                  <FileSpreadsheet size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                  <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--doc-text-secondary)" }}>
                    No hay historias clínicas cerradas en este rango
                  </div>
                  <p style={{ fontSize: "13px", margin: "4px 0 0 0" }}>
                    Ajusta el rango de fechas o completa el cierre de folios médicos pendientes.
                  </p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "var(--doc-bg)", borderBottom: "1px solid var(--doc-border)", textAlign: "left" }}>
                      <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Consecutivo</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Fecha / Hora</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Paciente</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Documento</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Diagnóstico CIE-10</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Procedimiento CUPS</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Valor ($ COP)</th>
                      <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Estado Legal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aptasParaRips.map((h, index) => {
                      const diag = Array.isArray(h.impresion_diagnostica) && h.impresion_diagnostica.length > 0
                        ? h.impresion_diagnostica[0]
                        : null;
                      const proc = Array.isArray(h.procedimientos) && h.procedimientos.length > 0
                        ? h.procedimientos[0]
                        : null;
                      const demo = h.snapshot_demografico || h.pacientes || {};
                      const fecha = new Date(h.created_at);
                      const honorarios = Number(ripsConfig.valorHonorariosDefecto) || 150000;

                      return (
                        <tr key={h.id} style={{ borderBottom: "1px solid var(--doc-border-subtle)" }}>
                          <td style={{ padding: "12px 18px", fontFamily: "monospace", color: "var(--doc-text-muted)" }}>
                            #{index + 1}
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--doc-text-primary)", fontWeight: 500 }}>
                            {fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                            <span style={{ fontSize: "11px", color: "var(--doc-text-muted)", marginLeft: "6px" }}>
                              {fecha.toTimeString().substring(0, 5)}
                            </span>
                          </td>
                          <td style={{ padding: "12px 18px", color: "var(--doc-text-primary)", fontWeight: 600 }}>
                            {demo.nombres ? `${demo.nombres} ${demo.apellidos || ""}` : h.pacientes ? `${h.pacientes.nombres} ${h.pacientes.apellidos}` : "Paciente"}
                          </td>
                          <td style={{ padding: "12px 18px", fontFamily: "monospace", color: "var(--doc-text-secondary)" }}>
                            {demo.tipo_documento || h.pacientes?.tipo_documento || "CC"} {demo.documento || h.pacientes?.documento || "—"}
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "rgba(10, 77, 92, 0.08)",
                              color: "var(--doc-primary)",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "12px"
                            }}>
                              {diag?.codigo || "Z000"}
                            </span>
                            <span style={{ fontSize: "12px", color: "var(--doc-text-secondary)", marginLeft: "8px" }}>
                              {diag?.descripcion || "Examen médico general"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: "rgba(0, 212, 170, 0.1)",
                              color: "#047857",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "12px"
                            }}>
                              {proc?.codigo || "890201"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 18px", fontFamily: "monospace", fontWeight: 600, color: "var(--doc-text-primary)" }}>
                            ${honorarios.toLocaleString("es-CO")}
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <span className="rips-compliance-badge rips-badge-ready" style={{ fontSize: "10px", padding: "3px 8px" }}>
                              CERRADO
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div style={{ padding: "20px", background: "#0f172a", maxHeight: "480px", overflowY: "auto" }}>
              <pre style={{
                margin: 0,
                fontFamily: "monospace",
                fontSize: "12.5px",
                color: "#38bdf8",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap"
              }}>
                {JSON.stringify(jsonRipsOficial, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* ── MANUAL DE APOYO & GUÍA RIPS 2026 (SLIDE-OVER DRAWER) ──── */}
      {manualOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          justifyContent: "flex-end",
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          transition: "opacity 0.2s"
        }}>
          {/* Backdrop click to close */}
          <div
            style={{ position: "absolute", inset: 0 }}
            onClick={() => setManualOpen(false)}
          />

          {/* Drawer content panel */}
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "680px",
            height: "100%",
            background: "white",
            boxShadow: "-10px 0 25px -5px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 10
          }}>
            {/* Header del Drawer */}
            <div style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--doc-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fafafa"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(10, 77, 92, 0.1)",
                  color: "var(--doc-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "var(--doc-text-primary)" }}>
                    Manual de Apoyo & Guía RIPS 2026
                  </h2>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--doc-text-secondary)" }}>
                    Resolución 2275 de 2023 · MinSalud Colombia y DIAN
                  </p>
                </div>
              </div>

              <button
                onClick={() => setManualOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--slate-400)",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "6px"
                }}
                title="Cerrar manual"
              >
                <X size={20} />
              </button>
            </div>

            {/* Pestañas del Manual */}
            <div style={{
              display: "flex",
              borderBottom: "1px solid var(--doc-border)",
              padding: "0 20px",
              background: "white"
            }}>
              {[
                { id: "que_es", label: "¿Qué es RIPS?" },
                { id: "flujo", label: "Flujo Paso a Paso" },
                { id: "glosario", label: "Glosario Médico" },
                { id: "faq", label: "Preguntas y Dudas" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setManualTab(tab.id as any)}
                  style={{
                    padding: "12px 16px",
                    border: "none",
                    background: "transparent",
                    fontSize: "13px",
                    fontWeight: manualTab === tab.id ? 700 : 500,
                    color: manualTab === tab.id ? "var(--doc-primary)" : "var(--doc-text-secondary)",
                    borderBottom: manualTab === tab.id ? "2px solid var(--doc-primary)" : "2px solid transparent",
                    cursor: "pointer"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cuerpo con Scroll del Manual */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", lineHeight: 1.6, fontSize: "13.5px", color: "var(--doc-text-primary)" }}>
              {/* TAB 1: ¿QUÉ ES RIPS? */}
              {manualTab === "que_es" && (
                <div>
                  <div style={{
                    padding: "16px",
                    borderRadius: "10px",
                    background: "rgba(10, 77, 92, 0.05)",
                    border: "1px solid rgba(10, 77, 92, 0.15)",
                    marginBottom: "20px"
                  }}>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "var(--doc-primary)", fontWeight: 700 }}>
                      ¿Qué es el RIPS y por qué es obligatorio?
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--doc-text-secondary)" }}>
                      El <strong>RIPS (Registro Individual de Prestación de Servicios de Salud)</strong> es el conjunto de datos mínimos que todo profesional de la salud o institución médica en Colombia debe reportar al Ministerio de Salud sobre cada atención prestada.
                    </p>
                  </div>

                  <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "16px 0 8px 0" }}>
                    ¿Por qué descargamos un archivo JSON en lugar de enviarlo directo?
                  </h4>
                  <p style={{ color: "var(--doc-text-secondary)" }}>
                    El Ministerio de Salud diseñó una arquitectura centralizada llamada <strong>MUV (Mecanismo Único de Validación)</strong> alojada en la plataforma SISPRO. Esta pasarela exige que el médico cargue su archivo firmado con sus credenciales oficiales del REPS. Una vez validado, el MUV genera el <strong>CUV (Código Único de Validación)</strong>, el cual debes adjuntar a tu Factura Electrónica de Venta (FEV) ante la DIAN o en tu software contable (Siigo, Facturatech, Alegra, World Office, etc.).
                  </p>

                  <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "20px 0 8px 0" }}>
                    El Cambio Histórico: De los viejos archivos planos .TXT al nuevo JSON único
                  </h4>
                  <p style={{ color: "var(--doc-text-secondary)" }}>
                    Históricamente bajo la Resolución 3374 de 2000, los RIPS se generaban en múltiples archivos de texto plano separados (AC para consultas, AP para procedimientos, US para usuarios, AF para facturas).
                  </p>
                  <p style={{ color: "var(--doc-text-secondary)" }}>
                    A partir de la <strong>Resolución 2275 de 2023</strong> y la <strong>Resolución 000948 de 2026</strong>, MinSalud eliminó los archivos planos. Ahora todo se reporta en <strong>un único archivo JSON jerárquico</strong> agrupado por paciente, donde cada usuario contiene sus consultas y procedimientos realizados.
                  </p>
                </div>
              )}

              {/* TAB 2: FLUJO PASO A PASO */}
              {manualTab === "flujo" && (
                <div>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "var(--doc-text-primary)", fontWeight: 700 }}>
                    Flujo Completo: De la Consulta Médica a MinSalud y DIAN
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Paso 1 */}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(10, 77, 92, 0.1)",
                        color: "var(--doc-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "13px",
                        flexShrink: 0
                      }}>
                        1
                      </div>
                      <div>
                        <strong style={{ fontSize: "13.5px", color: "var(--doc-text-primary)" }}>
                          Atención y Cierre Formal de la Historia Clínica
                        </strong>
                        <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--doc-text-secondary)" }}>
                          Atiendes a tu paciente en el consultorio o telemedicina. Al finalizar, seleccionas el diagnóstico principal (CIE-10) y cierras formalmente el folio. Solo las historias con estado <code>cerrado</code> son legalmente inalterables y aptas para RIPS.
                        </p>
                      </div>
                    </div>

                    {/* Paso 2 */}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(0, 212, 170, 0.15)",
                        color: "#047857",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "13px",
                        flexShrink: 0
                      }}>
                        2
                      </div>
                      <div>
                        <strong style={{ fontSize: "13.5px", color: "var(--doc-text-primary)" }}>
                          Generación y Descarga del RIPS JSON en este Módulo
                        </strong>
                        <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--doc-text-secondary)" }}>
                          Filtras el rango de fechas de tu periodo de facturación (ej. mes en curso). Haces clic en <strong>Descargar RIPS JSON</strong>. El sistema valida automáticamente las reglas y emite el archivo estructurado bajo la Res. 2275 de 2023.
                        </p>
                      </div>
                    </div>

                    {/* Paso 3 */}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "13px",
                        flexShrink: 0
                      }}>
                        3
                      </div>
                      <div>
                        <strong style={{ fontSize: "13.5px", color: "var(--doc-text-primary)" }}>
                          Carga en el Validador MUV de SISPRO (MinSalud)
                        </strong>
                        <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--doc-text-secondary)" }}>
                          Ingresas con tu usuario REPS a la plataforma web del MUV (<code>muv.sispro.gov.co</code>) y subes el archivo JSON descargado. El validador examina que tu consultorio esté activo y emite el certificado de conformidad con el <strong>Código CUV</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Paso 4 */}
                    <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(168, 85, 247, 0.15)",
                        color: "#7c3aed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "13px",
                        flexShrink: 0
                      }}>
                        4
                      </div>
                      <div>
                        <strong style={{ fontSize: "13.5px", color: "var(--doc-text-primary)" }}>
                          Expedición de la Factura Electrónica (FEV) ante la DIAN
                        </strong>
                        <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--doc-text-secondary)" }}>
                          En tu software contable o proveedor tecnológico de facturación (Siigo, Facturatech, etc.), creas la factura electrónica incluyendo el código CUV emitido por el MUV. La DIAN y la aseguradora/EPS validan y reconocen el pago.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: GLOSARIO */}
              {manualTab === "glosario" && (
                <div>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "var(--doc-text-primary)", fontWeight: 700 }}>
                    Glosario de Términos Médico-Normativos
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--slate-200)" }}>
                      <strong style={{ color: "var(--doc-primary)" }}>REPS (12 dígitos)</strong>
                      <div style={{ fontSize: "12.5px", color: "var(--doc-text-secondary)", marginTop: "2px" }}>
                        Registro Especial de Prestadores de Servicios de Salud. Identificador único asignado a tu consultorio por la Secretaría de Salud departamental o distrital.
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--slate-200)" }}>
                      <strong style={{ color: "var(--doc-primary)" }}>CUPS (Clasificación Única de Procedimientos en Salud)</strong>
                      <div style={{ fontSize: "12.5px", color: "var(--doc-text-secondary)", marginTop: "2px" }}>
                        Código de 6 dígitos que identifica el acto médico realizado (ej. <code>890201</code> Consulta de primera vez, <code>890202</code> Consulta de control).
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--slate-200)" }}>
                      <strong style={{ color: "var(--doc-primary)" }}>CIE-10 (Clasificación Internacional de Enfermedades)</strong>
                      <div style={{ fontSize: "12.5px", color: "var(--doc-text-secondary)", marginTop: "2px" }}>
                        Código alfa-numérico universal asignado por la OMS que diagnostica la patología del paciente (ej. <code>J00</code> Rinofaringitis aguda).
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--slate-200)" }}>
                      <strong style={{ color: "var(--doc-primary)" }}>MUV (Mecanismo Único de Validación)</strong>
                      <div style={{ fontSize: "12.5px", color: "var(--doc-text-secondary)", marginTop: "2px" }}>
                        Servidor en la nube de SISPRO (MinSalud) encargado de verificar la consistencia técnica y legal del archivo RIPS JSON.
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--slate-200)" }}>
                      <strong style={{ color: "var(--doc-primary)" }}>CUV (Código Único de Validación)</strong>
                      <div style={{ fontSize: "12.5px", color: "var(--doc-text-secondary)", marginTop: "2px" }}>
                        Código alfanumérico generado por el MUV tras validar con éxito tu archivo RIPS. Es el &quot;sello digital&quot; requerido por la DIAN para facturar.
                      </div>
                    </div>

                    <div style={{ padding: "12px 14px", borderRadius: "8px", background: "#f8fafc", border: "1px solid var(--slate-200)" }}>
                      <strong style={{ color: "var(--doc-primary)" }}>DANE (5 dígitos)</strong>
                      <div style={{ fontSize: "12.5px", color: "var(--doc-text-secondary)", marginTop: "2px" }}>
                        Código geográfico oficial del municipio de atención (ej. <code>11001</code> Bogotá D.C., <code>05001</code> Medellín, <code>76001</code> Cali).
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PREGUNTAS FRECUENTES */}
              {manualTab === "faq" && (
                <div>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "var(--doc-text-primary)", fontWeight: 700 }}>
                    Preguntas Frecuentes y Resolución de Rechazos
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <strong style={{ fontSize: "13.5px", color: "var(--doc-text-primary)" }}>
                        ¿Por qué mis historias clínicas en borrador no aparecen en el RIPS?
                      </strong>
                      <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--doc-text-secondary)" }}>
                        Por mandato de la Resolución 1995 de 1999 y Resolución 2275 de 2023, los actos médicos en estado borrador carecen de firma legal del profesional y pueden ser modificados. El MUV rechaza cualquier registro que no esté sellado con estado cerrado e inalterable.
                      </p>
                    </div>

                    <div>
                      <strong style={{ fontSize: "13.5px", color: "var(--doc-text-primary)" }}>
                        ¿Qué hago si no recuerdo mi Código REPS de 12 dígitos?
                      </strong>
                      <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--doc-text-secondary)" }}>
                        Puedes ingresar al Registro Especial de Prestadores de Servicios de Salud en <code>prestadores.minsalud.gov.co/habilitacion/</code> y buscar por el NIT de tu consultorio o tu cédula de ciudadanía. También puedes ver tu distintivo de habilitación fijado en la pared de tu consultorio.
                      </p>
                    </div>

                    <div>
                      <strong style={{ fontSize: "13.5px", color: "var(--doc-text-primary)" }}>
                        ¿Cómo vinculo este archivo con mi software contable (Siigo, Facturatech, etc.)?
                      </strong>
                      <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--doc-text-secondary)" }}>
                        La mayoría de plataformas contables colombianas cuentan con una pestaña de Facturación en Salud donde puedes cargar el JSON generado aquí, o bien cargar primero el JSON al MUV de MinSalud y pegar únicamente el código CUV en la factura electrónica.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Drawer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--doc-border)",
              background: "#fafafa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "12px", color: "var(--doc-text-secondary)" }}>
                Portal Médico · Conforme a Res. 2275 / 2023
              </span>
              <button
                onClick={() => setManualOpen(false)}
                className="doc-btn doc-btn-primary"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Entendido, volver a Reportes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
