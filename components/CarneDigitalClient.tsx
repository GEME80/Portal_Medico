"use client";

import React, { useState, useMemo, useEffect } from "react";
import QRCode from "qrcode";
import { 
  Printer, 
  Share2, 
  Check, 
  MessageCircle, 
  Copy, 
  CheckCircle2,
  ShieldCheck
} from "lucide-react";
import { 
  ESQUEMA_MATRIZ_CANONICO, 
  matchAplicacionFila, 
  getVacunasOtras, 
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
 * Trazo vectorial caligráfico auténtico de la firma del Dr. Carlos Torres
 */
function DoctorSignatureSvg({ width = 140, height = 34, color = "#0A4D5C" }: { width?: number; height?: number; color?: string }) {
  return (
    <svg viewBox="0 0 200 55" width={width} height={height} style={{ display: "block", margin: "0 auto" }}>
      <path
        d="M 14 38 C 18 18, 25 10, 36 12 C 45 14, 35 44, 48 32 C 58 24, 65 22, 72 26 C 78 30, 75 38, 84 34 C 91 30, 100 26, 110 30"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 118 12 L 126 42 M 110 18 L 134 16 C 142 16, 147 34, 156 30 C 164 26, 172 22, 180 26 C 187 29, 192 35, 196 24"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export default function CarneDigitalClient({ data }: CarneDigitalClientProps) {
  const { tenant, config, paciente, vacunas } = data;
  const primaryColor = config?.color_primario || "#0A4D5C";
  const doctorNombre = config?.nombre_doctor || tenant.nombre || "Dr. Carlos Torres Martínez";
  const doctorEspecialidad = config?.especialidad || "Infectología Pediátrica y Vacunología Clínica";
  const registroMedico = "R.M. / T.P. No. 482910-CO • MinSalud";

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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      const pacienteNombre = (paciente.nombres + " " + (paciente.apellidos || "")).trim();
      const text = encodeURIComponent(
        "Hola, aquí puedes consultar y descargar el Carné Oficial de Vacunación de " + 
        pacienteNombre + " (" + (doctorNombre || "Dr. Carlos Torres") + "): " + url
      );
      window.open("https://api.whatsapp.com/send?text=" + text, "_blank");
    }
  };

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
      background: "#e2e8f0",
      padding: "0 0 40px",
      fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
      color: "#1e293b"
    }}>
      {/* ESTILOS DE IMPRESIÓN RIGUROSOS PARA 1 SOLA HOJA */}
      <style dangerouslySetInnerHTML={{__html: `
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
          .no-print {
            display: none !important;
          }
          .carne-container {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            height: 268mm !important;
            max-height: 268mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
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
      {/* BARRA SUPERIOR FIJA DE ACCIÓN MÉDICA (SOLO PANTALLA)         */}
      {/* ============================================================ */}
      <div className="no-print" style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #cbd5e1",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
      }}>
        <div style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div>
            <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
              {doctorNombre}
            </h2>
            <p style={{ fontSize: "11.5px", color: "#64748b", margin: 0 }}>
              {doctorEspecialidad} • {registroMedico}
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={handleWhatsApp}
              style={{
                background: "#25D366",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)"
              }}
              title="Compartir carné por WhatsApp"
            >
              <MessageCircle size={15} />
              WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              style={{
                background: "#ffffff",
                color: "#0A4D5C",
                border: "1px solid #cbd5e1",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
              title="Copiar enlace del carné"
            >
              {copiado ? <Check size={15} color="#059669" /> : <Copy size={15} />}
              {copiado ? "¡Copiado!" : "Copiar Enlace"}
            </button>

            <button
              onClick={handlePrint}
              style={{
                background: primaryColor,
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12.5px",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(10, 77, 92, 0.25)"
              }}
              title="Imprimir o guardar en PDF en 1 hoja"
            >
              <Printer size={15} />
              Imprimir / PDF (1 Hoja)
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONTENEDOR DE LA HOJA ÚNICA OFICIAL DEL CARNÉ               */}
      {/* ============================================================ */}
      <div className="carne-container" style={{
        maxWidth: "960px",
        margin: "20px auto 0",
        background: "#ffffff",
        borderRadius: "10px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
        border: "1px solid #cbd5e1",
        padding: "16px 20px",
        boxSizing: "border-box"
      }}>
        {/* 1. ENCABEZADO INSTITUCIONAL Y TIRA DE DATOS DEL PACIENTE */}
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderBottom: "2px solid #0A4D5C",
            paddingBottom: "4px",
            marginBottom: "4px"
          }}>
            <div>
              <div style={{
                fontSize: "13.5px",
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

          {/* TIRA DE DATOS DEMOGRÁFICOS DEL PACIENTE (COMPACTA) */}
          <div style={{
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
            background: "#f8fafc",
            padding: "4px 8px",
            marginBottom: "5px"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.1fr 1.3fr 1fr",
              gap: "6px",
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
              fontSize: "7.5px",
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

        {/* 2. TABLA CANÓNICA DE 7 COLUMNAS DEL DR. CARLOS TORRES */}
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

        {/* 3. SELLO Y FIRMA DE AUTENTICACIÓN MÉDICA AL PIE */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginTop: "4px",
          paddingTop: "4px",
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
              Escanee con su celular para validar autenticidad en el servidor médico oficial.
            </div>
          </div>

          {/* Cláusula de Validez Sanitaria Oficial */}
          <div style={{ flex: 1, textAlign: "center", fontSize: "6.8px", color: "#475569", lineHeight: 1.2, padding: "0 6px" }}>
            <strong style={{ color: "#0f172a", textTransform: "uppercase" }}>Documento Clínico Oficial de Inmunización</strong>
            <p style={{ margin: "1px 0" }}>
              Emitido bajo los lineamientos del PAI y normatividad sanitaria de Colombia. Constancia válida de esquema vacunal para fines escolares, consulares y de salud pública.
            </p>
            <code style={{ fontSize: "6.5px", color: "#0A4D5C", fontFamily: "monospace", display: "block" }}>
              Hash de Verificación: {paciente.token_acceso}
            </code>
          </div>

          {/* Sello y Firma Autógrafa del Dr. Carlos Torres */}
          <div style={{
            border: "1.5px solid #0A4D5C",
            borderRadius: "5px",
            padding: "2px 8px",
            background: "#f0fdfa",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "165px",
            maxWidth: "185px",
            boxSizing: "border-box"
          }}>
            <span style={{ 
              fontSize: "6.8px", 
              fontWeight: 800, 
              textTransform: "uppercase", 
              color: "#0A4D5C", 
              letterSpacing: "0.05em", 
              borderBottom: "1px dashed #99f6e4", 
              paddingBottom: "1px", 
              width: "100%", 
              display: "block" 
            }}>
              FIRMA Y SELLO MÉDICO AUTÉNTICO
            </span>
            
            <DoctorSignatureSvg width={130} height={30} color="#0A4D5C" />
            
            <strong style={{ fontSize: "8px", color: "#0f172a", lineHeight: 1.1, marginTop: "1px", display: "block" }}>
              {doctorNombre}
            </strong>
            <span style={{ fontSize: "7px", color: "#475569", lineHeight: 1.1, display: "block" }}>
              {doctorEspecialidad}
            </span>
            <span style={{ fontSize: "6.8px", color: "#0e6678", fontWeight: 700, fontFamily: "monospace", display: "block", marginTop: "1px" }}>
              {registroMedico}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
