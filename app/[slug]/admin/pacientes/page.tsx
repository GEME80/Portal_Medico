"use client";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { 
  guardarHistoriaClinica, 
  crearPacienteExpress, 
  buscarCIE10, 
  getDiagnosticosMasUsados,
  getHistoriaClinicaDetalle 
} from "@/lib/actions/clinical-actions";
import CustomConfirmModal from "@/components/CustomConfirmModal";
import { 
  Search, 
  UserPlus, 
  ShieldCheck, 
  Users, 
  Syringe, 
  Heart, 
  Activity, 
  Wind, 
  Thermometer, 
  Scale, 
  X, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Plus, 
  Sparkles, 
  FileText, 
  Calendar, 
  Lock, 
  ArrowRight, 
  User, 
  Stethoscope,
  Clock,
  Building2,
  Phone,
  FileCheck,
  RefreshCw
} from "lucide-react";
import CarneVacunacionModal from "./[pacienteId]/CarneVacunacionModal";

// Helper para cálculo preciso de edad
function getEdadDetallada(fechaNacimiento: string | null | undefined): { texto: string; anios: number; meses: number } {
  if (!fechaNacimiento) return { texto: "", anios: 0, meses: 0 };
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return { texto: "", anios: 0, meses: 0 };
  const hoy = new Date();
  let anios = hoy.getFullYear() - nacimiento.getFullYear();
  let meses = hoy.getMonth() - nacimiento.getMonth();
  if (meses < 0 || (meses === 0 && hoy.getDate() < nacimiento.getDate())) {
    anios--;
    meses += 12;
  }
  if (anios > 0) {
    return {
      texto: anios === 1 ? "1 año" : `${anios} años`,
      anios,
      meses
    };
  }
  return {
    texto: meses === 1 ? "1 mes" : `${meses} meses`,
    anios: 0,
    meses
  };
}

const MOTIVOS_FRECUENTES = [
  "Control médico general",
  "Revisión de exámenes de laboratorio",
  "Cuadro respiratorio agudo",
  "Dolor abdominal / Gastrointestinal",
  "Control Crecimiento y Desarrollo",
  "Control Hipertensión / Cardiovascular",
  "Cefalea / Control neurológico"
];

