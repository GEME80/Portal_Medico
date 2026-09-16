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
  Filter
} from "lucide-react";

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
  };
}

interface RipsManagerProps {
  tenantSlug: string;
  tenantName: string;
  historias: HistoriaItem[];
}

export default function RipsManager({ tenantSlug, tenantName, historias }: RipsManagerProps) {
  // Preset dates
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const todayStr = today.toISOString().split("T")[0];

  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth);
  const [fechaFin, setFechaFin] = useState(todayStr);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"tabla" | "json">("tabla");

  // Presets
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

  // Filter historias by date range
  const filteredHistorias = useMemo(() => {
    return historias.filter((h) => {
      const f = h.created_at.split("T")[0];
      return (!fechaInicio || f >= fechaInicio) && (!fechaFin || f <= fechaFin);
    });
  }, [historias, fechaInicio, fechaFin]);

  // Classification: Only 'cerrado' are eligible for MinSalud RIPS (Res. 1995/1999 & Res. 000948/2026)
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

  // Generate standardized MinSalud JSON schema (Resolución 000948 de 2026)
  const jsonRipsData = useMemo(() => {
    return aptasParaRips.map((h) => {
      const diag = Array.isArray(h.impresion_diagnostica) && h.impresion_diagnostica.length > 0
        ? h.impresion_diagnostica[0]
        : null;
      const proc = Array.isArray(h.procedimientos) && h.procedimientos.length > 0
        ? h.procedimientos[0]
        : null;
      const demo = h.snapshot_demografico || h.pacientes || {};
      const fecha = new Date(h.created_at);
      const fechaISO = fecha.toISOString().split("T")[0];
      const horaISO = fecha.toTimeString().substring(0, 5);

      return {
        numDocumentoPaciente: demo.documento || h.pacientes?.documento || "SIN_DOC",
        tipoDocumentoPaciente: demo.tipo_documento || h.pacientes?.tipo_documento || "CC",
        codigoDiagnosticoPrincipal: diag?.codigo || "Z000",
        tipoDiagnosticoPrincipal: diag?.tipoDiagnosticoPrincipal || "1",
        codigoProcedimiento: proc?.codigo || "890201",
        fechaInicioAtencion: fechaISO,
        horaInicioAtencion: horaISO,
        numAutorizacion: h.facturacion?.numAutorizacion || null
      };
    });
  }, [aptasParaRips]);

  const handleDownload = () => {
    if (jsonRipsData.length === 0) {
      alert("No hay atenciones cerradas en el rango seleccionado para exportar.");
      return;
    }
    const jsonString = JSON.stringify(jsonRipsData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RIPS_${tenantSlug}_${fechaInicio}_al_${fechaFin}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    const jsonString = JSON.stringify(jsonRipsData, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* ── HEADER DE SECCIÓN ──────────────────────────────────────── */}
      <div className="doc-dashboard-header" style={{ marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1 className="doc-welcome-title" style={{ margin: 0 }}>
              Generador de Reportes RIPS
            </h1>
            <span className="rips-compliance-badge rips-badge-ready">
              <ShieldCheck size={14} /> Res. 000948 / 2026
            </span>
          </div>
          <p className="doc-welcome-sub">
            Exportación interoperable para {tenantName} · Soporte obligatorio para Factura Electrónica de Venta (FEV).
          </p>
        </div>

        <div className="doc-quick-actions">
          <button
            onClick={handleDownload}
            disabled={aptasParaRips.length === 0}
            className="doc-btn doc-btn-accent"
            style={{ opacity: aptasParaRips.length === 0 ? 0.5 : 1, cursor: aptasParaRips.length === 0 ? "not-allowed" : "pointer" }}
          >
            <Download size={16} />
            <span>Descargar RIPS JSON ({aptasParaRips.length})</span>
          </button>
        </div>
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
            <div className="rips-kpi-label">Borradores (Sin Cierre)</div>
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

        {/* Alerta regulatoria de inalterabilidad */}
        {enBorrador.length > 0 ? (
          <div style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "var(--doc-radius-md)",
            background: "var(--doc-warning-light)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px"
          }}>
            <AlertCircle size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "2px" }} />
            <div style={{ fontSize: "13px", color: "#92400e", lineHeight: 1.5 }}>
              <strong>Aviso Normativo (Res. 1995/1999 & Res. 000948/2026):</strong> Tienes <strong>{enBorrador.length} folio(s) en estado borrador</strong>. El validador del Ministerio de Salud exige que los actos médicos estén formalmente cerrados con firma del profesional para ser incluidos en el soporte de factura electrónica.
            </div>
          </div>
        ) : (
          <div style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "var(--doc-radius-md)",
            background: "var(--doc-success-light)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            <CheckCircle2 size={18} style={{ color: "#059669", flexShrink: 0 }} />
            <div style={{ fontSize: "13px", color: "#065f46" }}>
              <strong>100% Conforme:</strong> Todas las historias del rango seleccionado tienen cierre legal y están listas para ser exportadas.
            </div>
          </div>
        )}
      </div>

      {/* ── VISTA DUAL: TABLA DE PRE-VISUALIZACIÓN O JSON RAW ──────── */}
      <div className="rips-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid var(--doc-border)",
          background: "#fafafa"
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
              <span>Estructura JSON MinSalud</span>
            </button>
          </div>

          {activeTab === "json" && (
            <button
              onClick={handleCopyJSON}
              className="doc-btn doc-btn-ghost"
              style={{ padding: "6px 12px", fontSize: "12px" }}
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
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Fecha / Hora</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Paciente</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Documento</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Diagnóstico CIE-10</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Procedimiento CUPS</th>
                    <th style={{ padding: "12px 18px", fontWeight: 700, color: "var(--doc-text-secondary)" }}>Estado Legal</th>
                  </tr>
                </thead>
                <tbody>
                  {aptasParaRips.map((h) => {
                    const diag = Array.isArray(h.impresion_diagnostica) && h.impresion_diagnostica.length > 0
                      ? h.impresion_diagnostica[0]
                      : null;
                    const proc = Array.isArray(h.procedimientos) && h.procedimientos.length > 0
                      ? h.procedimientos[0]
                      : null;
                    const demo = h.snapshot_demografico || h.pacientes || {};
                    const fecha = new Date(h.created_at);

                    return (
                      <tr key={h.id} style={{ borderBottom: "1px solid var(--doc-border-subtle)" }}>
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
          <div style={{ padding: "20px", background: "#0f172a", maxHeight: "450px", overflowY: "auto" }}>
            <pre style={{
              margin: 0,
              fontFamily: "monospace",
              fontSize: "12.5px",
              color: "#38bdf8",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap"
            }}>
              {JSON.stringify(jsonRipsData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
