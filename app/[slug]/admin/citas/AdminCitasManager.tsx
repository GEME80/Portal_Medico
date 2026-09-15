"use client";

import { useState, useMemo } from "react";
import {
  actualizarEstadoCita,
  crearBloqueoAgendaAction,
  eliminarCitaOBloqueoAction,
  guardarConfiguracionAgendaAction,
  editarCitaAction
} from "@/lib/actions/citas-actions";
import {
  calcularSlotsParaFecha,
  AgendaConfig,
  DEFAULT_AGENDA_CONFIG,
  DEFAULT_CALENDAR_BODY_TEMPLATE,
  CitaOEvento,
  getNowColombia,
  timeToMinutes
} from "@/lib/citas/slot-engine";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  ListFilter,
  Settings,
  Lock,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  CheckCircle2,
  X,
  Eye,
  MessageCircle,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search
} from "lucide-react";

interface CitaItem {
  id: string;
  tenant_id: string;
  tipo: "cita" | "bloqueo";
  estado: "solicitada" | "programada" | "confirmada" | "cancelada" | "completada" | "bloqueada";
  fecha_hora: string;
  fecha_fin?: string;
  duracion_minutos: number;
  motivo?: string;
  notas?: string;
  nombre_solicitante?: string;
  documento_solicitante?: string;
  telefono_solicitante?: string;
  email_solicitante?: string;
  pacientes?: {
    nombres: string;
    apellidos: string;
    documento: string;
  };
}

interface Props {
  tenantSlug: string;
  initialCitas: CitaItem[];
  initialConfig?: AgendaConfig;
  tableMissing?: boolean;
}