export default function PacientesPage({ params }: { params: { slug: string } }) {
  const [pacientesList, setPacientesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals state
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [consultaTab, setConsultaTab] = useState(1);
  const [savingForm, setSavingForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // New Patient Form State
  const [newPatientData, setNewPatientData] = useState({
    tipo_documento: "CC",
    documento: "",
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    genero: "Masculino",
    eps: "",
    prepagada: "",
    tipo_sangre: "O+",
    telefono: "",
    padre: "",
    telefono_padre: "",
    madre: "",
    telefono_madre: "",
    acompanante: "",
    telefono_acompanante: ""
  });
  const [hasManuallyChangedTipoDoc, setHasManuallyChangedTipoDoc] = useState(false);

  // Selected Patient & Consultation Form State
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [selectedPacienteData, setSelectedPacienteData] = useState<any>(null);
  const [showConfirmCerrar, setShowConfirmCerrar] = useState(false);
  const [carneModalPaciente, setCarneModalPaciente] = useState<any | null>(null);

  // Consultation Controlled State
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [enfermedadActual, setEnfermedadActual] = useState("");
  const [causaExterna, setCausaExterna] = useState("15");
  const [finalidadConsulta, setFinalidadConsulta] = useState("11");
  const [anamnesis, setAnamnesis] = useState("");
  const [planManejo, setPlanManejo] = useState("");
  const [tipoDiagnostico, setTipoDiagnostico] = useState("Confirmado nuevo");
  const [loadingAntecedentes, setLoadingAntecedentes] = useState(false);

  // Vitals State (100% Optional)
  const [tensionArterial, setTensionArterial] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [frecuenciaRespiratoria, setFrecuenciaRespiratoria] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [saturacion, setSaturacion] = useState("");
  const [peso, setPeso] = useState("");
  const [talla, setTalla] = useState("");
  const [imc, setImc] = useState("");

  // CIE-10 state
  const [cieSearch, setCieSearch] = useState("");
  const [cieOptions, setCieOptions] = useState<any[]>([]);
  const [cieSelected, setCieSelected] = useState<any | null>(null);
  const [cieLoading, setCieLoading] = useState(false);
  const [cieFrecuentes, setCieFrecuentes] = useState<any[]>([]);

  const supabase = createClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantSlug = pathname.split('/')[1];

  const [currentUserRole, setCurrentUserRole] = useState<string>("medico");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

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
          *,
          historias_clinicas ( id, created_at )
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
        openConsultaModal(pid, pData);
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

  // Smart IMC Calculation & WHO Categorization
  const imcData = useMemo(() => {
    const p = parseFloat(peso);
    const t = parseFloat(talla);
    if (isNaN(p) || isNaN(t) || p <= 0 || t <= 0) {
      return null;
    }
    const metros = t > 3 ? t / 100 : t;
    if (metros <= 0) return null;

    const imcVal = p / (metros * metros);
    const imcFormatted = imcVal.toFixed(2);

    let categoria = "Normal / Saludable";
    let color = "#059669";
    let bg = "rgba(16, 185, 129, 0.12)";
    let border = "rgba(16, 185, 129, 0.35)";

    if (imcVal < 18.5) {
      categoria = "Bajo Peso";
      color = "#2563eb";
      bg = "rgba(37, 99, 235, 0.1)";
      border = "rgba(37, 99, 235, 0.3)";
    } else if (imcVal >= 25 && imcVal < 30) {
      categoria = "Sobrepeso";
      color = "#d97706";
      bg = "rgba(245, 158, 11, 0.12)";
      border = "rgba(245, 158, 11, 0.35)";
    } else if (imcVal >= 30 && imcVal < 35) {
      categoria = "Obesidad Grado I";
      color = "#ea580c";
      bg = "rgba(234, 88, 12, 0.12)";
      border = "rgba(234, 88, 12, 0.35)";
    } else if (imcVal >= 35) {
      categoria = "Obesidad Severa";
      color = "#dc2626";
      bg = "rgba(239, 68, 68, 0.12)";
      border = "rgba(239, 68, 68, 0.35)";
    }

    const pesoMin = (18.5 * metros * metros).toFixed(1);
    const pesoMax = (24.9 * metros * metros).toFixed(1);

    return {
      val: imcFormatted,
      categoria,
      color,
      bg,
      border,
      pesoMin,
      pesoMax
    };
  }, [peso, talla]);

  useEffect(() => {
    setImc(imcData ? imcData.val : "");
  }, [imcData]);

  // Detector de duplicidad al registrar nuevo paciente
  const docExistente = useMemo(() => {
    if (!newPatientData.documento || newPatientData.documento.trim().length < 4) return null;
    return pacientesList.find(
      p => p.documento?.toString().trim().toLowerCase() === newPatientData.documento.trim().toLowerCase()
    );
  }, [newPatientData.documento, pacientesList]);

  // Edad calculada del nuevo paciente en tiempo real
  const nuevoPacienteEdad = useMemo(() => {
    return getEdadDetallada(newPatientData.fecha_nacimiento);
  }, [newPatientData.fecha_nacimiento]);

  // Actualizar sugerencia de tipo de documento según la edad
  const handleFechaNacimientoChange = (fecha: string) => {
    const edad = getEdadDetallada(fecha);
    let tipoSugerido = newPatientData.tipo_documento;
    if (!hasManuallyChangedTipoDoc) {
      if (edad.anios < 7) tipoSugerido = "RC";
      else if (edad.anios < 18) tipoSugerido = "TI";
      else tipoSugerido = "CC";
    }
    setNewPatientData(prev => ({
      ...prev,
      fecha_nacimiento: fecha,
      tipo_documento: tipoSugerido
    }));
  };

  // Apertura de Modales
  const openNewPatientModal = () => {
    setNewPatientData({
      tipo_documento: "CC",
      documento: "",
      nombres: "",
      apellidos: "",
      fecha_nacimiento: "",
      genero: "Masculino",
      eps: "",
      prepagada: "",
      tipo_sangre: "O+",
      telefono: "",
      padre: "",
      telefono_padre: "",
      madre: "",
      telefono_madre: "",
      acompanante: "",
      telefono_acompanante: ""
    });
    setHasManuallyChangedTipoDoc(false);
    setErrorMsg("");
    setIsNewPatientModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeNewPatientModal = () => {
    setIsNewPatientModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const openConsultaModal = (pacienteId: string, pacienteData: any) => {
    setSelectedPacienteId(pacienteId);
    setSelectedPacienteData(pacienteData);
    setConsultaTab(1);
    setMotivoConsulta("");
    setEnfermedadActual("");
    setCausaExterna("15");
    setFinalidadConsulta("11");
    setAnamnesis("");
    setPlanManejo("");
    setTipoDiagnostico("Confirmado nuevo");
    setTensionArterial("");
    setFrecuenciaCardiaca("");
    setFrecuenciaRespiratoria("");
    setTemperatura("");
    setSaturacion("");
    setPeso("");
    setTalla("");
    setImc("");
    setErrorMsg("");
    setCieSearch("");
    setCieSelected(null);
    setCieOptions([]);
    setIsConsultaModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeConsultaModal = () => {
    if (motivoConsulta || enfermedadActual || planManejo) {
      const confirmDiscard = window.confirm("¿Deseas salir de la consulta? Las notas no guardadas se perderán.");
      if (!confirmDiscard) return;
    }
    setIsConsultaModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  // Cargar antecedentes de última atención médica previa
  const handleLoadLastAntecedentes = async () => {
    if (!selectedPacienteData) return;
    const atenciones = selectedPacienteData.historias_clinicas || [];
    if (atenciones.length === 0) {
      alert("Este paciente no tiene antecedentes de consultas previas registradas.");
      return;
    }
    const lastHistoria = [...atenciones].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    if (!lastHistoria?.id) return;
    
    setLoadingAntecedentes(true);
    try {
      const detalle = await getHistoriaClinicaDetalle(lastHistoria.id);
      if (detalle?.anamnesis) {
        setAnamnesis(prev => prev ? `${prev}\n\n[Antecedentes de consulta anterior]:\n${detalle.anamnesis}` : detalle.anamnesis);
      } else {
        alert("La última consulta no contenía notas de antecedentes.");
      }
    } catch (err) {
      console.error("Error loading previous history antecedents:", err);
      alert("No fue posible obtener los antecedentes previos.");
    } finally {
      setLoadingAntecedentes(false);
    }
  };

  // Guardar Paciente (Admisión)
  const handleCreatePatientSubmit = async (iniciarConsultaInmediata: boolean = false) => {
    setSavingForm(true);
    setErrorMsg("");
    try {
      if (!newPatientData.documento || !newPatientData.nombres || !newPatientData.apellidos || !newPatientData.fecha_nacimiento) {
        throw new Error("Por favor completa los campos obligatorios marcados con * (Documento, Nombres, Apellidos y Fecha de Nacimiento).");
      }

      const res = await crearPacienteExpress(newPatientData, tenantSlug);
      if (!res.success) {
        throw new Error(res.error || "Error al registrar el paciente.");
      }

      const nuevoPaciente = res.data;
      closeNewPatientModal();
      await fetchPacientes();

      if (iniciarConsultaInmediata && !isRecepcion) {
        openConsultaModal(nuevoPaciente.id, nuevoPaciente);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al registrar paciente.");
    } finally {
      setSavingForm(false);
    }
  };

  // Guardar Historia Clínica (Borrador o Cerrado)
  const handleConsultaSubmit = async (estado: "borrador" | "cerrado") => {
    setSavingForm(true);
    setErrorMsg("");

    if (!cieSelected) {
      setErrorMsg("Debe buscar y seleccionar un Diagnóstico Principal (CIE-10) de la lista oficial.");
      setConsultaTab(3);
      setSavingForm(false);
      return;
    }

    if (!motivoConsulta.trim()) {
      setErrorMsg("Por favor ingrese el Motivo de Consulta.");
      setConsultaTab(1);
      setSavingForm(false);
      return;
    }

    try {
      const data = {
        paciente_id: selectedPacienteId,
        estado,
        metadatos_atencion: {
          causa_externa: causaExterna,
          finalidad_consulta: finalidadConsulta
        },
        signos_vitales: {
          tension_arterial: tensionArterial,
          frecuencia_cardiaca: frecuenciaCardiaca,
          frecuencia_respiratoria: frecuenciaRespiratoria,
          temperatura: temperatura,
          saturacion: saturacion,
          peso: peso,
          talla: talla,
          imc: imc
        },
        motivo_consulta: motivoConsulta,
        enfermedad_actual: enfermedadActual,
        anamnesis: anamnesis,
        plan_manejo: planManejo,
        impresion_diagnostica: [{
          codigo: cieSelected.codigo,
          descripcion: cieSelected.descripcion,
          tipo: tipoDiagnostico
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

      setIsConsultaModalOpen(false);
      document.body.style.overflow = 'auto';
      await fetchPacientes();
      loadCieFrecuentes();
    } catch (err: any) {
      setErrorMsg(err.message || "Ocurrió un error al guardar la historia clínica.");
    }
    setSavingForm(false);
  };

  const handleConfirmCerrar = () => {
    setShowConfirmCerrar(false);
    handleConsultaSubmit("cerrado");
  };

  // Helpers de inserción de texto en plan de manejo
  const handleAddPlanSection = (tipo: 'recomendaciones' | 'alarmas' | 'control') => {
    setPlanManejo(prev => {
      const prefix = prev.trim() ? prev.trim() + "\n\n" : "";
      if (tipo === 'recomendaciones') {
        return prefix + "RECOMENDACIONES GENERALES:\n- Mantener adecuada hidratación y reposo relativo.\n- Dieta balanceada fraccionada, baja en sodio y azúcares refinados.\n- Continuar medicación según posología prescrita.";
      }
      if (tipo === 'alarmas') {
        return prefix + "SIGNOS DE ALARMA PARA CONSULTAR A URGENCIAS:\n- Fiebre mayor a 38.5°C persistente o que no cede a antipiréticos.\n- Dificultad para respirar, dolor torácico opresivo o alteración del estado de conciencia.\n- Intolerancia a la vía oral, vómito persistente o signos de sangrado.";
      }
      if (tipo === 'control') {
        return prefix + "PRÓXIMO CONTROL:\n- Cita de control médico en 15 días con reporte de exámenes paraclínicos solicitados, o antes si presenta signos de alarma.";
      }
      return prev;
    });
  };

  const RipsBadge = () => (
    <span style={{ 
      marginLeft: "6px", 
      fontSize: "10px", 
      padding: "2px 6px", 
      background: "rgba(10, 77, 92, 0.1)", 
      color: "#0A4D5C", 
      borderRadius: "4px", 
      fontWeight: "700" 
    }}>
      RIPS
    </span>
  );

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
      </div>

      <div className="p-4 sm:p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif", minHeight: "calc(100vh - 64px)", background: "#f8fafc" }}>
        
        {/* Cabecera & Barra de Búsqueda */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ flex: 1, minWidth: 0, width: "100%", maxWidth: "600px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", margin: 0, letterSpacing: "-0.02em" }}>
                Directorio de Pacientes
              </h1>
              <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", background: "#e2e8f0", padding: "3px 10px", borderRadius: "12px" }}>
                {pacientesList.length} {pacientesList.length === 1 ? "paciente" : "pacientes"}
              </span>
            </div>
            
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={18} style={{ position: "absolute", left: "16px", color: "#94a3b8", pointerEvents: "none" }} />
              <input 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, apellido o número de documento..." 
                style={{
                  width: "100%",
                  padding: "13px 40px 13px 44px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#1e293b",
                  fontSize: "14px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    cursor: "pointer"
                  }}
                  title="Limpiar búsqueda"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          <button 
            onClick={openNewPatientModal}
            className="w-full sm:w-auto justify-center"
            style={{
              background: "#00D4AA",
              color: "#0f172a",
              fontWeight: "700",
              fontSize: "14px",
              padding: "12px 22px",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0, 212, 170, 0.28)",
              transition: "transform 0.15s, box-shadow 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px"
            }}
            onMouseOver={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <UserPlus size={16} strokeWidth={2.4} />
            <span>Nuevo Paciente</span>
          </button>
        </div>

        {/* Tabla de Pacientes */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
        }}>
          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#64748b", fontSize: "16px" }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px auto", color: "#0A4D5C" }} />
              Cargando directorio de pacientes...
            </div>
          ) : pacientesList.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
                color: "#94a3b8"
              }}>
                <User size={24} />
              </div>
              <p style={{ fontSize: "16px", fontWeight: "600", color: "#334155", margin: 0 }}>
                No se encontraron pacientes
              </p>
              <p style={{ fontSize: "14px", color: "#94a3b8", margin: "6px 0 0 0" }}>
                {searchQuery ? "Intenta modificar el término de búsqueda." : "Registra un nuevo paciente para comenzar."}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "16px 20px", color: "#475569", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Paciente</th>
                    <th style={{ padding: "16px 20px", color: "#475569", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Identificación</th>
                    <th style={{ padding: "16px 20px", color: "#475569", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Aseguramiento</th>
                    <th style={{ padding: "16px 20px", color: "#475569", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Última Atención</th>
                    <th style={{ padding: "16px 20px", color: "#475569", fontWeight: "700", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientesList.map((paciente) => {
                    const atenciones = paciente.historias_clinicas || [];
                    const ultimaAtencion = atenciones.length > 0 
                      ? atenciones.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
                      : null;
                    const edadInfo = getEdadDetallada(paciente.fecha_nacimiento);
                    const iniciales = `${paciente.nombres?.[0] || ""}${paciente.apellidos?.[0] || ""}`.toUpperCase();

                    return (
                      <tr 
                        key={paciente.id} 
                        style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" }} 
                        onMouseOver={e => e.currentTarget.style.background = "#f8fafc"} 
                        onMouseOut={e => e.currentTarget.style.background = "transparent"}
                      >
                        {/* Paciente y Edad */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{
                              width: "38px",
                              height: "38px",
                              borderRadius: "50%",
                              background: "rgba(10, 77, 92, 0.08)",
                              color: "#0A4D5C",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "13px",
                              flexShrink: 0
                            }}>
                              {iniciales || <User size={16} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>
                                {paciente.nombres} {paciente.apellidos}
                              </div>
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{edadInfo.texto || "Edad no registrada"}</span>
                                {paciente.genero && (
                                  <>
                                    <span>•</span>
                                    <span>{paciente.genero === "M" ? "Masculino" : paciente.genero === "F" ? "Femenino" : paciente.genero}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Documento con Badge */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              fontSize: "11px",
                              fontWeight: "800",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: "#e2e8f0",
                              color: "#475569"
                            }}>
                              {paciente.tipo_documento || "CC"}
                            </span>
                            <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                              {paciente.documento}
                            </span>
                          </div>
                        </td>

                        {/* Aseguramiento */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ fontSize: "13px", color: "#334155", fontWeight: "500" }}>
                            {paciente.eps ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <Building2 size={13} color="#64748b" /> {paciente.eps}
                              </span>
                            ) : (
                              <span style={{ color: "#94a3b8" }}>Particular / Sin EPS</span>
                            )}
                          </div>
                          {paciente.tipo_sangre && (
                            <div style={{ fontSize: "11px", color: "#0A4D5C", fontWeight: "700", marginTop: "2px" }}>
                              Grupo: {paciente.tipo_sangre}
                            </div>
                          )}
                        </td>

                        {/* Última Atención */}
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ fontSize: "13px", color: ultimaAtencion ? "#334155" : "#94a3b8" }}>
                            {ultimaAtencion ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                <Calendar size={13} color="#059669" />
                                {new Date(ultimaAtencion).toLocaleDateString("es-CO", { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              "Sin atenciones previas"
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: "16px 20px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                            <Link 
                              href={`/${tenantSlug}/admin/pacientes/${paciente.id}`}
                              style={{
                                background: "#f8fafc",
                                color: "#334155",
                                border: "1px solid #cbd5e1",
                                padding: "7px 12px",
                                borderRadius: "8px",
                                fontWeight: "600",
                                fontSize: "12px",
                                textDecoration: "none",
                                transition: "all 0.15s"
                              }}
                              onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; }}
                              onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; }}
                            >
                              Historial
                            </Link>

                            <button 
                              onClick={() => setCarneModalPaciente(paciente)}
                              style={{
                                background: "#f0fdfa",
                                color: "#0A4D5C",
                                border: "1px solid rgba(0, 212, 170, 0.4)",
                                padding: "7px 12px",
                                borderRadius: "8px",
                                fontWeight: "700",
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                transition: "all 0.15s"
                              }}
                              title="Ver y Registrar Carnet de Vacunación"
                              onMouseOver={e => { e.currentTarget.style.background = "rgba(0, 212, 170, 0.15)"; }}
                              onMouseOut={e => { e.currentTarget.style.background = "#f0fdfa"; }}
                            >
                              <Syringe size={13} color="#00b28e" /> Carnet
                            </button>

                            {!isRecepcion && (
                              <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openConsultaModal(paciente.id, paciente); }}
                                style={{
                                  background: "#0A4D5C",
                                  color: "#ffffff",
                                  border: "none",
                                  padding: "7px 14px",
                                  borderRadius: "8px",
                                  fontWeight: "600",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  boxShadow: "0 2px 6px rgba(10, 77, 92, 0.2)",
                                  transition: "all 0.15s"
                                }}
                                onMouseOver={e => e.currentTarget.style.background = "#083844"}
                                onMouseOut={e => e.currentTarget.style.background = "#0A4D5C"}
                              >
                                <Stethoscope size={13} /> Nueva Consulta
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: REGISTRAR NUEVO PACIENTE (Centrado, Ergonómico 680px)
      ───────────────────────────────────────────────────────────── */}
      {isMounted && isNewPatientModalOpen && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            padding: "8px"
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeNewPatientModal(); }}
        >
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "700px",
            maxHeight: "94vh",
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <style>{`
              @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.97) translateY(8px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>

            {/* Header */}
            <div className="p-4 sm:px-6 sm:py-5 border-b border-slate-200 flex justify-between items-center bg-white">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "rgba(0, 212, 170, 0.12)",
                  color: "#00b28e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <UserPlus size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>
                    Registrar Nuevo Paciente
                  </h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                    {isRecepcion 
                      ? "Datos demográficos y de admisión básica para sala de espera." 
                      : "Ingresa los datos del paciente para su expediente e historial clínico."}
                  </p>
                </div>
              </div>
              <button 
                onClick={closeNewPatientModal} 
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "24px",
                  cursor: "pointer",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onMouseOver={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6" style={{ WebkitOverflowScrolling: "touch" }}>
              {errorMsg && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#b91c1c",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Advertencia preventiva si el documento ya existe */}
              {docExistente && (
                <div style={{
                  background: "rgba(245, 158, 11, 0.1)",
                  color: "#b45309",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertTriangle size={16} />
                    <span>
                      Ya existe un paciente con documento <strong>{docExistente.documento}</strong>: {docExistente.nombres} {docExistente.apellidos}.
                    </span>
                  </div>
                  <Link
                    href={`/${tenantSlug}/admin/pacientes/${docExistente.id}`}
                    style={{
                      background: "#b45309",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      textDecoration: "none"
                    }}
                  >
                    Ver Paciente
                  </Link>
                </div>
              )}

              {/* Grupo 1: Identificación y Datos Personales */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px"
              }}>
                <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0A4D5C", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <User size={15} /> 1. Datos Personales e Identificación
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="col-span-1">
                    <label style={labelStyle}>Tipo Doc *</label>
                    <select 
                      value={newPatientData.tipo_documento}
                      onChange={e => {
                        setHasManuallyChangedTipoDoc(true);
                        setNewPatientData({ ...newPatientData, tipo_documento: e.target.value });
                      }}
                      style={inputStyle}
                      required
                    >
                      <option value="CC">CC - Cédula</option>
                      <option value="TI">TI - Tarjeta de Identidad</option>
                      <option value="RC">RC - Registro Civil</option>
                      <option value="PA">PA - Pasaporte</option>
                      <option value="CE">CE - Cédula Extranjería</option>
                      <option value="NU">NU - Número Único</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label style={labelStyle}>Número de Documento *</label>
                    <input 
                      value={newPatientData.documento}
                      onChange={e => setNewPatientData({ ...newPatientData, documento: e.target.value })}
                      placeholder="Ej: 1020304050"
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label style={labelStyle}>Nombres *</label>
                    <input 
                      value={newPatientData.nombres}
                      onChange={e => setNewPatientData({ ...newPatientData, nombres: e.target.value })}
                      placeholder="Ej: Juan Camilo"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Apellidos *</label>
                    <input 
                      value={newPatientData.apellidos}
                      onChange={e => setNewPatientData({ ...newPatientData, apellidos: e.target.value })}
                      placeholder="Ej: Pérez Rodríguez"
                      style={inputStyle}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ ...labelStyle, margin: 0 }}>Fecha de Nacimiento *</label>
                      {nuevoPacienteEdad.texto && (
                        <span style={{ fontSize: "11px", fontWeight: "700", color: "#00b28e", background: "rgba(0, 212, 170, 0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                          {nuevoPacienteEdad.anios < 18 ? "👶" : "🧑"} {nuevoPacienteEdad.texto}
                        </span>
                      )}
                    </div>
                    <input 
                      type="date"
                      value={newPatientData.fecha_nacimiento}
                      onChange={e => handleFechaNacimientoChange(e.target.value)}
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Género / Sexo Biológico *</label>
                    <select 
                      value={newPatientData.genero}
                      onChange={e => setNewPatientData({ ...newPatientData, genero: e.target.value })}
                      style={inputStyle}
                      required
                    >
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grupo 2: Aseguramiento y Contacto */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "16px"
              }}>
                <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0A4D5C", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Building2 size={15} /> 2. Aseguramiento & Contacto
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div>
                    <label style={labelStyle}>EPS / Entidad Administradora</label>
                    <input 
                      value={newPatientData.eps}
                      onChange={e => setNewPatientData({ ...newPatientData, eps: e.target.value })}
                      placeholder="Ej: Sanitas, Sura, Nueva EPS"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Medicina Prepagada / Póliza</label>
                    <input 
                      value={newPatientData.prepagada}
                      onChange={e => setNewPatientData({ ...newPatientData, prepagada: e.target.value })}
                      placeholder="Ej: Colmédica, Colsanitas"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label style={labelStyle}>Tipo de Sangre</label>
                    <select 
                      value={newPatientData.tipo_sangre}
                      onChange={e => setNewPatientData({ ...newPatientData, tipo_sangre: e.target.value })}
                      style={inputStyle}
                    >
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
                    <label style={labelStyle}>Teléfono Celular</label>
                    <input 
                      value={newPatientData.telefono}
                      onChange={e => setNewPatientData({ ...newPatientData, telefono: e.target.value })}
                      placeholder="Ej: 300 123 4567"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Grupo 3: Contacto Familiar / Acudiente (Opcional o recomendado para menores) */}
              <div style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "6px" }}>
                  <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0A4D5C", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Phone size={15} /> 3. Acudiente o Contacto de Emergencia
                  </div>
                  {nuevoPacienteEdad.anios < 18 && (
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#d97706", background: "rgba(245, 158, 11, 0.12)", padding: "2px 8px", borderRadius: "6px" }}>
                      Recomendado para Pediatría
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
                  <div>
                    <label style={labelStyle}>Nombre Padre / Acudiente 1</label>
                    <input 
                      value={newPatientData.padre}
                      onChange={e => setNewPatientData({ ...newPatientData, padre: e.target.value })}
                      placeholder="Nombre del padre o tutor"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Teléfono Padre / Acudiente 1</label>
                    <input 
                      value={newPatientData.telefono_padre}
                      onChange={e => setNewPatientData({ ...newPatientData, telefono_padre: e.target.value })}
                      placeholder="Teléfono móvil"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label style={labelStyle}>Nombre Madre / Acudiente 2</label>
                    <input 
                      value={newPatientData.madre}
                      onChange={e => setNewPatientData({ ...newPatientData, madre: e.target.value })}
                      placeholder="Nombre de la madre o tutora"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Teléfono Madre / Acudiente 2</label>
                    <input 
                      value={newPatientData.telefono_madre}
                      onChange={e => setNewPatientData({ ...newPatientData, telefono_madre: e.target.value })}
                      placeholder="Teléfono móvil"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 sm:px-6 sm:py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3 bg-white">
              <button 
                type="button" 
                onClick={closeNewPatientModal}
                style={{
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                Cancelar
              </button>

              <button 
                type="button" 
                disabled={savingForm}
                onClick={() => handleCreatePatientSubmit(false)}
                style={{
                  background: isRecepcion ? "#00D4AA" : "#ffffff",
                  color: isRecepcion ? "#0f172a" : "#0A4D5C",
                  border: isRecepcion ? "none" : "1px solid #0A4D5C",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: savingForm ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                {savingForm ? "Guardando..." : "Guardar Paciente"}
              </button>

              {!isRecepcion && (
                <button 
                  type="button" 
                  disabled={savingForm}
                  onClick={() => handleCreatePatientSubmit(true)}
                  style={{
                    background: "#0A4D5C",
                    color: "#ffffff",
                    border: "none",
                    padding: "10px 22px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: savingForm ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 2px 8px rgba(10, 77, 92, 0.25)"
                  }}
                >
                  <Stethoscope size={15} />
                  <span>Guardar e Iniciar Consulta</span>
                </button>
              )}
            </div>
          </div>
        </div>
      , document.body)}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: NUEVA CONSULTA MÉDICA (Centrado, Amplio ~940px)
      ───────────────────────────────────────────────────────────── */}
      {isMounted && isConsultaModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeConsultaModal(); }}
        >
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "960px",
            maxHeight: "94vh",
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            {/* Header: Ficha del Paciente */}
            <div className="p-3 sm:px-6 sm:py-4 border-b border-slate-200 bg-white flex justify-between items-center gap-2 sm:gap-4">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-teal-900/10 text-[#0A4D5C] flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0">
                  {selectedPacienteData?.nombres?.[0]}{selectedPacienteData?.apellidos?.[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                      {selectedPacienteData?.nombres} {selectedPacienteData?.apellidos}
                    </h2>
                    <span style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 6px",
                      borderRadius: "6px",
                      background: "rgba(0, 212, 170, 0.12)",
                      color: "#00b28e",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap"
                    }}>
                      CONSULTA ACTIVA
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center flex-wrap gap-x-2 gap-y-0.5">
                    <span><strong>{selectedPacienteData?.tipo_documento}</strong> {selectedPacienteData?.documento}</span>
                    <span>•</span>
                    <span>Edad: {getEdadDetallada(selectedPacienteData?.fecha_nacimiento).texto || "N/A"}</span>
                    <span>•</span>
                    <span>{selectedPacienteData?.eps || "Particular"}</span>
                    {selectedPacienteData?.tipo_sangre && (
                      <>
                        <span>•</span>
                        <span style={{ color: "#0A4D5C", fontWeight: "700" }}>{selectedPacienteData.tipo_sangre}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={closeConsultaModal} 
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "26px",
                  cursor: "pointer",
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
                onMouseOver={e => e.currentTarget.style.background = "#f1f5f9"}
                onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >
                &times;
              </button>
            </div>

            {/* Stepped Tabs Navigation (Scrollable on small devices) */}
            <div 
              className="flex border-b border-slate-200 bg-slate-50 px-2 sm:px-6 overflow-x-auto whitespace-nowrap"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {[
                { id: 1, label: "1. Motivo & Signos", icon: Activity },
                { id: 2, label: "2. Evolución & Examen", icon: FileText },
                { id: 3, label: "3. Diagnóstico & Plan", icon: Stethoscope }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = consultaTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setConsultaTab(tab.id)}
                    className="flex-shrink-0 text-xs sm:text-sm py-3 px-3 sm:px-5 font-semibold transition-all inline-flex items-center gap-1.5 sm:gap-2"
                    style={{
                      background: "transparent",
                      color: isActive ? "#0A4D5C" : "#64748b",
                      border: "none",
                      borderBottom: isActive ? "3px solid #00D4AA" : "3px solid transparent",
                      fontWeight: isActive ? "700" : "500",
                      cursor: "pointer"
                    }}
                  >
                    <Icon size={16} color={isActive ? "#00D4AA" : "#94a3b8"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-6" style={{ WebkitOverflowScrolling: "touch" }}>
              {errorMsg && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#b91c1c",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* ──────────────── TAB 1: MOTIVO & SIGNOS VITALES ──────────────── */}
              {consultaTab === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* Motivo de Consulta con Chips Rápidos */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <label style={{ ...labelStyle, margin: 0 }}>
                        Motivo de Consulta *
                      </label>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        Selecciona o escribe el motivo principal
                      </span>
                    </div>

                    {/* Chips de 1 clic */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                      {MOTIVOS_FRECUENTES.map(motivo => (
                        <button
                          key={motivo}
                          type="button"
                          onClick={() => {
                            setMotivoConsulta(prev => {
                              if (!prev.trim()) return motivo;
                              if (prev.includes(motivo)) return prev;
                              return `${prev}, ${motivo}`;
                            });
                          }}
                          style={{
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            borderRadius: "16px",
                            padding: "4px 10px",
                            fontSize: "11px",
                            color: "#475569",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; }}
                          onMouseOut={e => { e.currentTarget.style.background = "#f1f5f9"; }}
                        >
                          + {motivo}
                        </button>
                      ))}
                    </div>

                    <input 
                      value={motivoConsulta}
                      onChange={e => setMotivoConsulta(e.target.value)}
                      placeholder="¿Por qué acude el paciente a la consulta?"
                      style={inputStyle}
                      required
                    />
                  </div>

                  {/* Enfermedad Actual */}
                  <div>
                    <label style={labelStyle}>Enfermedad Actual</label>
                    <textarea 
                      value={enfermedadActual}
                      onChange={e => setEnfermedadActual(e.target.value)}
                      rows={3} 
                      style={{ ...inputStyle, resize: "vertical" }} 
                      placeholder="Descripción detallada de los síntomas, cronología y evolución del cuadro clínico..." 
                    />
                  </div>

                  {/* Causa Externa & Finalidad de Consulta (RIPS) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label style={labelStyle}>Causa Externa <RipsBadge /></label>
                      <select 
                        value={causaExterna}
                        onChange={e => setCausaExterna(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="15">15 - Enfermedad General</option>
                        <option value="01">01 - Accidente de Trabajo</option>
                        <option value="02">02 - Accidente de Tránsito</option>
                        <option value="10">10 - Otra</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Finalidad de Consulta <RipsBadge /></label>
                      <select 
                        value={finalidadConsulta}
                        onChange={e => setFinalidadConsulta(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="11">11 - Consulta de Control</option>
                        <option value="10">10 - Consulta de Primera Vez</option>
                        <option value="08">08 - Urgencias</option>
                      </select>
                    </div>
                  </div>

                  {/* Bloque de Signos Vitales (100% Opcionales) */}
                  <div style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px sm:padding:20px",
                    marginTop: "8px"
                  }} className="p-3 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          background: "rgba(0, 212, 170, 0.15)",
                          color: "#00b28e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}>
                          <Activity size={16} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>
                          Signos Vitales y Somatometría
                        </h3>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", background: "#e2e8f0", padding: "2px 8px", borderRadius: "6px", alignSelf: "flex-start" }}>
                        Opcional • No bloquea el guardado
                      </span>
                    </div>

                    {/* Grilla de Signos Vitales */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3.5 mb-4">
                      <div>
                        <label style={{ ...labelStyle, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Heart size={12} color="#e11d48" /> T.A. (mmHg)
                        </label>
                        <input 
                          value={tensionArterial}
                          onChange={e => setTensionArterial(e.target.value)}
                          placeholder="120/80" 
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }} 
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Activity size={12} color="#059669" /> F.C. (lpm)
                        </label>
                        <input 
                          type="number"
                          value={frecuenciaCardiaca}
                          onChange={e => setFrecuenciaCardiaca(e.target.value)}
                          placeholder="75" 
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }} 
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Wind size={12} color="#0284c7" /> F.R. (rpm)
                        </label>
                        <input 
                          type="number"
                          value={frecuenciaRespiratoria}
                          onChange={e => setFrecuenciaRespiratoria(e.target.value)}
                          placeholder="16" 
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }} 
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Thermometer size={12} color="#d97706" /> Temp (°C)
                        </label>
                        <input 
                          type="number"
                          step="0.1"
                          value={temperatura}
                          onChange={e => setTemperatura(e.target.value)}
                          placeholder="36.5" 
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }} 
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Activity size={12} color="#7c3aed" /> SpO2 (%)
                        </label>
                        <input 
                          type="number"
                          value={saturacion}
                          onChange={e => setSaturacion(e.target.value)}
                          placeholder="98" 
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }} 
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Scale size={12} color="#0A4D5C" /> Peso (kg)
                        </label>
                        <input 
                          type="number"
                          step="0.1"
                          value={peso}
                          onChange={e => setPeso(e.target.value)}
                          placeholder="70.0" 
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }} 
                        />
                      </div>

                      <div>
                        <label style={{ ...labelStyle, fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Scale size={12} color="#0A4D5C" /> Talla (cm)
                        </label>
                        <input 
                          type="number"
                          step="0.1"
                          value={talla}
                          onChange={e => setTalla(e.target.value)}
                          placeholder="170" 
                          style={{ ...inputStyle, padding: "8px 10px", fontSize: "13px" }} 
                        />
                      </div>
                    </div>

                    {/* SMART IMC CARD (Componente Clínico Inteligente) */}
                    {imcData ? (
                      <div 
                        className="p-3 sm:px-4 sm:py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                        style={{
                          background: imcData.bg,
                          border: `1px solid ${imcData.border}`
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <div style={{
                            background: imcData.color,
                            color: "#ffffff",
                            fontWeight: "800",
                            fontSize: "13px",
                            padding: "4px 8px",
                            borderRadius: "6px"
                          }}>
                            IMC {imcData.val} kg/m²
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: "700", color: imcData.color }}>
                            {imcData.categoria} (Clasificación OMS)
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569", fontWeight: "500" }}>
                          Peso saludable recomendado para {talla} cm: <strong>{imcData.pesoMin} - {imcData.pesoMax} kg</strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: "rgba(255,255,255,0.7)",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        fontSize: "12px",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        <Scale size={14} color="#94a3b8" />
                        <span>IMC: -- kg/m² • Ingrese peso y talla para el cálculo y clasificación nutricional automática.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 2: EVOLUCIÓN & EXAMEN CLÍNICO ──────────────── */}
              {consultaTab === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                      <div>
                        <label style={{ ...labelStyle, margin: 0 }}>
                          Antecedentes Clínicos Permanentes
                        </label>
                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                          Patológicos, quirúrgicos, farmacológicos, alérgicos y familiares
                        </p>
                      </div>

                      {/* Botón Importar Antecedentes Previos */}
                      <button
                        type="button"
                        onClick={handleLoadLastAntecedentes}
                        disabled={loadingAntecedentes}
                        style={{
                          background: "#f0fdfa",
                          color: "#0A4D5C",
                          border: "1px solid rgba(0, 212, 170, 0.4)",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: loadingAntecedentes ? "wait" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          alignSelf: "flex-start"
                        }}
                      >
                        <Copy size={13} color="#00b28e" />
                        <span>{loadingAntecedentes ? "Cargando..." : "Copiar antecedentes anteriores"}</span>
                      </button>
                    </div>

                    <textarea 
                      value={anamnesis}
                      onChange={e => setAnamnesis(e.target.value)}
                      rows={8} 
                      style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: "1.5" }} 
                      placeholder="Ej:&#10;- Alergias: Niega&#10;- Patológicos: Hipertensión arterial controlada&#10;- Quirúrgicos: Apendicectomía (2018)&#10;- Farmacológicos: Losartán 50mg cada 12 horas&#10;- Familiares: Madre con Diabetes Mellitus tipo 2" 
                    />
                  </div>
                </div>
              )}

              {/* ──────────────── TAB 3: DIAGNÓSTICO CIE-10 & CIERRE ──────────────── */}
              {consultaTab === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  
                  {/* Selector CIE-10 */}
                  <div style={{ position: "relative" }}>
                    <label style={labelStyle}>Diagnóstico Principal (CIE-10) <RipsBadge /> *</label>
                    
                    {cieSelected ? (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        background: "rgba(0, 212, 170, 0.08)",
                        border: "1px solid #00D4AA",
                        borderRadius: "10px",
                        gap: "10px",
                        flexWrap: "wrap"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                          <span style={{
                            background: "#00b28e",
                            color: "#ffffff",
                            fontWeight: "800",
                            fontSize: "12px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            flexShrink: 0
                          }}>
                            {cieSelected.codigo}
                          </span>
                          <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", wordBreak: "break-word" }}>
                            {cieSelected.descripcion}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setCieSelected(null); setCieSearch(""); }}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            color: "#64748b",
                            cursor: "pointer",
                            fontWeight: "600",
                            flexShrink: 0
                          }}
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <>
                        <input 
                          value={cieSearch}
                          onChange={e => setCieSearch(e.target.value)}
                          placeholder="Buscar diagnóstico por nombre o código (Ej: Rinofaringitis, J00, Hipertensión)..."
                          style={inputStyle}
                        />
                        {cieLoading && (
                          <span style={{ position: "absolute", right: "14px", top: "38px", fontSize: "12px", color: "#94a3b8" }}>
                            Buscando...
                          </span>
                        )}
                        {cieOptions.length > 0 && (
                          <ul style={{
                            position: "absolute",
                            zIndex: 20,
                            top: "72px",
                            left: 0,
                            right: 0,
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "10px",
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                            maxHeight: "220px",
                            overflowY: "auto",
                            margin: 0,
                            padding: 0,
                            listStyle: "none"
                          }}>
                            {cieOptions.map(opt => (
                              <li 
                                key={opt.codigo} 
                                onClick={() => { setCieSelected(opt); setCieSearch(""); setCieOptions([]); }}
                                style={{
                                  padding: "10px 14px",
                                  borderBottom: "1px solid #f1f5f9",
                                  cursor: "pointer",
                                  fontSize: "13px",
                                  color: "#334155"
                                }}
                                onMouseOver={e => e.currentTarget.style.background = "#f8fafc"}
                                onMouseOut={e => e.currentTarget.style.background = "transparent"}
                              >
                                <strong style={{ color: "#0A4D5C", marginRight: "6px" }}>{opt.codigo}</strong> - {opt.descripcion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>

                  {/* Diagnósticos Sugeridos / Frecuentes */}
                  {!cieSelected && cieFrecuentes.length > 0 && (
                    <div>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                        Diagnósticos frecuentes sugeridos:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {cieFrecuentes.slice(0, 6).map(item => (
                          <button
                            key={item.codigo}
                            type="button"
                            onClick={() => { setCieSelected(item); setCieSearch(""); setCieOptions([]); }}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              fontSize: "12px",
                              color: "#334155",
                              cursor: "pointer",
                              textAlign: "left",
                              transition: "all 0.15s",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              overflow: "hidden"
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; }}
                            onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; }}
                          >
                            <span style={{ color: "#00b28e", fontWeight: "800", flexShrink: 0 }}>{item.codigo}</span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.descripcion}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tipo de Diagnóstico */}
                  <div>
                    <label style={labelStyle}>Tipo de Diagnóstico <RipsBadge /></label>
                    <select 
                      value={tipoDiagnostico}
                      onChange={e => setTipoDiagnostico(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="Confirmado nuevo">Confirmado nuevo</option>
                      <option value="Impresión diagnóstica">Impresión diagnóstica</option>
                      <option value="Confirmado repetido">Confirmado repetido</option>
                    </select>
                  </div>

                  {/* Plan de Manejo Clínico */}
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                      <label style={{ ...labelStyle, margin: 0 }}>
                        Plan de Manejo Clínico
                      </label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddPlanSection('recomendaciones')}
                          style={{
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#334155",
                            cursor: "pointer"
                          }}
                        >
                          + Recomendaciones
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddPlanSection('alarmas')}
                          style={{
                            background: "#fef3c7",
                            border: "1px solid #fde68a",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#92400e",
                            cursor: "pointer"
                          }}
                        >
                          + Signos Alarma
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddPlanSection('control')}
                          style={{
                            background: "#f0fdfa",
                            border: "1px solid #ccfbf1",
                            borderRadius: "6px",
                            padding: "3px 8px",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#0A4D5C",
                            cursor: "pointer"
                          }}
                        >
                          + Control
                        </button>
                      </div>
                    </div>

                    <textarea 
                      value={planManejo}
                      onChange={e => setPlanManejo(e.target.value)}
                      rows={6} 
                      style={{ ...inputStyle, resize: "vertical", lineHeight: "1.5" }} 
                      placeholder="Prescripciones farmacológicas, exámenes paraclínicos solicitados, conducta y recomendaciones..." 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer de la Consulta */}
            <div className="p-3 sm:px-6 sm:py-4 border-t border-slate-200 bg-white flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2.5 sm:gap-3">
              <div className="w-full sm:w-auto">
                {consultaTab > 1 && (
                  <button
                    type="button"
                    onClick={() => setConsultaTab(prev => prev - 1)}
                    className="w-full sm:w-auto text-center"
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      color: "#475569",
                      padding: "10px 18px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    ← Anterior
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
                {consultaTab < 3 ? (
                  <button
                    type="button"
                    onClick={() => setConsultaTab(prev => prev + 1)}
                    className="w-full sm:w-auto justify-center"
                    style={{
                      background: "#0A4D5C",
                      color: "#ffffff",
                      border: "none",
                      padding: "10px 22px",
                      borderRadius: "8px",
                      fontWeight: "700",
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={savingForm}
                      onClick={() => handleConsultaSubmit("borrador")}
                      className="w-full sm:w-auto text-center"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        color: "#475569",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "13px",
                        cursor: savingForm ? "not-allowed" : "pointer"
                      }}
                    >
                      {savingForm ? "Guardando..." : "Guardar Borrador"}
                    </button>

                    <button
                      type="button"
                      disabled={savingForm}
                      onClick={() => {
                        if (!cieSelected) {
                          setErrorMsg("Debes seleccionar un Diagnóstico Principal (CIE-10) antes de cerrar la historia.");
                          return;
                        }
                        setShowConfirmCerrar(true);
                      }}
                      className="w-full sm:w-auto justify-center"
                      style={{
                        background: "#059669",
                        color: "#ffffff",
                        border: "none",
                        padding: "10px 24px",
                        borderRadius: "8px",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: savingForm ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)"
                      }}
                    >
                      <Lock size={14} />
                      <span>{savingForm ? "Procesando..." : "Firmar y Cerrar Historia"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {/* Modal de confirmación legal para firma y cierre */}
      {isMounted && createPortal(
        <CustomConfirmModal
          isOpen={showConfirmCerrar}
          title="Firmar y Cerrar Historia Clínica"
          message="¿Estás seguro de FIRMAR y CERRAR esta historia clínica? Una vez firmada, según la normativa médica colombiana (Resolución 1995 de 1999 de MinSalud), no podrá ser alterada ni eliminada."
          confirmText="Firmar y Cerrar 🔒"
          cancelText="Volver a revisar"
          onConfirm={handleConfirmCerrar}
          onCancel={() => setShowConfirmCerrar(false)}
        />
      , document.body)}

      {/* MODAL CARNÉ DE VACUNACIÓN DIRECTO */}
      {isMounted && carneModalPaciente && createPortal(
        <CarneVacunacionModal
          isOpen={!!carneModalPaciente}
          onClose={() => setCarneModalPaciente(null)}
          paciente={carneModalPaciente}
          tenantSlug={tenantSlug}
          tenantId={carneModalPaciente.tenant_id}
          currentUserRole={currentUserRole}
        />
      , document.body)}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  color: "#1e293b",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s"
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: "700",
  color: "#334155"
};
