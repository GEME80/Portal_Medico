/**
 * ============================================================
 * HUBMED - MOTOR DE DISPONIBILIDAD DE CITAS MÉDICAS (SLOT ENGINE)
 * ============================================================
 * Arquitectura: Pure Functions, Zero Side-Effects, Privacy-Preserving
 * Soporta Bloqueos por Horas, Días Completos, Semanas o Meses
 * Cumple con estándares Doctolib / Cal.com / Zocdoc
 */

export interface AgendaConfig {
  duracion_cita_minutos: number; // 15, 20, 30, 45, 60
  buffer_minutos: number; // 0, 5, 10, 15
  dias_laborales: {
    [day: number]: { // 0=Domingo, 1=Lunes, ..., 6=Sábado
      activo: boolean;
      inicio: string; // "08:00"
      fin: string; // "17:00"
      receso_inicio?: string; // "12:00"
      receso_fin?: string; // "14:00"
    };
  };
  auto_confirmar?: boolean;
  mensaje_instrucciones_calendario?: string; // Plantilla completa o personalizada para Google Calendar y Apple iCal
}

export const DEFAULT_CALENDAR_BODY_TEMPLATE = `RECORDATORIO DE CITA MÉDICA

Especialista: {DOCTOR_NOMBRE} ({ESPECIALIDAD})
Centro Médico: {CLINICA_NOMBRE}
Paciente: {PACIENTE_NOMBRE} ({DOCUMENTO})
Servicio: {SERVICIO}
Teléfono Consultorio: {TELEFONO}

Indicaciones del Especialista:
{INDICACIONES}`;

export const DEFAULT_AGENDA_CONFIG: AgendaConfig = {
  duracion_cita_minutos: 30,
  buffer_minutos: 0,
  dias_laborales: {
    1: { activo: true, inicio: "08:00", fin: "17:00", receso_inicio: "12:00", receso_fin: "13:00" }, // Lun
    2: { activo: true, inicio: "08:00", fin: "17:00", receso_inicio: "12:00", receso_fin: "13:00" }, // Mar
    3: { activo: true, inicio: "08:00", fin: "17:00", receso_inicio: "12:00", receso_fin: "13:00" }, // Mie
    4: { activo: true, inicio: "08:00", fin: "17:00", receso_inicio: "12:00", receso_fin: "13:00" }, // Jue
    5: { activo: true, inicio: "08:00", fin: "17:00", receso_inicio: "12:00", receso_fin: "13:00" }, // Vie
    6: { activo: true, inicio: "08:00", fin: "12:00" }, // Sab
    0: { activo: false, inicio: "08:00", fin: "12:00" }, // Dom cerrado
  },
  auto_confirmar: true,
  mensaje_instrucciones_calendario: DEFAULT_CALENDAR_BODY_TEMPLATE,
};

export interface CitaOEvento {
  id: string;
  tipo: "cita" | "bloqueo";
  estado: string; // "solicitada" | "programada" | "confirmada" | "cancelada" | "completada" | "bloqueada"
  fecha_hora: string; // ISO String
  fecha_fin?: string | null;
  duracion_minutos?: number;
  motivo?: string | null;
  notas?: string | null;
  nombre_solicitante?: string | null;
  documento_solicitante?: string | null;
  telefono_solicitante?: string | null;
}

export interface SlotDisponibilidad {
  hora: string; // "08:00"
  hora_fin: string; // "08:30"
  fecha_completa_iso: string;
  disponible: boolean;
  jornada: "manana" | "tarde";
  razon?: "disponible" | "ocupado" | "bloqueado" | "pasado" | "receso" | "fuera_horario";
  // CAMPOS CONFIDENCIALES (Solo presentes cuando isPublic = false)
  cita_id?: string;
  paciente_nombre?: string;
  bloqueo_motivo?: string;
  bloqueo_notas?: string;
}

