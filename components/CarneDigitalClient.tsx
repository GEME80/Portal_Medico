"use client";

import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  Syringe, 
  User, 
  CheckCircle2, 
  Check, 
  Calendar, 
  FileText, 
  Printer, 
  Share2, 
  Layers, 
  Award,
  Clock,
  Sparkles,
  ChevronRight,
  Info
} from "lucide-react";
import { 
  ESQUEMA_MATRIZ_CANONICO, 
  HITOS_EDAD_PEDIATRICA, 
  matchAplicacionFila, 
  getVacunasOtras, 
  getFilaPorId,
  FilaEsquema 
} from "@/lib/vacunas/constants";
import { AplicacionVacuna } from "@/lib/actions/vacunas-actions";

interface CarneDigitalClientProps {
  data: {
    tenant: { id: string; nombre: string; slug: string };
    config: any;
    paciente: any;
    vacunas: AplicacionVacuna[];
  };
}

function calcularEdadMesesYDetalle(fechaNacimiento: string) {
  if (!fechaNacimiento) return { totalMeses: 0, texto: "Edad no especificada" };
  const hoy = new Date();
  const nace = new Date(fechaNacimiento);
  let anos = hoy.getFullYear() - nace.getFullYear();
  let meses = hoy.getMonth() - nace.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nace.getDate())) {
    anos--;
    meses += 12;
  }
  if (hoy.getDate() < nace.getDate()) {
    meses--;
  }
  const totalMeses = anos * 12 + meses;
  let texto = "";
  if (anos === 0) {
    texto = meses + " meses";
  } else if (meses === 0) {
    texto = anos + (anos === 1 ? " año" : " años");
  } else {
    texto = anos + (anos === 1 ? " año" : " años") + ", " + meses + " meses";
  }
  return { totalMeses, texto };
}

