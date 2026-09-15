'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  calcularSlotsParaFecha,
  AgendaConfig,
  DEFAULT_AGENDA_CONFIG,
  CitaOEvento,
  CalculoSlotsResult,
  getNowColombia,
  timeToMinutes
} from '@/lib/citas/slot-engine';

export interface ActionResponse {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}

const SolicitudPublicaSchema = z.object({
  nombre: z.string().min(2, "El nombre es requerido"),
  documento: z.string().min(4, "El documento es requerido"),
  tipo_documento: z.string().default("CC"),
  telefono: z.string().min(7, "El teléfono de contacto es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  fecha_hora: z.string().min(10, "Fecha y hora requerida"),
  motivo: z.string().min(3, "Indica el motivo de la consulta"),
});

const BloqueoSchema = z.object({
  fecha_hora: z.string().min(10, "Fecha y hora de inicio requerida"),
  fecha_fin: z.string().min(10, "Fecha y hora de fin requerida").optional(),
  duracion_minutos: z.number().int().min(15).default(60),
  motivo: z.string().min(2, "Indica la razón del bloqueo (ej: Cirugía, Congreso, Almuerzo)"),
  notas: z.string().optional(),
});

/**
 * Helper para extraer la configuración de agenda de un tenant
 */
async function getTenantAgendaConfig(adminSupabase: any, tenantId: string): Promise<AgendaConfig> {
  try {
    const { data: configRow } = await adminSupabase
      .from('configuracion_portal')
      .select('hero_badge_texto')
      .eq('tenant_id', tenantId)
      .single();

    if (configRow?.hero_badge_texto) {
      try {
        const parsed = typeof configRow.hero_badge_texto === 'string'
          ? JSON.parse(configRow.hero_badge_texto)
          : configRow.hero_badge_texto;

        if (parsed?.agenda_config) {
          return {
            ...DEFAULT_AGENDA_CONFIG,
            ...parsed.agenda_config,
            dias_laborales: {
              ...DEFAULT_AGENDA_CONFIG.dias_laborales,
              ...(parsed.agenda_config.dias_laborales || {})
            }
          };
        }
      } catch (e) {
        // fallback to default
      }
    }
  } catch (err) {
    console.warn("Could not load custom agenda config, using default", err);
  }
  return DEFAULT_AGENDA_CONFIG;
}

/**
 * Consulta pública de slots disponibles para una fecha específica (PACIENTE)
 * PRIVACIDAD ESTRICTA: Los motivos y notas de bloqueos médicos NUNCA se devuelven al paciente.
 */
export async function obtenerSlotsDisponiblesPublicosAction(
  slug: string,
  fecha: string // YYYY-MM-DD
): Promise<ActionResponse> {
  try {
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return { success: false, error: 'Fecha inválida. Use formato YYYY-MM-DD', code: 'INVALID_DATE' };
    }

    const adminSupabase = createAdminClient();
    const { data: tenant, error: tErr } = await adminSupabase
      .from('tenants')
      .select('id, activo')
      .eq('slug', slug)
      .single();

    if (tErr || !tenant || !tenant.activo) {
      return { success: false, error: 'Consultorio no encontrado o inactivo', code: 'TENANT_NOT_FOUND' };
    }

    const agendaConfig = await getTenantAgendaConfig(adminSupabase, tenant.id);

    // Consultar citas y bloqueos del tenant en un rango que cubra el día (hora colombiana UTC-5)
    const fechaInicioFiltro = `${fecha}T00:00:00-05:00`;
    const fechaFinFiltro = `${fecha}T23:59:59-05:00`;

    const { data: eventos, error: evErr } = await adminSupabase
      .from('citas_medicas')
      .select('id, tipo, estado, fecha_hora, fecha_fin, duracion_minutos')
      .eq('tenant_id', tenant.id)
      .neq('estado', 'cancelada')
      .lte('fecha_hora', new Date(fechaFinFiltro).toISOString())
      .or(`fecha_fin.gte.${new Date(fechaInicioFiltro).toISOString()},fecha_fin.is.null`);

    if (evErr) {
      return { success: false, error: evErr.message, code: 'DB_ERROR' };
    }

    // Calcular slots con isPublic = true (SANITIZACIÓN DE MOTIVOS DE BLOQUEO)
    const resultado: CalculoSlotsResult = calcularSlotsParaFecha(
      fecha,
      (eventos || []) as CitaOEvento[],
      agendaConfig,
      true // isPublic: true
    );

    return {
      success: true,
      data: resultado
    };
  } catch (err: any) {
    console.error("Error en obtenerSlotsDisponiblesPublicosAction:", err);
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Permite a un paciente auto-agendar su cita médica de forma directa (CONFIRMACIÓN INMEDIATA)
 * Valida: No fechas pasadas, no horas pasadas, no colisiones con citas o bloqueos.
 */
export async function solicitarCitaPublicaAction(formData: any, slug: string): Promise<ActionResponse> {
  try {
    const validated = SolicitudPublicaSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
        code: 'VALIDATION_ERROR'
      };
    }
    const data = validated.data;

    // Validación contra tiempo pasado
    const nowCol = getNowColombia();
    const citaDate = new Date(data.fecha_hora);
    const citaFechaStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(citaDate);
    const citaHoraStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Bogota",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(citaDate);

    if (citaFechaStr < nowCol.fecha) {
      return { success: false, error: 'No es posible agendar citas en fechas pasadas.', code: 'PAST_DATE' };
    }

    if (citaFechaStr === nowCol.fecha && timeToMinutes(citaHoraStr) <= nowCol.minutesNow) {
      return { success: false, error: 'El horario seleccionado ya ha pasado para el día de hoy.', code: 'PAST_TIME' };
    }

    const adminSupabase = createAdminClient();
    const { data: tenant, error: tErr } = await adminSupabase
      .from('tenants')
      .select('id, activo')
      .eq('slug', slug)
      .single();

    if (tErr || !tenant || !tenant.activo) {
      return { success: false, error: 'Consultorio no encontrado o inactivo', code: 'TENANT_NOT_FOUND' };
    }

    const agendaConfig = await getTenantAgendaConfig(adminSupabase, tenant.id);
    const duracionCita = agendaConfig.duracion_cita_minutos || 30;

    // Verificar si el slot está libre actualmente
    const { data: colisiones, error: colErr } = await adminSupabase
      .from('citas_medicas')
      .select('id, tipo, estado, fecha_hora, duracion_minutos')
      .eq('tenant_id', tenant.id)
      .neq('estado', 'cancelada')
      .gte('fecha_hora', new Date(citaDate.getTime() - (duracionCita * 60000)).toISOString())
      .lte('fecha_hora', new Date(citaDate.getTime() + (duracionCita * 60000)).toISOString());

    if (colErr) {
      return { success: false, error: colErr.message, code: 'DB_ERROR' };
    }

    // Comprobar colisión exacta
    const citaStart = citaDate.getTime();
    const citaEnd = citaStart + duracionCita * 60000;
    const hayConflicto = (colisiones || []).some((c) => {
      const cStart = new Date(c.fecha_hora).getTime();
      const cDur = (c.duracion_minutos || duracionCita) * 60000;
      const cEnd = cStart + cDur;
      return Math.max(citaStart, cStart) < Math.min(citaEnd, cEnd);
    });

    if (hayConflicto) {
      return {
        success: false,
        error: 'El horario seleccionado acaba de ser ocupado o bloqueado. Por favor, selecciona otro horario.',
        code: 'SLOT_OCCUPIED'
      };
    }

    // Auto-confirmar cita directamente (Zocdoc Standard)
    const { data: nuevaCita, error: insErr } = await adminSupabase
      .from('citas_medicas')
      .insert([{
        tenant_id: tenant.id,
        tipo: 'cita',
        estado: 'confirmada', // Auto-confirmada directamente
        fecha_hora: data.fecha_hora,
        duracion_minutos: duracionCita,
        motivo: data.motivo,
        nombre_solicitante: data.nombre,
        documento_solicitante: `${data.tipo_documento} ${data.documento}`,
        telefono_solicitante: data.telefono,
        email_solicitante: data.email || null,
      }])
      .select()
      .single();

    if (insErr) {
      console.error("Error al registrar cita:", insErr);
      return { success: false, error: `No se pudo registrar la cita: ${insErr.message}`, code: 'DB_ERROR' };
    }

    revalidatePath(`/${slug}/admin/citas`);
    revalidatePath(`/${slug}/citas`);
    return { success: true, data: nuevaCita };
  } catch (err: any) {
    console.error("Error inesperado en solicitarCitaPublicaAction:", err);
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Permite al doctor o recepcionista crear un bloqueo en la agenda con motivo privado
 */
export async function crearBloqueoAgendaAction(formData: any, slug: string): Promise<ActionResponse> {
  try {
    const validated = BloqueoSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
        code: 'VALIDATION_ERROR'
      };
    }
    const data = validated.data;

    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    const adminSupabase = createAdminClient();
    const { data: tenant } = await adminSupabase.from('tenants').select('id').eq('slug', slug).single();
    if (!tenant) return { success: false, error: 'Tenant no encontrado', code: 'TENANT_NOT_FOUND' };

    const { data: bloqueo, error: insErr } = await adminSupabase
      .from('citas_medicas')
      .insert([{
        tenant_id: tenant.id,
        medico_id: user.id,
        tipo: 'bloqueo',
        estado: 'bloqueada',
        fecha_hora: data.fecha_hora,
        fecha_fin: data.fecha_fin || null,
        duracion_minutos: data.duracion_minutos,
        motivo: data.motivo, // Motivo privado del doctor (ej. Cirugía, Congreso, Almuerzo)
        notas: data.notas || 'Bloqueo de agenda médica privada',
      }])
      .select()
      .single();

    if (insErr) throw new Error(insErr.message);

    revalidatePath(`/${slug}/admin/citas`);
    revalidatePath(`/${slug}/citas`);
    return { success: true, data: bloqueo };
  } catch (err: any) {
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Permite cambiar el estado de una cita (confirmar, cancelar, completar)
 */
export async function actualizarEstadoCita(
  citaId: string,
  estado: 'solicitada' | 'programada' | 'confirmada' | 'cancelada' | 'completada' | 'bloqueada',
  slug: string
): Promise<ActionResponse> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('citas_medicas')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', citaId);

    if (error) throw new Error(error.message);

    revalidatePath(`/${slug}/admin/citas`);
    revalidatePath(`/${slug}/citas`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Permite eliminar un bloqueo o cita definitivamente
 */
export async function eliminarCitaOBloqueoAction(id: string, slug: string): Promise<ActionResponse> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('citas_medicas')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    revalidatePath(`/${slug}/admin/citas`);
    revalidatePath(`/${slug}/citas`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Permite al doctor guardar la configuración de su agenda (duración, días laborales, horarios)
 */
export async function guardarConfiguracionAgendaAction(
  agendaConfig: AgendaConfig,
  slug: string
): Promise<ActionResponse> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    const adminSupabase = createAdminClient();
    const { data: tenant } = await adminSupabase.from('tenants').select('id').eq('slug', slug).single();
    if (!tenant) return { success: false, error: 'Tenant no encontrado', code: 'TENANT_NOT_FOUND' };

    const { data: currentConfig } = await adminSupabase
      .from('configuracion_portal')
      .select('hero_badge_texto')
      .eq('tenant_id', tenant.id)
      .single();

    let configJson: any = {};
    if (currentConfig?.hero_badge_texto) {
      try {
        configJson = typeof currentConfig.hero_badge_texto === 'string'
          ? JSON.parse(currentConfig.hero_badge_texto)
          : currentConfig.hero_badge_texto;
      } catch (e) {
        configJson = {};
      }
    }

    configJson.agenda_config = agendaConfig;

    const { error: updErr } = await adminSupabase
      .from('configuracion_portal')
      .update({
        hero_badge_texto: JSON.stringify(configJson),
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenant.id);

    if (updErr) throw new Error(updErr.message);

    revalidatePath(`/${slug}/admin/citas`);
    revalidatePath(`/${slug}/citas`);
    return { success: true, data: agendaConfig };
  } catch (err: any) {
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

const EditarCitaSchema = z.object({
  id: z.string().min(5, "ID de cita requerido"),
  fecha_hora: z.string().min(10, "Fecha y hora requerida"),
  duracion_minutos: z.number().int().min(5).default(30),
  motivo: z.string().min(1, "El motivo es requerido"),
  notas: z.string().optional().nullable(),
  nombre_solicitante: z.string().optional().nullable(),
  documento_solicitante: z.string().optional().nullable(),
  telefono_solicitante: z.string().optional().nullable(),
  email_solicitante: z.string().optional().nullable(),
  estado: z.enum(['solicitada', 'programada', 'confirmada', 'cancelada', 'completada', 'bloqueada']).default('confirmada')
});

/**
 * Permite al médico editar cualquier detalle de una cita (reprogramar fecha/hora, cambiar datos del paciente, actualizar motivo o notas)
 */
export async function editarCitaAction(
  formData: any,
  slug: string
): Promise<ActionResponse> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    const validated = EditarCitaSchema.safeParse(formData);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues.map(i => i.message).join(', '),
        code: 'VALIDATION_ERROR'
      };
    }
    const data = validated.data;

    const adminSupabase = createAdminClient();
    const { data: updatedCita, error: updErr } = await adminSupabase
      .from('citas_medicas')
      .update({
        fecha_hora: data.fecha_hora,
        duracion_minutos: data.duracion_minutos,
        motivo: data.motivo,
        notas: data.notas || null,
        nombre_solicitante: data.nombre_solicitante || null,
        documento_solicitante: data.documento_solicitante || null,
        telefono_solicitante: data.telefono_solicitante || null,
        email_solicitante: data.email_solicitante || null,
        estado: data.estado,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single();

    if (updErr) throw new Error(updErr.message);

    revalidatePath(`/${slug}/admin/citas`);
    revalidatePath(`/${slug}/citas`);
    return { success: true, data: updatedCita };
  } catch (err: any) {
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}
