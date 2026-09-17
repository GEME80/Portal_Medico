"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Activity, 
  Share2, 
  Check, 
  Copy, 
  ExternalLink, 
  Plus, 
  MessageCircle, 
  Calendar, 
  Scale, 
  Ruler, 
  RotateCw,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import VectorGrowthChart from "@/components/VectorGrowthChart";
import { getPuntosCrecimientoPaciente, agregarMedicionHistorica } from "@/lib/actions/clinical-actions";
import { calcularMesesPaciente } from "@/lib/oms/constants";

interface CurvasCrecimientoModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: any;
  tenantSlug: string;
}

export default function CurvasCrecimientoModal({
  isOpen,
  onClose,
  paciente,
  tenantSlug
}: CurvasCrecimientoModalProps) {
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Formulario nueva medición manual
  const [newFecha, setNewFecha] = useState(new Date().toISOString().split("T")[0]);
  const [newPeso, setNewPeso] = useState("");
  const [newTalla, setNewTalla] = useState("");
  const [newPerimetro, setNewPerimetro] = useState("");
  const [savingMedicion, setSavingMedicion] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cargar mediciones cuando se abre el modal
  const cargarMediciones = async () => {
    if (!paciente?.id) return;
    setLoading(true);
    try {
      const data = await getPuntosCrecimientoPaciente(paciente.id);
      setMediciones(data || []);
    } catch (err) {
      console.error("Error al cargar puntos de crecimiento:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && paciente?.id) {
      cargarMediciones();
    }
  }, [isOpen, paciente?.id]);

  const meses = useMemo(() => {
    return paciente?.fecha_nacimiento ? calcularMesesPaciente(paciente.fecha_nacimiento) : 0;
  }, [paciente?.fecha_nacimiento]);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined" || !paciente?.token_acceso) return "";
    return `${window.location.origin}/${tenantSlug}/crecimiento/${paciente.token_acceso}`;
  }, [tenantSlug, paciente?.token_acceso]);

  const esMasculino = useMemo(() => {
    const g = (paciente?.genero || "").toUpperCase();
    return g.startsWith("M");
  }, [paciente?.genero]);

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!publicUrl) return;
    const nombre = `${paciente.nombres || ""} ${paciente.apellidos || ""}`.trim();
    const texto = `Hola, te comparto el enlace oficial para consultar las Curvas de Crecimiento OMS de ${nombre} (Resolución 2465/2016 MinSalud): ${publicUrl}`;
    const cleanPhone = (paciente.telefono || "").replace(/[^0-9]/g, "");
    
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    
    window.open(waUrl, "_blank");
  };

  const handleSaveMedicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paciente?.id || (!newPeso && !newTalla)) return;

    setSavingMedicion(true);
    try {
      await agregarMedicionHistorica(
        paciente.id,
        newPeso,
        newTalla,
        newFecha,
        newPerimetro || undefined
      );
      setNewPeso("");
      setNewTalla("");
      setNewPerimetro("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await cargarMediciones();
    } catch (err) {
      console.error("Error al registrar medición histórica:", err);
      alert("No se pudo registrar la medición. Intenta nuevamente.");
    } finally {
      setSavingMedicion(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: "16px",
      overflowY: "auto"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "980px",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        border: "1px solid #cbd5e1",
        overflow: "hidden"
      }}>
        {/* HEADER MODAL */}
        <div style={{
          padding: "18px 24px",
          borderBottom: "1px solid #e2e8f0",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: esMasculino ? "#eff6ff" : "#fdf2f8",
              border: `1px solid ${esMasculino ? "#bfdbfe" : "#fbcfe8"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Activity size={22} color={esMasculino ? "#2563eb" : "#db2777"} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "19px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Curvas de Crecimiento OMS
                </h2>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: esMasculino ? "#dbeafe" : "#fce7f3",
                  color: esMasculino ? "#1e40af" : "#9d174d",
                  border: `1px solid ${esMasculino ? "#bfdbfe" : "#fbcfe8"}`
                }}>
                  {esMasculino ? "Patrón Niños (Celeste)" : "Patrón Niñas (Rosado)"}
                </span>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "9999px",
                  background: "#f1f5f9",
                  color: "#475569"
                }}>
                  {meses < 24 ? `${meses} meses` : `${Math.floor(meses / 12)} años y ${meses % 12}m`}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
                Paciente: <strong style={{ color: "#334155" }}>{paciente?.nombres} {paciente?.apellidos}</strong> • Resolución 2465 de 2016 MinSalud Colombia
              </p>
            </div>
          </div>

          {/* ACCIONES SUPERIORES */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* WHATSAPP */}
            <button
              onClick={handleWhatsAppShare}
              title="Enviar informe oficial por WhatsApp a los padres"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#25D366",
                color: "white",
                border: "none",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)"
              }}
            >
              <MessageCircle size={14} />
              Enviar WhatsApp
            </button>

            {/* COPIAR ENLACE */}
            <button
              onClick={handleCopyLink}
              title="Copiar enlace público del visor de curvas"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "#ffffff",
                color: "#0A4D5C",
                border: "1px solid #cbd5e1",
                padding: "7px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {copiedLink ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              {copiedLink ? "¡Copiado!" : "Copiar Enlace"}
            </button>

            {/* ABRIR VISTA PÚBLICA */}
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir vista pública del informe y curvas"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "#f8fafc",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  padding: "7px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textDecoration: "none"
                }}
              >
                <ExternalLink size={13} />
                Ver Vista Padres
              </a>
            )}

            {/* CERRAR */}
            <button
              onClick={onClose}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                marginLeft: "4px"
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CUERPO DEL MODAL */}
        <div style={{
          padding: "20px 24px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {loading ? (
            <div style={{
              padding: "48px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px"
            }}>
              <RotateCw size={28} className="animate-spin text-[#0A4D5C]" />
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#64748b" }}>
                Cargando curvas de crecimiento y calibraciones OMS...
              </p>
            </div>
          ) : (
            <>
              {/* COMPONENTE VECTORIAL PRINCIPAL */}
              <VectorGrowthChart
                paciente={paciente}
                mediciones={mediciones}
              />

              {/* FORMULARIO DE AGREGAR MEDICIÓN HISTÓRICA */}
              <div style={{
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "16px 20px"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                  gap: "8px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Plus size={16} color="#0A4D5C" />
                    <h4 style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                      Agregar Registro Antropométrico Manual
                    </h4>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      (Se graficará automáticamente en las curvas del paciente)
                    </span>
                  </div>

                  {saveSuccess && (
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#166534",
                      background: "#dcfce7",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}>
                      <Check size={13} /> Medición guardada con éxito
                    </span>
                  )}
                </div>

                <form onSubmit={handleSaveMedicion} style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr)) 140px",
                  gap: "12px",
                  alignItems: "end"
                }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Fecha de Medición *
                    </label>
                    <input
                      type="date"
                      required
                      value={newFecha}
                      onChange={(e) => setNewFecha(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: "12.5px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "white",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Peso (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.5"
                      max="150"
                      placeholder="Ej: 12.4"
                      required
                      value={newPeso}
                      onChange={(e) => setNewPeso(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: "12.5px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "white",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Talla / Longitud (cm) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="30"
                      max="220"
                      placeholder="Ej: 87.5"
                      required
                      value={newTalla}
                      onChange={(e) => setNewTalla(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: "12.5px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "white",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Perím. Cefálico (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="70"
                      placeholder="Opcional"
                      value={newPerimetro}
                      onChange={(e) => setNewPerimetro(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        fontSize: "12.5px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "white",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingMedicion}
                    style={{
                      background: "#0A4D5C",
                      color: "white",
                      border: "none",
                      padding: "9px 16px",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: 800,
                      cursor: savingMedicion ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      height: "38px"
                    }}
                  >
                    {savingMedicion ? (
                      <RotateCw size={14} className="animate-spin" />
                    ) : (
                      <Plus size={15} />
                    )}
                    {savingMedicion ? "Guardando" : "Registrar"}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
