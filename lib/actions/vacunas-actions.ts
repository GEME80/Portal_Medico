'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AplicacionVacuna {
  id: string;
  tenant_id: string;
  paciente_id: string;
  vacuna_id?: string | null;
  nombre_vacuna: string;
  enfermedad_prevenida?: string;
  dosis: string;
  edad_aplicacion?: string;
  fecha_aplicacion: string;
  numero_lote?: string;
  laboratorio?: string;
  via_administracion?: string;
  sitio_aplicacion?: string;
  profesional_nombre?: string;
  origen: 'institucional' | 'externo';
  observaciones?: string;
  proxima_cita_sugerida?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NuevaAplicacionInput {
  paciente_id: string;
  vacuna_id?: string | null;
  nombre_vacuna: string;
  enfermedad_prevenida?: string;
  dosis: string;
  edad_aplicacion?: string;
  fecha_aplicacion: string;
  numero_lote?: string;
  laboratorio?: string;
  via_administracion?: string;
  sitio_aplicacion?: string;
  profesional_nombre?: string;
  origen?: 'institucional' | 'externo';
  observaciones?: string;
  proxima_cita_sugerida?: string | null;
  descontar_stock?: boolean;
}


/**
 * Obtener todas las vacunas aplicadas a un paciente
 */
export async function getVacunasPaciente(pacienteId: string): Promise<{ success: boolean; data?: AplicacionVacuna[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('aplicaciones_vacunas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha_aplicacion', { ascending: false });

    if (error) throw error;
    return { success: true, data: data as AplicacionVacuna[] };
  } catch (err: any) {
    console.error('Error fetching vacunas paciente:', err);
    return { success: false, error: err.message || 'Error al obtener las vacunas.' };
  }
}

/**
 * Obtener ítems del inventario del consultorio disponibles para aplicar
 */
export async function getInventarioVacunasTenant(tenantId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventario_medico')
      .select('id, nombre, nombre_generico, laboratorio, enfermedad, via_admin, esquema_dosis, stock_actual, lote_activo')
      .eq('tenant_id', tenantId)
      .order('nombre');

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error('Error fetching inventario vacunas:', err);
    return { success: false, data: [] };
  }
}

/**
 * Registrar la aplicación de una vacuna a un paciente
 */
export async function registrarAplicacionVacuna(
  input: NuevaAplicacionInput,
  tenantSlug?: string
): Promise<{ success: boolean; data?: AplicacionVacuna; error?: string }> {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Validar paciente y obtener tenant_id
    const { data: paciente, error: pacErr } = await supabase
      .from('pacientes')
      .select('id, tenant_id, nombres, apellidos')
      .eq('id', input.paciente_id)
      .single();

    if (pacErr || !paciente) {
      throw new Error('Paciente no encontrado.');
    }

    const tenantId = paciente.tenant_id;

    // 2. Insertar aplicación de vacuna
    const payload = {
      tenant_id: tenantId,
      paciente_id: input.paciente_id,
      vacuna_id: input.vacuna_id || null,
      nombre_vacuna: input.nombre_vacuna.trim(),
      enfermedad_prevenida: input.enfermedad_prevenida?.trim() || '',
      dosis: input.dosis.trim(),
      edad_aplicacion: input.edad_aplicacion?.trim() || '',
      fecha_aplicacion: input.fecha_aplicacion,
      numero_lote: input.numero_lote?.trim() || '',
      laboratorio: input.laboratorio?.trim() || '',
      via_administracion: input.via_administracion || 'Intramuscular',
      sitio_aplicacion: input.sitio_aplicacion?.trim() || '',
      profesional_nombre: input.profesional_nombre?.trim() || '',
      origen: input.origen || (input.vacuna_id ? 'institucional' : 'externo'),
      observaciones: input.observaciones?.trim() || '',
      proxima_cita_sugerida: input.proxima_cita_sugerida || null,
    };

    const { data: nuevaAplicacion, error: insertErr } = await supabase
      .from('aplicaciones_vacunas')
      .insert([payload])
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 3. Descontar stock si fue solicitado y está vinculado a inventario
    if (input.descontar_stock && input.vacuna_id) {
      try {
        const { data: item } = await adminSupabase
          .from('inventario_medico')
          .select('id, stock_actual, nombre')
          .eq('id', input.vacuna_id)
          .single();

        if (item) {
          const nuevoStock = Math.max(0, (item.stock_actual || 0) - 1);
          await adminSupabase
            .from('inventario_medico')
            .update({ stock_actual: nuevoStock })
            .eq('id', input.vacuna_id);

          // Registrar movimiento de kardex
          await adminSupabase.from('movimientos_inventario').insert([{
            tenant_id: tenantId,
            item_id: input.vacuna_id,
            tipo_movimiento: 'SALIDA',
            cantidad: 1,
            motivo: `Aplicación de vacuna a paciente: ${paciente.nombres} ${paciente.apellidos} (${input.dosis})`,
            notas: `Lote: ${input.numero_lote || 'N/A'}. ID Aplicación: ${nuevaAplicacion.id}`,
            fecha: input.fecha_aplicacion
          }]);

          // Descontar del lote si coincide
          if (input.numero_lote) {
            const { data: loteRow } = await adminSupabase
              .from('lotes_inventario')
              .select('id, cantidad')
              .eq('item_id', input.vacuna_id)
              .eq('numero_lote', input.numero_lote.trim())
              .single();

            if (loteRow) {
              await adminSupabase
                .from('lotes_inventario')
                .update({ cantidad: Math.max(0, (loteRow.cantidad || 0) - 1) })
                .eq('id', loteRow.id);
            }
          }
        }
      } catch (stockErr) {
        console.error('Advertencia: no se pudo descontar stock automáticamente:', stockErr);
      }
    }

    if (tenantSlug) {
      revalidatePath(`/${tenantSlug}/admin/pacientes/${input.paciente_id}`);
      revalidatePath(`/${tenantSlug}/admin/inventario`);
    }

    return { success: true, data: nuevaAplicacion as AplicacionVacuna };
  } catch (err: any) {
    console.error('Error registrando aplicación de vacuna:', err);
    return { success: false, error: err.message || 'Error al registrar la vacuna.' };
  }
}