export interface CalculoSlotsResult {
  fecha: string; // "YYYY-MM-DD"
  dia_semana: number;
  dia_laboral_activo: boolean;
  duracion_minutos: number;
  slots: SlotDisponibilidad[];
  total_disponibles: number;
  total_ocupados: number;
  total_bloqueados: number;
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function formatDateColombia(date: Date): { fecha: string; hora: string; minutes: number } {
  const formatterFecha = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const formatterHora = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const fecha = formatterFecha.format(date);
  const hora = formatterHora.format(date);
  const minutes = timeToMinutes(hora);
  return { fecha, hora, minutes };
}

export function getNowColombia(): { fecha: string; hora: string; minutesNow: number; jsDate: Date } {
  const now = new Date();
  const { fecha, hora, minutes } = formatDateColombia(now);
  return { fecha, hora, minutesNow: minutes, jsDate: now };
}

export function calcularSlotsParaFecha(
  fechaStr: string,
  citasYBloqueos: CitaOEvento[],
  config: AgendaConfig = DEFAULT_AGENDA_CONFIG,
  isPublic: boolean = true
): CalculoSlotsResult {
  const nowCol = getNowColombia();
  const duracion = Math.max(15, config.duracion_cita_minutos || 30);
  const buffer = Math.max(0, config.buffer_minutos || 0);
  const slotInterval = duracion + buffer;

  const [year, month, day] = fechaStr.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const diaSemana = dateObj.getUTCDay();

  const jornadaConfig = config.dias_laborales?.[diaSemana];

  if (!jornadaConfig || !jornadaConfig.activo) {
    return {
      fecha: fechaStr,
      dia_semana: diaSemana,
      dia_laboral_activo: false,
      duracion_minutos: duracion,
      slots: [],
      total_disponibles: 0,
      total_ocupados: 0,
      total_bloqueados: 0,
    };
  }

  const inicioMin = timeToMinutes(jornadaConfig.inicio || "08:00");
  const finMin = timeToMinutes(jornadaConfig.fin || "17:00");
  const recesoInicioMin = jornadaConfig.receso_inicio ? timeToMinutes(jornadaConfig.receso_inicio) : null;
  const recesoFinMin = jornadaConfig.receso_fin ? timeToMinutes(jornadaConfig.receso_fin) : null;

  const esPasadoCompleto = fechaStr < nowCol.fecha;
  const esHoy = fechaStr === nowCol.fecha;

  // Filtrar eventos que intersectan este día (soporta bloqueos de múltiples días o semanas)
  const eventosDelDia = (citasYBloqueos || []).filter((e) => {
    if (e.estado === "cancelada") return false;
    try {
      const eStartDate = new Date(e.fecha_hora);
      const { fecha: eStartFecha } = formatDateColombia(eStartDate);

      let eEndFecha = eStartFecha;
      if (e.fecha_fin) {
        const eEndDate = new Date(e.fecha_fin);
        eEndFecha = formatDateColombia(eEndDate).fecha;
      }

      // Intersecta si fechaStr está entre [eStartFecha, eEndFecha]
      return fechaStr >= eStartFecha && fechaStr <= eEndFecha;
    } catch {
      return false;
    }
  });

  const slots: SlotDisponibilidad[] = [];
  let totalDisponibles = 0;
  let totalOcupados = 0;
  let totalBloqueados = 0;

  for (let m = inicioMin; m + duracion <= finMin; m += slotInterval) {
    const slotStartMin = m;
    const slotEndMin = m + duracion;
    const horaStr = minutesToTime(slotStartMin);
    const horaFinStr = minutesToTime(slotEndMin);
    const jornada = slotStartMin < 720 ? "manana" : "tarde";

    const isoString = `${fechaStr}T${horaStr}:00-05:00`;

    // 1. Receso laboral
    if (recesoInicioMin !== null && recesoFinMin !== null) {
      if (slotStartMin >= recesoInicioMin && slotStartMin < recesoFinMin) {
        slots.push({
          hora: horaStr,
          hora_fin: horaFinStr,
          fecha_completa_iso: isoString,
          disponible: false,
          jornada,
          razon: "receso",
        });
        continue;
      }
    }

    // 2. Tiempo pasado
    if (esPasadoCompleto || (esHoy && slotStartMin <= nowCol.minutesNow + 5)) {
      slots.push({
        hora: horaStr,
        hora_fin: horaFinStr,
        fecha_completa_iso: isoString,
        disponible: false,
        jornada,
        razon: "pasado",
      });
      continue;
    }

    // 3. Colisiones con citas o bloqueos multi-día / multi-semana
    let solapadoConCita: CitaOEvento | null = null;
    let solapadoConBloqueo: CitaOEvento | null = null;

    for (const ev of eventosDelDia) {
      const evStartDate = new Date(ev.fecha_hora);
      const { fecha: evStartFecha, minutes: evStartMin } = formatDateColombia(evStartDate);

      let evEndFecha = evStartFecha;
      let evEndMin = evStartMin + (ev.duracion_minutos || duracion);

      if (ev.fecha_fin) {
        try {
          const evEndDate = new Date(ev.fecha_fin);
          const endInfo = formatDateColombia(evEndDate);
          evEndFecha = endInfo.fecha;
          evEndMin = endInfo.minutes;
        } catch {}
      }

      let haySolapamiento = false;

      // Caso A: El día actual está en medio de un rango multi-día
      if (fechaStr > evStartFecha && fechaStr < evEndFecha) {
        haySolapamiento = true; // Día completo cubierto
      }
      // Caso B: El día actual es el día de inicio y el evento termina en un día posterior
      else if (fechaStr === evStartFecha && fechaStr < evEndFecha) {
        haySolapamiento = slotEndMin > evStartMin; // Desde evStartMin en adelante
      }
      // Caso C: El día actual es el día final de un evento que empezó antes
      else if (fechaStr > evStartFecha && fechaStr === evEndFecha) {
        haySolapamiento = slotStartMin < evEndMin; // Hasta evEndMin
      }
      // Caso D: Evento ocurre completamente dentro del mismo día
      else {
        haySolapamiento = Math.max(slotStartMin, evStartMin) < Math.min(slotEndMin, evEndMin);
      }

      if (haySolapamiento) {
        if (ev.tipo === "bloqueo" || ev.estado === "bloqueada") {
          solapadoConBloqueo = ev;
        } else {
          solapadoConCita = ev;
        }
        break;
      }
    }

    if (solapadoConBloqueo) {
      totalBloqueados++;
      const slotItem: SlotDisponibilidad = {
        hora: horaStr,
        hora_fin: horaFinStr,
        fecha_completa_iso: isoString,
        disponible: false,
        jornada,
        razon: "bloqueado",
      };

      if (!isPublic) {
        slotItem.cita_id = solapadoConBloqueo.id;
        slotItem.bloqueo_motivo = solapadoConBloqueo.motivo || "Bloqueo de agenda";
        slotItem.bloqueo_notas = solapadoConBloqueo.notas || undefined;
      }

      slots.push(slotItem);
    } else if (solapadoConCita) {
      totalOcupados++;
      const slotItem: SlotDisponibilidad = {
        hora: horaStr,
        hora_fin: horaFinStr,
        fecha_completa_iso: isoString,
        disponible: false,
        jornada,
        razon: "ocupado",
      };

      if (!isPublic) {
        slotItem.cita_id = solapadoConCita.id;
        slotItem.paciente_nombre = solapadoConCita.nombre_solicitante || "Paciente agendado";
      }

      slots.push(slotItem);
    } else {
      totalDisponibles++;
      slots.push({
        hora: horaStr,
        hora_fin: horaFinStr,
        fecha_completa_iso: isoString,
        disponible: true,
        jornada,
        razon: "disponible",
      });
    }
  }

  return {
    fecha: fechaStr,
    dia_semana: diaSemana,
    dia_laboral_activo: true,
    duracion_minutos: duracion,
    slots,
    total_disponibles: totalDisponibles,
    total_ocupados: totalOcupados,
    total_bloqueados: totalBloqueados,
  };
}
