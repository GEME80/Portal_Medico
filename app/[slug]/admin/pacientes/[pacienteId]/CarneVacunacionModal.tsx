"use client";

import { useState, useEffect } from "react";
import { 
  Syringe, 
  Share2, 
  ExternalLink, 
  Check, 
  Plus, 
  Trash2, 
  Calendar, 
  ShieldCheck, 
  X, 
  AlertCircle,
  Package,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import { 
  AplicacionVacuna, 
  getVacunasPaciente, 
  getInventarioVacunasTenant, 
  registrarAplicacionVacuna, 
  eliminarAplicacionVacuna 
} from "@/lib/actions/vacunas-actions";
import { PLANTILLAS_VACUNAS } from "@/lib/vacunas/constants";

interface CarneVacunacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: any;
  tenantSlug: string;
  tenantId: string;
  currentUserRole: string;
}

export default function CarneVacunacionModal({
  isOpen,
  onClose,
  paciente,
  tenantSlug,
  tenantId,
  currentUserRole
}: CarneVacunacionModalProps) {
  const [activeTab, setActiveTab] = useState<"tarjetas" | "nueva">("tarjetas");
  const [vacunas, setVacunas] = useState<AplicacionVacuna[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventario, setInventario] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
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
  const [profesionalNombre, setProfesionalNombre] = useState("");
  const [origen, setOrigen] = useState<"institucional" | "externo">("institucional");
  const [observaciones, setObservaciones] = useState("");
  const [proximaCita, setProximaCita] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isRecepcion = currentUserRole === "recepcion";

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
      setErrorMsg("Error al cargar datos del carné.");
    } finally {
      setLoading(false);
    }
  };

  const getPublicCarneUrl = () => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    return `${origin}/${tenantSlug}/carne/${paciente.token_acceso}`;
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
      `Hola, adjuntamos el Carné de Vacunación Digital actualizado de *${paciente.nombres} ${paciente.apellidos}*:\n\n🔗 ${url}\n\nPuede consultarlo, guardarlo o imprimirlo en cualquier momento.`
    );
    
    const waUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${message}`
      : `https://wa.me/?text=${message}`;
      
    window.open(waUrl, "_blank");
  };

  const handleSelectPlantilla = (p: typeof PLANTILLAS_VACUNAS[0]) => {
    setSelectedInventarioId("");
    setNombreVacuna(p.nombre);
    setEnfermedadPrevenida(p.enfermedad);
    setEdadAplicacion(p.edad);
    setViaAdmin(p.via);
    setSitioAplicacion(p.sitio);
    setDosis(p.dosisDefecto || "1ra Dosis");
  };

  const handleSelectInventario = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const invId = e.target.value;
    setSelectedInventarioId(invId);
    if (!invId) return;

    const item = inventario.find(i => i.id === invId);
    if (item) {
      setNombreVacuna(item.nombre);
      setEnfermedadPrevenida(item.enfermedad || "");
      setLaboratorio(item.laboratorio || "");
      setNumeroLote(item.lote_activo || "");
      setViaAdmin(item.via_admin || "Intramuscular");
      setOrigen("institucional");
      setDescontarStock(true);
    }
  };

  const resetForm = () => {
    setSelectedInventarioId("");
    setNombreVacuna("");
    setEnfermedadPrevenida("");
    setDosis("1ra Dosis");
    setEdadAplicacion("");
    setFechaAplicacion(new Date().toISOString().split("T")[0]);
    setNumeroLote("");
    setLaboratorio("");
    setViaAdmin("Intramuscular");
    setSitioAplicacion("Deltoides derecho");
    setProfesionalNombre("");
    setOrigen("institucional");
    setObservaciones("");
    setProximaCita("");
    setErrorMsg("");
  };

  const handleSubmitNuevaVacuna = async (e: React.FormEvent) => {
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
      proxima_cita_sugerida: proximaCita || null,
      descontar_stock: descontarStock && !!selectedInventarioId
    }, tenantSlug);

    setSaving(false);

    if (res.success) {
      setSuccessMsg("¡Vacuna registrada con éxito en el Carné Digital!");
      setTimeout(() => setSuccessMsg(""), 3000);
      resetForm();
      setActiveTab("tarjetas");
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

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(5px)",
      zIndex: 1100,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        width: "100%",
        maxWidth: "960px",
        maxHeight: "92vh",
        borderRadius: "20px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative"
      }}>
        
        {/* ── HEADER ── */}
        <div style={{
          padding: "24px 32px",
          background: "linear-gradient(135deg, #0A4D5C 0%, #083c48 100%)",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "46px",
              height: "46px",
              borderRadius: "12px",
              background: "rgba(0, 212, 170, 0.2)",
              color: "#00D4AA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Syringe size={26} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Carné de Vacunación Digital
                </h2>
                <span style={{
                  background: "rgba(0, 212, 170, 0.15)",
                  color: "#00D4AA",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: 700
                }}>
                  Oficial
                </span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}>
                Paciente: <strong>{paciente.nombres} {paciente.apellidos}</strong> • {paciente.tipo_documento} {paciente.documento}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handleShareWhatsApp}
              title="Compartir enlace seguro del carné por WhatsApp"
              style={{
                background: "#25D366",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)"
              }}
            >
              <Share2 size={15} /> WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              title="Copiar enlace público del carné"
              style={{
                background: copiedLink ? "#10b981" : "rgba(255,255,255,0.15)",
                color: "white",
                border: "none",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
            >
              {copiedLink ? <Check size={15} /> : <ExternalLink size={15} />}
              {copiedLink ? "¡Copiado!" : "Copiar Enlace"}
            </button>

            <a
              href={`/${tenantSlug}/carne/${paciente.token_acceso}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir vista pública del carné"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "white",
                textDecoration: "none",
                padding: "8px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              Ver Carné ↗
            </a>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "white",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginLeft: "8px"
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── TABS BAR ── */}
        <div style={{
          padding: "12px 32px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          gap: "12px"
        }}>
          <button
            onClick={() => setActiveTab("tarjetas")}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: activeTab === "tarjetas" ? "white" : "transparent",
              color: activeTab === "tarjetas" ? "#0A4D5C" : "#64748b",
              boxShadow: activeTab === "tarjetas" ? "0 2px 8px rgba(0,0,0,0.06)" : "none"
            }}
          >
            <Layers size={16} />
            Tarjetas Aplicadas ({vacunas.length})
          </button>

          <button
            onClick={() => setActiveTab("nueva")}
            style={{
              padding: "8px 18px",
              borderRadius: "10px",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: activeTab === "nueva" ? "#00D4AA" : "transparent",
              color: activeTab === "nueva" ? "#0f172a" : "#64748b",
              boxShadow: activeTab === "nueva" ? "0 2px 8px rgba(0, 212, 170, 0.25)" : "none"
            }}
          >
            <Plus size={16} />
            + Registrar Vacuna
          </button>
        </div>

        {/* ── CONTENT BODY ── */}
        <div style={{ padding: "28px 32px", overflowY: "auto", flex: 1, background: "#ffffff" }}>
          
          {successMsg && (
            <div style={{
              background: "#ecfdf5",
              border: "1px solid #10b981",
              color: "#065f46",
              padding: "12px 18px",
              borderRadius: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              fontWeight: 600
            }}>
              <Check size={18} /> {successMsg}
            </div>
          )}

          {errorMsg && (
            <div style={{
              background: "#fff1f2",
              border: "1px solid #f43f5e",
              color: "#9f1239",
              padding: "12px 18px",
              borderRadius: "12px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px"
            }}>
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          {/* TAB 1: TARJETAS DE VACUNACIÓN APLICADAS */}
          {activeTab === "tarjetas" && (
            <div>
              {loading ? (
                <div style={{ textAlign: "center", padding: "50px 0", color: "#64748b" }}>
                  <Syringe size={32} style={{ animation: "bounce 1s infinite", margin: "0 auto 12px", color: "#00D4AA" }} />
                  <p>Cargando historial de vacunación...</p>
                </div>
              ) : vacunas.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "50px 20px",
                  background: "#f8fafc",
                  borderRadius: "16px",
                  border: "2px dashed #cbd5e1"
                }}>
                  <Syringe size={42} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
                  <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b", margin: "0 0 6px 0" }}>
                    No hay vacunas registradas en el carné
                  </h3>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 18px 0", maxWidth: "440px", marginInline: "auto" }}>
                    Registre las vacunas administradas en consulta o los antecedentes vacunales que el menor ya recibió.
                  </p>
                  <button
                    onClick={() => setActiveTab("nueva")}
                    style={{
                      background: "#00D4AA",
                      color: "#0f172a",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    + Registrar Primera Vacuna
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px" }}>
                  {vacunas.map((vac) => (
                    <div
                      key={vac.id}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "18px",
                        position: "relative",
                        transition: "all 0.2s",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                      }}
                    >
                      {/* Top Badges */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <span style={{
                          background: vac.origen === "institucional" ? "rgba(0, 212, 170, 0.15)" : "rgba(59, 130, 246, 0.1)",
                          color: vac.origen === "institucional" ? "#00876c" : "#2563eb",
                          padding: "3px 8px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase"
                        }}>
                          {vac.origen === "institucional" ? "🏥 Consultorio" : "📋 Antecedente"}
                        </span>

                        <span style={{
                          background: "#0A4D5C",
                          color: "white",
                          padding: "3px 8px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 700
                        }}>
                          {vac.dosis}
                        </span>
                      </div>

                      {/* Vaccine Name */}
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                        {vac.nombre_vacuna}
                      </h4>

                      {vac.enfermedad_prevenida && (
                        <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
                          Protege: {vac.enfermedad_prevenida}
                        </p>
                      )}

                      {/* Meta Grid */}
                      <div style={{
                        background: "white",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        fontSize: "12px",
                        color: "#334155",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        border: "1px solid #edf2f7"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#64748b" }}>Fecha Aplicación:</span>
                          <strong>{vac.fecha_aplicacion}</strong>
                        </div>

                        {vac.numero_lote && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748b" }}>Lote:</span>
                            <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: "4px", fontSize: "11px" }}>
                              {vac.numero_lote}
                            </code>
                          </div>
                        )}

                        {vac.laboratorio && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748b" }}>Laboratorio:</span>
                            <span>{vac.laboratorio}</span>
                          </div>
                        )}

                        {vac.via_administracion && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748b" }}>Vía & Sitio:</span>
                            <span>{vac.via_administracion} {vac.sitio_aplicacion ? `(${vac.sitio_aplicacion})` : ""}</span>
                          </div>
                        )}

                        {vac.edad_aplicacion && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748b" }}>Edad al aplicar:</span>
                            <span>{vac.edad_aplicacion}</span>
                          </div>
                        )}

                        {vac.profesional_nombre && (
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748b" }}>Profesional:</span>
                            <span>{vac.profesional_nombre}</span>
                          </div>
                        )}
                      </div>

                      {vac.observaciones && (
                        <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                          Obs: {vac.observaciones}
                        </p>
                      )}

                      {/* Card Actions */}
                      <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleDeleteVacuna(vac.id)}
                          disabled={deletingId === vac.id}
                          title="Eliminar este registro"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: "12px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            borderRadius: "6px"
                          }}
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FORMULARIO REGISTRAR VACUNA */}
          {activeTab === "nueva" && (
            <form onSubmit={handleSubmitNuevaVacuna} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Opción A: Cargar desde Inventario */}
              {inventario.length > 0 && (
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "14px",
                  padding: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <Package size={18} color="#16a34a" />
                    <strong style={{ fontSize: "13px", color: "#166534" }}>
                      Seleccionar de Inventario de Vacunas Activo
                    </strong>
                  </div>
                  <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#15803d" }}>
                    Auto-completa el nombre, lote activo y laboratorio, y permite descontar stock del consultorio.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", alignItems: "center" }}>
                    <select
                      value={selectedInventarioId}
                      onChange={handleSelectInventario}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #86efac",
                        background: "white",
                        fontSize: "13px"
                      }}
                    >
                      <option value="">-- Seleccione del inventario (Opcional) --</option>
                      {inventario.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.nombre} {inv.laboratorio ? `(${inv.laboratorio})` : ""} - Stock: {inv.stock_actual} {inv.lote_activo ? `[Lote: ${inv.lote_activo}]` : ""}
                        </option>
                      ))}
                    </select>

                    {selectedInventarioId && (
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#166534", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={descontarStock}
                          onChange={(e) => setDescontarStock(e.target.checked)}
                        />
                        Descontar 1 unidad de stock
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Opción B: Chips de Plantillas Rápidas */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                  <Sparkles size={14} color="#00D4AA" /> Plantillas Rápidas (Esquema Pediátrico Sugerido):
                </label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {PLANTILLAS_VACUNAS.slice(0, 10).map((plantilla, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPlantilla(plantilla)}
                      style={{
                        background: nombreVacuna === plantilla.nombre ? "#0A4D5C" : "#f1f5f9",
                        color: nombreVacuna === plantilla.nombre ? "white" : "#334155",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: 600,
                        transition: "all 0.15s"
                      }}
                    >
                      {plantilla.nombre} ({plantilla.edad})
                    </button>
                  ))}
                </div>
              </div>

              {/* Fila 1: Nombre de Vacuna & Enfermedad */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Nombre de la Vacuna / Biológico *
                  </label>
                  <input
                    required
                    placeholder="Ej. Hexavalente, Rotavirus, Triple Viral..."
                    value={nombreVacuna}
                    onChange={(e) => setNombreVacuna(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Enfermedad Prevenida
                  </label>
                  <input
                    placeholder="Ej. Difteria, Tétanos, Tosferina, Polio..."
                    value={enfermedadPrevenida}
                    onChange={(e) => setEnfermedadPrevenida(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* Fila 2: Dosis, Fecha y Edad */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Dosis Aplicada *
                  </label>
                  <select
                    value={dosis}
                    onChange={(e) => setDosis(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="1ra Dosis">1ra Dosis</option>
                    <option value="2da Dosis">2da Dosis</option>
                    <option value="3ra Dosis">3ra Dosis</option>
                    <option value="1er Refuerzo">1er Refuerzo</option>
                    <option value="2do Refuerzo">2do Refuerzo</option>
                    <option value="Dosis Única">Dosis Única</option>
                    <option value="Recién Nacido">Dosis Recién Nacido</option>
                    <option value="Dosis Anual">Dosis Anual</option>
                    <option value="Refuerzo">Refuerzo</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Fecha de Aplicación *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaAplicacion}
                    onChange={(e) => setFechaAplicacion(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Edad al Aplicar
                  </label>
                  <input
                    placeholder="Ej. 2 Meses, 1 Año..."
                    value={edadAplicacion}
                    onChange={(e) => setEdadAplicacion(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* Fila 3: Lote, Laboratorio, Origen */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Número de Lote
                  </label>
                  <input
                    placeholder="Ej. VAC2026-X01"
                    value={numeroLote}
                    onChange={(e) => setNumeroLote(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Laboratorio Fabricante
                  </label>
                  <input
                    placeholder="Ej. Sanofi, GSK, Pfizer, MSD..."
                    value={laboratorio}
                    onChange={(e) => setLaboratorio(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Origen de la Dosis
                  </label>
                  <select
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value as "institucional" | "externo")}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="institucional">🏥 Aplicada en Consultorio</option>
                    <option value="externo">📋 Antecedente (Otra IPS / Histórica)</option>
                  </select>
                </div>
              </div>

              {/* Fila 4: Vía, Sitio, Profesional */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Vía de Administración
                  </label>
                  <select
                    value={viaAdmin}
                    onChange={(e) => setViaAdmin(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  >
                    <option value="Intramuscular">Intramuscular</option>
                    <option value="Subcutánea">Subcutánea</option>
                    <option value="Oral">Oral</option>
                    <option value="Intradérmica">Intradérmica</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Sitio Anatómico
                  </label>
                  <input
                    placeholder="Ej. Deltoides der., Vasto externo..."
                    value={sitioAplicacion}
                    onChange={(e) => setSitioAplicacion(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Profesional / Vacunador
                  </label>
                  <input
                    placeholder="Nombre del profesional"
                    value={profesionalNombre}
                    onChange={(e) => setProfesionalNombre(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* Fila 5: Observaciones & Próxima Cita */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Observaciones Clínicas / Reacciones
                  </label>
                  <input
                    placeholder="Tolerancia adecuada, sin efectos adversos inmediatos..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Próxima Dosis / Cita Sugerida
                  </label>
                  <input
                    type="date"
                    value={proximaCita}
                    onChange={(e) => setProximaCita(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("tarjetas")}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    background: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#475569"
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#00D4AA",
                    color: "#0f172a",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(0, 212, 170, 0.3)"
                  }}
                >
                  {saving ? "Guardando en Carné..." : "Guardar en Carné de Vacunación"}
                </button>
              </div>

            </form>
          )}

        </div>

        {/* ── FOOTER BAR ── */}
        <div style={{
          padding: "14px 32px",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#64748b"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={16} color="#00b28e" />
            <span>Carné encriptado bajo token de acceso seguro para el paciente y acudientes.</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#0A4D5C",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
}
