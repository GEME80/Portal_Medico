"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Lock, ShieldCheck, Syringe, Activity } from "lucide-react";
import { getHistoriasClinicas, getHistoriaClinicaDetalle } from "@/lib/actions/clinical-actions";
import CarneVacunacionModal from "./CarneVacunacionModal";
import CurvasCrecimientoModal from "./CurvasCrecimientoModal";

export default function PerfilPaciente() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.slug as string;
  const pacienteId = params.pacienteId as string;

  const [currentUserRole, setCurrentUserRole] = useState<string>("medico");
  const [paciente, setPaciente] = useState<any>(null);
  const [historias, setHistorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.app_metadata?.role) {
        setCurrentUserRole(user.app_metadata.role);
      }
    });
  }, []);

  const isRecepcion = currentUserRole === "recepcion";

  // Modo edición demográfica
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // Visor de historia
  const [viewingHistoriaId, setViewingHistoriaId] = useState<string | null>(null);
  const [historiaDetails, setHistoriaDetails] = useState<any>(null);
  const [loadingHistoria, setLoadingHistoria] = useState(false);

  // Curvas OMS y Carné de Vacunación
  const [viewingCurvas, setViewingCurvas] = useState(false);
  const [viewingCarne, setViewingCarne] = useState(false);

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return "Edad desconocida";
    const hoy = new Date();
    const nace = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nace.getFullYear();
    const m = hoy.getMonth() - nace.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nace.getDate())) {
      edad--;
    }
    if (edad === 0) {
      let meses = (hoy.getFullYear() - nace.getFullYear()) * 12 + hoy.getMonth() - nace.getMonth();
      if (hoy.getDate() < nace.getDate()) meses--;
      return `${meses} meses`;
    }
    return `${edad} años`;
  };

  const WaButton = ({ phone }: { phone: string }) => {
    if (!phone) return <span style={{ color: "#94a3b8" }}>No registrado</span>;
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const finalPhone = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <span>{phone}</span>
        <a href={`https://wa.me/${finalPhone}`} target="_blank" rel="noopener noreferrer" style={{ background: "#25D366", color: "white", padding: "2px 8px", borderRadius: "12px", textDecoration: "none", fontSize: "11px", fontWeight: "bold" }}>
          WhatsApp
        </a>
      </span>
    );
  };

  useEffect(() => {
    fetchPacienteYHistorias();
  }, [pacienteId, isRecepcion]);

  const fetchPacienteYHistorias = async () => {
    setLoading(true);
    
    // Traer datos del paciente
    const { data: pData, error: pErr } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", pacienteId)
      .single();

    if (pData) {
      setPaciente(pData);
      setEditForm(pData);
    }

    // Traer historias clínicas SOLO si tiene rol médico
    if (!isRecepcion) {
      try {
        const hData = await getHistoriasClinicas(pacienteId);
        setHistorias(hData);
      } catch (error) {
        console.error("Error trayendo historias:", error);
      }
    }

    setLoading(false);
  };

  const openHistoriaViewer = async (historiaId: string) => {
    setViewingHistoriaId(historiaId);
    setLoadingHistoria(true);
    setHistoriaDetails(null);
    try {
      const detalles = await getHistoriaClinicaDetalle(historiaId);
      setHistoriaDetails(detalles);
    } catch (e) {
      alert("Error al cargar la historia");
      setViewingHistoriaId(null);
    }
    setLoadingHistoria(false);
  };

  const handleUpdateDemograficos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    
    const { error } = await supabase
      .from("pacientes")
      .update({
        nombres: editForm.nombres,
        apellidos: editForm.apellidos,
        documento: editForm.documento,
        tipo_documento: editForm.tipo_documento,
        fecha_nacimiento: editForm.fecha_nacimiento,
        genero: editForm.genero,
        eps: editForm.eps,
        prepagada: editForm.prepagada,
        tipo_sangre: editForm.tipo_sangre,
        telefono: editForm.telefono,
        acompanante: editForm.acompanante,
        telefono_acompanante: editForm.telefono_acompanante,
        padre: editForm.padre,
        telefono_padre: editForm.telefono_padre,
        madre: editForm.madre,
        telefono_madre: editForm.telefono_madre
      })
      .eq("id", pacienteId);
      
    setSavingEdit(false);
    if (!error) {
      setIsEditing(false);
      fetchPacienteYHistorias(); // refrescar
    } else {
      alert("Error al actualizar los datos.");
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Cargando perfil...</div>;
  if (!paciente) return <div style={{ padding: "40px", textAlign: "center" }}>Paciente no encontrado.</div>;

  return (
    <div className="p-4 sm:p-6 md:p-8" style={{ fontFamily: "'Outfit', sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      
      {/* HEADER & NAV */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "16px", alignItems: "center" }}>
        <Link href={`/${tenantSlug}/admin/pacientes`} style={{ color: "#64748b", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
          ← Volver a Historias
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        
        {/* COL 1: DEMOGRAFICOS */}
        <div className="lg:col-span-1 p-4 sm:p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Perfil del Paciente</h2>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => setViewingCarne(true)}
                style={{
                  background: "#f0fdfa",
                  border: "1px solid #00D4AA",
                  color: "#0A4D5C",
                  fontWeight: "700",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  cursor: "pointer",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <Syringe size={13} color="#00b28e" /> Carnet de Vacunación
              </button>
              {!isRecepcion && (
                <button
                  onClick={() => setViewingCurvas(true)}
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #3b82f6",
                    color: "#2563eb",
                    fontWeight: "600",
                    padding: "4px 12px",
                    borderRadius: "16px",
                    cursor: "pointer",
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <Activity size={13} color="#2563eb" /> Curvas OMS
                </button>
              )}
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} style={{ background: "none", border: "none", color: "#00b28e", fontWeight: "700", cursor: "pointer" }}>
                  Editar
                </button>
              )}
            </div>
          </div>
          
          {!isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ background: "#f1f5f9", padding: "16px", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", background: "#00D4AA", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "800", margin: "0 auto 12px" }}>
                  {paciente.nombres?.charAt(0)}{paciente.apellidos?.charAt(0)}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0" }}>{paciente.nombres} {paciente.apellidos}</h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "14px", fontWeight: "600" }}>{paciente.tipo_documento} {paciente.documento}</p>
              </div>
              
              <div style={{ fontSize: "14px" }}>
                <p style={{ margin: "8px 0" }}><strong>Fecha Nacimiento:</strong> {paciente.fecha_nacimiento} ({calcularEdad(paciente.fecha_nacimiento)})</p>
                <p style={{ margin: "8px 0", display: "flex", alignItems:"center", gap:"8px", flexWrap: "wrap" }}><strong>Teléfono:</strong> <WaButton phone={paciente.telefono} /></p>
                <p style={{ margin: "8px 0" }}><strong>Género:</strong> {paciente.genero}</p>
                <p style={{ margin: "8px 0" }}><strong>Tipo de Sangre:</strong> {paciente.tipo_sangre || "No registrado"}</p>
                <p style={{ margin: "8px 0" }}><strong>EPS:</strong> {paciente.eps}</p>
                <p style={{ margin: "8px 0" }}><strong>Prepagada / Adicional:</strong> {paciente.prepagada || "No registrado"}</p>
              </div>

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "8px", fontSize: "14px" }}>
                <h4 style={{ fontSize: "12px", textTransform: "uppercase", color: "#94a3b8", letterSpacing: "1px", marginBottom: "12px" }}>Acompañantes y Red</h4>
                <div style={{ marginBottom: "12px" }}>
                  <strong>Padre:</strong> {paciente.padre || "No registrado"}
                  <div style={{ marginTop: "4px" }}><WaButton phone={paciente.telefono_padre} /></div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <strong>Madre:</strong> {paciente.madre || "No registrada"}
                  <div style={{ marginTop: "4px" }}><WaButton phone={paciente.telefono_madre} /></div>
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <strong>Acompañante Habitual:</strong> {paciente.acompanante || "No registrado"}
                  <div style={{ marginTop: "4px" }}><WaButton phone={paciente.telefono_acompanante} /></div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateDemograficos} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Nombres</label>
                <input required value={editForm.nombres} onChange={e => setEditForm({...editForm, nombres: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Apellidos</label>
                <input required value={editForm.apellidos} onChange={e => setEditForm({...editForm, apellidos: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-1">
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Tipo</label>
                  <select value={editForm.tipo_documento} onChange={e => setEditForm({...editForm, tipo_documento: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                    <option value="RC">RC</option>
                    <option value="TI">TI</option>
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PAS">PAS</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Documento</label>
                  <input required value={editForm.documento} onChange={e => setEditForm({...editForm, documento: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Fecha de Nacimiento</label>
                <input type="date" required value={editForm.fecha_nacimiento} onChange={e => setEditForm({...editForm, fecha_nacimiento: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Género</label>
                <select value={editForm.genero} onChange={e => setEditForm({...editForm, genero: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                  <option value="F">Femenino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Tipo de Sangre</label>
                  <select value={editForm.tipo_sangre || ""} onChange={e => setEditForm({...editForm, tipo_sangre: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
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
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Teléfono Principal</label>
                  <input value={editForm.telefono || ""} onChange={e => setEditForm({...editForm, telefono: e.target.value})} placeholder="+57300..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>EPS</label>
                  <input value={editForm.eps || ""} onChange={e => setEditForm({...editForm, eps: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Prepagada / Seguro</label>
                  <input value={editForm.prepagada || ""} onChange={e => setEditForm({...editForm, prepagada: e.target.value})} placeholder="Ej. Colsanitas" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>

              {/* Nuevos Campos Familiares */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginTop: "8px" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Nombre Padre</label>
                    <input value={editForm.padre || ""} onChange={e => setEditForm({...editForm, padre: e.target.value})} placeholder="Ej. Carlos Torres" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Teléfono Padre</label>
                    <input value={editForm.telefono_padre || ""} onChange={e => setEditForm({...editForm, telefono_padre: e.target.value})} placeholder="+57..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Nombre Madre</label>
                    <input value={editForm.madre || ""} onChange={e => setEditForm({...editForm, madre: e.target.value})} placeholder="Ej. Maria Perez" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Teléfono Madre</label>
                    <input value={editForm.telefono_madre || ""} onChange={e => setEditForm({...editForm, telefono_madre: e.target.value})} placeholder="+57..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Acompañante Habitual</label>
                    <input value={editForm.acompanante || ""} onChange={e => setEditForm({...editForm, acompanante: e.target.value})} placeholder="Nombre" style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>Tel. Acompañante</label>
                    <input value={editForm.telefono_acompanante || ""} onChange={e => setEditForm({...editForm, telefono_acompanante: e.target.value})} placeholder="+57..." style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button type="button" onClick={() => { setEditForm(paciente); setIsEditing(false); }} style={{ flex: 1, padding: "12px", background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>Cancelar</button>
                <button type="submit" disabled={savingEdit} style={{ flex: 2, padding: "12px", background: "#00D4AA", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                  {savingEdit ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* COL 2: LINEA DE TIEMPO / HISTORIAS */}
        <div className="lg:col-span-2 p-4 sm:p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-slate-200/80">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", margin: 0 }}>Historial de Consultas</h2>
            
            {!isRecepcion && (
              <Link 
                href={`/${tenantSlug}/admin/pacientes?action=new&pid=${paciente.id}`}
                className="w-full sm:w-auto text-center"
                style={{
                  background: "rgba(0, 212, 170, 0.1)",
                  color: "#00b28e",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  textDecoration: "none",
                  transition: "all 0.2s"
                }}
              >
                + Nueva Consulta
              </Link>
            )}
          </div>

          {isRecepcion ? (
            <div style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "48px 24px",
              textAlign: "center"
            }}>
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(10, 77, 92, 0.08)",
                color: "#0A4D5C",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px"
              }}>
                <Lock size={24} />
              </div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "17px", fontWeight: 800, color: "#1e293b" }}>
                Historial Clínico Bajo Reserva Médica
              </h3>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b", lineHeight: 1.6, maxWidth: "440px", marginInline: "auto" }}>
                Las evoluciones médicas, diagnósticos CIE-10 y notas de consulta están protegidas por reserva legal sanitaria y son de acceso exclusivo para el profesional médico autorizado (Resolución 1995 de 1999 de MinSalud).
              </p>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#f1f5f9",
                color: "#475569",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 600
              }}>
                <ShieldCheck size={14} /> Acceso Administrativo: Solo Edición de Datos Demográficos
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {historias.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  El paciente no tiene historias clínicas registradas.
                </div>
              ) : (
                historias.map((hist) => (
                  <div key={hist.id} style={{ 
                    borderLeft: "3px solid #00D4AA", 
                    paddingLeft: "20px", 
                    position: "relative" 
                  }}>
                    <div style={{ 
                      position: "absolute", left: "-9px", top: "0", width: "15px", height: "15px", 
                      background: hist.estado === 'cerrado' ? "#10b981" : "#f59e0b", 
                      borderRadius: "50%", border: "3px solid white" 
                    }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                          Consulta General
                        </h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                          {new Date(hist.created_at).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: hist.estado === 'cerrado' ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        color: hist.estado === 'cerrado' ? "#059669" : "#d97706",
                      }}>
                        {hist.estado.toUpperCase()}
                      </span>
                    </div>
                    
                    <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", marginTop: "12px", fontSize: "14px", color: "#334155" }}>
                      <p style={{ margin: "0 0 8px 0" }}><strong>Motivo:</strong> {hist.motivo_consulta || 'No especificado'}</p>
                      <p style={{ margin: "0 0 12px 0" }}>
                        <strong>Diagnóstico (CIE-10):</strong> {hist.impresion_diagnostica?.[0] ? `${hist.impresion_diagnostica[0].codigo} - ${hist.impresion_diagnostica[0].descripcion}` : 'Sin diagnóstico principal'}
                      </p>
                      
                      <button 
                        onClick={() => openHistoriaViewer(hist.id)}
                        style={{ color: "#0ea5e9", background: "none", border: "none", padding: 0, fontWeight: "600", fontSize: "13px", cursor: "pointer" }}
                      >
                        Ver historia completa →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>

      {/* VISOR MODAL DE HISTORIA CLÍNICA */}
      {viewingHistoriaId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex justify-center items-start overflow-y-auto p-2 sm:p-6">
          <div style={{ background: "white", width: "100%", maxWidth: "800px", borderRadius: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", overflow: "hidden", position: "relative" }}>
            {/* Header Modal */}
            <div className="p-4 sm:px-8 sm:py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 style={{ margin: 0, fontSize: "20px sm:fontSize:22px", color: "#0f172a", fontWeight: "800" }} className="text-lg sm:text-xl">Historia Clínica</h2>
              <button onClick={() => setViewingHistoriaId(null)} style={{ background: "none", border: "none", fontSize: "28px", color: "#94a3b8", cursor: "pointer", lineHeight: "1" }}>×</button>
            </div>
            
            {/* Body Modal */}
            <div className="p-4 sm:p-8">
              {loadingHistoria ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Desencriptando y cargando historia...</div>
              ) : historiaDetails ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "28px", fontSize: "14px sm:fontSize:15px", color: "#334155" }}>
                  
                  {/* Fila 1: Signos Vitales y RIPS */}
                  <div>
                    <h3 style={{ fontSize: "16px", color: "#00b28e", margin: "0 0 14px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px", fontWeight: "700" }}>Signos Vitales y Medidas</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-xl text-sm">
                      <div><strong>FR:</strong> {historiaDetails.signos_vitales?.frecuencia_respiratoria || '--'} rpm</div>
                      <div><strong>SatO2:</strong> {historiaDetails.signos_vitales?.saturacion || '--'} %</div>
                      <div><strong>Temp:</strong> {historiaDetails.signos_vitales?.temperatura || '--'} °C</div>
                      <div><strong>TA:</strong> {historiaDetails.signos_vitales?.tension_arterial || '--'} mmHg</div>
                      <div><strong>FC:</strong> {historiaDetails.signos_vitales?.frecuencia_cardiaca || '--'} lpm</div>
                      <div><strong>Peso:</strong> {historiaDetails.signos_vitales?.peso || '--'} kg</div>
                      <div><strong>Talla:</strong> {historiaDetails.signos_vitales?.talla || '--'} cm</div>
                      <div><strong>IMC:</strong> {historiaDetails.signos_vitales?.imc || '--'}</div>
                    </div>
                  </div>

                  {/* Fila 2: Motivo y Enfermedad */}
                  <div>
                    <h3 style={{ fontSize: "16px", color: "#00b28e", margin: "0 0 16px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>Motivo y Enfermedad Actual</h3>
                    <p style={{ margin: "0 0 8px 0" }}><strong>Motivo de Consulta:</strong> {historiaDetails.motivo_consulta}</p>
                    <p style={{ margin: 0 }}><strong>Enfermedad Actual:</strong> {historiaDetails.enfermedad_actual}</p>
                  </div>

                  {/* Fila 3: Antecedentes */}
                  <div>
                    <h3 style={{ fontSize: "16px", color: "#00b28e", margin: "0 0 16px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>Anamnesis y Antecedentes</h3>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{historiaDetails.anamnesis || 'Sin registro.'}</p>
                  </div>

                  {/* Fila 4: Diagnóstico y RIPS Adicional */}
                  <div>
                    <h3 style={{ fontSize: "16px", color: "#00b28e", margin: "0 0 16px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>Diagnóstico (CIE-10)</h3>
                    {historiaDetails.impresion_diagnostica?.map((d:any, i:number) => (
                      <div key={i} style={{ marginBottom: "8px" }}>
                        <strong>{d.codigo}:</strong> {d.descripcion} <span style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: "8px", fontSize: "12px", marginLeft: "8px" }}>{d.tipo}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: "12px", display: "flex", gap: "24px", fontSize: "13px", color: "#64748b" }}>
                      <span><strong>Finalidad:</strong> {historiaDetails.metadatos_atencion?.finalidad_consulta || 'N/A'}</span>
                      <span><strong>Causa Externa:</strong> {historiaDetails.metadatos_atencion?.causa_externa || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Fila 5: Plan */}
                  <div>
                    <h3 style={{ fontSize: "16px", color: "#00b28e", margin: "0 0 16px 0", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>Plan de Manejo</h3>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{historiaDetails.plan_manejo || 'Sin registro.'}</p>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CURVAS DE CRECIMIENTO OMS */}
      <CurvasCrecimientoModal
        isOpen={viewingCurvas}
        onClose={() => setViewingCurvas(false)}
        paciente={paciente}
        tenantSlug={tenantSlug}
      />

      {/* MODAL CARNÉ DE VACUNACIÓN DIGITAL */}
      <CarneVacunacionModal
        isOpen={viewingCarne}
        onClose={() => setViewingCarne(false)}
        paciente={paciente}
        tenantSlug={tenantSlug}
        tenantId={paciente?.tenant_id}
        currentUserRole={currentUserRole}
      />
    </div>
  );
}