/**
 * Eliminar una aplicación de vacuna (por error de digitación)
 */
export async function eliminarAplicacionVacuna(
  aplicacionId: string,
  tenantSlug?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: aplicacion, error: fetchErr } = await supabase
      .from('aplicaciones_vacunas')
      .select('id, paciente_id')
      .eq('id', aplicacionId)
      .single();

    if (fetchErr || !aplicacion) {
      throw new Error('Registro no encontrado.');
    }

    const { error: delErr } = await supabase
      .from('aplicaciones_vacunas')
      .delete()
      .eq('id', aplicacionId);

    if (delErr) throw delErr;

    if (tenantSlug) {
      revalidatePath(`/${tenantSlug}/admin/pacientes/${aplicacion.paciente_id}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error eliminando aplicación de vacuna:', err);
    return { success: false, error: err.message || 'Error al eliminar el registro.' };
  }
}

/**
 * Obtener datos completos para el Carné Digital Público
 */
export async function getCarneDigitalPublico(slug: string, token: string) {
  try {
    const adminSupabase = createAdminClient();

    // 1. Resolver tenant
    const { data: tenant, error: tErr } = await adminSupabase
      .from('tenants')
      .select('id, nombre, slug, telefono, email, direccion')
      .eq('slug', slug)
      .single();

    if (tErr || !tenant) return null;

    // 2. Resolver configuración visual del tenant
    const { data: config } = await adminSupabase
      .from('configuracion_portal')
      .select('nombre_doctor, especialidad, registro_medico, logo_url, color_primario, color_acento, telefono, direccion')
      .eq('tenant_id', tenant.id)
      .single();

    // 3. Resolver paciente por token_acceso
    const { data: paciente, error: pErr } = await adminSupabase
      .from('pacientes')
      .select('id, nombres, apellidos, documento, tipo_documento, fecha_nacimiento, genero, eps, tipo_sangre, token_acceso')
      .eq('token_acceso', token)
      .eq('tenant_id', tenant.id)
      .single();

    if (pErr || !paciente) return null;

    // 4. Obtener vacunas aplicadas
    const { data: vacunas } = await adminSupabase
      .from('aplicaciones_vacunas')
      .select('*')
      .eq('paciente_id', paciente.id)
      .order('fecha_aplicacion', { ascending: true });

    return {
      tenant,
      config,
      paciente,
      vacunas: (vacunas || []) as AplicacionVacuna[]
    };
  } catch (err) {
    console.error('Error obteniendo carné digital público:', err);
    return null;
  }
}
