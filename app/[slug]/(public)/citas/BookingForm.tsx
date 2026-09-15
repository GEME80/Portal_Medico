"use client";

import { useState, useEffect } from "react";
import {
  solicitarCitaPublicaAction,
  obtenerSlotsDisponiblesPublicosAction
} from "@/lib/actions/citas-actions";
import { SlotDisponibilidad, CalculoSlotsResult, DEFAULT_CALENDAR_BODY_TEMPLATE } from "@/lib/citas/slot-engine";
import {
  Stethoscope,
  Syringe,
  Activity,
  Dna,
  Sun,
  Sunset,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  User,
  Phone,
  ArrowRight,
  ExternalLink
} from "lucide-react";

interface Props {
  tenantSlug: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  phone: string;
  primaryColor: string;
  accentColor: string;
  calendarInstructions?: string;
}

export default function BookingForm({
  tenantSlug,
  doctorName,
  specialty,
  clinicName,
  phone,
  primaryColor,
  accentColor,
  calendarInstructions = "Por favor presentarse 10 minutos antes con su documento de identidad y exámenes previos.",
}: Props) {
  const getInitialDate = () => {
    const d = new Date();
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return fmt.format(d);
  };

  const [selectedDate, setSelectedDate] = useState<string>(getInitialDate());
  const [selectedSlot, setSelectedSlot] = useState<SlotDisponibilidad | null>(null);
  const [slotsResult, setSlotsResult] = useState<CalculoSlotsResult | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    nombre: "",
    documento: "",
    tipo_documento: "RC",
    acudiente: "",
    telefono: "",
    email: "",
    servicio: "Consulta Pediátrica Especializada",
    motivo: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedCita, setSubmittedCita] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar slots disponibles cuando cambia la fecha seleccionada
  useEffect(() => {
    let isMounted = true;
    setLoadingSlots(true);
    setSelectedSlot(null);
    setError(null);

    obtenerSlotsDisponiblesPublicosAction(tenantSlug, selectedDate).then((res) => {
      if (!isMounted) return;
      setLoadingSlots(false);
      if (res.success && res.data) {
        setSlotsResult(res.data);
      } else {
        setError(res.error || "No fue posible consultar los horarios disponibles.");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [tenantSlug, selectedDate]);

  // Generar días para el selector rápido de fechas (próximos 14 días)
  const getNextDays = () => {
    const days: { dateStr: string; label: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const base = new Date();
    const todayStr = getInitialDate();

    for (let i = 0; i < 14; i++) {
      const d = new Date(base.getTime() + i * 86400000);
      const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      const dateStr = fmt.format(d);

      const dayNameFmt = new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        weekday: "short"
      });
      const dayNumFmt = new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        day: "numeric"
      });

      days.push({
        dateStr,
        label: i === 0 ? "Hoy" : i === 1 ? "Mañana" : dayNameFmt.format(d),
        dayName: dayNameFmt.format(d).toUpperCase(),
        dayNum: parseInt(dayNumFmt.format(d), 10),
        isToday: dateStr === todayStr
      });
    }
    return days;
  };

  const nextDays = getNextDays();

  const slotsManana = slotsResult?.slots.filter(s => s.jornada === "manana") || [];
  const slotsTarde = slotsResult?.slots.filter(s => s.jornada === "tarde") || [];

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Por favor, selecciona un horario disponible para tu cita.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await solicitarCitaPublicaAction({
      nombre: formData.nombre,
      documento: formData.documento,
      tipo_documento: formData.tipo_documento,
      telefono: formData.telefono,
      email: formData.email,
      fecha_hora: selectedSlot.fecha_completa_iso,
      motivo: `[${formData.servicio}] ${formData.motivo}${formData.acudiente ? ` (Acudiente: ${formData.acudiente})` : ""}`,
    }, tenantSlug);

    setSubmitting(false);

    if (res.success && res.data) {
      setSubmittedCita(res.data);
    } else {
      setError(res.error || "Ocurrió un error al agendar tu cita. Por favor, intenta de nuevo o selecciona otro horario.");
      obtenerSlotsDisponiblesPublicosAction(tenantSlug, selectedDate).then(r => {
        if (r.success && r.data) setSlotsResult(r.data);
      });
    }
  };

  const buildCalendarBody = () => {
    const rawTemplate = calendarInstructions || DEFAULT_CALENDAR_BODY_TEMPLATE;
    const defaultIndicaciones = "Por favor presentarse 10 minutos antes con su documento de identidad y exámenes previos.";
    
    // Si el usuario configuró solo una frase de indicaciones, o la plantilla completa:
    let body = rawTemplate;
    if (!rawTemplate.includes("{DOCTOR_NOMBRE}") && !rawTemplate.includes("{PACIENTE_NOMBRE}")) {
      body = `RECORDATORIO DE CITA MÉDICA\n\n` +
        `Especialista: ${doctorName} (${specialty})\n` +
        `Centro Médico: ${clinicName}\n` +
        `Paciente: ${formData.nombre} (${formData.tipo_documento} ${formData.documento})\n` +
        `Servicio: ${formData.servicio}\n` +
        `Teléfono Consultorio: ${phone || "No especificado"}\n\n` +
        `Indicaciones del Especialista:\n${rawTemplate}`;
    } else {
      body = body
        .replace(/{DOCTOR_NOMBRE}/g, doctorName)
        .replace(/{ESPECIALIDAD}/g, specialty)
        .replace(/{CLINICA_NOMBRE}/g, clinicName)
        .replace(/{PACIENTE_NOMBRE}/g, formData.nombre)
        .replace(/{DOCUMENTO}/g, `${formData.tipo_documento} ${formData.documento}`)
        .replace(/{SERVICIO}/g, formData.servicio)
        .replace(/{TELEFONO}/g, phone || "No especificado")
        .replace(/{INDICACIONES}/g, defaultIndicaciones);
    }
    return body;
  };

  const getGoogleCalendarUrl = () => {
    if (!submittedCita) return "#";
    const startIso = new Date(submittedCita.fecha_hora).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const durMs = (submittedCita.duracion_minutos || 30) * 60000;
    const endIso = new Date(new Date(submittedCita.fecha_hora).getTime() + durMs).toISOString().replace(/-|:|\.\d\d\d/g, "");

    const title = encodeURIComponent(`Cita Médica: ${formData.nombre} - ${doctorName}`);
    const details = encodeURIComponent(buildCalendarBody());
    const location = encodeURIComponent(clinicName);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  const downloadIcsFile = () => {
    if (!submittedCita) return;
    const startIso = new Date(submittedCita.fecha_hora).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const durMs = (submittedCita.duracion_minutos || 30) * 60000;
    const endIso = new Date(new Date(submittedCita.fecha_hora).getTime() + durMs).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const icsDescription = buildCalendarBody().replace(/\n/g, "\\n");

    // Archivo ICS con ALARM incorporada para 1 día antes (-P1D) y 2 horas antes (-PT2H)
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//HubMed//Citas Medicas//ES",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:cita-${submittedCita.id || Date.now()}@hubmed.app`,
      `DTSTAMP:${startIso}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:Cita Médica: ${formData.nombre} - ${doctorName}`,
      `DESCRIPTION:${icsDescription}`,
      `LOCATION:${clinicName}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-P1D",
      "ACTION:DISPLAY",
      "DESCRIPTION:Recordatorio de Cita Médica (Mañana)",
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Recordatorio de Cita Médica (En 2 horas)",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `cita-medica-${formData.nombre.toLowerCase().replace(/\s+/g, "-")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (submittedCita) {
    const citaFecha = new Date(submittedCita.fecha_hora);
    const fechaFormateada = citaFecha.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Bogota"
    });
    const horaFormateada = citaFecha.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Bogota"
    });

    return (
      <div style={{
        maxWidth: "640px",
        margin: "40px auto",
        padding: "40px 32px",
        background: "#ffffff",
        borderRadius: "20px",
        boxShadow: "0 20px 45px -10px rgba(10, 77, 92, 0.12)",
        textAlign: "center",
        border: "1px solid #e2e8f0"
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "rgba(10, 77, 92, 0.08)",
          color: primaryColor || "#0A4D5C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px"
        }}>
          <CheckCircle2 size={36} strokeWidth={2.2} />
        </div>

        <span style={{
          display: "inline-block",
          padding: "4px 14px",
          borderRadius: "20px",
          background: "rgba(10, 77, 92, 0.08)",
          color: primaryColor || "#0A4D5C",
          fontSize: "12px",
          fontWeight: 800,
          letterSpacing: "0.5px",
          marginBottom: "10px"
        }}>
          CITA CONFIRMADA
        </span>

        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#0f172a", marginBottom: "10px" }}>
          Tu turno ha sido reservado
        </h1>

        <p style={{ color: "#475569", fontSize: "15px", lineHeight: "1.5", maxWidth: "480px", margin: "0 auto 24px" }}>
          Hola <strong>{formData.nombre}</strong>, tu cita con el <strong>{doctorName}</strong> ha quedado confirmada en la agenda médica.
        </p>

        <div style={{
          background: "#f8fafc",
          borderRadius: "14px",
          padding: "20px",
          textAlign: "left",
          marginBottom: "28px",
          border: "1px solid #e2e8f0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px"
        }}>
          <div>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, display: "block" }}>FECHA</span>
            <strong style={{ fontSize: "14px", color: "#0f172a", textTransform: "capitalize", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              <CalendarIcon size={14} color="#0A4D5C" /> {fechaFormateada}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, display: "block" }}>HORA</span>
            <strong style={{ fontSize: "14px", color: "#0A4D5C", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              <Clock size={14} color="#0A4D5C" /> {horaFormateada} ({submittedCita.duracion_minutos || 30} min)
            </strong>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, display: "block" }}>ESPECIALISTA</span>
            <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              <User size={14} color="#64748b" /> {doctorName}
            </span>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, display: "block" }}>CONSULTORIO</span>
            <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              <Building2 size={14} color="#64748b" /> {clinicName}
            </span>
          </div>
          <div style={{ gridColumn: "1 / -1", borderTop: "1px dashed #cbd5e1", paddingTop: "10px" }}>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, display: "block" }}>PACIENTE & CONTACTO</span>
            <span style={{ fontSize: "13px", color: "#334155", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              <User size={14} color="#64748b" /> {formData.nombre} ({formData.tipo_documento} {formData.documento}) · <Phone size={14} color="#64748b" /> {formData.telefono}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              background: "#0A4D5C",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              borderRadius: "10px",
              textDecoration: "none",
              boxShadow: "0 4px 10px rgba(10, 77, 92, 0.2)"
            }}
          >
            <CalendarIcon size={16} />
            <span>Google Calendar</span>
            <ExternalLink size={13} opacity={0.8} />
          </a>

          <button
            type="button"
            onClick={downloadIcsFile}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 18px",
              background: "#ffffff",
              color: "#0f172a",
              fontWeight: 700,
              fontSize: "13px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
            }}
          >
            <CalendarIcon size={16} color="#0A4D5C" />
            <span>Apple / Outlook (.ics)</span>
          </button>

          <a
            href={`/${tenantSlug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "12px 18px",
              background: "#f1f5f9",
              color: "#334155",
              fontWeight: 700,
              fontSize: "13px",
              borderRadius: "10px",
              textDecoration: "none",
              border: "1px solid #cbd5e1"
            }}
          >
            <span>Volver al Portal</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "16px auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
          Agenda tu Cita Médica
        </h1>
        <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>
          {doctorName} · {specialty}
        </p>
      </div>

      {error && (
        <div style={{
          padding: "14px 18px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "12px",
          color: "#991b1b",
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleBookingSubmit} style={{
        background: "#ffffff",
        padding: "28px 32px",
        borderRadius: "20px",
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)",
        border: "1px solid #e2e8f0"
      }}>
        {/* PASO 1: Servicio en Chips Compactos con Iconos Médicos Profesionales */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: primaryColor || "#0A4D5C",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "12px"
            }}>1</div>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Tipo de Servicio o Consulta
            </h3>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[
              { id: "Consulta Pediátrica Especializada", label: "Consulta Pediátrica", icon: Stethoscope },
              { id: "Vacunación / Aplicación de Biológicos", label: "Vacunación", icon: Syringe },
              { id: "Control de Crecimiento y Somatometría", label: "Control de Crecimiento", icon: Activity },
              { id: "Consulta de Infectología y Fiebre", label: "Infectología Pediátrica", icon: Dna },
            ].map((srv) => {
              const selected = formData.servicio === srv.id;
              const IconComp = srv.icon;
              return (
                <button
                  type="button"
                  key={srv.id}
                  onClick={() => setFormData({ ...formData, servicio: srv.id })}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "8px 14px",
                    borderRadius: "20px",
                    border: `1.5px solid ${selected ? primaryColor || "#0A4D5C" : "#e2e8f0"}`,
                    background: selected ? (primaryColor ? `${primaryColor}12` : "rgba(10, 77, 92, 0.08)") : "#ffffff",
                    color: selected ? primaryColor || "#0A4D5C" : "#334155",
                    fontSize: "13px",
                    fontWeight: selected ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <IconComp size={15} strokeWidth={selected ? 2.3 : 1.8} />
                  <span>{srv.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PASO 2: Selección de Fecha y Franja Horaria */}
        <div style={{ marginBottom: "24px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: primaryColor || "#0A4D5C",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "12px"
            }}>2</div>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Selecciona Fecha y Horario
            </h3>
          </div>

          {/* Carrusel Horizontal de Días */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              paddingBottom: "6px",
              scrollbarWidth: "thin"
            }}>
              {nextDays.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                return (
                  <button
                    type="button"
                    key={d.dateStr}
                    onClick={() => setSelectedDate(d.dateStr)}
                    style={{
                      flex: "0 0 68px",
                      padding: "8px 2px",
                      borderRadius: "10px",
                      border: `1.5px solid ${isSelected ? primaryColor || "#0A4D5C" : "#e2e8f0"}`,
                      background: isSelected ? primaryColor || "#0A4D5C" : "#ffffff",
                      color: isSelected ? "#ffffff" : "#1e293b",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 3px 8px rgba(10, 77, 92, 0.18)" : "none"
                    }}
                  >
                    <span style={{ display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", opacity: isSelected ? 0.9 : 0.6 }}>
                      {d.label}
                    </span>
                    <span style={{ display: "block", fontSize: "16px", fontWeight: 800, margin: "1px 0" }}>
                      {d.dayNum}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector manual de fecha */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>O elige otra fecha:</span>
            <input
              type="date"
              min={getInitialDate()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                fontWeight: 600,
                color: "#1e293b"
              }}
            />
          </div>

          {/* Slots Disponibles en Chips Interactivos */}
          <div style={{
            background: "#f8fafc",
            borderRadius: "14px",
            padding: "16px",
            border: "1px solid #e2e8f0",
            minHeight: "120px"
          }}>
            {loadingSlots ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#64748b", fontSize: "13px" }}>
                Consultando disponibilidad en tiempo real...
              </div>
            ) : !slotsResult || !slotsResult.dia_laboral_activo ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#334155" }}>
                  Consultorio cerrado en esta fecha
                </p>
                <p style={{ margin: 0, fontSize: "12px" }}>
                  Por favor selecciona otro día en el calendario.
                </p>
              </div>
            ) : slotsResult.total_disponibles === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "#334155" }}>
                  No hay horarios disponibles para el {selectedDate}
                </p>
                <p style={{ margin: 0, fontSize: "12px" }}>
                  Todos los turnos de este día se encuentran ocupados o en receso.
                </p>
              </div>
            ) : (
              <div>
                {/* Jornada Mañana */}
                {slotsManana.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <Sun size={14} color="#eab308" />
                      <span>Mañana ({slotsResult.duracion_minutos} min)</span>
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {slotsManana.map((slot) => {
                        const isSelected = selectedSlot?.hora === slot.hora;
                        if (!slot.disponible) {
                          return (
                            <button
                              type="button"
                              key={slot.hora}
                              disabled
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                background: "#f1f5f9",
                                color: "#94a3b8",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "not-allowed",
                                textDecoration: "line-through"
                              }}
                              title="No disponible"
                            >
                              {slot.hora}
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            key={slot.hora}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "8px",
                              border: `1.5px solid ${isSelected ? primaryColor || "#0A4D5C" : "#cbd5e1"}`,
                              background: isSelected ? primaryColor || "#0A4D5C" : "#ffffff",
                              color: isSelected ? "#ffffff" : "#0f172a",
                              fontSize: "13px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: isSelected ? "0 3px 8px rgba(10,77,92,0.2)" : "none"
                            }}
                          >
                            {slot.hora}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Jornada Tarde */}
                {slotsTarde.length > 0 && (
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <Sunset size={14} color="#f97316" />
                      <span>Tarde ({slotsResult.duracion_minutos} min)</span>
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {slotsTarde.map((slot) => {
                        const isSelected = selectedSlot?.hora === slot.hora;
                        if (!slot.disponible) {
                          return (
                            <button
                              type="button"
                              key={slot.hora}
                              disabled
                              style={{
                                padding: "6px 12px",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                background: "#f1f5f9",
                                color: "#94a3b8",
                                fontSize: "12px",
                                fontWeight: 500,
                                cursor: "not-allowed",
                                textDecoration: "line-through"
                              }}
                              title="No disponible"
                            >
                              {slot.hora}
                            </button>
                          );
                        }

                        return (
                          <button
                            type="button"
                            key={slot.hora}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "8px",
                              border: `1.5px solid ${isSelected ? primaryColor || "#0A4D5C" : "#cbd5e1"}`,
                              background: isSelected ? primaryColor || "#0A4D5C" : "#ffffff",
                              color: isSelected ? "#ffffff" : "#0f172a",
                              fontSize: "13px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: isSelected ? "0 3px 8px rgba(10,77,92,0.2)" : "none"
                            }}
                          >
                            {slot.hora}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedSlot && (
                  <div style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    background: "rgba(10, 77, 92, 0.06)",
                    borderRadius: "8px",
                    border: "1px solid rgba(10, 77, 92, 0.2)",
                    color: "#0A4D5C",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    <CheckCircle2 size={15} />
                    <span>Horario seleccionado: <strong>{selectedDate}</strong> a las <strong>{selectedSlot.hora} - {selectedSlot.hora_fin}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PASO 3: Datos del Paciente */}
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: primaryColor || "#0A4D5C",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "12px"
            }}>3</div>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Datos del Paciente y Contacto
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Nombre completo del paciente *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Mateo Silva Vargas"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Tipo de documento *
              </label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  background: "#ffffff"
                }}
              >
                <option value="RC">Registro Civil (RC)</option>
                <option value="TI">Tarjeta de Identidad (TI)</option>
                <option value="CC">Cédula de Ciudadanía (CC)</option>
                <option value="CE">Cédula de Extranjería (CE)</option>
                <option value="PA">Pasaporte (PA)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Número de documento *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 1023456789"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Nombre acudiente / acompañante
              </label>
              <input
                type="text"
                placeholder="Ej: Carolina Vargas"
                value={formData.acudiente}
                onChange={(e) => setFormData({ ...formData, acudiente: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                WhatsApp / Teléfono *
              </label>
              <input
                type="tel"
                required
                placeholder="Ej: 315 354 6360"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "4px" }}>
                Motivo de consulta o síntomas (breve descripción)
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Control de crecimiento rutinario, revisión de esquema de vacunación o síntomas..."
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px"
                }}
              />
            </div>
          </div>

          {/* Botón de Confirmación Directa */}
          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              background: !selectedSlot ? "#94a3b8" : primaryColor || "#0A4D5C",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 800,
              border: "none",
              cursor: !selectedSlot ? "not-allowed" : "pointer",
              boxShadow: !selectedSlot ? "none" : "0 6px 16px rgba(10, 77, 92, 0.25)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            {submitting ? (
              <span>Confirmando cita en tiempo real...</span>
            ) : !selectedSlot ? (
              <span>Selecciona una hora disponible para continuar</span>
            ) : (
              <>
                <CalendarIcon size={16} />
                <span>CONFIRMAR CITA DIRECTAMENTE ({selectedSlot.hora})</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
          <p style={{ textAlign: "center", fontSize: "11px", color: "#64748b", margin: "8px 0 0" }}>
            Confirmación directa garantizada. Recibirás recordatorio en tu número de contacto.
          </p>
        </div>
      </form>
    </div>
  );
}