function formatearFechaCorta(fechaStr: string) {
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

const COLORES_CATEGORIAS: Record<string, { bg: string; text: string; border: string }> = {
  bcg: { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" },
  polio: { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd" },
  hepb: { bg: "#eef2ff", text: "#3730a3", border: "#c7d2fe" },
  hib: { bg: "#fffbeb", text: "#92400e", border: "#fde68a" },
  dtp: { bg: "#fff1f2", text: "#9f1239", border: "#fecdd3" },
  fiebre_amarilla: { bg: "#fefce8", text: "#854d0e", border: "#fef08a" },
  srp: { bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
  neumococo: { bg: "#f0fdfa", text: "#115e59", border: "#99f6e4" },
  rotavirus: { bg: "#fdf2f8", text: "#9d174d", border: "#fbcfe8" },
  varicela: { bg: "#faf5ff", text: "#6b21a8", border: "#e9d5ff" },
  hepa: { bg: "#ecfeff", text: "#155e75", border: "#a5f3fc" },
  meningococo: { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
  vph: { bg: "#fdf4ff", text: "#86198f", border: "#f5d0fe" },
  influenza: { bg: "#f0fdfa", text: "#042f2e", border: "#5eead4" }
};

export default function CarneDigitalClient({ data }: CarneDigitalClientProps) {
  const { tenant, config, paciente, vacunas } = data;
  const [vista, setVista] = useState<"grafica" | "matriz">("grafica");
  const [filtro, setFiltro] = useState<"todos" | "aplicadas" | "pendientes">("todos");

  const primaryColor = config?.color_primario || "#0A4D5C";
  const edadInfo = calcularEdadMesesYDetalle(paciente.fecha_nacimiento);

  const { matchesMap, vacunasOtras } = useMemo(() => {
    const claimedIds = new Set<string>();
    const map = new Map<string, any>();

    for (const cat of ESQUEMA_MATRIZ_CANONICO) {
      for (const fila of cat.filas) {
        const app = matchAplicacionFila(vacunas, fila, claimedIds);
        if (app) {
          map.set(fila.id, app);
        }
      }
    }

    const otras = getVacunasOtras(vacunas, claimedIds);
    return { matchesMap: map, vacunasOtras: otras };
  }, [vacunas]);

  const totalDosisAplicadas = vacunas.length;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f5f9",
      padding: "24px 16px 60px",
      fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      color: "#1e293b"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        .carne-title {
          color: #ffffff !important;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .carne-sub {
          color: #d0f5fb !important;
          margin: 4px 0 0 0;
          font-size: 14px;
        }
        @media print {
          @page {
            size: portrait;
            margin: 8mm 10mm;
          }
          body {
            background: white !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-full-table {
            display: block !important;
          }
          .print-card-wrapper {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}} />

      {/* TOP NAVIGATION BAR */}
      <div className="no-print" style={{
        maxWidth: "1100px",
        margin: "0 auto 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "#0A4D5C",
            color: "#00D4AA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(10, 77, 92, 0.25)"
          }}>
            <Syringe size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
              {config?.nombre_doctor || tenant.nombre}
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0, fontWeight: 500 }}>
              {config?.especialidad || "Pediatría y Puericultura • Esquema de Vacunación Oficial"}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          style={{
            background: "#0A4D5C",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 14px rgba(10, 77, 92, 0.2)"
          }}
        >
          <Printer size={16} /> Imprimir / Guardar como PDF
        </button>
      </div>

      {/* MAIN CARD CONTAINER */}
      <div className="print-card-wrapper" style={{
        maxWidth: "1100px",
        margin: "0 auto",
        background: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
        border: "1px solid #e2e8f0",
        overflow: "hidden"
      }}>
        
        {/* ENCABEZADO INSTITUCIONAL DE ALTO CONTRASTE */}
        <div style={{
          padding: "26px 32px",
          background: `linear-gradient(135deg, ${primaryColor} 0%, #062b33 100%)`,
          color: "white",
          position: "relative"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "18px"
          }}>
            <div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(0, 212, 170, 0.18)",
                color: "#5ff2d0",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.03em",
                marginBottom: "10px",
                border: "1px solid rgba(0, 212, 170, 0.3)"
              }}>
                <ShieldCheck size={14} /> DOCUMENTO CLÍNICO OFICIAL DE INMUNIZACIÓN
              </div>

              <h1 className="carne-title" style={{ fontSize: "28px" }}>
                Carné de Vacunación Infantil
              </h1>
              
              <p className="carne-sub">
                {config?.nombre_doctor || "Dr. Carlos Torres"} • {config?.especialidad || "Pediatra • Infectólogo Pediatra"}
              </p>
              
              {config?.titulo_doctor && (
                <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>
                  {config.titulo_doctor}
                </p>
              )}
            </div>

            {/* SELLO DE TOKEN DIGITAL */}
            <div style={{
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "14px",
              padding: "12px 18px",
              textAlign: "left"
            }}>
              <span style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#a0eaf5", fontWeight: 800, display: "block", marginBottom: "4px" }}>
                Certificado Digital Seguro
              </span>
              <code style={{ fontSize: "11px", color: "#ffffff", fontFamily: "monospace", display: "block", wordBreak: "break-all", maxWidth: "230px" }}>
                {paciente.token_acceso}
              </code>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#5ff2d0", fontSize: "11.5px", fontWeight: 700, marginTop: "6px" }}>
                <CheckCircle2 size={13} /> Verificado en Línea
              </div>
            </div>
          </div>
        </div>

        {/* TARJETA DE IDENTIDAD DEL PACIENTE & DASHBOARD */}
        <div style={{
          padding: "24px 32px",
          background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "18px",
            alignItems: "center"
          }}>
            {/* Paciente Nombre & Avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #0A4D5C 0%, #00d4aa 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: "0 6px 16px rgba(10, 77, 92, 0.2)"
              }}>
                {paciente.nombres?.charAt(0) || "P"}
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.05em", display: "block" }}>
                  Paciente
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {paciente.nombres} {paciente.apellidos}
                </h3>
                <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                  {paciente.tipo_documento} {paciente.documento}
                </span>
              </div>
            </div>

            {/* Nacimiento y Edad */}
            <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.04em", display: "block", marginBottom: "3px" }}>
                Fecha Nacimiento / Edad
              </span>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                {paciente.fecha_nacimiento || "No especificada"}
              </div>
              <span style={{ fontSize: "12px", color: "#0e6678", fontWeight: 700 }}>
                {edadInfo.texto}
              </span>
            </div>

            {/* Aseguradora y Estado */}
            <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.04em", display: "block", marginBottom: "3px" }}>
                Aseguradora / Cobertura
              </span>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                {paciente.eps || "Particular"}
              </div>
              <span style={{ fontSize: "12px", color: totalDosisAplicadas > 0 ? "#059669" : "#d97706", fontWeight: 700 }}>
                {totalDosisAplicadas > 0 ? "● Esquema en Curso" : "○ Sin Registros"}
              </span>
            </div>

            {/* KPI Dosis Aplicadas */}
            <div style={{
              background: "linear-gradient(135deg, #0A4D5C 0%, #0e6678 100%)",
              color: "white",
              padding: "14px 18px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div>
                <span style={{ fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase", color: "#a0eaf5", letterSpacing: "0.04em", display: "block" }}>
                  Dosis Aplicadas
                </span>
                <span style={{ fontSize: "26px", fontWeight: 900, color: "#ffffff", lineHeight: 1.1 }}>
                  {totalDosisAplicadas}
                </span>
              </div>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(0, 212, 170, 0.2)",
                color: "#00D4AA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px"
              }}>
                ✓
              </div>
            </div>
          </div>

          {/* BARRA DE PROGRESO DE INMUNIZACIÓN INFANTIL */}
          <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", fontSize: "12px" }}>
              <span style={{ fontWeight: 700, color: "#475569" }}>
                Progreso del Esquema Pediátrico Ampliado
              </span>
              <span style={{ fontWeight: 800, color: "#0A4D5C" }}>
                {totalDosisAplicadas} dosis registradas
              </span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{
                width: `${Math.max(6, Math.min(100, (totalDosisAplicadas / 18) * 100))}%`,
                height: "100%",
                background: "linear-gradient(90deg, #0A4D5C 0%, #00D4AA 100%)",
                borderRadius: "999px",
                transition: "width 0.4s ease"
              }} />
            </div>
          </div>
        </div>

        {/* BARRA DE CONTROL DE VISTAS (NO PRINT) */}
        <div className="no-print" style={{
          padding: "14px 32px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          {/* Tabs Selector de Vista Principal */}
          <div style={{
            display: "inline-flex",
            background: "#e2e8f0",
            padding: "3px",
            borderRadius: "12px",
            gap: "2px"
          }}>
            <button
              onClick={() => setVista("grafica")}
              style={{
                padding: "8px 18px",
                borderRadius: "9px",
                border: "none",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: vista === "grafica" ? "#ffffff" : "transparent",
                color: vista === "grafica" ? "#0A4D5C" : "#64748b",
                boxShadow: vista === "grafica" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <Sparkles size={15} color={vista === "grafica" ? "#00D4AA" : "#94a3b8"} />
              Línea de Tiempo Gráfica (Por Edades)
            </button>

            <button
              onClick={() => setVista("matriz")}
              style={{
                padding: "8px 18px",
                borderRadius: "9px",
                border: "none",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: vista === "matriz" ? "#ffffff" : "transparent",
                color: vista === "matriz" ? "#0A4D5C" : "#64748b",
                boxShadow: vista === "matriz" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease"
              }}
            >
              <FileText size={15} color={vista === "matriz" ? "#0A4D5C" : "#94a3b8"} />
              Matriz Oficial (7 Columnas)
            </button>
          </div>

          {/* Filtro Rápido */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginRight: "4px" }}>
              Mostrar:
            </span>
            {(["todos", "aplicadas", "pendientes"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: filtro === f ? "#0A4D5C" : "#cbd5e1",
                  background: filtro === f ? "#0A4D5C" : "#ffffff",
                  color: filtro === f ? "#ffffff" : "#475569",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {f === "todos" ? "Todas" : f === "aplicadas" ? ("Aplicadas (" + totalDosisAplicadas + ")") : "Pendientes"}
              </button>
            ))}
          </div>
        </div>

        {/* VISTA 1: LÍNEA DE TIEMPO GRÁFICA POR EDADES (PADRES / MÓVIL) */}
        <div style={{ display: vista === "grafica" ? "block" : "none", padding: "28px 32px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
              Esquema de Inmunización por Hitos de Desarrollo
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Consulte las vacunas aplicadas y las dosis sugeridas organizadas cronológicamente para el menor.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {HITOS_EDAD_PEDIATRICA.map((hito) => {
              const rowsInHito = hito.filasIds.map(fid => {
                const fila = getFilaPorId(fid);
                const app = fila ? matchesMap.get(fila.id) : null;
                return { fila, app };
              }).filter(item => item.fila !== undefined) as { fila: FilaEsquema; app: any }[];

              const filteredRows = rowsInHito.filter(({ app }) => {
                if (filtro === "aplicadas") return !!app;
                if (filtro === "pendientes") return !app;
                return true;
              });

              if (filteredRows.length === 0) return null;

              const appliedCount = rowsInHito.filter(r => !!r.app).length;
              const isCurrentAge = edadInfo.totalMeses >= hito.edadMesesMin && edadInfo.totalMeses <= hito.edadMesesMax;

              return (
                <div 
                  key={hito.id}
                  style={{
                    background: isCurrentAge ? "#f0fdfa" : "#ffffff",
                    border: isCurrentAge ? "2px solid #00d4aa" : "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "20px 24px",
                    boxShadow: isCurrentAge ? "0 8px 24px rgba(0, 212, 170, 0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
                    position: "relative"
                  }}
                >
                  {/* HEADER DEL HITO DE EDAD */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                    borderBottom: "1px solid #edf2f7",
                    paddingBottom: "12px",
                    flexWrap: "wrap",
                    gap: "10px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "26px", lineHeight: 1 }}>{hito.icono}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            {hito.titulo}
                          </h4>
                          {isCurrentAge && (
                            <span style={{
                              background: "#0A4D5C",
                              color: "#00d4aa",
                              fontSize: "11px",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              ⭐ Etapa Actual ({edadInfo.texto})
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {hito.subtitulo}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: appliedCount === rowsInHito.length ? "#059669" : "#64748b",
                      background: appliedCount === rowsInHito.length ? "#ecfdf5" : "#f1f5f9",
                      padding: "4px 12px",
                      borderRadius: "8px",
                      border: "1px solid " + (appliedCount === rowsInHito.length ? "#a7f3d0" : "#e2e8f0")
                    }}>
                      {appliedCount} de {rowsInHito.length} administradas
                    </div>
                  </div>

                  {/* GRID DE TARJETAS DE VACUNAS EN ESTE HITO */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "14px"
                  }}>
                    {filteredRows.map(({ fila, app }) => {
                      const isApplied = !!app;

                      if (isApplied) {
                        return (
                          <div 
                            key={fila.id}
                            style={{
                              background: "#f0fdf4",
                              border: "1.5px solid #86efac",
                              borderRadius: "12px",
                              padding: "14px 16px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.08)"
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{
                                  background: "#10b981",
                                  color: "#ffffff",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 800,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px"
                                }}>
                                  <Check size={12} strokeWidth={3} /> APLICADA
                                </span>
                                <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46" }}>
                                  {fila.dosis}
                                </span>
                              </div>

                              <strong style={{ fontSize: "14px", color: "#0f172a", display: "block", marginBottom: "3px" }}>
                                {app.nombre_vacuna}
                              </strong>

                              <span style={{ fontSize: "11.5px", color: "#475569", display: "block", marginBottom: "10px" }}>
                                {fila.enfermedadPrevenida}
                              </span>
                            </div>

                            <div style={{
                              background: "#ffffff",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              border: "1px solid #bbf7d0",
                              fontSize: "11.5px",
                              color: "#1e293b",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px"
                            }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Fecha:</span>
                                <strong>{formatearFechaCorta(app.fecha_aplicacion)}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Lote:</span>
                                <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: "4px", fontSize: "11px", fontWeight: 700 }}>
                                  {app.numero_lote || "S/L"}
                                </code>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "4px", marginTop: "2px" }}>
                                <span style={{ color: "#64748b" }}>Firma:</span>
                                <span style={{ color: "#065f46", fontWeight: 700 }}>
                                  {app.profesional_nombre || "Dr. Carlos Torres"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div 
                            key={fila.id}
                            style={{
                              background: "#ffffff",
                              border: "1px dashed #cbd5e1",
                              borderRadius: "12px",
                              padding: "14px 16px",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between"
                            }}
                          >
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                <span style={{
                                  background: "#f1f5f9",
                                  color: "#64748b",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 700
                                }}>
                                  PENDIENTE
                                </span>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                                  {fila.dosis}
                                </span>
                              </div>

                              <strong style={{ fontSize: "13.5px", color: "#334155", display: "block", marginBottom: "3px" }}>
                                {fila.biologicoSugerido}
                              </strong>

                              <span style={{ fontSize: "11.5px", color: "#64748b", display: "block" }}>
                                {fila.enfermedadPrevenida}
                              </span>
                            </div>

                            <div style={{ marginTop: "12px", fontSize: "11px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Clock size={12} />
                              <span>Programada para esta edad</span>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}

            {/* OTRAS VACUNAS EN LÍNEA DE TIEMPO */}
            {vacunasOtras.length > 0 && (
              <div style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "20px 24px"
              }}>
                <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 12px 0" }}>
                  Otras Vacunas y Dosis Especiales
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
                  {vacunasOtras.map((otra, idx) => (
                    <div 
                      key={otra.id || idx}
                      style={{
                        background: "#f0fdf4",
                        border: "1.5px solid #86efac",
                        borderRadius: "12px",
                        padding: "14px 16px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ background: "#10b981", color: "#ffffff", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>
                          APLICADA
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46" }}>
                          {otra.dosis || "Única"}
                        </span>
                      </div>
                      <strong style={{ fontSize: "14px", color: "#0f172a", display: "block", marginBottom: "4px" }}>
                        {otra.nombre_vacuna}
                      </strong>
                      <div style={{ fontSize: "11.5px", color: "#475569" }}>
                        Fecha: <strong>{formatearFechaCorta(otra.fecha_aplicacion)}</strong> • Lote: <code>{otra.numero_lote || "S/L"}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VISTA 2: MATRIZ OFICIAL CLÍNICA (7 COLUMNAS DR. TORRES) */}
        <div 
          className={vista === "matriz" ? "print-full-table" : "no-print"}
          style={{ 
            display: vista === "matriz" ? "block" : "none", 
            padding: "24px 32px",
            overflowX: "auto"
          }}
        >
          <div className="no-print" style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                Matriz Oficial de Inmunización (Formato Físico)
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Representación fiel de la tabla física del Dr. Carlos Torres para validación escolar e institucional.
              </p>
            </div>
          </div>

          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "12px",
            minWidth: "820px",
            border: "1.5px solid #cbd5e1"
          }}>
            <thead>
              <tr style={{ background: "#0A4D5C", color: "#ffffff" }}>
                <th style={{ padding: "12px 10px", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", border: "1px solid #0f3d48", color: "#ffffff", width: "22%" }}>
                  ME PROTEGE DE
                </th>
                <th style={{ padding: "12px 8px", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", border: "1px solid #0f3d48", color: "#ffffff", width: "15%", textAlign: "center" }}>
                  EDAD
                </th>
                <th style={{ padding: "12px 8px", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", border: "1px solid #0f3d48", color: "#ffffff", width: "10%", textAlign: "center" }}>
                  DOSIS
                </th>
                <th style={{ padding: "12px 8px", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", border: "1px solid #0f3d48", color: "#ffffff", width: "13%", textAlign: "center" }}>
                  FECHA DE APLICACIÓN
                </th>
                <th style={{ padding: "12px 10px", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", border: "1px solid #0f3d48", color: "#ffffff", width: "15%" }}>
                  NOMBRE
                </th>
                <th style={{ padding: "12px 8px", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", border: "1px solid #0f3d48", color: "#ffffff", width: "12%", textAlign: "center" }}>
                  NÚMERO DE LOTE
                </th>
                <th style={{ padding: "12px 8px", fontWeight: 800, fontSize: "11px", textTransform: "uppercase", border: "1px solid #0f3d48", color: "#ffffff", width: "13%", textAlign: "center" }}>
                  FIRMA DEL VACUNADOR
                </th>
              </tr>
            </thead>
            <tbody>
              {ESQUEMA_MATRIZ_CANONICO.map((cat) => {
                const palette = COLORES_CATEGORIAS[cat.id] || { bg: "#f8fafc", text: "#1e293b", border: "#e2e8f0" };

                const rowItems = cat.filas.map(fila => ({
                  fila,
                  app: matchesMap.get(fila.id)
                }));

                const filteredRows = rowItems.filter(({ app }) => {
                  if (filtro === "aplicadas") return !!app;
                  if (filtro === "pendientes") return !app;
                  return true;
                });

                if (filteredRows.length === 0) return null;

                return filteredRows.map(({ fila, app }, rIndex) => {
                  const isApplied = !!app;

                  return (
                    <tr 
                      key={fila.id}
                      style={{
                        background: isApplied ? "#f0fdf4" : "#ffffff",
                        borderBottom: "1px solid #cbd5e1"
                      }}
                    >
                      {/* COLUMNA 1: ME PROTEGE DE */}
                      {rIndex === 0 && (
                        <td
                          rowSpan={filteredRows.length}
                          style={{
                            padding: "12px 10px",
                            fontWeight: 800,
                            verticalAlign: "middle",
                            border: "1px solid #cbd5e1",
                            background: palette.bg,
                            color: palette.text,
                            fontSize: "12px",
                            lineHeight: 1.3,
                            letterSpacing: "-0.01em"
                          }}
                        >
                          {cat.titulo}
                        </td>
                      )}

                      {/* COLUMNA 2: EDAD */}
                      <td style={{
                        padding: "9px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "center",
                        color: "#334155",
                        fontWeight: 600,
                        fontSize: "11.5px"
                      }}>
                        {fila.edad}
                      </td>

                      {/* COLUMNA 3: DOSIS */}
                      <td style={{
                        padding: "9px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "center",
                        fontWeight: 800,
                        color: isApplied ? "#065f46" : "#0f172a",
                        fontSize: "12px"
                      }}>
                        {fila.dosis}
                      </td>

                      {/* COLUMNA 4: FECHA DE APLICACIÓN */}
                      <td style={{
                        padding: "9px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "center",
                        fontWeight: isApplied ? 800 : 400
                      }}>
                        {isApplied ? (
                          <strong style={{ color: "#0f172a" }}>
                            {formatearFechaCorta(app.fecha_aplicacion)}
                          </strong>
                        ) : (
                          <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>-- / -- / ----</span>
                        )}
                      </td>

                      {/* COLUMNA 5: NOMBRE */}
                      <td style={{
                        padding: "9px 10px",
                        border: "1px solid #cbd5e1"
                      }}>
                        {isApplied ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Check size={14} color="#10b981" strokeWidth={3} />
                            <strong style={{ color: "#065f46", fontSize: "12.5px" }}>
                              {app.nombre_vacuna}
                            </strong>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "11px" }}>
                            ({fila.biologicoSugerido})
                          </span>
                        )}
                      </td>

                      {/* COLUMNA 6: NÚMERO DE LOTE */}
                      <td style={{
                        padding: "9px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "center"
                      }}>
                        {isApplied ? (
                          <span style={{
                            fontFamily: "monospace",
                            background: "#f1f5f9",
                            padding: "2px 7px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#1e293b",
                            border: "1px solid #e2e8f0"
                          }}>
                            {app.numero_lote || "S/L"}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1", fontFamily: "monospace" }}>--</span>
                        )}
                      </td>

                      {/* COLUMNA 7: FIRMA DEL VACUNADOR */}
                      <td style={{
                        padding: "9px 8px",
                        border: "1px solid #cbd5e1",
                        textAlign: "center"
                      }}>
                        {isApplied ? (
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#065f46",
                            background: "#d1fae5",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            display: "inline-block"
                          }}>
                            ✓ {app.profesional_nombre || "Dr. Carlos Torres"}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>--</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}

              {/* FILAS DE OTRAS VACUNAS */}
              {vacunasOtras.length > 0 ? (
                vacunasOtras.map((otra, idx) => (
                  <tr key={otra.id || idx} style={{ background: "#f0fdf4", borderBottom: "1px solid #cbd5e1" }}>
                    {idx === 0 && (
                      <td
                        rowSpan={vacunasOtras.length}
                        style={{
                          padding: "12px 10px",
                          fontWeight: 800,
                          verticalAlign: "middle",
                          border: "1px solid #cbd5e1",
                          background: "#f1f5f9",
                          color: "#334155",
                          fontSize: "12px"
                        }}
                      >
                        OTRAS
                      </td>
                    )}
                    <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#334155", fontWeight: 600, fontSize: "11.5px" }}>
                      {otra.edad_aplicacion || "--"}
                    </td>
                    <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 800, color: "#065f46" }}>
                      {otra.dosis || "Única"}
                    </td>
                    <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 800, color: "#0f172a" }}>
                      {formatearFechaCorta(otra.fecha_aplicacion)}
                    </td>
                    <td style={{ padding: "9px 10px", border: "1px solid #cbd5e1" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Check size={14} color="#10b981" strokeWidth={3} />
                        <strong style={{ color: "#065f46", fontSize: "12.5px" }}>
                          {otra.nombre_vacuna}
                        </strong>
                      </div>
                    </td>
                    <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                      <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 7px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, color: "#1e293b", border: "1px solid #e2e8f0" }}>
                        {otra.numero_lote || "S/L"}
                      </span>
                    </td>
                    <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", background: "#d1fae5", padding: "2px 8px", borderRadius: "6px" }}>
                        ✓ {otra.profesional_nombre || "Dr. Carlos Torres"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={{ padding: "12px 10px", fontWeight: 800, verticalAlign: "middle", border: "1px solid #cbd5e1", background: "#f1f5f9", color: "#334155" }}>
                    OTRAS
                  </td>
                  <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#94a3b8" }}>--</td>
                  <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#94a3b8" }}>--</td>
                  <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#cbd5e1", fontFamily: "monospace" }}>-- / -- / ----</td>
                  <td style={{ padding: "9px 10px", border: "1px solid #cbd5e1", color: "#94a3b8", fontStyle: "italic", fontSize: "11px" }}>(Dengue / Covid-19 / Otras)</td>
                  <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#cbd5e1", fontFamily: "monospace" }}>--</td>
                  <td style={{ padding: "9px 8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#cbd5e1" }}>--</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SELLO Y AVAL MÉDICO DIGITAL */}
        <div style={{
          padding: "22px 32px",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "#0A4D5C",
                color: "#5ff2d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                flexShrink: 0
              }}>
                <ShieldCheck size={26} />
              </div>
              <div>
                <strong style={{ fontSize: "14px", color: "#0f172a", display: "block", lineHeight: 1.2 }}>
                  {config?.nombre_doctor || tenant.nombre}
                </strong>
                <span style={{ fontSize: "12px", color: "#475569", display: "block" }}>
                  {config?.especialidad || "Pediatra • Infectólogo Pediatra"}
                </span>
                <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px", marginTop: "2px" }}>
                  ✓ Firma y Registro Clínico Validado en Línea
                </span>
              </div>
            </div>

            <div style={{ fontSize: "11.5px", color: "#64748b", textAlign: "left" }}>
              <p style={{ margin: "0 0 3px 0" }}>
                Documento clínico oficial emitido bajo estándares de interoperabilidad sanitaria <strong>HubMed Cloud</strong>.
              </p>
              <p style={{ margin: 0, fontFamily: "monospace", color: "#94a3b8", fontSize: "10.5px" }}>
                Verificación: {paciente.token_acceso}
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS (NO PRINT) */}
        <div className="no-print" style={{
          padding: "16px 32px",
          background: "#ffffff",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Comparta este carné digital mediante el enlace oficial seguro provisto por el consultorio.
          </span>
          <button
            onClick={handlePrint}
            style={{
              background: "#0A4D5C",
              color: "white",
              border: "none",
              padding: "10px 22px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Printer size={16} /> Imprimir / Guardar como PDF
          </button>
        </div>

      </div>

      {/* FOOTER LEGAL */}
      <p className="no-print" style={{
        textAlign: "center",
        fontSize: "12px",
        color: "#94a3b8",
        marginTop: "20px"
      }}>
        Este carné digital es un documento clínico con validez ante instituciones educativas, de salud y migratorias.
      </p>

    </div>
  );
}
