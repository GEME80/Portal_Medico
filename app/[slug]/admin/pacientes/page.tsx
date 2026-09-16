"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { guardarHistoriaClinica, crearPacienteExpress, buscarCIE10, getDiagnosticosMasUsados } from "@/lib/actions/clinical-actions";
import CustomConfirmModal from "@/components/CustomConfirmModal";
import { Search, UserPlus, ShieldCheck, Users } from "lucide-react";


export default function PacientesPage({ params }: { params: { slug: string } }) {
  const [pacientesList, setPacientesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Slide-over state
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [savingForm, setSavingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // CIE-10 state
  const [cieSearch, setCieSearch] = useState("");
  const [cieOptions, setCieOptions] = useState<any[]>([]);
  const [cieSelected, setCieSelected] = useState<any | null>(null);
  const [cieLoading, setCieLoading] = useState(false);
  const [cieFrecuentes, setCieFrecuentes] = useState<any[]>([]);

  
  // Selected or New Patient state
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [selectedPacienteData, setSelectedPacienteData] = useState<any>(null);
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);

  const handleConfirmCerrar = () => {
    setShowConfirmCerrar(false);
    const form = document.getElementById('clinical-form') as HTMLFormElement;
    if (form) {
      handleSubmit(form, "cerrado");
    }
  };
  
  // Vitals State
  const [peso, setPeso] = useState<string>("");
  const [talla, setTalla] = useState<string>("");
  const [imc, setImc] = useState<string>("");

  const supabase = createClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantSlug = pathname.split('/')[1];

  const [currentUserRole, setCurrentUserRole] = useState<string>("medico");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.app_metadata?.role) {
        setCurrentUserRole(user.app_metadata.role);
      }
    });
  }, []);

  const isRecepcion = currentUserRole === "recepcion";

  const loadCieFrecuentes = async () => {
    if (isRecepcion) return;
    try {
      const res = await getDiagnosticosMasUsados(tenantSlug);
      setCieFrecuentes(res);
    } catch (e) {
      console.error("Error loading frequent diagnoses", e);
    }
  };

  useEffect(() => {
    loadCieFrecuentes();
  }, [tenantSlug, isRecepcion]);

  const fetchPacientes = async () => {

    setLoading(true);
    const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", tenantSlug).single();
    if (tenant) {
      let query = supabase
        .from("pacientes")
        .select(`
          id,
          nombres,
          apellidos,
          documento,
          created_at,
          historias_clinicas ( created_at )
        `)
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`documento.ilike.%${searchQuery}%,nombres.ilike.%${searchQuery}%,apellidos.ilike.%${searchQuery}%`);
      }
      
      const { data } = await query;
      if (data) setPacientesList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPacientes();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, tenantSlug]);

  // Listener para auto-abrir nueva consulta desde el perfil
  useEffect(() => {
    const action = searchParams.get('action');
    const pid = searchParams.get('pid');
    
    if (action === 'new' && pid && pacientesList.length > 0) {
      const pData = pacientesList.find(p => p.id === pid);
      if (pData) {
        openNewHistory(pid, pData);
        // Limpiar URL para no re-abrir si recarga
        router.replace(`/${tenantSlug}/admin/pacientes`, { scroll: false });
      }
    }
  }, [searchParams, pacientesList, tenantSlug, router]);

  // Buscador CIE-10 (Debounced)
  useEffect(() => {
    if (!cieSearch || cieSearch.length < 2 || cieSelected?.codigo === cieSearch) {
      setCieOptions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setCieLoading(true);
      try {
        const results = await buscarCIE10(cieSearch);
        setCieOptions(results);
      } catch (e) {
        console.error("Error fetching CIE10", e);
      }
      setCieLoading(false);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [cieSearch, cieSelected]);

  useEffect(() => {
    const p = parseFloat(peso);
    const t = parseFloat(talla);
    if (!isNaN(p) && !isNaN(t) && t > 0) {
      const metros = t > 3 ? t / 100 : t;
      const imcValue = (p / (metros * metros)).toFixed(2);
      setImc(imcValue);
    } else {
      setImc("");
    }
  }, [peso, talla]);

  const openNewHistory = (pacienteId?: string, pacienteData?: any) => {
    setSelectedPacienteId(pacienteId || null);
    setSelectedPacienteData(pacienteData || null);
    setActiveTab(pacienteId ? 2 : 1);
    setPeso("");
    setTalla("");
    setImc("");
    setErrorMsg("");
    setCieSearch("");
    setCieSelected(null);
    setCieOptions([]);
    setIsSlideOverOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeSlideOver = () => {
    setIsSlideOverOpen(false);
    document.body.style.overflow = 'auto';
  };

  const handleCreatePaciente = async (formData: FormData): Promise<string> => {
    const data = Object.fromEntries(formData.entries());
    const res = await crearPacienteExpress(data, tenantSlug);
    if (!res.success) {
      throw new Error(res.error || 'Error al registrar el paciente.');
    }
    return res.data.id;
  };

  const handleCreatePacienteExpressOnly = async (form: HTMLFormElement) => {
    setSavingForm(true);
    setErrorMsg("");
    try {
      const formData = new FormData(form);
      await handleCreatePaciente(formData);
      closeSlideOver();
      fetchPacientes();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar paciente.');
    } finally {
      setSavingForm(false);
    }
  };

  const handleSubmit = async (form: HTMLFormElement, estado: "borrador" | "cerrado") => {
    setSavingForm(true);
    setErrorMsg("");

    if (!cieSelected) {
      setErrorMsg("Debe buscar y seleccionar un Diagnóstico Principal (CIE-10) oficial de la lista desplegable.");
      setSavingForm(false);
      return;
    }
    
    const formData = new FormData(form);
    
    try {
      let finalPacienteId = selectedPacienteId;
      
      if (!finalPacienteId) {
        finalPacienteId = await handleCreatePaciente(formData);
      }
      
      const data = {
        paciente_id: finalPacienteId,
        estado,
        metadatos_atencion: {
          causa_externa: formData.get("causa_externa"),
          finalidad_consulta: formData.get("finalidad_consulta")
        },
        signos_vitales: {
          tension_arterial: formData.get("tension_arterial"),
          frecuencia_cardiaca: formData.get("frecuencia_cardiaca"),
          frecuencia_respiratoria: formData.get("frecuencia_respiratoria"),
          temperatura: formData.get("temperatura"),
          saturacion: formData.get("saturacion"),
          peso: formData.get("peso"),
          talla: formData.get("talla"),
          imc: imc
        },
        motivo_consulta: formData.get("motivo_consulta") as string,
        enfermedad_actual: formData.get("enfermedad_actual") as string,
        anamnesis: formData.get("anamnesis") as string,
        plan_manejo: formData.get("plan_manejo") as string,
        impresion_diagnostica: [{
          codigo: cieSelected.codigo,
          descripcion: cieSelected.descripcion,
          tipo: formData.get("tipo_diagnostico")
        }],
        procedimientos: [],
        facturacion: {}
      };

      const saveRes = await guardarHistoriaClinica(data, tenantSlug);
      if (!saveRes.success) {
        setErrorMsg(saveRes.error || "Ocurrió un error al guardar la historia clínica.");
        setSavingForm(false);
        return;
      }
      closeSlideOver();
      fetchPacientes();
      loadCieFrecuentes();
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error al guardar la historia clínica.");
    }
    setSavingForm(false);
  };

  const tabs = [
    { id: 1, label: "Identificación" },
    { id: 2, label: "Atención & Signos" },
    { id: 3, label: "Evolución Médica" },
    { id: 4, label: "Diagnóstico & Cierre" }
  ];

  const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: "700", color: "#64748b", marginBottom: "8px" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" };
  const nextBtnStyle = { background: "#00D4AA", color: "#0f172a", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" };
  const prevBtnStyle = { background: "#f1f5f9", color: "#475569", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" };

  const RipsBadge = () => <span style={{ marginLeft: "6px", fontSize: "10px", padding: "2px 6px", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", borderRadius: "4px", fontWeight: "700" }}>RIPS</span>;

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
            <Users size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="admin-topbar-title" style={{ margin: 0, lineHeight: 1.2 }}>Gestión de Pacientes</h1>
            <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "2px 0 0" }}>
              Directorio de pacientes, historias clínicas y registro de consultas
            </p>
          </div>
        </div>
        <div className="admin-topbar-right">
          <button 
            onClick={() => openNewHistory()}
            style={{
              background: "#00D4AA",
              color: "#0f172a",
              fontWeight: "700",
              fontSize: "13px",
              padding: "9px 18px",
              borderRadius: "9px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0, 212, 170, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px"
            }}
          >
            <UserPlus size={15} />
            <span>Nuevo Paciente</span>
          </button>
        </div>
      </div>

      <div style={{ padding: "32px", fontFamily: "'Outfit', sans-serif", minHeight: "calc(100vh - 64px)", background: "#f8fafc" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px" }}>
        <div style={{ flex: 1, maxWidth: "600px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b", margin: "0 0 16px 0" }}>
            Pacientes
          </h1>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={18} style={{ position: "absolute", left: "16px", color: "#64748b", pointerEvents: "none" }} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o número de documento..." 
              style={{
                width: "100%",
                padding: "14px 20px 14px 44px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                color: "#1e293b",
                fontSize: "15px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                transition: "border-color 0.2s",
                outline: "none"
              }}
            />
          </div>
        </div>
        
        <button 
          onClick={() => openNewHistory()}
          style={{
            background: "#00D4AA",
            color: "#0f172a",
            fontWeight: "700",
            fontSize: "14px",
            padding: "12px 24px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 212, 170, 0.25)",
            transition: "transform 0.15s, box-shadow 0.15s",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <UserPlus size={16} />
          <span>Nuevo Paciente</span>
        </button>
      </div>

      <div style={{
        background: "#ffffff",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
      }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b", fontSize: "18px" }}>Cargando información...</div>
        ) : pacientesList.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#64748b", fontSize: "18px" }}>
            No se encontraron pacientes.{searchQuery ? " Intenta otra búsqueda." : ""}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "20px", textAlign: "left", color: "#475569", fontWeight: "600", fontSize: "14px", textTransform: "uppercase" }}>Paciente</th>
                <th style={{ padding: "20px", textAlign: "left", color: "#475569", fontWeight: "600", fontSize: "14px", textTransform: "uppercase" }}>Documento</th>
                <th style={{ padding: "20px", textAlign: "left", color: "#475569", fontWeight: "600", fontSize: "14px", textTransform: "uppercase" }}>Última Atención</th>
                <th style={{ padding: "20px", textAlign: "left", color: "#475569", fontWeight: "600", fontSize: "14px", textTransform: "uppercase" }}>Estado</th>
                <th style={{ padding: "20px", textAlign: "center", color: "#475569", fontWeight: "600", fontSize: "14px", textTransform: "uppercase" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {pacientesList.map((paciente) => {
                const atenciones = paciente.historias_clinicas || [];
                const ultimaAtencion = atenciones.length > 0 
                  ? atenciones.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
                  : null;

                return (
                <tr key={paciente.id} style={{ borderBottom: "1px solid #e2e8f0", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "#f8fafc"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "20px", fontWeight: "600", color: "#1e293b" }}>{paciente.nombres} {paciente.apellidos}</td>
                  <td style={{ padding: "20px", color: "#64748b" }}>{paciente.documento}</td>
                  <td style={{ padding: "20px", color: "#64748b" }}>
                    {ultimaAtencion 
                      ? new Date(ultimaAtencion).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric' })
                      : "Sin atenciones previas"}
                  </td>
                  <td style={{ padding: "20px" }}>
                    <span style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "700",
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#059669",
                      border: "1px solid rgba(16, 185, 129, 0.3)"
                    }}>
                      ACTIVO
                    </span>
                  </td>
                  <td style={{ padding: "20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <Link 
                        href={`/${tenantSlug}/admin/pacientes/${paciente.id}`}
                        style={{
                          background: "#f1f5f9",
                          color: "#334155",
                          border: "1px solid #cbd5e1",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textDecoration: "none"
                        }}
                      >
                        Consultar
                      </Link>
                      {!isRecepcion && (
                        <button 
                          onClick={() => openNewHistory(paciente.id, paciente)}
                          style={{
                            background: "rgba(0, 212, 170, 0.1)",
                            color: "#00b28e",
                            border: "1px solid rgba(0, 212, 170, 0.3)",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          Nueva Consulta
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over Modal for New History */}
      {isSlideOverOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          {/* Modal Background click to close */}
          <div style={{ position: "absolute", inset: 0 }} onClick={closeSlideOver}></div>
          
          {/* Slide-over panel */}
          <div style={{ 
            position: "absolute",
            top: 0, right: 0, bottom: 0, width: "600px", maxWidth: "100%",
            background: "#ffffff", 
            borderLeft: "1px solid #e2e8f0",
            boxShadow: "-10px 0 40px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <style>{`
              @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>
            
            <div style={{ padding: "32px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, color: "#1e293b", fontSize: "22px", fontWeight: 800 }}>
                  {isRecepcion 
                    ? "Registro de Nuevo Paciente" 
                    : `Nueva Historia Médica ${selectedPacienteData ? `- ${selectedPacienteData.nombres} ${selectedPacienteData.apellidos}` : ""}`}
                </h2>
                {isRecepcion && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                    Ingresa los datos demográficos básicos para la admisión en sala de espera.
                  </p>
                )}
              </div>
              <button onClick={closeSlideOver} style={{ background: "transparent", border: "none", color: "#9ca3af", fontSize: "28px", cursor: "pointer" }}>&times;</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
                  {errorMsg}
                </div>
              )}

              {/* Banner informativo para recepción */}
              {isRecepcion && (
                <div style={{
                  background: "rgba(10, 77, 92, 0.06)",
                  border: "1px solid rgba(10, 77, 92, 0.18)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "24px",
                  fontSize: "13px",
                  color: "#0A4D5C",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <ShieldCheck size={18} />
                  <span><strong>Modo Admisión / Secretaría:</strong> Solo se capturan datos demográficos. El historial clínico y diagnósticos CIE-10 son exclusivos del médico.</span>
                </div>
              )}

              {/* Context Summary for Existing Patient */}
              {selectedPacienteId && selectedPacienteData && (
                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#1e293b" }}>{selectedPacienteData.nombres} {selectedPacienteData.apellidos}</h3>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>{selectedPacienteData.tipo_documento} {selectedPacienteData.documento} • {selectedPacienteData.eps || "Sin EPS"}</p>
                  </div>
                  <div style={{ background: "rgba(0, 212, 170, 0.1)", color: "#00b28e", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                    PACIENTE REGISTRADO
                  </div>
                </div>
              )}

              {/* Tabs Nav (solo para rol médico) */}
              {!isRecepcion && (
                <div style={{ display: "flex", borderBottom: "2px solid rgba(255,255,255,0.1)", marginBottom: "32px" }}>
                  {tabs.filter(tab => !selectedPacienteId || tab.id !== 1).map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        flex: 1,
                        padding: "16px",
                        background: "transparent",
                        color: activeTab === tab.id ? "#00D4AA" : "#9ca3af",
                        border: "none",
                        borderBottom: activeTab === tab.id ? "3px solid #00D4AA" : "3px solid transparent",
                        fontWeight: activeTab === tab.id ? "700" : "500",
                        fontSize: "15px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              <form id="clinical-form">
                {/* Tab 1: Identificación */}
                <div className="tab-container" data-tab="1" style={{ display: activeTab === 1 ? "block" : "none" }}>
                  <h3 style={{ color: "#1e293b", marginBottom: "24px", fontSize: "20px" }}>
                    {selectedPacienteData 
                      ? `Nueva Consulta - ${selectedPacienteData.nombres} ${selectedPacienteData.apellidos}` 
                      : "Datos Demográficos del Paciente"}
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div>
                      <label style={labelStyle}>Documento <RipsBadge /></label>
                      <input name="documento" required defaultValue={selectedPacienteData?.documento} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} placeholder="CC o TI" />
                    </div>
                    <div>
                      <label style={labelStyle}>Nombres <RipsBadge /></label>
                      <input name="nombres" required defaultValue={selectedPacienteData?.nombres} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} />
                    </div>
                    <div>
                      <label style={labelStyle}>Apellidos <RipsBadge /></label>
                      <input name="apellidos" required defaultValue={selectedPacienteData?.apellidos} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} />
                    </div>
                    <div>
                      <label style={labelStyle}>Fecha de Nacimiento <RipsBadge /></label>
                      <input type="date" name="fecha_nacimiento" required defaultValue={selectedPacienteData?.fecha_nacimiento} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} />
                    </div>
                    <div>
                      <label style={labelStyle}>EPS <RipsBadge /></label>
                      <input name="eps" defaultValue={selectedPacienteData?.eps} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} />
                    </div>
                    <div>
                      <label style={labelStyle}>Género <RipsBadge /></label>
                      <select name="genero" required defaultValue={selectedPacienteData?.genero} disabled={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}}>
                        <option value="">Seleccione...</option>
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Tipo de Sangre</label>
                      <select name="tipo_sangre" defaultValue={selectedPacienteData?.tipo_sangre} disabled={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}}>
                        <option value="">Seleccione...</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Prepagada / Adicional</label>
                      <input name="prepagada" defaultValue={selectedPacienteData?.prepagada} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} placeholder="Ej. Colsanitas" />
                    </div>
                    <div>
                      <label style={labelStyle}>Teléfono Paciente</label>
                      <input name="telefono" defaultValue={selectedPacienteData?.telefono} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} placeholder="+573001234567" />
                    </div>
                    <div>
                      <label style={labelStyle}>Nombre Padre</label>
                      <input name="padre" defaultValue={selectedPacienteData?.padre} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} />
                    </div>
                    <div>
                      <label style={labelStyle}>Teléfono Padre</label>
                      <input name="telefono_padre" defaultValue={selectedPacienteData?.telefono_padre} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} placeholder="+57..." />
                    </div>
                    <div>
                      <label style={labelStyle}>Nombre Madre</label>
                      <input name="madre" defaultValue={selectedPacienteData?.madre} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} />
                    </div>
                    <div>
                      <label style={labelStyle}>Teléfono Madre</label>
                      <input name="telefono_madre" defaultValue={selectedPacienteData?.telefono_madre} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} placeholder="+57..." />
                    </div>
                    <div>
                      <label style={labelStyle}>Nombre Acompañante</label>
                      <input name="acompanante" defaultValue={selectedPacienteData?.acompanante} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} />
                    </div>
                    <div>
                      <label style={labelStyle}>Tel. Acompañante</label>
                      <input name="telefono_acompanante" defaultValue={selectedPacienteData?.telefono_acompanante} readOnly={!!selectedPacienteId} style={{...inputStyle, background: selectedPacienteId ? "rgba(255,255,255,0.05)" : inputStyle.background}} placeholder="+57..." />
                    </div>
                  </div>
                  <div style={{ marginTop: "32px", textAlign: "right" }}>
                    {isRecepcion ? (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <button type="button" onClick={closeSlideOver} style={prevBtnStyle}>
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={savingForm}
                          onClick={() => {
                            const form = document.getElementById("clinical-form") as HTMLFormElement;
                            if (form) handleCreatePacienteExpressOnly(form);
                          }}
                          style={{
                            background: "#00D4AA",
                            color: "#0f172a",
                            border: "none",
                            padding: "12px 28px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            cursor: savingForm ? "not-allowed" : "pointer"
                          }}
                        >
                          {savingForm ? "Registrando..." : "Registrar Paciente"}
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setActiveTab(2)} style={nextBtnStyle}>Siguiente: Atención & Signos →</button>
                    )}
                  </div>
                </div>

                {/* Tab 2: Atención y Signos */}
                <div className="tab-container" data-tab="2" style={{ display: activeTab === 2 ? "flex" : "none", flexDirection: "column", gap: "24px" }}>
                  
                  {/* MinSalud Reqs: Moved Motivo and Enfermedad here to be the very first thing recorded */}
                  <h3 style={{ color: "#1e293b", margin: 0, fontSize: "20px" }}>Atención Inicial</h3>
                  <div>
                    <label style={labelStyle}>Motivo de Consulta</label>
                    <input name="motivo_consulta" required style={inputStyle} placeholder="¿Por qué acude el paciente?" />
                  </div>
                  <div>
                    <label style={labelStyle}>Enfermedad Actual</label>
                    <textarea name="enfermedad_actual" required rows={3} style={{...inputStyle, resize: "vertical"}} placeholder="Descripción detallada de los síntomas..." />
                  </div>

                  <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "8px 0" }}></div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                    <div>
                      <label style={labelStyle}>Causa Externa <RipsBadge /></label>
                      <select name="causa_externa" required style={inputStyle}>
                        <option value="15">15 - Enfermedad General</option>
                        <option value="01">01 - Accidente de Trabajo</option>
                        <option value="02">02 - Accidente de Tránsito</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Finalidad de Consulta <RipsBadge /></label>
                      <select name="finalidad_consulta" required defaultValue={selectedPacienteId ? "11" : "10"} style={inputStyle}>
                        <option value="10">10 - Atención de Primera Vez</option>
                        <option value="11">11 - Atención de Control</option>
                        <option value="08">08 - Urgencias</option>
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "16px 0" }}></div>
                  
                  <h3 style={{ color: "#00D4AA", margin: 0, fontSize: "20px" }}>Signos Vitales y Examen Físico</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
                    <div>
                      <label style={labelStyle}>Tensión Arterial (mmHg)</label>
                      <input name="tension_arterial" placeholder="120/80" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Frecuencia Cardíaca (lpm)</label>
                      <input type="number" name="frecuencia_cardiaca" placeholder="80" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Frecuencia Respiratoria (rpm)</label>
                      <input type="number" name="frecuencia_respiratoria" required placeholder="16" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Temperatura (°C)</label>
                      <input type="number" step="0.1" name="temperatura" placeholder="36.5" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Saturación (SpO2 %)</label>
                      <input type="number" name="saturacion" required placeholder="98" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Peso (kg)</label>
                      <input type="number" step="0.1" name="peso" value={peso} onChange={e => setPeso(e.target.value)} placeholder="70" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Talla (cm)</label>
                      <input type="number" step="0.1" name="talla" value={talla} onChange={e => setTalla(e.target.value)} placeholder="170" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>IMC Calculado</label>
                      <input value={imc} readOnly style={{...inputStyle, background: "rgba(0,0,0,0.6)", color: parseFloat(imc) > 25 ? "#f59e0b" : "#34d399", fontWeight: "bold"}} placeholder="Automático" />
                    </div>
                  </div>
                  <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between" }}>
                    {selectedPacienteId ? 
                      <div /> /* Empty div to push next button to the right */ : 
                      <button type="button" onClick={() => setActiveTab(1)} style={prevBtnStyle}>← Anterior</button>
                    }
                    <button type="button" onClick={() => setActiveTab(3)} style={nextBtnStyle}>Siguiente: Evolución →</button>
                  </div>
                </div>

                {/* Tab 3: Evolución Médica */}
                <div className="tab-container" data-tab="3" style={{ display: activeTab === 3 ? "flex" : "none", flexDirection: "column", gap: "24px" }}>
                  <h3 style={{ color: "#1e293b", margin: 0, fontSize: "20px" }}>Anamnesis y Antecedentes</h3>
                  <div>
                    <label style={labelStyle}>Antecedentes Clínicos Permanentes (Familiares, Personales, Quirúrgicos, Alergias)</label>
                    <textarea name="anamnesis" rows={5} style={{...inputStyle, resize: "vertical"}} placeholder="Familiares, personales, quirúrgicos..." />
                  </div>
                  <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between" }}>
                    <button type="button" onClick={() => setActiveTab(2)} style={prevBtnStyle}>← Anterior</button>
                    <button type="button" onClick={() => setActiveTab(4)} style={nextBtnStyle}>Siguiente: Diagnóstico →</button>
                  </div>
                </div>

                {/* Tab 4: Diagnóstico y Cierre */}
                <div className="tab-container" data-tab="4" style={{ display: activeTab === 4 ? "flex" : "none", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Diagnóstico Principal (CIE-10) - Full Width */}
                  <div style={{ position: "relative" }}>
                    <label style={labelStyle}>Diagnóstico Principal (CIE-10) <RipsBadge /></label>
                    <input 
                      value={cieSelected ? `${cieSelected.codigo} - ${cieSelected.descripcion}` : cieSearch}
                      onChange={(e) => { setCieSearch(e.target.value); setCieSelected(null); }}
                      placeholder="Ej: Sinusitis (escriba para buscar...)"
                      style={inputStyle}
                      required
                    />
                    {cieLoading && <span style={{position:"absolute", right:"12px", top:"40px", fontSize:"12px", color:"#94a3b8"}}>Buscando...</span>}
                    {cieOptions.length > 0 && (
                      <ul style={{ position: "absolute", zIndex: 10, background: "white", border: "1px solid #e2e8f0", width: "100%", maxHeight: "200px", overflowY: "auto", margin: 0, padding: 0, listStyle: "none", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
                        {cieOptions.map((opt) => (
                          <li 
                            key={opt.codigo} 
                            onClick={() => { setCieSelected(opt); setCieSearch(""); setCieOptions([]); }}
                            style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", fontSize: "13px", color: "#334155" }}
                            onMouseOver={e => e.currentTarget.style.background = "#f8fafc"}
                            onMouseOut={e => e.currentTarget.style.background = "transparent"}
                          >
                            <strong style={{color:"#00b28e"}}>{opt.codigo}</strong> - {opt.descripcion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Diagnósticos Sugeridos/Frecuentes - Cuadrícula transparente de 3x3 */}
                  {cieFrecuentes.length > 0 && (
                    <div style={{ marginTop: "-4px" }}>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                        Diagnósticos sugeridos / frecuentes:
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", background: "transparent" }}>
                        {cieFrecuentes.map((item) => (
                          <button
                            key={item.codigo}
                            type="button"
                            onClick={() => { setCieSelected(item); setCieSearch(""); setCieOptions([]); }}
                            style={{
                              background: "rgba(255, 255, 255, 0.4)",
                              backdropFilter: "blur(4px)",
                              WebkitBackdropFilter: "blur(4px)",
                              border: "1px solid rgba(203, 213, 225, 0.6)",
                              borderRadius: "12px",
                              padding: "10px 12px",
                              fontSize: "12px",
                              color: "#334155",
                              fontWeight: "600",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "all 0.15s ease",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.borderColor = "#94a3b8"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.4)"; e.currentTarget.style.borderColor = "rgba(203, 213, 225, 0.6)"; }}
                            title={`${item.codigo} - ${item.descripcion}`}
                          >
                            <span style={{ color: "#00b28e", fontWeight: "800", marginRight: "4px" }}>{item.codigo}</span>
                            <span style={{ color: "#475569", fontWeight: "500" }}>
                              {item.descripcion.length > 25 ? item.descripcion.substring(0, 25) + "..." : item.descripcion}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tipo de Diagnóstico */}
                  <div>
                    <label style={labelStyle}>Tipo de Diagnóstico <RipsBadge /></label>
                    <select name="tipo_diagnostico" required style={inputStyle}>
                      <option value="Impresión diagnóstica">Impresión diagnóstica</option>
                      <option value="Confirmado nuevo">Confirmado nuevo</option>
                      <option value="Confirmado repetido">Confirmado repetido</option>
                    </select>
                  </div>

                  {/* Plan de Manejo Clínico */}
                  <div>
                    <label style={labelStyle}>Plan de Manejo Clínico</label>
                    <textarea name="plan_manejo" required rows={6} style={{...inputStyle, resize: "vertical"}} placeholder="Medicamentos, recomendaciones, órdenes..." />
                  </div>
                  
                  <div style={{ padding: "24px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", marginTop: "16px" }}>
                    <h4 style={{ color: "#1e293b", margin: "0 0 16px 0", fontSize: "18px" }}>Acciones de Cierre</h4>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          const form = document.getElementById('clinical-form') as HTMLFormElement;
                          if (form.checkValidity()) {
                            handleSubmit(form, "borrador");
                          } else {
                            const invalidElement = form.querySelector(':invalid');
                            if (invalidElement) {
                              const tabContainer = invalidElement.closest('.tab-container');
                              if (tabContainer) {
                                const tabId = parseInt(tabContainer.getAttribute('data-tab') || "1");
                                setActiveTab(tabId);
                                setTimeout(() => form.reportValidity(), 100);
                              } else {
                                form.reportValidity();
                              }
                            }
                          }
                        }}
                        disabled={savingForm}
                        style={{
                          background: "transparent",
                          color: "#9ca3af",
                          border: "2px solid rgba(255, 255, 255, 0.2)",
                          padding: "16px 32px",
                          borderRadius: "12px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "16px",
                          flex: 1,
                          transition: "all 0.2s"
                        }}
                        onMouseOver={e => e.currentTarget.style.color = "#fff"}
                        onMouseOut={e => e.currentTarget.style.color = "#9ca3af"}
                      >
                        {savingForm ? "Procesando..." : "Guardar Borrador"}
                      </button>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          const form = document.getElementById('clinical-form') as HTMLFormElement;
                          if (form.checkValidity()) {
                            setShowConfirmCerrar(true);
                          } else {
                            const invalidElement = form.querySelector(':invalid');
                            if (invalidElement) {
                              const tabContainer = invalidElement.closest('.tab-container');
                              if (tabContainer) {
                                const tabId = parseInt(tabContainer.getAttribute('data-tab') || "1");
                                setActiveTab(tabId);
                                setTimeout(() => form.reportValidity(), 100);
                              } else {
                                form.reportValidity();
                              }
                            }
                          }
                        }}
                        disabled={savingForm}
                        style={{
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          padding: "16px 32px",
                          borderRadius: "12px",
                          cursor: "pointer",
                          fontWeight: "800",
                          fontSize: "16px",
                          flex: 2,
                          boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                          transition: "transform 0.2s"
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                        onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
                      >
                        {savingForm ? "Procesando..." : "Firmar y Cerrar Historia 🔒"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <CustomConfirmModal
        isOpen={showConfirmCerrar}
        title="Firmar y Cerrar Historia"
        message="¿Estás seguro de FIRMAR y CERRAR esta historia clínica? Una vez firmada, no podrá ser modificada posteriormente."
        confirmText="Firmar y Cerrar 🔒"
        cancelText="Cancelar"
        onConfirm={handleConfirmCerrar}
        onCancel={() => setShowConfirmCerrar(false)}
      />
    </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  color: "#1e293b",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s"
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#334155", 
};

const nextBtnStyle = {
  background: "rgba(0, 212, 170, 0.15)", 
  color: "#00D4AA", 
  border: "1px solid rgba(0, 212, 170, 0.4)", 
  padding: "12px 24px", 
  borderRadius: "8px", 
  fontWeight: "bold", 
  cursor: "pointer"
};

const prevBtnStyle = {
  background: "transparent", 
  color: "#9ca3af", 
  border: "1px solid rgba(255, 255, 255, 0.2)", 
  padding: "12px 24px", 
  borderRadius: "8px", 
  fontWeight: "bold", 
  cursor: "pointer"
};