export default function AdminCitasManager({
  tenantSlug,
  initialCitas,
  initialConfig,
  tableMissing
}: Props) {
  const [citas, setCitas] = useState<CitaItem[]>(initialCitas || []);
  const [agendaConfig, setAgendaConfig] = useState<AgendaConfig>(initialConfig || DEFAULT_AGENDA_CONFIG);
  
  // Vistas: 'dia' | 'semana' | 'mes' | 'lista'
  const [activeView, setActiveView] = useState<"dia" | "semana" | "mes" | "lista">("dia");
  
  // Fecha activa para navegación (YYYY-MM-DD)
  const todayStr = getNowColombia().fecha;
  const [currentDateStr, setCurrentDateStr] = useState<string>(todayStr);

  // Modales y Drawer de Detalle
  const [selectedCitaForDetail, setSelectedCitaForDetail] = useState<CitaItem | null>(null);
  const [editingCita, setEditingCita] = useState<CitaItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    fecha: "",
    hora: "",
    duracion_minutos: 30,
    nombre_solicitante: "",
    documento_solicitante: "",
    telefono_solicitante: "",
    email_solicitante: "",
    motivo: "",
    notas: "",
    estado: "confirmada" as any
  });
  const [editLoading, setEditLoading] = useState(false);

  // Modal de Bloqueo de Agenda (Horas o Semanas/Rango de Fechas)
  const [showBloqueoModal, setShowBloqueoModal] = useState(false);
  const [bloqueoModo, setBloqueoModo] = useState<"horas" | "rango">("horas");
  const [bloqueoTodoElDia, setBloqueoTodoElDia] = useState(true);
  const [bloqueoForm, setBloqueoForm] = useState({
    fecha_inicio: currentDateStr,
    fecha_fin: currentDateStr,
    hora_inicio: "08:00",
    hora_fin: "18:00",
    motivo: "",
    notas: ""
  });
  const [bloqueoLoading, setBloqueoLoading] = useState(false);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState<AgendaConfig>(agendaConfig);
  const [configLoading, setConfigLoading] = useState(false);

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Búsqueda en lista
  const [searchTerm, setSearchTerm] = useState("");

  // Helpers de Navegación de Fecha
  const handlePrevDate = () => {
    const d = new Date(currentDateStr + "T12:00:00Z");
    if (activeView === "dia") {
      d.setUTCDate(d.getUTCDate() - 1);
    } else if (activeView === "semana") {
      d.setUTCDate(d.getUTCDate() - 7);
    } else if (activeView === "mes") {
      d.setUTCMonth(d.getUTCMonth() - 1);
    }
    setCurrentDateStr(d.toISOString().split("T")[0]);
  };

  const handleNextDate = () => {
    const d = new Date(currentDateStr + "T12:00:00Z");
    if (activeView === "dia") {
      d.setUTCDate(d.getUTCDate() + 1);
    } else if (activeView === "semana") {
      d.setUTCDate(d.getUTCDate() + 7);
    } else if (activeView === "mes") {
      d.setUTCMonth(d.getUTCMonth() + 1);
    }
    setCurrentDateStr(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setCurrentDateStr(todayStr);
  };

  // Abrir Detalle de Cita
  const handleOpenDetail = (citaId: string) => {
    const found = citas.find(c => c.id === citaId);
    if (found) {
      setSelectedCitaForDetail(found);
    }
  };

  // Iniciar Edición de Cita
  const handleStartEdit = (cita: CitaItem) => {
    const d = new Date(cita.fecha_hora);
    const fStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(d);
    const hStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Bogota",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(d);

    setEditFormData({
      fecha: fStr,
      hora: hStr,
      duracion_minutos: cita.duracion_minutos || 30,
      nombre_solicitante: cita.nombre_solicitante || "",
      documento_solicitante: cita.documento_solicitante || "",
      telefono_solicitante: cita.telefono_solicitante || "",
      email_solicitante: cita.email_solicitante || "",
      motivo: cita.motivo || "",
      notas: cita.notas || "",
      estado: cita.estado
    });
    setEditingCita(cita);
  };

  // Guardar Edición de Cita
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCita) return;

    setEditLoading(true);
    setFeedbackMsg(null);

    const fecha_hora = `${editFormData.fecha}T${editFormData.hora}:00-05:00`;

    const res = await editarCitaAction({
      id: editingCita.id,
      fecha_hora,
      duracion_minutos: Number(editFormData.duracion_minutos),
      motivo: editFormData.motivo,
      notas: editFormData.notas,
      nombre_solicitante: editFormData.nombre_solicitante,
      documento_solicitante: editFormData.documento_solicitante,
      telefono_solicitante: editFormData.telefono_solicitante,
      email_solicitante: editFormData.email_solicitante,
      estado: editFormData.estado
    }, tenantSlug);

    setEditLoading(false);

    if (res.success && res.data) {
      setCitas(prev => prev.map(c => c.id === editingCita.id ? res.data : c));
      setSelectedCitaForDetail(res.data);
      setEditingCita(null);
      setFeedbackMsg({ type: "success", text: "Cita médica actualizada exitosamente." });
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Error al actualizar la cita" });
    }
  };

  // Cambiar Estado
  const handleCambiarEstado = async (id: string, nuevoEstado: "confirmada" | "cancelada" | "completada") => {
    setProcessingId(id);
    setFeedbackMsg(null);
    const res = await actualizarEstadoCita(id, nuevoEstado, tenantSlug);
    setProcessingId(null);
    if (res.success) {
      setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
      if (selectedCitaForDetail?.id === id) {
        setSelectedCitaForDetail(prev => prev ? { ...prev, estado: nuevoEstado } : null);
      }
      setFeedbackMsg({
        type: "success",
        text: `Cita ${nuevoEstado === "confirmada" ? "confirmada" : nuevoEstado === "cancelada" ? "cancelada" : "completada"} exitosamente.`
      });
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Error al actualizar estado" });
    }
  };

  // Eliminar
  const handleEliminar = async (id: string) => {
    if (!confirm("¿Deseas eliminar definitivamente este registro de la agenda médica?")) return;
    setProcessingId(id);
    const res = await eliminarCitaOBloqueoAction(id, tenantSlug);
    setProcessingId(null);
    if (res.success) {
      setCitas(prev => prev.filter(c => c.id !== id));
      if (selectedCitaForDetail?.id === id) {
        setSelectedCitaForDetail(null);
      }
      setFeedbackMsg({ type: "success", text: "Registro eliminado de la agenda." });
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Error al eliminar" });
    }
  };

  // Aplicar Preset de Rango de Días
  const handleApplyPreset = (dias: number) => {
    const start = new Date(bloqueoForm.fecha_inicio + "T12:00:00Z");
    const end = new Date(start.getTime() + (dias - 1) * 86400000);
    const endStr = end.toISOString().split("T")[0];
    setBloqueoForm(prev => ({ ...prev, fecha_fin: endStr }));
  };

  // Crear Bloqueo de Agenda
  const handleCrearBloqueo = async (e: React.FormEvent) => {
    e.preventDefault();
    setBloqueoLoading(true);
    setFeedbackMsg(null);

    let fecha_hora = "";
    let fecha_fin: string | null = null;
    let duracion_minutos = 60;

    if (bloqueoModo === "horas") {
      fecha_hora = `${bloqueoForm.fecha_inicio}T${bloqueoForm.hora_inicio}:00-05:00`;
      fecha_fin = `${bloqueoForm.fecha_inicio}T${bloqueoForm.hora_fin}:00-05:00`;
      const startMin = timeToMinutes(bloqueoForm.hora_inicio);
      const endMin = timeToMinutes(bloqueoForm.hora_fin);
      duracion_minutos = Math.max(15, endMin - startMin);
    } else {
      if (bloqueoForm.fecha_fin < bloqueoForm.fecha_inicio) {
        setBloqueoLoading(false);
        setFeedbackMsg({ type: "error", text: "La fecha de fin no puede ser anterior a la fecha de inicio." });
        return;
      }

      if (bloqueoTodoElDia) {
        fecha_hora = `${bloqueoForm.fecha_inicio}T00:00:00-05:00`;
        fecha_fin = `${bloqueoForm.fecha_fin}T23:59:59-05:00`;
        duracion_minutos = 1440;
      } else {
        fecha_hora = `${bloqueoForm.fecha_inicio}T${bloqueoForm.hora_inicio}:00-05:00`;
        fecha_fin = `${bloqueoForm.fecha_fin}T${bloqueoForm.hora_fin}:00-05:00`;
        const startMin = timeToMinutes(bloqueoForm.hora_inicio);
        const endMin = timeToMinutes(bloqueoForm.hora_fin);
        duracion_minutos = Math.max(15, endMin - startMin);
      }
    }

    const res = await crearBloqueoAgendaAction({
      motivo: bloqueoForm.motivo,
      fecha_hora,
      fecha_fin,
      duracion_minutos,
      notas: bloqueoForm.notas
    }, tenantSlug);

    setBloqueoLoading(false);

    if (res.success) {
      setFeedbackMsg({
        type: "success",
        text: `Bloqueo ${bloqueoModo === "rango" ? `del ${bloqueoForm.fecha_inicio} al ${bloqueoForm.fecha_fin}` : "de agenda"} registrado exitosamente.`
      });
      setShowBloqueoModal(false);
      setBloqueoForm({
        fecha_inicio: currentDateStr,
        fecha_fin: currentDateStr,
        hora_inicio: "08:00",
        hora_fin: "18:00",
        motivo: "",
        notas: ""
      });
      if (res.data) {
        setCitas(prev => [res.data, ...prev]);
      }
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Error al crear bloqueo" });
    }
  };

  // Guardar Configuración
  const handleGuardarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true);
    setFeedbackMsg(null);

    const res = await guardarConfiguracionAgendaAction(configForm, tenantSlug);
    setConfigLoading(false);

    if (res.success) {
      setAgendaConfig(configForm);
      setShowConfigModal(false);
      setFeedbackMsg({ type: "success", text: "Configuración de agenda actualizada exitosamente." });
    } else {
      setFeedbackMsg({ type: "error", text: res.error || "Error al guardar configuración" });
    }
  };

  // Cálculo de slots para el día actual
  const slotsDia = useMemo(() => {
    return calcularSlotsParaFecha(
      currentDateStr,
      citas as CitaOEvento[],
      agendaConfig,
      false
    );
  }, [currentDateStr, citas, agendaConfig]);

  // Días de la semana actual
  const diasSemana = useMemo(() => {
    const [y, m, d] = currentDateStr.split("-").map(Number);
    const curr = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayOfWeek = curr.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(curr);
    monday.setUTCDate(curr.getUTCDate() + diffToMonday);

    const result = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setUTCDate(monday.getUTCDate() + i);
      const dayStr = dayDate.toISOString().split("T")[0];
      
      const slots = calcularSlotsParaFecha(
        dayStr,
        citas as CitaOEvento[],
        agendaConfig,
        false
      );

      result.push({
        dateStr: dayStr,
        dayName: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"][i],
        dayNum: dayDate.getUTCDate(),
        isToday: dayStr === todayStr,
        slotsResult: slots
      });
    }
    return result;
  }, [currentDateStr, citas, agendaConfig, todayStr]);

  // Días del mes
  const diasMes = useMemo(() => {
    const [y, m] = currentDateStr.split("-").map(Number);
    const firstDay = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
    const lastDay = new Date(Date.UTC(y, m, 0, 12, 0, 0));
    const daysInMonth = lastDay.getUTCDate();
    const startDayOfWeek = firstDay.getUTCDay();
    const paddingStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days = [];
    for (let p = 0; p < paddingStart; p++) {
      days.push({ empty: true, key: `pad-${p}` });
    }

    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      
      const slots = calcularSlotsParaFecha(
        dateStr,
        citas as CitaOEvento[],
        agendaConfig,
        false
      );

      days.push({
        empty: false,
        key: dateStr,
        dateStr,
        dayNum,
        isToday: dateStr === todayStr,
        isSelected: dateStr === currentDateStr,
        totalCitas: slots.total_ocupados,
        totalBloqueos: slots.total_bloqueados
      });
    }
    return days;
  }, [currentDateStr, citas, agendaConfig, todayStr]);

  // Citas filtradas
  const citasFiltradas = useMemo(() => {
    return citas.filter(c => {
      if (!searchTerm) return true;
      const t = searchTerm.toLowerCase();
      return (
        c.nombre_solicitante?.toLowerCase().includes(t) ||
        c.documento_solicitante?.toLowerCase().includes(t) ||
        c.telefono_solicitante?.toLowerCase().includes(t) ||
        c.motivo?.toLowerCase().includes(t)
      );
    });
  }, [citas, searchTerm]);

  return (
    <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "24px" }}>
      {/* Header Principal */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <Calendar size={26} color="#0A4D5C" strokeWidth={2.2} />
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Agenda Médica & Control de Citas
            </h1>
            <span style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: "20px",
              background: "#0A4D5C",
              color: "#ffffff"
            }}>
              Duración: {agendaConfig.duracion_cita_minutos} min
            </span>
          </div>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
            Gestiona citas en tiempo real, reprogramaciones y bloqueos de agenda por horas o semanas completas.
          </p>
        </div>

        {/* Botones de Acción */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowConfigModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 15px",
              borderRadius: "10px",
              background: "#f1f5f9",
              color: "#334155",
              fontWeight: 700,
              fontSize: "13px",
              border: "1px solid #cbd5e1",
              cursor: "pointer"
            }}
          >
            <Settings size={14} />
            <span>Ajustes de Agenda</span>
          </button>

          <button
            onClick={() => {
              setBloqueoForm(prev => ({
                ...prev,
                fecha_inicio: currentDateStr,
                fecha_fin: currentDateStr
              }));
              setShowBloqueoModal(true);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "10px",
              background: "#e0f2fe",
              color: "#0369a1",
              fontWeight: 700,
              fontSize: "13px",
              border: "1px solid #bae6fd",
              cursor: "pointer"
            }}
          >
            <Lock size={14} />
            <span>Bloquear Espacio / Semanas</span>
          </button>

          <a
            href={`/${tenantSlug}/citas`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "10px",
              background: "#0A4D5C",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              textDecoration: "none",
              boxShadow: "0 4px 10px rgba(10, 77, 92, 0.2)"
            }}
          >
            <span>Portal de Pacientes</span>
            <ExternalLink size={13} opacity={0.8} />
          </a>
        </div>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: "12px 18px",
          borderRadius: "12px",
          marginBottom: "16px",
          background: feedbackMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${feedbackMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
          color: feedbackMsg.type === "success" ? "#166534" : "#991b1b",
          fontSize: "14px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {feedbackMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Barra de Control de Navegación y Vistas */}
      <div style={{
        background: "#ffffff",
        padding: "14px 20px",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        {/* Selector de Vistas */}
        <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
          {[
            { id: "dia", label: "Vista Día", icon: Clock },
            { id: "semana", label: "Vista Semana", icon: CalendarDays },
            { id: "mes", label: "Vista Mes", icon: CalendarRange },
            { id: "lista", label: "Todas las Citas", icon: ListFilter },
          ].map(v => {
            const IconComp = v.icon;
            const isAct = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id as any)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "none",
                  background: isAct ? "#ffffff" : "transparent",
                  color: isAct ? "#0A4D5C" : "#64748b",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: isAct ? "0 2px 5px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease"
                }}
              >
                <IconComp size={14} />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>

        {/* Controles de Fecha */}
        {activeView !== "lista" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={handlePrevDate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                cursor: "pointer",
                fontWeight: 700
              }}
              title="Anterior"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={handleToday}
              style={{
                padding: "7px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: currentDateStr === todayStr ? "#0A4D5C" : "#ffffff",
                color: currentDateStr === todayStr ? "#ffffff" : "#334155",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "13px"
              }}
            >
              Hoy
            </button>

            <button
              onClick={handleNextDate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                cursor: "pointer",
                fontWeight: 700
              }}
              title="Siguiente"
            >
              <ChevronRight size={16} />
            </button>

            <input
              type="date"
              value={currentDateStr}
              onChange={(e) => setCurrentDateStr(e.target.value)}
              style={{
                padding: "7px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                fontWeight: 600
              }}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. VISTA DÍA */}
      {/* ========================================================================= */}
      {activeView === "dia" && (
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
        }}>
          <div style={{
            padding: "16px 24px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                Horarios del {currentDateStr}
              </h3>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                {slotsDia.total_disponibles} libres · {slotsDia.total_ocupados} citas · {slotsDia.total_bloqueados} bloqueos
              </span>
            </div>

            {!slotsDia.dia_laboral_activo && (
              <span style={{
                padding: "4px 12px",
                borderRadius: "20px",
                background: "#fee2e2",
                color: "#991b1b",
                fontSize: "12px",
                fontWeight: 700
              }}>
                Día No Laboral según Configuración
              </span>
            )}
          </div>

          <div style={{ padding: "16px 24px" }}>
            {slotsDia.slots.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: 600 }}>No hay franjas de atención programadas para este día.</p>
                <button
                  onClick={() => setShowConfigModal(true)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: "#0A4D5C",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px"
                  }}
                >
                  Configurar días de atención
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {slotsDia.slots.map((slot) => {
                  const citaAsociada = slot.cita_id ? citas.find(c => c.id === slot.cita_id) : null;

                  // 1. Slot Bloqueado
                  if (slot.razon === "bloqueado") {
                    return (
                      <div
                        key={slot.hora}
                        onClick={() => citaAsociada && handleOpenDetail(citaAsociada.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 18px",
                          borderRadius: "12px",
                          background: "#f0f9ff",
                          border: "1px solid #bae6fd",
                          borderLeft: "5px solid #0284c7",
                          cursor: citaAsociada ? "pointer" : "default",
                          transition: "transform 0.1s ease"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#0369a1", minWidth: "90px", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Clock size={14} /> {slot.hora} - {slot.hora_fin}
                          </span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{
                                background: "#0284c7",
                                color: "#ffffff",
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                <Lock size={10} /> BLOQUEO PRIVADO
                              </span>
                              <strong style={{ fontSize: "14px", color: "#0c4a6e" }}>
                                {slot.bloqueo_motivo || citaAsociada?.motivo || "Bloqueo de agenda"}
                              </strong>
                            </div>
                            {slot.bloqueo_notas && (
                              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#0369a1" }}>
                                {slot.bloqueo_notas}
                              </p>
                            )}
                            <span style={{ fontSize: "11px", color: "#64748b" }}>
                              Confidencial: El paciente solo ve &quot;No disponible&quot;.
                            </span>
                          </div>
                        </div>

                        {citaAsociada && (
                          <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleStartEdit(citaAsociada)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                background: "#ffffff",
                                color: "#0369a1",
                                border: "1px solid #bae6fd",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              <Pencil size={12} /> Editar
                            </button>
                            <button
                              onClick={() => handleEliminar(citaAsociada.id)}
                              disabled={processingId === citaAsociada.id}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                background: "#ffffff",
                                color: "#ef4444",
                                border: "1px solid #fca5a5",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                              title="Eliminar bloqueo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 2. Slot Ocupado con Cita Médica
                  if (slot.razon === "ocupado" && citaAsociada) {
                    const telefono = citaAsociada.telefono_solicitante?.replace(/\D/g, "");
                    const whatsappUrl = telefono ? `https://wa.me/57${telefono}` : null;

                    return (
                      <div
                        key={slot.hora}
                        onClick={() => handleOpenDetail(citaAsociada.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 18px",
                          borderRadius: "12px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderLeft: "5px solid #16a34a",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 800, color: "#166534", minWidth: "90px", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Clock size={14} /> {slot.hora} - {slot.hora_fin}
                          </span>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{
                                background: "#16a34a",
                                color: "#ffffff",
                                fontSize: "10px",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px"
                              }}>
                                <Check size={10} /> CITA CONFIRMADA
                              </span>
                              <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                                {citaAsociada.nombre_solicitante || "Paciente"}
                              </strong>
                              {citaAsociada.documento_solicitante && (
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                  ({citaAsociada.documento_solicitante})
                                </span>
                              )}
                            </div>
                            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#334155" }}>
                              {citaAsociada.motivo || "Consulta médica"}
                            </p>
                          </div>
                        </div>

                        {/* Acciones de Cita */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenDetail(citaAsociada.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: "#ffffff",
                              color: "#0A4D5C",
                              border: "1px solid #cbd5e1",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            <Eye size={13} /> Ver Ficha
                          </button>

                          <button
                            onClick={() => handleStartEdit(citaAsociada)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              background: "#ffffff",
                              color: "#0369a1",
                              border: "1px solid #bae6fd",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            <Pencil size={12} /> Editar
                          </button>

                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                padding: "6px 10px",
                                borderRadius: "8px",
                                background: "#25D366",
                                color: "#ffffff",
                                fontSize: "12px",
                                fontWeight: 700,
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                              title="Abrir WhatsApp"
                            >
                              <MessageCircle size={13} />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <button
                            onClick={() => handleEliminar(citaAsociada.id)}
                            disabled={processingId === citaAsociada.id}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              background: "#ffffff",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                            title="Eliminar cita"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // 3. Slot Pasado o Receso
                  if (slot.razon === "pasado" || slot.razon === "receso") {
                    return (
                      <div
                        key={slot.hora}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 18px",
                          borderRadius: "10px",
                          background: "#f8fafc",
                          border: "1px dashed #cbd5e1",
                          opacity: 0.6
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Clock size={13} /> {slot.hora} - {slot.hora_fin} · {slot.razon === "receso" ? "Receso / Almuerzo" : "Horario pasado"}
                        </span>
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>No disponible</span>
                      </div>
                    );
                  }

                  // 4. Slot Disponible (Libre)
                  return (
                    <div
                      key={slot.hora}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 18px",
                        borderRadius: "12px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#0A4D5C", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Clock size={14} /> {slot.hora} - {slot.hora_fin}
                        </span>
                        <span style={{
                          background: "#e2e8f0",
                          color: "#475569",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "6px"
                        }}>
                          DISPONIBLE
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => {
                            setBloqueoModo("horas");
                            setBloqueoForm({
                              fecha_inicio: currentDateStr,
                              fecha_fin: currentDateStr,
                              hora_inicio: slot.hora,
                              hora_fin: slot.hora_fin,
                              motivo: "",
                              notas: ""
                            });
                            setShowBloqueoModal(true);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            background: "#f1f5f9",
                            color: "#475569",
                            fontSize: "12px",
                            fontWeight: 600,
                            border: "1px solid #cbd5e1",
                            cursor: "pointer"
                          }}
                        >
                          <Lock size={12} /> Bloquear
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISTA SEMANA */}
      {/* ========================================================================= */}
      {activeView === "semana" && (
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          overflowX: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(150px, 1fr))", borderBottom: "1px solid #e2e8f0" }}>
            {diasSemana.map((d) => (
              <div
                key={d.dateStr}
                onClick={() => {
                  setCurrentDateStr(d.dateStr);
                  setActiveView("dia");
                }}
                style={{
                  padding: "14px 10px",
                  textAlign: "center",
                  borderRight: "1px solid #e2e8f0",
                  background: d.isToday ? "#f0fdf4" : d.dateStr === currentDateStr ? "#f0f9ff" : "#f8fafc",
                  cursor: "pointer"
                }}
              >
                <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                  {d.dayName}
                </span>
                <span style={{ display: "block", fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                  {d.dayNum}
                </span>
                <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "4px" }}>
                  {d.slotsResult.total_ocupados > 0 && (
                    <span style={{ fontSize: "10px", background: "#16a34a", color: "#fff", padding: "1px 6px", borderRadius: "8px", fontWeight: 700 }}>
                      {d.slotsResult.total_ocupados} citas
                    </span>
                  )}
                  {d.slotsResult.total_bloqueados > 0 && (
                    <span style={{ fontSize: "10px", background: "#0284c7", color: "#fff", padding: "1px 6px", borderRadius: "8px", fontWeight: 700 }}>
                      {d.slotsResult.total_bloqueados} bloq
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(150px, 1fr))", padding: "12px 0", minHeight: "400px" }}>
            {diasSemana.map((d) => (
              <div key={d.dateStr} style={{ borderRight: "1px solid #f1f5f9", padding: "0 8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {d.slotsResult.slots.map((slot) => {
                  if (slot.razon === "ocupado") {
                    return (
                      <div
                        key={slot.hora}
                        onClick={() => slot.cita_id && handleOpenDetail(slot.cita_id)}
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          background: "#dcfce7",
                          border: "1px solid #86efac",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "11px" }}>{slot.hora}</strong>
                          <Eye size={12} color="#166534" />
                        </div>
                        <div style={{ fontWeight: 700, color: "#166534", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px" }}>
                          {slot.paciente_nombre || "Cita"}
                        </div>
                      </div>
                    );
                  }
                  if (slot.razon === "bloqueado") {
                    return (
                      <div
                        key={slot.hora}
                        onClick={() => slot.cita_id && handleOpenDetail(slot.cita_id)}
                        style={{
                          padding: "8px",
                          borderRadius: "8px",
                          background: "#e0f2fe",
                          border: "1px solid #7dd3fc",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "11px" }}>{slot.hora}</strong>
                          <Lock size={11} color="#0369a1" />
                        </div>
                        <div style={{ fontWeight: 700, color: "#0369a1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px" }}>
                          {slot.bloqueo_motivo || "Bloqueo"}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VISTA MES */}
      {/* ========================================================================= */}
      {activeView === "mes" && (
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
            Calendario Mensual
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
              <div key={d} style={{ textAlign: "center", fontWeight: 700, fontSize: "12px", color: "#64748b", padding: "8px 0" }}>
                {d}
              </div>
            ))}

            {diasMes.map((d: any) => {
              if (d.empty) {
                return <div key={d.key} style={{ minHeight: "80px", background: "#f8fafc", borderRadius: "10px", opacity: 0.3 }} />;
              }

              return (
                <div
                  key={d.key}
                  onClick={() => {
                    setCurrentDateStr(d.dateStr);
                    setActiveView("dia");
                  }}
                  style={{
                    minHeight: "90px",
                    padding: "8px",
                    borderRadius: "12px",
                    border: `1px solid ${d.isSelected ? "#0A4D5C" : d.isToday ? "#86efac" : "#e2e8f0"}`,
                    background: d.isSelected ? "rgba(10, 77, 92, 0.05)" : d.isToday ? "#f0fdf4" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: d.isToday ? "#16a34a" : "#0f172a" }}>
                      {d.dayNum}
                    </span>
                    {d.isToday && (
                      <span style={{ fontSize: "9px", background: "#16a34a", color: "#fff", padding: "1px 4px", borderRadius: "4px", fontWeight: 700 }}>
                        HOY
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {d.totalCitas > 0 && (
                      <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                        {d.totalCitas} {d.totalCitas === 1 ? "cita" : "citas"}
                      </span>
                    )}
                    {d.totalBloqueos > 0 && (
                      <span style={{ fontSize: "11px", background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>
                        {d.totalBloqueos} bloq
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TODAS LAS CITAS / LISTA */}
      {/* ========================================================================= */}
      {activeView === "lista" && (
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1px solid #e2e8f0",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
              Registro Histórico de Citas Médicas ({citasFiltradas.length})
            </h3>
            <div style={{ position: "relative", minWidth: "280px" }}>
              <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Buscar por nombre, documento o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 16px 9px 34px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left", color: "#475569" }}>
                  <th style={{ padding: "12px 14px" }}>Fecha / Hora</th>
                  <th style={{ padding: "12px 14px" }}>Tipo</th>
                  <th style={{ padding: "12px 14px" }}>Paciente / Motivo</th>
                  <th style={{ padding: "12px 14px" }}>Contacto</th>
                  <th style={{ padding: "12px 14px" }}>Estado</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.map((c) => {
                  const d = new Date(c.fecha_hora);
                  const isBloqueo = c.tipo === "bloqueo" || c.estado === "bloqueada";
                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenDetail(c.id)}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                    >
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>
                        {d.toLocaleDateString("es-CO")} · {d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {isBloqueo ? (
                          <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "11px" }}>
                            BLOQUEO
                          </span>
                        ) : (
                          <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "11px" }}>
                            CITA
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <strong style={{ display: "block", color: "#0f172a" }}>
                          {isBloqueo ? c.motivo || "Bloqueo de agenda" : c.nombre_solicitante}
                        </strong>
                        <span style={{ color: "#64748b", fontSize: "12px" }}>
                          {isBloqueo ? c.notas : c.motivo}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "#475569" }}>
                        {c.telefono_solicitante || "-"}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontWeight: 700,
                          fontSize: "11px",
                          background: c.estado === "confirmada" ? "#dcfce7" : c.estado === "completada" ? "#e0e7ff" : "#fee2e2",
                          color: c.estado === "confirmada" ? "#166534" : c.estado === "completada" ? "#3730a3" : "#991b1b"
                        }}>
                          {c.estado.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleStartEdit(c)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            border: "1px solid #bae6fd",
                            background: "#ffffff",
                            color: "#0369a1",
                            fontSize: "12px",
                            cursor: "pointer",
                            marginRight: "6px"
                          }}
                        >
                          <Pencil size={11} /> Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(c.id)}
                          style={{
                            padding: "5px 8px",
                            borderRadius: "6px",
                            border: "1px solid #fecaca",
                            background: "#ffffff",
                            color: "#dc2626",
                            fontSize: "12px",
                            cursor: "pointer"
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL / DRAWER: FICHA Y DETALLE COMPLETO DE LA CITA */}
      {/* ========================================================================= */}
      {selectedCitaForDetail && !editingCita && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "540px",
            width: "100%",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: selectedCitaForDetail.tipo === "bloqueo" ? "#e0f2fe" : "rgba(10, 77, 92, 0.08)",
                  color: selectedCitaForDetail.tipo === "bloqueo" ? "#0284c7" : "#0A4D5C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {selectedCitaForDetail.tipo === "bloqueo" ? <Lock size={20} /> : <User size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                    {selectedCitaForDetail.tipo === "bloqueo"
                      ? "Bloqueo Médico Privado"
                      : selectedCitaForDetail.nombre_solicitante || "Paciente"}
                  </h3>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    {selectedCitaForDetail.tipo === "bloqueo"
                      ? "Espacio reservado por el doctor"
                      : selectedCitaForDetail.documento_solicitante || "Sin documento"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCitaForDetail(null)}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <span style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 800,
                background: selectedCitaForDetail.estado === "confirmada" ? "#dcfce7" : selectedCitaForDetail.estado === "completada" ? "#e0e7ff" : "#fee2e2",
                color: selectedCitaForDetail.estado === "confirmada" ? "#166534" : selectedCitaForDetail.estado === "completada" ? "#3730a3" : "#991b1b"
              }}>
                ESTADO: {selectedCitaForDetail.estado.toUpperCase()}
              </span>
            </div>

            <div style={{
              background: "#f8fafc",
              borderRadius: "14px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "14px",
              marginBottom: "24px"
            }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block" }}>FECHA Y HORA</span>
                <strong style={{ fontSize: "14px", color: "#0f172a", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                  <Calendar size={14} color="#0A4D5C" /> {new Date(selectedCitaForDetail.fecha_hora).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </strong>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#0A4D5C", fontWeight: 700, marginTop: "2px" }}>
                  <Clock size={13} /> {new Date(selectedCitaForDetail.fecha_hora).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })} ({selectedCitaForDetail.duracion_minutos || 30} min)
                </span>
              </div>

              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block" }}>CONTACTO</span>
                <strong style={{ fontSize: "14px", color: "#0f172a", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                  <Phone size={14} color="#0A4D5C" /> {selectedCitaForDetail.telefono_solicitante || "No registrado"}
                </strong>
                {selectedCitaForDetail.email_solicitante && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    <Mail size={12} /> {selectedCitaForDetail.email_solicitante}
                  </span>
                )}
              </div>

              <div style={{ gridColumn: "1 / -1", borderTop: "1px dashed #cbd5e1", paddingTop: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block" }}>
                  {selectedCitaForDetail.tipo === "bloqueo" ? "MOTIVO DEL BLOQUEO (CONFIDENCIAL)" : "SERVICIO Y MOTIVO DE CONSULTA"}
                </span>
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#1e293b", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                  <FileText size={14} color="#64748b" /> {selectedCitaForDetail.motivo || "Consulta general"}
                </p>
              </div>

              {selectedCitaForDetail.notas && (
                <div style={{ gridColumn: "1 / -1", background: "#ffffff", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block" }}>NOTAS INTERNAS DEL MÉDICO</span>
                  <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#475569" }}>
                    {selectedCitaForDetail.notas}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleStartEdit(selectedCitaForDetail)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 16px",
                    borderRadius: "10px",
                    background: "#0A4D5C",
                    color: "#ffffff",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  <Pencil size={13} /> Editar / Reprogramar
                </button>

                {selectedCitaForDetail.telefono_solicitante && (
                  <a
                    href={`https://wa.me/57${selectedCitaForDetail.telefono_solicitante.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "9px 14px",
                      borderRadius: "10px",
                      background: "#25D366",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "13px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {selectedCitaForDetail.estado === "confirmada" && (
                  <button
                    onClick={() => handleCambiarEstado(selectedCitaForDetail.id, "completada")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "9px 14px",
                      borderRadius: "10px",
                      background: "#dcfce7",
                      color: "#166534",
                      border: "1px solid #86efac",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    <Check size={14} /> Atendida
                  </button>
                )}

                <button
                  onClick={() => handleEliminar(selectedCitaForDetail.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "9px 14px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  <Trash2 size={13} /> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR / REPROGRAMAR CITA */}
      {/* ========================================================================= */}
      {editingCita && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "580px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                Editar / Reprogramar Cita Médica
              </h3>
              <button
                onClick={() => setEditingCita(null)}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.fecha}
                    onChange={(e) => setEditFormData({ ...editFormData, fecha: e.target.value })}
                    style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={editFormData.hora}
                    onChange={(e) => setEditFormData({ ...editFormData, hora: e.target.value })}
                    style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Duración
                  </label>
                  <select
                    value={editFormData.duracion_minutos}
                    onChange={(e) => setEditFormData({ ...editFormData, duracion_minutos: Number(e.target.value) })}
                    style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                  >
                    <option value={15}>15 min</option>
                    <option value={20}>20 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                    <option value={90}>90 min</option>
                    <option value={120}>120 min</option>
                  </select>
                </div>
              </div>

              {editingCita.tipo !== "bloqueo" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Nombre del Paciente
                    </label>
                    <input
                      type="text"
                      value={editFormData.nombre_solicitante}
                      onChange={(e) => setEditFormData({ ...editFormData, nombre_solicitante: e.target.value })}
                      style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Documento
                    </label>
                    <input
                      type="text"
                      value={editFormData.documento_solicitante}
                      onChange={(e) => setEditFormData({ ...editFormData, documento_solicitante: e.target.value })}
                      style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      WhatsApp / Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editFormData.telefono_solicitante}
                      onChange={(e) => setEditFormData({ ...editFormData, telefono_solicitante: e.target.value })}
                      style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Estado
                    </label>
                    <select
                      value={editFormData.estado}
                      onChange={(e) => setEditFormData({ ...editFormData, estado: e.target.value })}
                      style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", background: "#fff" }}
                    >
                      <option value="confirmada">Confirmada</option>
                      <option value="completada">Atendida / Completada</option>
                      <option value="solicitada">Solicitada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  {editingCita.tipo === "bloqueo" ? "Motivo del Bloqueo (Confidencial) *" : "Motivo de Consulta / Servicio *"}
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.motivo}
                  onChange={(e) => setEditFormData({ ...editFormData, motivo: e.target.value })}
                  style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Notas Privadas del Médico
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notas}
                  onChange={(e) => setEditFormData({ ...editFormData, notas: e.target.value })}
                  placeholder="Notas internas personales..."
                  style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setEditingCita(null)}
                  style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{ padding: "9px 22px", borderRadius: "10px", background: "#0A4D5C", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: 700 }}
                >
                  {editLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BLOQUEAR ESPACIO EN AGENDA (HORAS O SEMANAS COMPLETAS) */}
      {/* ========================================================================= */}
      {showBloqueoModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "560px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={18} color="#0369a1" />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  Bloquear Espacio en Agenda Médica
                </h3>
              </div>
              <button
                onClick={() => setShowBloqueoModal(false)}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Selector de Modo: Horas vs Rango de Días / Semanas */}
            <div style={{ display: "flex", gap: "6px", background: "#f1f5f9", padding: "4px", borderRadius: "10px", marginBottom: "16px" }}>
              <button
                type="button"
                onClick={() => setBloqueoModo("horas")}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background: bloqueoModo === "horas" ? "#ffffff" : "transparent",
                  color: bloqueoModo === "horas" ? "#0A4D5C" : "#64748b",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: bloqueoModo === "horas" ? "0 2px 4px rgba(0,0,0,0.06)" : "none"
                }}
              >
                <Clock size={14} />
                <span>Por Horas (Mismo Día)</span>
              </button>

              <button
                type="button"
                onClick={() => setBloqueoModo("rango")}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background: bloqueoModo === "rango" ? "#ffffff" : "transparent",
                  color: bloqueoModo === "rango" ? "#0A4D5C" : "#64748b",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: bloqueoModo === "rango" ? "0 2px 4px rgba(0,0,0,0.06)" : "none"
                }}
              >
                <CalendarRange size={14} />
                <span>Rango de Días / Semanas</span>
              </button>
            </div>

            {/* Aviso de Privacidad Estricta */}
            <div style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#e0f2fe",
              border: "1px solid #bae6fd",
              marginBottom: "18px",
              fontSize: "12px",
              color: "#0369a1",
              lineHeight: "1.5",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <ShieldCheck size={18} style={{ flexShrink: 0 }} />
              <span><strong>Garantía de Privacidad:</strong> El motivo solo lo ves tú en tu consola. En el portal público del paciente aparecerá como <strong>&quot;No disponible&quot;</strong>.</span>
            </div>

            <form onSubmit={handleCrearBloqueo}>
              {bloqueoModo === "horas" ? (
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                    Fecha del Bloqueo *
                  </label>
                  <input
                    type="date"
                    required
                    value={bloqueoForm.fecha_inicio}
                    onChange={(e) => setBloqueoForm({ ...bloqueoForm, fecha_inicio: e.target.value, fecha_fin: e.target.value })}
                    style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "8px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Fecha Inicio *
                      </label>
                      <input
                        type="date"
                        required
                        value={bloqueoForm.fecha_inicio}
                        onChange={(e) => setBloqueoForm({ ...bloqueoForm, fecha_inicio: e.target.value })}
                        style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                        Fecha Fin *
                      </label>
                      <input
                        type="date"
                        required
                        min={bloqueoForm.fecha_inicio}
                        value={bloqueoForm.fecha_fin}
                        onChange={(e) => setBloqueoForm({ ...bloqueoForm, fecha_fin: e.target.value })}
                        style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                      />
                    </div>
                  </div>

                  {/* Presets rápidos */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", alignSelf: "center" }}>Duración rápida:</span>
                    {[
                      { label: "+1 Día", dias: 1 },
                      { label: "+1 Semana (7d)", dias: 7 },
                      { label: "+2 Semanas (14d)", dias: 14 },
                      { label: "+1 Mes (30d)", dias: 30 }
                    ].map(p => (
                      <button
                        type="button"
                        key={p.label}
                        onClick={() => handleApplyPreset(p.dias)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#334155",
                          cursor: "pointer"
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="todoElDia"
                      checked={bloqueoTodoElDia}
                      onChange={(e) => setBloqueoTodoElDia(e.target.checked)}
                    />
                    <label htmlFor="todoElDia" style={{ fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                      Bloquear todo el día (Jornada completa durante todo el rango)
                    </label>
                  </div>
                </div>
              )}

              {/* Horas */}
              {(bloqueoModo === "horas" || !bloqueoTodoElDia) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Hora de Inicio *
                    </label>
                    <input
                      type="time"
                      required
                      value={bloqueoForm.hora_inicio}
                      onChange={(e) => setBloqueoForm({ ...bloqueoForm, hora_inicio: e.target.value })}
                      style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                      Hora de Fin *
                    </label>
                    <input
                      type="time"
                      required
                      value={bloqueoForm.hora_fin}
                      onChange={(e) => setBloqueoForm({ ...bloqueoForm, hora_fin: e.target.value })}
                      style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>
              )}

              {/* Sugerencias de Motivo */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                  Motivo Confidencial del Médico *
                </label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                  {[
                    "Vacaciones",
                    "Cirugía / Procedimiento",
                    "Congreso / Capacitación",
                    "Almuerzo / Descanso",
                    "Diligencia Personal",
                    "Incapacidad Médica"
                  ].map(motivo => (
                    <button
                      type="button"
                      key={motivo}
                      onClick={() => setBloqueoForm({ ...bloqueoForm, motivo })}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        background: bloqueoForm.motivo === motivo ? "#e0f2fe" : "#ffffff",
                        color: bloqueoForm.motivo === motivo ? "#0369a1" : "#475569",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      {motivo}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  placeholder="Ej: Vacaciones familiares de dos semanas, Cirugía, etc."
                  value={bloqueoForm.motivo}
                  onChange={(e) => setBloqueoForm({ ...bloqueoForm, motivo: e.target.value })}
                  style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>
                  Notas Privadas Adicionales
                </label>
                <textarea
                  rows={2}
                  placeholder="Notas internas personales..."
                  value={bloqueoForm.notas}
                  onChange={(e) => setBloqueoForm({ ...bloqueoForm, notas: e.target.value })}
                  style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowBloqueoModal(false)}
                  style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={bloqueoLoading}
                  style={{ padding: "9px 20px", borderRadius: "10px", background: "#0284c7", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: 700 }}
                >
                  {bloqueoLoading ? "Guardando..." : "Confirmar Bloqueo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AJUSTES DE AGENDA (DURACIÓN, DÍAS LABORALES) */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          padding: "20px"
        }}>
          <div style={{
            background: "#ffffff",
            borderRadius: "20px",
            padding: "32px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={18} color="#0A4D5C" />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                  Configuración de la Agenda Médica
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGuardarConfig}>
              {/* Duración de cita */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                  Duración de cada Cita Médica
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[15, 20, 30, 45, 60].map((mins) => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setConfigForm({ ...configForm, duracion_cita_minutos: mins })}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "10px",
                        border: `2px solid ${configForm.duracion_cita_minutos === mins ? "#0A4D5C" : "#cbd5e1"}`,
                        background: configForm.duracion_cita_minutos === mins ? "#0A4D5C" : "#ffffff",
                        color: configForm.duracion_cita_minutos === mins ? "#ffffff" : "#334155",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Buffer entre citas */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                  Tiempo de Colchón / Descanso entre Citas
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[0, 5, 10, 15].map((buf) => (
                    <button
                      type="button"
                      key={buf}
                      onClick={() => setConfigForm({ ...configForm, buffer_minutos: buf })}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "10px",
                        border: `2px solid ${configForm.buffer_minutos === buf ? "#0A4D5C" : "#cbd5e1"}`,
                        background: configForm.buffer_minutos === buf ? "#0A4D5C" : "#ffffff",
                        color: configForm.buffer_minutos === buf ? "#ffffff" : "#334155",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      {buf === 0 ? "Sin descanso" : `${buf} min`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Días y Horarios */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "12px" }}>
                  Jornada de Atención por Día de la Semana
                </label>
                {[
                  { num: 1, label: "Lunes" },
                  { num: 2, label: "Martes" },
                  { num: 3, label: "Miércoles" },
                  { num: 4, label: "Jueves" },
                  { num: 5, label: "Viernes" },
                  { num: 6, label: "Sábado" },
                  { num: 0, label: "Domingo" },
                ].map((dia) => {
                  const conf = configForm.dias_laborales[dia.num] || { activo: false, inicio: "08:00", fin: "17:00" };
                  return (
                    <div
                      key={dia.num}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        background: conf.activo ? "#f8fafc" : "#f1f5f9",
                        marginBottom: "6px",
                        opacity: conf.activo ? 1 : 0.6
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={conf.activo}
                        onChange={(e) => {
                          setConfigForm({
                            ...configForm,
                            dias_laborales: {
                              ...configForm.dias_laborales,
                              [dia.num]: { ...conf, activo: e.target.checked }
                            }
                          });
                        }}
                      />
                      <span style={{ width: "90px", fontSize: "13px", fontWeight: 700 }}>{dia.label}</span>

                      {conf.activo ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <input
                            type="time"
                            value={conf.inicio || "08:00"}
                            onChange={(e) => {
                              setConfigForm({
                                ...configForm,
                                dias_laborales: {
                                  ...configForm.dias_laborales,
                                  [dia.num]: { ...conf, inicio: e.target.value }
                                }
                              });
                            }}
                            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                          />
                          <span style={{ fontSize: "12px" }}>a</span>
                          <input
                            type="time"
                            value={conf.fin || "17:00"}
                            onChange={(e) => {
                              setConfigForm({
                                ...configForm,
                                dias_laborales: {
                                  ...configForm.dias_laborales,
                                  [dia.num]: { ...conf, fin: e.target.value }
                                }
                              });
                            }}
                            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                          />
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Mensaje / Plantilla completa para el Calendario del Paciente */}
              <div style={{ marginBottom: "24px", background: "#f8fafc", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar size={16} color="#0A4D5C" />
                    <label style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                      Mensaje Completo para Google Calendar / Apple (.ics)
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfigForm({ ...configForm, mensaje_instrucciones_calendario: DEFAULT_CALENDAR_BODY_TEMPLATE })}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#0A4D5C",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "underline"
                    }}
                  >
                    Restablecer formato estándar
                  </button>
                </div>

                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px 0", lineHeight: 1.4 }}>
                  Puedes editar la redacción completa que se agregará a la descripción del calendario del paciente. Las variables entre llaves se autocompletarán con los datos reales:
                </p>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {["{DOCTOR_NOMBRE}", "{ESPECIALIDAD}", "{CLINICA_NOMBRE}", "{PACIENTE_NOMBRE}", "{DOCUMENTO}", "{SERVICIO}", "{TELEFONO}", "{INDICACIONES}"].map(v => (
                    <span
                      key={v}
                      style={{
                        fontSize: "11px",
                        fontFamily: "monospace",
                        background: "#e2e8f0",
                        color: "#334155",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 600
                      }}
                    >
                      {v}
                    </span>
                  ))}
                </div>

                <textarea
                  rows={9}
                  value={configForm.mensaje_instrucciones_calendario ?? DEFAULT_CALENDAR_BODY_TEMPLATE}
                  onChange={(e) => setConfigForm({ ...configForm, mensaje_instrucciones_calendario: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    background: "#ffffff"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f8fafc", cursor: "pointer", fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={configLoading}
                  style={{ padding: "9px 20px", borderRadius: "10px", background: "#0A4D5C", color: "#ffffff", border: "none", cursor: "pointer", fontWeight: 700 }}
                >
                  {configLoading ? "Guardando..." : "Guardar Configuración"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
