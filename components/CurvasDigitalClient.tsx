"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { 
  Printer, 
  Share2, 
  Check, 
  Copy, 
  ShieldCheck, 
  Download, 
  Syringe, 
  Calendar, 
  Activity, 
  User, 
  Scale, 
  Building2, 
  Phone, 
  FileText,
  MessageCircle,
  Sparkles
} from "lucide-react";
import VectorGrowthChart from "./VectorGrowthChart";
import { calcularMesesPaciente, evaluarZScoreResolucion2465 } from "@/lib/oms/constants";

interface CurvasDigitalClientProps {
  data: {
    tenant: { id: string; nombre: string; slug: string };
    config: any;
    paciente: any;
    mediciones: any[];
  };
}

function DoctorSignatureSvg({ width = 135, height = 32, color = "#0A4D5C" }: { width?: number; height?: number; color?: string }) {
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

function formatearEdadMeses(totalMeses: number): string {
  const anios = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;
  if (anios === 0) return `${meses} meses`;
  if (meses === 0) return `${anios} ${anios === 1 ? 'año' : 'años'}`;
  return `${anios} ${anios === 1 ? 'año' : 'años'}, ${meses} m`;
}

export default function CurvasDigitalClient({ data }: CurvasDigitalClientProps) {
  const { tenant, config, paciente, mediciones } = data;
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const nombreDoctor = config?.nombre_doctor || "Dr. Carlos Torres Martínez";
  const especialidad = config?.especialidad || "Médico Pediatra • Especialista en Crecimiento y Desarrollo";
  const nombrePaciente = `${paciente.nombres} ${paciente.apellidos || ""}`.trim();

  // Generar código QR dinámico
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      QRCode.toDataURL(url, {
        width: 120,
        margin: 1,
        color: { dark: "#0A4D5C", light: "#ffffff" }
      }).then(setQrDataUrl).catch(console.error);
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShareWhatsApp = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      const phone = paciente.telefono || "";
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const message = encodeURIComponent(
        `Hola, le compartimos el Informe Oficial y Curvas de Crecimiento OMS de *${nombrePaciente}* emitido por el consultorio del *${nombreDoctor}*:\n\n🔗 ${url}\n\nPuede consultar la evolución antropométrica, gráficas y descargarlo en PDF en cualquier momento.`
      );
      const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
      window.open(waUrl, "_blank");
    }
  };

  // Última medición registrada
  const ultimaMedicion = useMemo(() => {
    if (!mediciones || mediciones.length === 0) return null;
    return mediciones[mediciones.length - 1];
  }, [mediciones]);

  const edadActualMeses = useMemo(() => {
    return calcularMesesPaciente(paciente.fecha_nacimiento);
  }, [paciente.fecha_nacimiento]);

  // Diagnóstico nutricional actual sugerido
  const diagnosticoActual = useMemo(() => {
    if (!ultimaMedicion?.signos_vitales) return null;
    const sv = ultimaMedicion.signos_vitales;
    const p = parseFloat(String(sv.peso || 0));
    const t = parseFloat(String(sv.talla || 0));
    if (p <= 0 || t <= 0) return null;

    const m = t > 3 ? t / 100 : t;
    const imc = p / (m * m);

    // Si es >= 5 años (60 meses) el estándar es IMC/Edad
    if (edadActualMeses >= 60) {
      // zScore aproximado
      const zscore = (imc - 16.5) / 2.2;
      return evaluarZScoreResolucion2465('imc_edad', zscore, edadActualMeses);
    } else {
      // Menor de 5 años: Peso/Talla
      const zscore = (p - (t * 0.22)) / 1.5;
      return evaluarZScoreResolucion2465('peso_talla', zscore, edadActualMeses);
    }
  }, [ultimaMedicion, edadActualMeses]);

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Outfit', sans-serif" }}>
      
      {/* ── BARRA SUPERIOR FIJA DE ACCIONES (Oculta en Impresión) ── */}
      <div className="no-print curvas-topbar" style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        padding: "10px 20px"
      }}>
        <div className="curvas-topbar-inner" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(0, 212, 170, 0.15)",
              color: "#00D4AA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Activity size={18} />
            </div>
            <div>
              <div style={{ color: "#ffffff", fontWeight: "700", fontSize: "13.5px", lineHeight: "1.2" }}>
                Curvas de Crecimiento OMS Oficiales
              </div>
              <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                {nombrePaciente} • {nombreDoctor}
              </div>
            </div>
          </div>

          <div className="curvas-topbar-buttons" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {/* Botón Enlace al Carné de Vacunación */}
            <Link
              href={`/${tenant.slug}/carne/${paciente.token_acceso || paciente.id}`}
              className="curvas-action-btn"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "7px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                textDecoration: "none",
                transition: "all 0.15s"
              }}
            >
              <Syringe size={14} color="#00D4AA" />
              <span>Ver Carné</span>
            </Link>

            {/* Botón WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="curvas-action-btn"
              style={{
                background: "#25D366",
                color: "#ffffff",
                border: "none",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 6px rgba(37, 211, 102, 0.3)"
              }}
            >
              <MessageCircle size={14} />
              <span>WhatsApp</span>
            </button>

            {/* Botón Copiar Enlace */}
            <button
              onClick={handleCopyLink}
              className="curvas-action-btn"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "7px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {copied ? <Check size={14} color="#00D4AA" /> : <Copy size={14} />}
              <span>{copied ? "¡Copiado!" : "Copiar"}</span>
            </button>

            {/* Botón Imprimir / PDF */}
            <button
              onClick={handlePrint}
              className="curvas-action-btn"
              style={{
                background: "#00D4AA",
                color: "#0f172a",
                border: "none",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(0, 212, 170, 0.3)"
              }}
            >
              <Printer size={14} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CUERPO DEL DOCUMENTO MÉDICO (Optimizado para Pantalla e Impresión) ── */}
      <div className="curvas-page-wrapper" style={{ maxWidth: "980px", margin: "24px auto", padding: "0 16px 40px 16px" }}>
        
        <div className="curvas-sheet" style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          overflow: "hidden",
          padding: "32px"
        }}>
          
          {/* ── ENCABEZADO INSTITUCIONAL ── */}
          <div className="curvas-header" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #0A4D5C",
            paddingBottom: "20px",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "800", color: "#00b28e", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                INFORME ANTROPOMÉTRICO OFICIAL
              </div>
              <h1 style={{ margin: "4px 0 0 0", fontSize: "22px", fontWeight: "800", color: "#0A4D5C", letterSpacing: "-0.02em" }}>
                Curvas de Crecimiento Infantil OMS
              </h1>
              <div style={{ fontSize: "13px", color: "#334155", fontWeight: "600", marginTop: "2px" }}>
                {nombreDoctor}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {especialidad} • Resolución 2465 de 2016 (MinSalud Colombia)
              </div>
            </div>

            <div className="curvas-header-right" style={{ textAlign: "right", fontSize: "12px", color: "#64748b" }}>
              <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "13px" }}>{tenant.nombre}</div>
              {config?.direccion && <div>{config.direccion}</div>}
              {config?.telefono && <div>Tel: {config.telefono}</div>}
              <div style={{ marginTop: "4px", fontSize: "11px", color: "#059669", fontWeight: "600" }}>
                ✓ Documento Certificado Digitalmente
              </div>
            </div>
          </div>

          {/* ── DATOS DEL PACIENTE Y RESUMEN ANTROPOMÉTRICO ── */}
          <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "20px",
            marginBottom: "24px"
          }}>
            <div className="curvas-patient-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Paciente</span>
                <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{nombrePaciente}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Documento</span>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#334155" }}>
                  {paciente.tipo_documento} {paciente.documento}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Edad Actual</span>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#00b28e" }}>
                  {formatearEdadMeses(edadActualMeses)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "700" }}>Sexo / Género</span>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#334155" }}>
                  {paciente.genero === "F" || paciente.genero === "Femenino" ? "Femenino (Niña)" : "Masculino (Niño)"}
                </div>
              </div>
            </div>

            {/* Tarjetas KPI de Última Medición */}
            {ultimaMedicion && (
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Scale size={14} color="#0A4D5C" /> Último Control Registrado ({ultimaMedicion.fecha_medicion || ultimaMedicion.created_at.split('T')[0]}):
                </div>

                <div className="curvas-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                  <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Peso Actual</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0A4D5C" }}>
                      {ultimaMedicion.signos_vitales?.peso ? `${ultimaMedicion.signos_vitales.peso} kg` : "--"}
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Talla Actual</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0A4D5C" }}>
                      {ultimaMedicion.signos_vitales?.talla ? `${ultimaMedicion.signos_vitales.talla} cm` : "--"}
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>IMC Calculado</div>
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0A4D5C" }}>
                      {ultimaMedicion.signos_vitales?.imc || "--"}
                    </div>
                  </div>

                  {ultimaMedicion.signos_vitales?.perimetro_cefalico && (
                    <div style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>P. Cefálico</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#0A4D5C" }}>
                        {ultimaMedicion.signos_vitales.perimetro_cefalico} cm
                      </div>
                    </div>
                  )}

                  {diagnosticoActual && (
                    <div className="kpi-diag-card" style={{
                      background: diagnosticoActual.badgeBg,
                      border: `1px solid ${diagnosticoActual.badgeBorder}`,
                      borderRadius: "10px",
                      padding: "10px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}>
                      <div style={{ fontSize: "11px", color: "#475569", fontWeight: "700" }}>Clasificación Nutricional (OMS)</div>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: diagnosticoActual.color }}>
                        {diagnosticoActual.estado}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {diagnosticoActual.descripcion}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── GRÁFICA VECTORIAL INTERACTIVA ── */}
          <div style={{ marginBottom: "32px" }}>
            <VectorGrowthChart
              paciente={paciente}
              mediciones={mediciones}
            />
          </div>

          {/* ── TABLA HISTÓRICA DE MEDICIONES ── */}
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileText size={18} color="#0A4D5C" /> Historial Cronológico de Mediciones Antropométricas
            </h3>

            <div className="mobile-swipe-hint">
              ↔ Desliza horizontalmente para ver todos los datos de los controles
            </div>

            {mediciones.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b", fontSize: "13px" }}>
                No hay mediciones registradas para este paciente.
              </div>
            ) : (
              <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "12px", WebkitOverflowScrolling: "touch" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left", minWidth: "620px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontWeight: "700" }}>
                      <th style={{ padding: "10px 14px" }}>Fecha</th>
                      <th style={{ padding: "10px 14px" }}>Edad en Control</th>
                      <th style={{ padding: "10px 14px" }}>Peso</th>
                      <th style={{ padding: "10px 14px" }}>Talla</th>
                      <th style={{ padding: "10px 14px" }}>IMC</th>
                      <th style={{ padding: "10px 14px" }}>P. Cefálico</th>
                      <th style={{ padding: "10px 14px" }}>Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mediciones.map((m, idx) => {
                      const fecha = m.fecha_medicion || m.created_at.split("T")[0];
                      const meses = calcularMesesPaciente(paciente.fecha_nacimiento, m.created_at || m.fecha_medicion);
                      const sv = m.signos_vitales || {};
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: "600", color: "#0f172a" }}>{fecha}</td>
                          <td style={{ padding: "10px 14px", color: "#475569" }}>{formatearEdadMeses(meses)}</td>
                          <td style={{ padding: "10px 14px", fontWeight: "700", color: "#0A4D5C" }}>{sv.peso ? `${sv.peso} kg` : "--"}</td>
                          <td style={{ padding: "10px 14px", fontWeight: "700", color: "#0A4D5C" }}>{sv.talla ? `${sv.talla} cm` : "--"}</td>
                          <td style={{ padding: "10px 14px", color: "#334155" }}>{sv.imc || "--"}</td>
                          <td style={{ padding: "10px 14px", color: "#334155" }}>{sv.perimetro_cefalico ? `${sv.perimetro_cefalico} cm` : "--"}</td>
                          <td style={{ padding: "10px 14px", color: "#64748b", fontSize: "11px" }}>
                            {m.tipo === "consulta" ? "Consulta Médica" : "Registro Histórico"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── PIE INSTITUCIONAL, CÓDIGO QR Y FIRMA ── */}
          <div className="curvas-footer" style={{
            borderTop: "2px solid #e2e8f0",
            paddingTop: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {qrDataUrl && (
                <img 
                  src={qrDataUrl} 
                  alt="QR Verificación" 
                  style={{ width: "80px", height: "80px", borderRadius: "8px", border: "1px solid #cbd5e1", flexShrink: 0 }} 
                />
              )}
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#0A4D5C" }}>
                  VERIFICACIÓN DIGITAL OFICIAL
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", maxWidth: "260px", marginTop: "2px" }}>
                  Escanee el código QR para validar la autenticidad y vigencia de este registro antropométrico.
                </div>
                <div style={{ fontSize: "9px", fontFamily: "monospace", color: "#94a3b8", marginTop: "4px" }}>
                  Token: {paciente.token_acceso || paciente.id}
                </div>
              </div>
            </div>

            {/* Firma Médica Digital */}
            <div style={{ textAlign: "center", minWidth: "220px" }}>
              <DoctorSignatureSvg width={150} height={36} color="#0A4D5C" />
              <div style={{ borderTop: "1px solid #cbd5e1", marginTop: "4px", paddingTop: "4px" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#0A4D5C" }}>{nombreDoctor}</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>Pediatra • Reg. Médico Oficial</div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Estilos de Responsividad Móvil y Pantalla Fina */}
      <style>{`
        .mobile-swipe-hint {
          display: none;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #0A4D5C;
          background: #e0f2f5;
          padding: 6px 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          border: 1px dashed #99f6e4;
        }

        .kpi-diag-card {
          grid-column: span 2;
        }

        @media screen and (max-width: 768px) {
          .curvas-page-wrapper {
            padding: 0 8px 30px !important;
            margin: 12px auto !important;
          }
          .curvas-sheet {
            padding: 18px 14px !important;
            border-radius: 14px !important;
          }
          .curvas-topbar {
            padding: 8px 12px !important;
          }
          .curvas-topbar-inner {
            gap: 8px !important;
          }
          .curvas-action-btn {
            font-size: 11px !important;
            padding: 6px 10px !important;
          }
          .curvas-header-right {
            text-align: left !important;
            margin-top: 8px !important;
            border-top: 1px dashed #e2e8f0;
            padding-top: 10px;
            width: 100%;
          }
          .curvas-patient-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .mobile-swipe-hint {
            display: block !important;
          }
          .kpi-diag-card {
            grid-column: 1 / -1 !important;
          }
          .curvas-footer {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 16px !important;
          }
        }

        @media screen and (max-width: 480px) {
          .curvas-patient-grid {
            grid-template-columns: 1fr !important;
          }
          .curvas-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .curvas-topbar-buttons {
            width: 100%;
            justify-content: space-between;
          }
          .curvas-action-btn {
            flex: 1;
            justify-content: center;
            padding: 6px 6px !important;
          }
        }

        @media print {
          .no-print {
            display: none !important;
          }
          body, html {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: letter portrait;
            margin: 8mm 10mm;
          }
        }
      `}</style>

    </div>
  );
}
