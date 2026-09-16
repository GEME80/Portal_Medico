'use client';

import { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  CalendarDays, 
  Package, 
  Newspaper, 
  Lock, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  crearMiembroAdministrativo, 
  actualizarPermisosMiembro, 
  cambiarEstadoMiembro, 
  removerMiembroEquipo,
  MiembroEquipoView
} from '@/lib/actions/equipo-actions';
import { PermisosAdministrativos, DEFAULT_PERMISOS_ADMIN } from '@/lib/auth/permissions';

interface EquipoClientProps {
  tenantSlug: string;
  initialMiembros: MiembroEquipoView[];
  primaryColor?: string;
  accentColor?: string;
}

export default function EquipoClient({
  tenantSlug,
  initialMiembros,
  primaryColor = '#0A4D5C',
  accentColor = '#00D4AA',
}: EquipoClientProps) {
  const [miembros, setMiembros] = useState<MiembroEquipoView[]>(initialMiembros);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Crear
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createNombre, setCreateNombre] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createPermisos, setCreatePermisos] = useState<PermisosAdministrativos>({ ...DEFAULT_PERMISOS_ADMIN });
  const [createdSuccessCreds, setCreatedSuccessCreds] = useState<{ email: string; pass: string } | null>(null);

  // Modal Editar Permisos
  const [editingMember, setEditingMember] = useState<MiembroEquipoView | null>(null);
  const [editPermisos, setEditPermisos] = useState<PermisosAdministrativos>({ ...DEFAULT_PERMISOS_ADMIN });

  const handleOpenCreate = () => {
    setCreateNombre('');
    setCreateEmail('');
    setCreatePassword('HubMed' + Math.floor(1000 + Math.random() * 9000) + '*');
    setCreatePermisos({ ...DEFAULT_PERMISOS_ADMIN });
    setCreatedSuccessCreds(null);
    setErrorMsg(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNombre.trim() || !createEmail.trim()) {
      setErrorMsg('Por favor completa el nombre y el correo electrónico.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await crearMiembroAdministrativo(tenantSlug, {
      nombre: createNombre,
      email: createEmail,
      password: createPassword,
      permisos: createPermisos,
    });

    setLoading(false);

    if (res.success) {
      setCreatedSuccessCreds({
        email: createEmail.trim(),
        pass: res.data?.passwordAsignada || createPassword,
      });
      // Actualizar lista local optimista
      const newMember: MiembroEquipoView = {
        id: 'tmp-' + Date.now(),
        tenant_id: '',
        user_id: '',
        rol: 'recepcion',
        nombre: createNombre.trim(),
        email: createEmail.trim().toLowerCase(),
        permisos: { ...createPermisos },
        activo: true,
        created_at: new Date().toISOString(),
      };
      setMiembros([newMember, ...miembros]);
    } else {
      setErrorMsg(res.error || 'Error al crear el colaborador.');
    }
  };

  const handleOpenEdit = (member: MiembroEquipoView) => {
    setEditingMember(member);
    setEditPermisos({ ...member.permisos });
    setErrorMsg(null);
  };

  const handleSaveEditPermisos = async () => {
    if (!editingMember) return;
    setLoading(true);
    setErrorMsg(null);

    const res = await actualizarPermisosMiembro(tenantSlug, editingMember.id, editPermisos);
    setLoading(false);

    if (res.success) {
      setMiembros(miembros.map(m => m.id === editingMember.id ? { ...m, permisos: { ...editPermisos } } : m));
      setEditingMember(null);
      setSuccessMsg('Permisos actualizados exitosamente.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(res.error || 'Error al actualizar permisos.');
    }
  };

  const handleToggleActivo = async (member: MiembroEquipoView) => {
    const nuevoEstado = !member.activo;
    setLoading(true);
    const res = await cambiarEstadoMiembro(tenantSlug, member.id, nuevoEstado);
    setLoading(false);

    if (res.success) {
      setMiembros(miembros.map(m => m.id === member.id ? { ...m, activo: nuevoEstado } : m));
    } else {
      alert('Error al cambiar estado: ' + res.error);
    }
  };

  const handleRemoveMember = async (member: MiembroEquipoView) => {
    const confirm = window.confirm(`¿Estás seguro de remover a ${member.nombre || member.email}? Ya no podrá acceder al consultorio.`);
    if (!confirm) return;

    setLoading(true);
    const res = await removerMiembroEquipo(member.id, tenantSlug);
    setLoading(false);

    if (res.success) {
      setMiembros(miembros.filter(m => m.id !== member.id));
      setSuccessMsg('Colaborador removido correctamente.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      alert('Error al remover colaborador: ' + res.error);
    }
  };

  return (
    <>
      {/* ── TOPBAR STICKY ── */}
      <div className="admin-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "rgba(10, 77, 92, 0.08)",
            color: primaryColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Users size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="admin-topbar-title" style={{ margin: 0, lineHeight: 1.2 }}>Equipo & Permisos Administrativos</h1>
            <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "2px 0 0" }}>
              Crea y configura los accesos del personal de secretaría y recepción, con bloqueo total de opciones médicas
            </p>
          </div>
        </div>
        <div className="admin-topbar-right">
          <button 
            onClick={handleOpenCreate}
            className="btn btn-emerald" 
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px",
              background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
              color: '#ffffff',
              fontWeight: 700,
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={16} />
            <span>Nuevo Colaborador</span>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto" style={{ padding: "28px 24px" }}>
        {/* Banner de Mensajes */}
        {successMsg && (
          <div style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
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
            <Check size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tarjeta de Gobernanza & Reserva Legal */}
        <div style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "28px",
          display: "flex",
          gap: "18px",
          alignItems: "flex-start",
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
        }}>
          <div style={{
            background: "rgba(10, 77, 92, 0.1)",
            color: primaryColor,
            padding: "10px",
            borderRadius: "12px",
            flexShrink: 0
          }}>
            <ShieldCheck size={26} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>
              Segregación de Funciones y Reserva Legal (Resolución 1995 de 1999 de MinSalud)
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
              El personal administrativo puede gestionar la <strong>agenda de citas</strong>, registrar <strong>datos demográficos</strong> y administrar la <strong>caja/inventario</strong> según los permisos que otorgues abajo. 
              Todas las opciones médicas (historias clínicas, evolución, diagnósticos CIE-10, fórmulas médicas y curvas OMS) quedan <strong>estrictamente deshabilitadas</strong> por mandato de ley y reserva médica.
            </p>
          </div>
        </div>

        {/* Tabla de Miembros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#ffffff"
          }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#1e293b" }}>Colaboradores Registrados</h2>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                {miembros.length} {miembros.length === 1 ? 'colaborador activo' : 'colaboradores en el consultorio'}
              </span>
            </div>
          </div>

          {miembros.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "#64748b" }}>
              <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#f1f5f9",
                color: "#94a3b8",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px"
              }}>
                <Users size={26} />
              </div>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>No has asignado colaboradores</h4>
              <p style={{ margin: "0 0 20px 0", fontSize: "13px", maxWidth: "420px", marginInline: "auto" }}>
                Crea una cuenta para tu recepcionista o asistente con los permisos específicos que requiera para atender tu consultorio.
              </p>
              <button 
                onClick={handleOpenCreate}
                className="btn btn-emerald"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: primaryColor,
                  color: "#ffffff",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <UserPlus size={16} /> Crear Primer Colaborador
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="w-full text-left border-collapse" style={{ width: "100%", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <th style={{ padding: "14px 20px", fontWeight: 700 }}>Colaborador</th>
                    <th style={{ padding: "14px 16px", fontWeight: 700 }}>Rol</th>
                    <th style={{ padding: "14px 16px", fontWeight: 700 }}>Permisos Asignados</th>
                    <th style={{ padding: "14px 16px", fontWeight: 700 }}>Estado</th>
                    <th style={{ padding: "14px 20px", fontWeight: 700, textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {miembros.map((miembro) => (
                    <tr key={miembro.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50 transition-colors">
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #0A4D5C 0%, #00D4AA 100%)",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "14px"
                          }}>
                            {(miembro.nombre || miembro.email || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "14px" }}>
                              {miembro.nombre || 'Colaborador'}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                              {miembro.email || miembro.user_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "16px 16px" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: miembro.rol === 'recepcion' ? "rgba(10, 77, 92, 0.08)" : "rgba(16, 185, 129, 0.1)",
                          color: miembro.rol === 'recepcion' ? primaryColor : "#047857"
                        }}>
                          {miembro.rol === 'recepcion' ? 'Recepción / Administrativo' : 'Médico Auxiliar'}
                        </span>
                      </td>

                      <td style={{ padding: "16px 16px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {miembro.permisos.citas && (
                            <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <CalendarDays size={12} /> Citas
                            </span>
                          )}
                          {miembro.permisos.pacientes_demograficos && (
                            <span style={{ background: "#f0fdf4", color: "#15803d", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Users size={12} /> Pacientes (Demográfico)
                            </span>
                          )}
                          {miembro.permisos.inventario && (
                            <span style={{ background: "#fef3c7", color: "#b45309", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Package size={12} /> Caja/Inventario
                            </span>
                          )}
                          {miembro.permisos.noticias && (
                            <span style={{ background: "#f5f3ff", color: "#6d28d9", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <Newspaper size={12} /> Noticias
                            </span>
                          )}
                          <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <Lock size={11} /> Opciones Médicas Bloqueadas
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: "16px 16px" }}>
                        <button
                          onClick={() => handleToggleActivo(miembro)}
                          style={{
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: miembro.activo ? "#16a34a" : "#94a3b8"
                          }}
                        >
                          <span style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: miembro.activo ? "#16a34a" : "#cbd5e1"
                          }} />
                          {miembro.activo ? 'Activo' : 'Suspendido'}
                        </button>
                      </td>

                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            onClick={() => handleOpenEdit(miembro)}
                            style={{
                              background: "#f1f5f9",
                              border: "1px solid #e2e8f0",
                              color: "#334155",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Edit3 size={13} /> Permisos
                          </button>
                          <button
                            onClick={() => handleRemoveMember(miembro)}
                            style={{
                              background: "#fee2e2",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: CREAR COLABORADOR ── */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            maxWidth: "540px",
            width: "100%",
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            {createdSuccessCreds ? (
              <div style={{ textAlign: "center" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px"
                }}>
                  <Check size={30} strokeWidth={2.5} />
                </div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>
                  ¡Colaborador Creado Exitosamente!
                </h3>
                <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0" }}>
                  Entrega estas credenciales iniciales a tu colaborador administrativo para que ingrese a su panel:
                </p>

                <div style={{
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "12px",
                  padding: "18px",
                  textAlign: "left",
                  marginBottom: "24px"
                }}>
                  <div style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Enlace de Ingreso:</span>
                    <strong style={{ fontSize: "13px", color: primaryColor }}>
                      https://portal-medico-five.vercel.app/{tenantSlug}/login
                    </strong>
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Usuario / Correo:</span>
                    <strong style={{ fontSize: "14px", color: "#0f172a" }}>{createdSuccessCreds.email}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Contraseña Inicial:</span>
                    <strong style={{ fontSize: "14px", color: "#0f172a", fontFamily: "monospace" }}>{createdSuccessCreds.pass}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    width: "100%",
                    background: primaryColor,
                    color: "#ffffff",
                    fontWeight: 700,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Entendido y Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0f172a" }}>Nuevo Colaborador Administrativo</h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                      Asigna credenciales y permisos operativos de secretaría
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {errorMsg && (
                  <div style={{
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Laura Gómez"
                      value={createNombre}
                      onChange={(e) => setCreateNombre(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Correo Electrónico (Login)
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="laura.asistente@consultorio.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontSize: "14px",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                      Contraseña Temporal
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showCreatePassword ? "text" : "password"}
                        required
                        value={createPassword}
                        onChange={(e) => setCreatePassword(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          paddingRight: "40px",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          fontSize: "14px",
                          boxSizing: "border-box",
                          fontFamily: "monospace"
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(!showCreatePassword)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b"
                        }}
                      >
                        {showCreatePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interruptores de Permisos */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
                    Permisos Operativos Asignados
                  </label>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Citas */}
                    <label style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer"
                    }}>
                      <input
                        type="checkbox"
                        checked={createPermisos.citas}
                        onChange={(e) => setCreatePermisos({ ...createPermisos, citas: e.target.checked })}
                        style={{ marginTop: "3px", accentColor: primaryColor }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>📅 Agenda & Calendario de Citas</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Permite agendar, reprogramar, cancelar y marcar asistencia de pacientes.</div>
                      </div>
                    </label>

                    {/* Pacientes Demográficos */}
                    <label style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer"
                    }}>
                      <input
                        type="checkbox"
                        checked={createPermisos.pacientes_demograficos}
                        onChange={(e) => setCreatePermisos({ ...createPermisos, pacientes_demograficos: e.target.checked })}
                        style={{ marginTop: "3px", accentColor: primaryColor }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>👤 Registro de Pacientes (Datos Básicos)</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Permite ingresar pacientes nuevos y actualizar teléfonos, acudientes y EPS. *Sin acceso a historias clínicas.*</div>
                      </div>
                    </label>

                    {/* Inventario / POS */}
                    <label style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer"
                    }}>
                      <input
                        type="checkbox"
                        checked={createPermisos.inventario}
                        onChange={(e) => setCreatePermisos({ ...createPermisos, inventario: e.target.checked })}
                        style={{ marginTop: "3px", accentColor: primaryColor }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>📦 Inventario, Vacunas & Caja POS</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Permite cobrar consultas y registrar la salida de vacunas o medicamentos.</div>
                      </div>
                    </label>

                    {/* Noticias */}
                    <label style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      cursor: "pointer"
                    }}>
                      <input
                        type="checkbox"
                        checked={createPermisos.noticias}
                        onChange={(e) => setCreatePermisos({ ...createPermisos, noticias: e.target.checked })}
                        style={{ marginTop: "3px", accentColor: primaryColor }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#1e293b" }}>📰 Publicaciones & Noticias</div>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Permite redactar y publicar comunicados en la web pública del consultorio.</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Nota de Seguridad */}
                <div style={{
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "24px",
                  display: "flex",
                  gap: "10px",
                  fontSize: "12px",
                  color: "#92400e"
                }}>
                  <Lock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong>Bloqueo Médico Inviolable:</strong> El colaborador administrativo <strong>nunca</strong> podrá ver ni editar historias clínicas, notas de evolución, diagnósticos CIE-10, prescripciones médicas ni descargar reportes RIPS.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      fontWeight: 600,
                      color: "#64748b",
                      cursor: "pointer"
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 2,
                      padding: "12px",
                      background: primaryColor,
                      color: "#ffffff",
                      borderRadius: "10px",
                      border: "none",
                      fontWeight: 700,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Creando...' : 'Crear Colaborador'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR PERMISOS ── */}
      {editingMember && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            maxWidth: "500px",
            width: "100%",
            padding: "32px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  Editar Permisos de {editingMember.nombre || editingMember.email}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                  Activa o desactiva las áreas a las que tiene acceso
                </p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editPermisos.citas}
                  onChange={(e) => setEditPermisos({ ...editPermisos, citas: e.target.checked })}
                  style={{ accentColor: primaryColor }}
                />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>📅 Agenda & Calendario de Citas</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editPermisos.pacientes_demograficos}
                  onChange={(e) => setEditPermisos({ ...editPermisos, pacientes_demograficos: e.target.checked })}
                  style={{ accentColor: primaryColor }}
                />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>👤 Registro de Pacientes (Demográficos)</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editPermisos.inventario}
                  onChange={(e) => setEditPermisos({ ...editPermisos, inventario: e.target.checked })}
                  style={{ accentColor: primaryColor }}
                />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>📦 Inventario, Vacunas & Caja POS</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={editPermisos.noticias}
                  onChange={(e) => setEditPermisos({ ...editPermisos, noticias: e.target.checked })}
                  style={{ accentColor: primaryColor }}
                />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>📰 Publicaciones & Noticias</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  fontWeight: 600,
                  color: "#64748b",
                  cursor: "pointer"
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditPermisos}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: "12px",
                  background: primaryColor,
                  color: "#ffffff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
