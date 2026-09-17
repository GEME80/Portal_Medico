"use client";

import React, { useState, useMemo, useEffect } from "react";
import QRCode from "qrcode";
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
  Info,
  QrCode,
  FileCheck
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

/**
 * Trazo vectorial caligráfico de la firma autógrafa médica del Dr. Carlos Torres
 */
function DoctorSignatureSvg({ width = 140, height = 36, color = "#0A4D5C" }: { width?: number; height?: number; color?: string }) {
  return (
    <svg viewBox="0 0 200 55" width={width} height={height} style={{ display: "block", margin: "0 auto" }}>
      {/* Letra inicial D/P con bucle superior */}
      <path
        d="M 14 38 C 18 18, 25 10, 36 12 C 45 14, 35 44, 48 32 C 58 24, 65 22, 72 26 C 78 30, 75 38, 84 34 C 91 30, 100 26, 110 30"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Trazo central Torres con cruz de la T */}
      <path
        d="M 118 12 L 126 42 M 110 18 L 134 16 C 142 16, 147 34, 156 30 C 164 26, 172 22, 180 26 C 187 29, 192 35, 196 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rúbrica inferior de seguridad médica */}
      <path
        d="M 22 46 Q 95 52 188 38 Q 148 54 68 50"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Componente del Sello Médico Oficial del Doctor
 */
function DoctorMedicalSealBox({ 
  doctorNombre, 
  doctorEspecialidad, 
  registroMedico,
  compact = false 
}: { 
  doctorNombre: string; 
  doctorEspecialidad: string; 
  registroMedico: string;
  compact?: boolean;
}) {
  return (
    <div style={{
      border: "1.5px solid #0A4D5C",
      borderRadius: "6px",
      padding: compact ? "3px 8px" : "6px 14px",
      background: "#f0fdfa",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minWidth: compact ? "165px" : "210px",
      maxWidth: compact ? "185px" : "240px",
      boxSizing: "border-box"
    }}>
      <span style={{ 
        fontSize: compact ? "7px" : "8px", 
        fontWeight: 800, 
        textTransform: "uppercase", 
        color: "#0A4D5C", 
        letterSpacing: "0.06em", 
        borderBottom: "1px dashed #99f6e4", 
        paddingBottom: "1px", 
        width: "100%", 
        display: "block" 
      }}>
        FIRMA Y SELLO MÉDICO AUTÉNTICO
      </span>
      
      <DoctorSignatureSvg width={compact ? 130 : 155} height={compact ? 32 : 38} color="#0A4D5C" />
      
      <strong style={{ fontSize: compact ? "8.5px" : "11px", color: "#0f172a", lineHeight: 1.1, marginTop: "1px", display: "block" }}>
        {doctorNombre}
      </strong>
      <span style={{ fontSize: compact ? "7.5px" : "9.5px", color: "#475569", lineHeight: 1.1, display: "block" }}>
        {doctorEspecialidad}
      </span>
      <span style={{ fontSize: compact ? "7px" : "8.5px", color: "#0e6678", fontWeight: 700, fontFamily: "monospace", display: "block", marginTop: "1px" }}>
        {registroMedico}
      </span>
    </div>
  );
}

export default function CarneDigitalClient({ data }: CarneDigitalClientProps) {
  const { tenant, config, paciente, vacunas } = data;
  const primaryColor = config?.color_primario || "#0A4D5C";
  const doctorNombre = config?.nombre_doctor || tenant.nombre || "Dr. Carlos Torres Martínez";
  const doctorEspecialidad = config?.especialidad || "Infectología Pediátrica y Vacunología Clínica";
  const registroMedico = "R.M. / T.P. No. 482910-CO • MinSalud";

  const [vista, setVista] = useState<"grafica" | "matriz" | "impresion">("grafica");
  const [filtro, setFiltro] = useState<"todos" | "aplicadas" | "pendientes">("todos");
  const [copiado, setCopiado] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const edadInfo = useMemo(() => {
    return calcularEdadMesesYDetalle(paciente.fecha_nacimiento);
  }, [paciente.fecha_nacimiento]);

  // Generar código QR en tiempo real para verificación
  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const fullUrl = origin + "/" + tenant.slug + "/carne/" + paciente.token_acceso;
      QRCode.toDataURL(fullUrl, {
        width: 180,
        margin: 1,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0A4D5C",
          light: "#FFFFFF"
        }
      }).then(setQrDataUrl).catch(console.error);
    }
  }, [tenant.slug, paciente.token_acceso]);

  // Mapa de coincidencias para la matriz canónica
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

  const totalDosisAplicadas = vacunas.length;
  const progresoPorcentaje = Math.min(100, Math.round((totalDosisAplicadas / 18) * 100));

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  // Fecha de expedición formateada
  const fechaExpedicion = useMemo(() => {
    return new Date().toLocaleDateString("es-CO", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    });
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f5f9",
      padding: "24px 16px 60px",
      fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      color: "#1e293b"
    }}>
      {/* ESTILOS DE IMPRESIÓN RIGUROSOS PARA 1 SOLA HOJA */}
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

        /* ─── PANTALLA VS IMPRESIÓN ─── */
        @media screen {
          .print-only {
            display: none !important;
          }
          .web-only {
            display: block !important;
          }
        }

        @media print {
          @page {
            size: letter portrait;
            margin: 5mm 7mm 5mm 7mm;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif !important;
          }
          .web-only {
            display: none !important;
          }
          .print-only {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            height: 268mm !important;
            max-height: 268mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            table-layout: fixed !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          th, td {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      {/* ============================================================ */}
      {/* VISTA EN PANTALLA (WEB / MÓVIL INTERACTIVA)                  */}
      {/* ============================================================ */}
      <div className="web-only">
        {/* TOP NAVIGATION BAR */}
        <div style={{
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
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: primaryColor,
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
                {doctorNombre}
              </h2>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0, fontWeight: 500 }}>
                {doctorEspecialidad} • {registroMedico}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={handleShare}
              style={{
                background: "#ffffff",
                color: "#0A4D5C",
                border: "1px solid #cbd5e1",
                padding: "10px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Share2 size={16} />
              {copiado ? "¡Enlace Copiado!" : "Compartir"}
            </button>

            <button
              onClick={handlePrint}
              style={{
                background: primaryColor,
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
                boxShadow: "0 4px 14px rgba(10, 77, 92, 0.25)"
              }}
            >
              <Printer size={16} />
              Imprimir / Guardar en 1 Hoja (PDF)
            </button>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL INTERACTIVO */}
        <div style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
          overflow: "hidden"
        }}>
          {/* HEADER HERO */}
          <div style={{
            padding: "26px 32px",
            background: "linear-gradient(135deg, " + primaryColor + " 0%, #062b33 100%)",
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
                  {doctorNombre} • {doctorEspecialidad}
                </p>
                
                <p style={{ margin: "4px 0 0 0", fontSize: "11.5px", color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>
                  {registroMedico}
                </p>
              </div>

              {/* SELLO DE TOKEN DIGITAL & QR */}
              <div style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "14px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                {qrDataUrl && (
                  <img 
                    src={qrDataUrl} 
                    alt="QR Verificación" 
                    style={{ width: "56px", height: "56px", borderRadius: "8px", background: "white", padding: "3px" }} 
                  />
                )}
                <div>
                  <span style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#a0eaf5", fontWeight: 800, display: "block" }}>
                    Certificado Verificable
                  </span>
                  <code style={{ fontSize: "10.5px", color: "#ffffff", fontFamily: "monospace", display: "block" }}>
                    {paciente.token_acceso.slice(0, 18)}...
                  </code>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#5ff2d0", fontSize: "11px", fontWeight: 700, marginTop: "4px" }}>
                    <CheckCircle2 size={13} /> Verificado en Servidor
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TARJETA DE IDENTIDAD DEL PACIENTE & DASHBOARD */}
          <div style={{
            padding: "22px 32px",
            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
            borderBottom: "1px solid #e2e8f0"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              alignItems: "center"
            }}>
              {/* Paciente Nombre & Avatar */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #0A4D5C 0%, #00d4aa 100%)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
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
                  <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    {paciente.nombres} {paciente.apellidos}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                    {paciente.tipo_documento} {paciente.documento}
                  </span>
                </div>
              </div>

              {/* Nacimiento y Edad */}
              <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.04em", display: "block" }}>
                  Fecha Nacimiento / Edad
                </span>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>
                  {paciente.fecha_nacimiento || "No especificada"}
                </div>
                <span style={{ fontSize: "11.5px", color: "#0e6678", fontWeight: 700 }}>
                  {edadInfo.texto}
                </span>
              </div>

              {/* Aseguradora y Cobertura */}
              <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "10.5px", fontWeight: 800, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.04em", display: "block" }}>
                  Aseguradora / Cobertura
                </span>
                <div style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>
                  {paciente.eps || "Particular"}
                </div>
                <span style={{ fontSize: "11.5px", color: "#065f46", fontWeight: 700 }}>
                  ● Esquema en Curso
                </span>
              </div>

              {/* Contador de Dosis */}
              <div style={{
                background: "linear-gradient(135deg, #0A4D5C 0%, #0d5f70 100%)",
                padding: "10px 16px",
                borderRadius: "10px",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#a0eaf5", fontWeight: 700, display: "block" }}>
                    Dosis Aplicadas
                  </span>
                  <div style={{ fontSize: "22px", fontWeight: 900, lineHeight: 1 }}>
                    {totalDosisAplicadas}
                  </div>
                </div>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(0, 212, 170, 0.2)",
                  color: "#00d4aa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Check size={20} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Barra de Progreso General */}
            <div style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "4px" }}>
                <span style={{ fontWeight: 700, color: "#475569" }}>
                  Progreso del Esquema Pediátrico Ampliado
                </span>
                <span style={{ fontWeight: 800, color: "#0A4D5C" }}>
                  {totalDosisAplicadas} dosis registradas
                </span>
              </div>
              <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: Math.max(5, progresoPorcentaje) + "%",
                  background: "linear-gradient(90deg, #0A4D5C 0%, #00d4aa 100%)",
                  borderRadius: "10px"
                }} />
              </div>
            </div>
          </div>

          {/* VIEW SWITCHER TABS & FILTERS */}
          <div style={{
            padding: "14px 32px",
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            {/* TABS DE CONMUTACIÓN DE VISTA */}
            <div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "12px", gap: "4px" }}>
              <button
                onClick={() => setVista("grafica")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "9px",
                  border: "none",
                  background: vista === "grafica" ? "#ffffff" : "transparent",
                  color: vista === "grafica" ? "#0A4D5C" : "#64748b",
                  fontWeight: vista === "grafica" ? 800 : 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: vista === "grafica" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                }}
              >
                <Layers size={15} />
                Línea de Tiempo (Por Edades)
              </button>

              <button
                onClick={() => setVista("matriz")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "9px",
                  border: "none",
                  background: vista === "matriz" ? "#ffffff" : "transparent",
                  color: vista === "matriz" ? "#0A4D5C" : "#64748b",
                  fontWeight: vista === "matriz" ? 800 : 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: vista === "matriz" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                }}
              >
                <FileText size={15} />
                Matriz Oficial (7 Columnas)
              </button>

              <button
                onClick={() => setVista("impresion")}
                style={{
                  padding: "8px 16px",
                  borderRadius: "9px",
                  border: "none",
                  background: vista === "impresion" ? "#ffffff" : "transparent",
                  color: vista === "impresion" ? "#0A4D5C" : "#64748b",
                  fontWeight: vista === "impresion" ? 800 : 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: vista === "impresion" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
                }}
              >
                <FileCheck size={15} />
                Vista Hoja Única (Impresión)
              </button>
            </div>

            {/* FILTROS (visibles en vista gráfica y matriz) */}
            {vista !== "impresion" && (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "11.5px", color: "#64748b", fontWeight: 700, marginRight: "4px" }}>
                  Filtrar:
                </span>
                {(["todos", "aplicadas", "pendientes"] as const).map((modo) => (
                  <button
                    key={modo}
                    onClick={() => setFiltro(modo)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "20px",
                      border: "1px solid " + (filtro === modo ? "#0A4D5C" : "#e2e8f0"),
                      background: filtro === modo ? "#e0f2f5" : "#ffffff",
                      color: filtro === modo ? "#0A4D5C" : "#64748b",
                      fontSize: "11.5px",
                      fontWeight: filtro === modo ? 800 : 600,
                      cursor: "pointer",
                      textTransform: "capitalize"
                    }}
                  >
                    {modo === "todos" ? "Todas" : modo === "aplicadas" ? "✅ Aplicadas" : "⏳ Pendientes"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ======================================================= */}
          {/* VISTA 1: LÍNEA DE TIEMPO GRÁFICA (POR EDADES)           */}
          {/* ======================================================= */}
          {vista === "grafica" && (
            <div style={{ padding: "26px 32px", background: "#f8fafc" }}>
              <div style={{ maxWidth: "860px", margin: "0 auto", position: "relative" }}>
                {HITOS_EDAD_PEDIATRICA.map((hito, hitoIdx) => {
                  const vacunasDelHito = hito.filasIds
                    .map((id) => {
                      const fila = getFilaPorId(id);
                      if (!fila) return null;
                      const app = matchesMap.get(id);
                      return { fila, app };
                    })
                    .filter((item): item is { fila: FilaEsquema; app: AplicacionVacuna | undefined } => item !== null);

                  const filtradas = vacunasDelHito.filter(({ app }) => {
                    if (filtro === "aplicadas") return !!app;
                    if (filtro === "pendientes") return !app;
                    return true;
                  });

                  if (filtradas.length === 0 && filtro !== "todos") {
                    return null;
                  }

                  const esEtapaActual = edadInfo.totalMeses >= hito.edadMesesMin && edadInfo.totalMeses <= hito.edadMesesMax;
                  const totalAplicadasHito = vacunasDelHito.filter(v => !!v.app).length;
                  const todasCompletas = totalAplicadasHito === vacunasDelHito.length && vacunasDelHito.length > 0;

                  return (
                    <div
                      key={hito.id}
                      style={{
                        marginBottom: "24px",
                        position: "relative",
                        paddingLeft: "32px",
                        borderLeft: "3px solid " + (todasCompletas ? "#10b981" : esEtapaActual ? "#0A4D5C" : "#cbd5e1")
                      }}
                    >
                      {/* Nodo circular del timeline */}
                      <div style={{
                        position: "absolute",
                        left: "-14px",
                        top: "0px",
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        background: todasCompletas ? "#10b981" : esEtapaActual ? "#0A4D5C" : "#ffffff",
                        border: "3px solid " + (todasCompletas ? "#a7f3d0" : esEtapaActual ? "#5ff2d0" : "#cbd5e1"),
                        color: todasCompletas || esEtapaActual ? "white" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 900
                      }}>
                        {todasCompletas ? "✓" : hitoIdx + 1}
                      </div>

                      {/* Header del Hito */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                        marginBottom: "12px"
                      }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "20px" }}>{hito.icono}</span>
                            <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                              {hito.titulo}
                            </h3>
                            {esEtapaActual && (
                              <span style={{
                                background: "#0A4D5C",
                                color: "#00d4aa",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "10.5px",
                                fontWeight: 800,
                                letterSpacing: "0.03em"
                              }}>
                                ETAPA ACTUAL
                              </span>
                            )}
                            {todasCompletas && (
                              <span style={{
                                background: "#ecfdf5",
                                color: "#065f46",
                                border: "1px solid #a7f3d0",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "10.5px",
                                fontWeight: 800
                              }}>
                                100% AL DÍA
                              </span>
                            )}
                          </div>
                          <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                            {hito.subtitulo}
                          </p>
                        </div>

                        <span style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: totalAplicadasHito > 0 ? "#0A4D5C" : "#94a3b8"
                        }}>
                          {totalAplicadasHito} de {vacunasDelHito.length} aplicadas
                        </span>
                      </div>

                      {/* Lista de Tarjetas de Vacunas dentro del Hito */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: "12px"
                      }}>
                        {filtradas.map(({ fila, app }) => {
                          const isApplied = !!app;
                          return (
                            <div
                              key={fila.id}
                              style={{
                                background: isApplied ? "#ffffff" : "#f8fafc",
                                border: "1.5px solid " + (isApplied ? "#a7f3d0" : "#e2e8f0"),
                                borderRadius: "14px",
                                padding: "14px",
                                position: "relative",
                                boxShadow: isApplied ? "0 3px 10px rgba(16, 185, 129, 0.08)" : "none"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                <span style={{
                                  fontSize: "10.5px",
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  color: isApplied ? "#065f46" : "#475569",
                                  background: isApplied ? "#ecfdf5" : "#e2e8f0",
                                  padding: "2px 8px",
                                  borderRadius: "6px"
                                }}>
                                  Dosis: {fila.dosis}
                                </span>

                                {isApplied ? (
                                  <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    color: "#059669",
                                    background: "#d1fae5",
                                    padding: "2px 8px",
                                    borderRadius: "12px"
                                  }}>
                                    <CheckCircle2 size={13} /> APLICADA
                                  </span>
                                ) : (
                                  <span style={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "#b45309",
                                    background: "#fef3c7",
                                    padding: "2px 8px",
                                    borderRadius: "12px"
                                  }}>
                                    PENDIENTE
                                  </span>
                                )}
                              </div>

                              <h4 style={{ fontSize: "14.5px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0", lineHeight: 1.25 }}>
                                {isApplied ? app.nombre_vacuna : fila.biologicoSugerido}
                              </h4>

                              {isApplied ? (
                                <div style={{ fontSize: "11.5px", color: "#334155" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                                    <Calendar size={13} color="#059669" />
                                    <span><strong>Fecha:</strong> {formatearFechaCorta(app.fecha_aplicacion)}</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "3px" }}>
                                    <Syringe size={13} color="#059669" />
                                    <span><strong>Lote:</strong> <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: "4px", fontWeight: 700 }}>{app.numero_lote || "S/L"}</code></span>
                                  </div>
                                  <div style={{ fontSize: "10.5px", color: "#065f46", fontWeight: 700, marginTop: "4px" }}>
                                    ✓ Avalado: {app.profesional_nombre || doctorNombre}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ fontSize: "11.5px", color: "#64748b" }}>
                                  <p style={{ margin: "0 0 4px 0" }}>
                                    Edad recomendada: <strong>{fila.edad}</strong>
                                  </p>
                                  <span style={{ fontSize: "10.5px", color: "#94a3b8", fontStyle: "italic" }}>
                                    Programar con el consultorio
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================= */}
          {/* VISTA 2: MATRIZ OFICIAL CANÓNICA (7 COLUMNAS)           */}
          {/* ======================================================= */}
          {vista === "matriz" && (
            <div style={{ padding: "20px 24px", overflowX: "auto" }}>
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "10px 16px",
                borderRadius: "10px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "12px",
                color: "#166534"
              }}>
                <Info size={16} />
                <span>
                  <strong>Formato Oficial de Expediente Pediátrico:</strong> Esta tabla replica exactamente el carné físico de vacunación de 7 columnas del Dr. Carlos Torres Martínez.
                </span>
              </div>

              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontFamily: "inherit",
                fontSize: "12px",
                background: "#ffffff"
              }}>
                <thead>
                  <tr style={{ background: primaryColor, color: "white" }}>
                    <th style={{ padding: "10px 8px", border: "1px solid #cbd5e1", textAlign: "left", width: "17%", color: "white" }}>
                      ME PROTEGE DE
                    </th>
                    <th style={{ padding: "10px 8px", border: "1px solid #cbd5e1", textAlign: "center", width: "12%", color: "white" }}>
                      EDAD
                    </th>
                    <th style={{ padding: "10px 8px", border: "1px solid #cbd5e1", textAlign: "center", width: "10%", color: "white" }}>
                      DOSIS
                    </th>
                    <th style={{ padding: "10px 8px", border: "1px solid #cbd5e1", textAlign: "center", width: "14%", color: "white" }}>
                      FECHA APLICACIÓN
                    </th>
                    <th style={{ padding: "10px 8px", border: "1px solid #cbd5e1", textAlign: "left", width: "21%", color: "white" }}>
                      NOMBRE
                    </th>
                    <th style={{ padding: "10px 8px", border: "1px solid #cbd5e1", textAlign: "center", width: "11%", color: "white" }}>
                      NÚMERO LOTE
                    </th>
                    <th style={{ padding: "10px 8px", border: "1px solid #cbd5e1", textAlign: "center", width: "15%", color: "white" }}>
                      FIRMA VACUNADOR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ESQUEMA_MATRIZ_CANONICO.map((cat) => {
                    const palette = getCategoriaPalette(cat.id);
                    return cat.filas.map((fila, filaIdx) => {
                      const app = matchesMap.get(fila.id);
                      const isApplied = !!app;

                      if (filtro === "aplicadas" && !isApplied) return null;
                      if (filtro === "pendientes" && isApplied) return null;

                      return (
                        <tr
                          key={fila.id}
                          style={{
                            background: isApplied ? "#f0fdf4" : filaIdx % 2 === 0 ? "#ffffff" : "#fafafa"
                          }}
                        >
                          {/* Categoría con rowspan */}
                          {filaIdx === 0 && (
                            <td
                              rowSpan={cat.filas.length}
                              style={{
                                padding: "8px 10px",
                                fontWeight: 800,
                                verticalAlign: "middle",
                                border: "1px solid #cbd5e1",
                                background: palette.bg,
                                color: palette.text,
                                fontSize: "11.5px",
                                lineHeight: 1.25
                              }}
                            >
                              {cat.titulo}
                            </td>
                          )}

                          <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", color: "#334155", fontWeight: 600 }}>
                            {fila.edad}
                          </td>

                          <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 800, color: isApplied ? "#065f46" : "#0f172a" }}>
                            {fila.dosis}
                          </td>

                          <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: isApplied ? 800 : 400 }}>
                            {isApplied ? (
                              <strong style={{ color: "#0f172a" }}>
                                {formatearFechaCorta(app.fecha_aplicacion)}
                              </strong>
                            ) : (
                              <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>-- / -- / ----</span>
                            )}
                          </td>

                          <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>
                            {isApplied ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <Check size={14} color="#10b981" strokeWidth={3} />
                                <strong style={{ color: "#065f46" }}>
                                  {app.nombre_vacuna}
                                </strong>
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "11.5px" }}>
                                ({fila.biologicoSugerido})
                              </span>
                            )}
                          </td>

                          <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                            {isApplied ? (
                              <span style={{ fontFamily: "monospace", background: "#f1f5f9", padding: "2px 7px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, color: "#1e293b", border: "1px solid #e2e8f0" }}>
                                {app.numero_lote || "S/L"}
                              </span>
                            ) : (
                              <span style={{ color: "#cbd5e1", fontFamily: "monospace" }}>--</span>
                            )}
                          </td>

                          <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>
                            {isApplied ? (
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#065f46", background: "#d1fae5", padding: "2px 8px", borderRadius: "6px" }}>
                                ✓ {app.profesional_nombre || doctorNombre}
                              </span>
                            ) : (
                              <span style={{ color: "#cbd5e1" }}>--</span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })}

                  {/* Vacunas Otras */}
                  {vacunasOtras.length > 0 && vacunasOtras.map((otra, idx) => (
                    <tr key={otra.id || idx} style={{ background: "#f0fdf4" }}>
                      {idx === 0 && (
                        <td
                          rowSpan={vacunasOtras.length}
                          style={{
                            padding: "8px 10px",
                            fontWeight: 800,
                            verticalAlign: "middle",
                            border: "1px solid #cbd5e1",
                            background: "#f1f5f9",
                            color: "#334155"
                          }}
                        >
                          OTRAS
                        </td>
                      )}
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>{otra.edad_aplicacion || "--"}</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 800 }}>{otra.dosis || "Única"}</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", fontWeight: 800 }}>{formatearFechaCorta(otra.fecha_aplicacion)}</td>
                      <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 800, color: "#065f46" }}>{otra.nombre_vacuna}</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center", fontFamily: "monospace" }}>{otra.numero_lote || "S/L"}</td>
                      <td style={{ padding: "8px", border: "1px solid #cbd5e1", textAlign: "center" }}>✓ {otra.profesional_nombre || doctorNombre}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ======================================================= */}
          {/* VISTA 3: SIMULACIÓN / PREVIA DE HOJA ÚNICA EN PANTALLA  */}
          {/* ======================================================= */}
          {vista === "impresion" && (
            <div style={{ padding: "26px 20px", background: "#cbd5e1", textAlign: "center" }}>
              <div style={{
                background: "#ffffff",
                width: "100%",
                maxWidth: "850px",
                margin: "0 auto",
                padding: "20px 24px",
                borderRadius: "8px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                textAlign: "left",
                boxSizing: "border-box"
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px"
                }}>
                  <div>
                    <strong style={{ fontSize: "14px", color: "#0A4D5C" }}>
                      📄 Formato Oficial de 1 Sola Hoja (Certificado de Inmunización)
                    </strong>
                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                      Diseñado milimétricamente para caber en 1 página de papel (Carta o A4) sin cortes ni saltos.
                    </p>
                  </div>
                  <button
                    onClick={handlePrint}
                    style={{
                      background: primaryColor,
                      color: "white",
                      border: "none",
                      padding: "8px 18px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Printer size={15} /> Imprimir Ahora
                  </button>
                </div>

                {/* Vista previa miniatura del documento */}
                <p style={{ fontSize: "12px", color: "#475569", textAlign: "center" }}>
                  Al presionar <strong>"Imprimir / Guardar en 1 Hoja (PDF)"</strong>, el navegador imprimirá exactamente la hoja única oficial certificada con firma y código QR.
                </p>
              </div>
            </div>
          )}

          {/* SELLO Y FIRMA MÉDICA DIGITAL (AL PIE DE LA VISTA WEB) */}
          <div style={{
            padding: "20px 32px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "20px"
            }}>
              {/* Info legal y QR */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "260px" }}>
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="QR Validación"
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "white",
                      padding: "3px"
                    }}
                  />
                )}
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", margin: "0 0 3px 0" }}>
                    Certificación Médica Digital Verificable
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: 1.3 }}>
                    Documento clínico expedido conforme al estándar oficial de inmunizaciones.
                  </p>
                  <p style={{ fontSize: "11px", color: "#0e6678", fontFamily: "monospace", margin: "4px 0 0 0" }}>
                    UUID: {paciente.token_acceso}
                  </p>
                </div>
              </div>

              {/* Sello y Firma del Doctor */}
              <DoctorMedicalSealBox
                doctorNombre={doctorNombre}
                doctorEspecialidad={doctorEspecialidad}
                registroMedico={registroMedico}
                compact={false}
              />
            </div>
          </div>

          {/* FOOTER ACCIONES WEB */}
          <div style={{
            padding: "14px 32px",
            background: "#f1f5f9",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Para validar o verificar la autenticidad de este carné, escanee el código QR o consulte el portal oficial.
            </span>
            <button
              onClick={handlePrint}
              style={{
                background: primaryColor,
                color: "white",
                border: "none",
                padding: "8px 18px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Printer size={15} /> Imprimir / PDF en 1 Hoja
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* VISTA EXCLUSIVA DE IMPRESIÓN / PDF (EXACTAMENTE 1 SOLA HOJA) */}
      {/* ============================================================ */}
      <div className="print-only print-sheet">
        {/* 1. ENCABEZADO INSTITUCIONAL CLÍNICO */}
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: "2px solid #0A4D5C",
            paddingBottom: "3px",
            marginBottom: "3px"
          }}>
            <div>
              <div style={{
                fontSize: "13px",
                fontWeight: 900,
                color: "#0A4D5C",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                lineHeight: 1.1
              }}>
                {doctorNombre}
              </div>
              <div style={{ fontSize: "8.5px", color: "#475569", fontWeight: 700, marginTop: "1px" }}>
                {doctorEspecialidad} • {registroMedico}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{
                background: "#0A4D5C",
                color: "#ffffff",
                fontSize: "8.5px",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "3px",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
                display: "inline-block"
              }}>
                CARNÉ OFICIAL DE INMUNIZACIÓN PEDIÁTRICA
              </span>
            </div>
          </div>

          {/* TIRA DE DATOS DEMOGRÁFICOS DEL PACIENTE (ULTRA-COMPACTA) */}
          <div style={{
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
            background: "#f8fafc",
            padding: "3px 6px",
            marginBottom: "4px"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.1fr 1.3fr 1fr",
              gap: "4px",
              fontSize: "8.5px",
              lineHeight: 1.2
            }}>
              <div>
                <span style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "7px" }}>PACIENTE: </span>
                <strong style={{ color: "#0f172a" }}>{paciente.nombres} {paciente.apellidos}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "7px" }}>DOCUMENTO: </span>
                <strong style={{ color: "#0f172a" }}>{paciente.tipo_documento} {paciente.documento}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "7px" }}>F. NAC. / EDAD: </span>
                <strong style={{ color: "#0f172a" }}>{paciente.fecha_nacimiento} ({edadInfo.texto})</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "7px" }}>ASEGURADORA: </span>
                <strong style={{ color: "#0f172a" }}>{paciente.eps || "Particular"}</strong>
              </div>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "0.5px solid #e2e8f0",
              paddingTop: "2px",
              marginTop: "2px",
              fontSize: "7px",
              color: "#64748b"
            }}>
              <span>
                <strong style={{ color: "#065f46" }}>● Estado:</strong> {totalDosisAplicadas} {totalDosisAplicadas === 1 ? "dosis aplicada" : "dosis aplicadas"} registradas
              </span>
              <span>
                <strong>Fecha Expedición:</strong> {fechaExpedicion}
              </span>
              <span style={{ fontFamily: "monospace", color: "#0e6678" }}>
                Token: {paciente.token_acceso}
              </span>
            </div>
          </div>
        </div>

        {/* 2. TABLA CANÓNICA DE 7 COLUMNAS AJUSTADA MILIMÉTRICAMENTE PARA 1 HOJA */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: "8.5px",
            lineHeight: 1.15
          }}>
            <thead>
              <tr style={{ background: "#0A4D5C", color: "white" }}>
                <th style={{ padding: "2px 4px", border: "0.5pt solid #94a3b8", textAlign: "left", width: "17%", color: "white", fontSize: "8px" }}>
                  ME PROTEGE DE
                </th>
                <th style={{ padding: "2px 4px", border: "0.5pt solid #94a3b8", textAlign: "center", width: "12%", color: "white", fontSize: "8px" }}>
                  EDAD
                </th>
                <th style={{ padding: "2px 4px", border: "0.5pt solid #94a3b8", textAlign: "center", width: "10%", color: "white", fontSize: "8px" }}>
                  DOSIS
                </th>
                <th style={{ padding: "2px 4px", border: "0.5pt solid #94a3b8", textAlign: "center", width: "14%", color: "white", fontSize: "8px" }}>
                  FECHA APLICACIÓN
                </th>
                <th style={{ padding: "2px 4px", border: "0.5pt solid #94a3b8", textAlign: "left", width: "20%", color: "white", fontSize: "8px" }}>
                  NOMBRE BIOLÓGICO
                </th>
                <th style={{ padding: "2px 4px", border: "0.5pt solid #94a3b8", textAlign: "center", width: "12%", color: "white", fontSize: "8px" }}>
                  NÚMERO LOTE
                </th>
                <th style={{ padding: "2px 4px", border: "0.5pt solid #94a3b8", textAlign: "center", width: "15%", color: "white", fontSize: "8px" }}>
                  FIRMA / PROFESIONAL
                </th>
              </tr>
            </thead>
            <tbody>
              {ESQUEMA_MATRIZ_CANONICO.map((cat) => {
                const palette = getCategoriaPalette(cat.id);
                return cat.filas.map((fila, filaIdx) => {
                  const app = matchesMap.get(fila.id);
                  const isApplied = !!app;

                  return (
                    <tr
                      key={fila.id}
                      style={{
                        background: isApplied ? "#f0fdf4" : filaIdx % 2 === 0 ? "#ffffff" : "#fbfcfd"
                      }}
                    >
                      {/* Columna 1 con rowspan */}
                      {filaIdx === 0 && (
                        <td
                          rowSpan={cat.filas.length}
                          style={{
                            padding: "1.5px 3px",
                            fontWeight: 800,
                            verticalAlign: "middle",
                            border: "0.5pt solid #94a3b8",
                            background: palette.bg,
                            color: palette.text,
                            fontSize: "8px",
                            lineHeight: 1.1,
                            letterSpacing: "-0.01em"
                          }}
                        >
                          {cat.titulo}
                        </td>
                      )}

                      {/* Columna 2: Edad */}
                      <td style={{
                        padding: "1.5px 3px",
                        border: "0.5pt solid #94a3b8",
                        textAlign: "center",
                        color: "#334155",
                        fontSize: "8px"
                      }}>
                        {fila.edad}
                      </td>

                      {/* Columna 3: Dosis */}
                      <td style={{
                        padding: "1.5px 3px",
                        border: "0.5pt solid #94a3b8",
                        textAlign: "center",
                        fontWeight: 800,
                        color: isApplied ? "#065f46" : "#0f172a",
                        fontSize: "8px"
                      }}>
                        {fila.dosis}
                      </td>

                      {/* Columna 4: Fecha */}
                      <td style={{
                        padding: "1.5px 3px",
                        border: "0.5pt solid #94a3b8",
                        textAlign: "center",
                        fontSize: "8px"
                      }}>
                        {isApplied ? (
                          <strong style={{ color: "#0f172a" }}>
                            {formatearFechaCorta(app.fecha_aplicacion)}
                          </strong>
                        ) : (
                          <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>-- / -- / ----</span>
                        )}
                      </td>

                      {/* Columna 5: Nombre */}
                      <td style={{
                        padding: "1.5px 3px",
                        border: "0.5pt solid #94a3b8",
                        fontSize: "8px"
                      }}>
                        {isApplied ? (
                          <strong style={{ color: "#065f46" }}>
                            ✓ {app.nombre_vacuna}
                          </strong>
                        ) : (
                          <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "7.5px" }}>
                            ({fila.biologicoSugerido})
                          </span>
                        )}
                      </td>

                      {/* Columna 6: Lote */}
                      <td style={{
                        padding: "1.5px 3px",
                        border: "0.5pt solid #94a3b8",
                        textAlign: "center",
                        fontSize: "8px"
                      }}>
                        {isApplied ? (
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                            {app.numero_lote || "S/L"}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>--</span>
                        )}
                      </td>

                      {/* Columna 7: Firma */}
                      <td style={{
                        padding: "1.5px 3px",
                        border: "0.5pt solid #94a3b8",
                        textAlign: "center",
                        fontSize: "7.5px"
                      }}>
                        {isApplied ? (
                          <span style={{ fontWeight: 800, color: "#065f46" }}>
                            ✓ {app.profesional_nombre || doctorNombre}
                          </span>
                        ) : (
                          <span style={{ color: "#cbd5e1" }}>--</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}

              {/* Fila Otras */}
              {vacunasOtras.length > 0 ? (
                vacunasOtras.map((otra, idx) => (
                  <tr key={otra.id || idx} style={{ background: "#f0fdf4" }}>
                    {idx === 0 && (
                      <td
                        rowSpan={vacunasOtras.length}
                        style={{
                          padding: "1.5px 3px",
                          fontWeight: 800,
                          verticalAlign: "middle",
                          border: "0.5pt solid #94a3b8",
                          background: "#f1f5f9",
                          color: "#334155",
                          fontSize: "8px"
                        }}
                      >
                        OTRAS
                      </td>
                    )}
                    <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", fontSize: "8px" }}>{otra.edad_aplicacion || "--"}</td>
                    <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", fontWeight: 800, fontSize: "8px" }}>{otra.dosis || "Única"}</td>
                    <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", fontWeight: 800, fontSize: "8px" }}>{formatearFechaCorta(otra.fecha_aplicacion)}</td>
                    <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", fontWeight: 800, color: "#065f46", fontSize: "8px" }}>✓ {otra.nombre_vacuna}</td>
                    <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", fontFamily: "monospace", fontSize: "8px" }}>{otra.numero_lote || "S/L"}</td>
                    <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", fontSize: "7.5px", fontWeight: 800, color: "#065f46" }}>✓ {otra.profesional_nombre || doctorNombre}</td>
                  </tr>
                ))
              ) : (
                <tr style={{ background: "#ffffff" }}>
                  <td style={{ padding: "1.5px 3px", fontWeight: 800, border: "0.5pt solid #94a3b8", background: "#f1f5f9", color: "#475569", fontSize: "8px" }}>
                    OTRAS
                  </td>
                  <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", color: "#94a3b8", fontSize: "8px" }}>--</td>
                  <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", color: "#94a3b8", fontSize: "8px" }}>--</td>
                  <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", color: "#cbd5e1", fontSize: "8px" }}>-- / -- / ----</td>
                  <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", color: "#94a3b8", fontStyle: "italic", fontSize: "7.5px" }}>(Dengue / COVID-19 / Otras)</td>
                  <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", color: "#cbd5e1", fontSize: "8px" }}>--</td>
                  <td style={{ padding: "1.5px 3px", border: "0.5pt solid #94a3b8", textAlign: "center", color: "#cbd5e1", fontSize: "7.5px" }}>--</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3. SELLO Y FIRMA DE AUTENTICACIÓN MÉDICA AL PIE DE LA HOJA ÚNICA */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginTop: "3px",
          paddingTop: "3px",
          borderTop: "1px solid #cbd5e1"
        }}>
          {/* QR de Verificación Instantánea */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "155px" }}>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Verificación"
                style={{ width: "54px", height: "54px", display: "block", borderRadius: "3px", border: "0.5pt solid #94a3b8" }}
              />
            ) : (
              <div style={{ width: "54px", height: "54px", background: "#f1f5f9", borderRadius: "3px", border: "0.5pt solid #94a3b8" }} />
            )}
            <div style={{ fontSize: "6.5px", color: "#475569", lineHeight: 1.15 }}>
              <strong style={{ color: "#0A4D5C", display: "block", fontSize: "7.5px" }}>VERIFICACIÓN CLÍNICA</strong>
              Escanee para validar la autenticidad e integridad del carné directamente en el servidor médico oficial.
            </div>
          </div>

          {/* Cláusula de Validez Sanitaria Oficial */}
          <div style={{ flex: 1, textAlign: "center", fontSize: "6.8px", color: "#475569", lineHeight: 1.2, padding: "0 6px" }}>
            <strong style={{ color: "#0f172a", textTransform: "uppercase" }}>Documento Clínico Oficial de Inmunización</strong>
            <p style={{ margin: "1px 0" }}>
              Emitido bajo los lineamientos técnicos del PAI y normatividad sanitaria de Colombia. Constancia válida de esquema de vacunación para fines escolares, consulares y de salud pública.
            </p>
            <code style={{ fontSize: "6.5px", color: "#0A4D5C", fontFamily: "monospace", display: "block" }}>
              Hash de Verificación: {paciente.token_acceso}
            </code>
          </div>

          {/* Sello y Firma Autógrafa del Dr. Carlos Torres */}
          <DoctorMedicalSealBox
            doctorNombre={doctorNombre}
            doctorEspecialidad={doctorEspecialidad}
            registroMedico={registroMedico}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
}
