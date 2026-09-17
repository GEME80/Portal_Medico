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
 * Obtener ítems del inventario del consultorio disponibles para aplicar (Únicamente Vacunas)
 */
export async function getInventarioVacunasTenant(tenantId: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventario_medico')
      .select(`
        id,
        nombre,
        nombre_generico,
        laboratorio,
        enfermedad,
        via_admin,
        esquema_dosis,
        stock_actual,
        lote_activo,
        categoria:categorias_inventario!inner(id, nombre),
        lotes:lotes_inventario(id, numero_lote, fecha_vencimiento, cantidad, fecha_registro)
      `)
      .eq('tenant_id', tenantId)
      .ilike('categoria.nombre', '%vacuna%')
      .order('nombre');

    if (error) {
      console.warn('Filtro por categorias_inventario fallo, usando fallback:', error.message);
      const { data: fallbackData, error: fbErr } = await supabase
        .from('inventario_medico')
        .select('id, nombre, nombre_generico, laboratorio, enfermedad, via_admin, esquema_dosis, stock_actual, lote_activo, categoria_id')
        .eq('tenant_id', tenantId)
        .order('nombre');
      
      if (fbErr) throw fbErr;
      
      const filtered = (fallbackData || []).filter(item => {
        const nom = item.nombre.toLowerCase();
        return !nom.includes('jeringa') && !nom.includes('solución') && !nom.includes('solucion') && !nom.includes('suero') && !nom.includes('ringer') && !nom.includes('aguja') && !nom.includes('guante');
      });
      return { success: true, data: filtered };
    }

    // Normalizar lote activo para cada vacuna: si está vacío, usar el lote más reciente registrado
    const processedData = (data || []).map((item: any) => {
      let activeLot = item.lote_activo?.trim();
      if ((!activeLot || activeLot === '—') && item.lotes && item.lotes.length > 0) {
        const sortedLots = [...item.lotes].sort((a: any, b: any) => 
          new Date(b.fecha_registro || 0).getTime() - new Date(a.fecha_registro || 0).getTime()
        );
        activeLot = sortedLots[0]?.numero_lote || '';
      }

      // Obtener fecha de vencimiento del lote activo
      let fechaVenc = '';
      if (item.lotes && item.lotes.length > 0) {
        const foundLot = item.lotes.find((l: any) => l.numero_lote === activeLot) || item.lotes[0];
        fechaVenc = foundLot?.fecha_vencimiento || '';
      }

      return {
        id: item.id,
        nombre: item.nombre,
        nombre_generico: item.nombre_generico || '',
        laboratorio: item.laboratorio || '',
        enfermedad: item.enfermedad || item.nombre_generico || '',
        via_admin: item.via_admin || 'Intramuscular',
        esquema_dosis: item.esquema_dosis || '',
        stock_actual: item.stock_actual ?? 0,
        lote_activo: activeLot || '',
        fecha_vencimiento: fechaVenc,
        lotes: item.lotes || []
      };
    });

    return { success: true, data: processedData };
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

export interface CombinadaInput {
  paciente_id: string;
  tipo_combinada: 'HEXAVALENTE' | 'TETRAXIM';
  dosis_numero: '1' | '2' | '3' | 'ref1' | 'ref2';
  nombre_comercial?: string;
  fecha_aplicacion: string;
  numero_lote?: string;
  laboratorio?: string;
  profesional_nombre?: string;
  origen?: 'institucional' | 'externo';
  vacuna_id?: string | null;
  descontar_stock?: boolean;
  observaciones?: string;
}

/**
 * Registrar una vacuna combinada (ej. Hexavalente o Tetraxim)
 * Poblando automáticamente las filas correspondientes en la matriz
 */
export async function registrarVacunaCombinada(
  input: CombinadaInput,
  tenantSlug?: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Validar paciente y obtener tenant_id
    const { data: paciente, error: pacErr } = await supabase
      .from('pacientes')
      .select('id, tenant_id, nombres, apellidos')
      .eq('id', input.paciente_id)
      .single();

    if (pacErr || !paciente) throw new Error('Paciente no encontrado.');

    const tenantId = paciente.tenant_id;
    const commercialName = input.nombre_comercial?.trim() || (input.tipo_combinada === 'HEXAVALENTE' ? 'Hexaxim' : 'Tetraxim');

    let rowsToInsert: any[] = [];

    if (input.tipo_combinada === 'HEXAVALENTE') {
      const dosisMap: Record<string, string> = { '1': '1ª', '2': '2ª', '3': '3ª' };
      const edadMap: Record<string, string> = { '1': '2º Mes', '2': '4º Mes', '3': '6º Mes' };
      const dLabel = dosisMap[input.dosis_numero] || '1ª';
      const eLabel = edadMap[input.dosis_numero] || '2º Mes';

      // Polio, Hep B, Hib, DTP
      rowsToInsert = [
        {
          nombre_vacuna: `${commercialName} (Polio)`,
          enfermedad_prevenida: 'POLIO I.M.',
          dosis: dLabel,
          edad_aplicacion: eLabel,
        },
        {
          nombre_vacuna: `${commercialName} (Hepatitis B)`,
          enfermedad_prevenida: 'HEPATITIS B',
          dosis: input.dosis_numero === '1' ? '2ª' : input.dosis_numero === '2' ? '2ª' : '3ª',
          edad_aplicacion: eLabel,
        },
        {
          nombre_vacuna: `${commercialName} (Hib)`,
          enfermedad_prevenida: 'HAEMOPHILUS INFLUENZAE TIPO B (Hib)',
          dosis: dLabel,
          edad_aplicacion: eLabel,
        },
        {
          nombre_vacuna: `${commercialName} (DTP)`,
          enfermedad_prevenida: 'DIFTERIA - TOS FERINA - TETANO (DTP)',
          dosis: dLabel,
          edad_aplicacion: eLabel,
        },
      ];
    } else if (input.tipo_combinada === 'TETRAXIM') {
      const isRef2 = input.dosis_numero === 'ref2';
      const dLabel = isRef2 ? '2º Refuerzo' : '1er Refuerzo';
      const eLabel = isRef2 ? '5 Años' : '1 Año después de la 3ª dosis';

      // Polio, DTP
      rowsToInsert = [
        {
          nombre_vacuna: `${commercialName} (Polio)`,
          enfermedad_prevenida: 'POLIO I.M.',
          dosis: dLabel,
          edad_aplicacion: eLabel,
        },
        {
          nombre_vacuna: `${commercialName} (DTP)`,
          enfermedad_prevenida: 'DIFTERIA - TOS FERINA - TETANO (DTP)',
          dosis: dLabel,
          edad_aplicacion: eLabel,
        },
      ];
    }

    const payloads = rowsToInsert.map(row => ({
      tenant_id: tenantId,
      paciente_id: input.paciente_id,
      vacuna_id: input.vacuna_id || null,
      nombre_vacuna: row.nombre_vacuna,
      enfermedad_prevenida: row.enfermedad_prevenida,
      dosis: row.dosis,
      edad_aplicacion: row.edad_aplicacion,
      fecha_aplicacion: input.fecha_aplicacion,
      numero_lote: input.numero_lote?.trim() || '',
      laboratorio: input.laboratorio?.trim() || '',
      via_administracion: 'Intramuscular',
      sitio_aplicacion: 'Vasto externo muslo',
      profesional_nombre: input.profesional_nombre?.trim() || '',
      origen: input.origen || (input.vacuna_id ? 'institucional' : 'externo'),
      observaciones: input.observaciones ? `${input.observaciones} (Combinada ${input.tipo_combinada})` : `Vacuna combinada ${input.tipo_combinada}`,
    }));

    const { error: insertErr } = await supabase
      .from('aplicaciones_vacunas')
      .insert(payloads);

    if (insertErr) throw insertErr;

    // Descontar stock una sola vez
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

          await adminSupabase.from('movimientos_inventario').insert([{
            tenant_id: tenantId,
            item_id: input.vacuna_id,
            tipo_movimiento: 'SALIDA',
            cantidad: 1,
            motivo: `Aplicación combinada ${input.tipo_combinada} a paciente: ${paciente.nombres} ${paciente.apellidos}`,
            notas: `Lote: ${input.numero_lote || 'N/A'}`,
            fecha: input.fecha_aplicacion
          }]);
        }
      } catch (stockErr) {
        console.error('Advertencia descuento inventario combinada:', stockErr);
      }
    }

    if (tenantSlug) {
      revalidatePath(`/${tenantSlug}/admin/pacientes/${input.paciente_id}`);
      revalidatePath(`/${tenantSlug}/admin/inventario`);
    }

    return { success: true, count: payloads.length };
  } catch (err: any) {
    console.error('Error registrando vacuna combinada:', err);
    return { success: false, error: err.message || 'Error al registrar vacuna combinada.' };
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
    const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
    const canonicalSlug = cleanSlug === 'dr-carlos-torres' ? 'dr-torres' : cleanSlug;

    // 1. Resolver tenant
    const { data: tenant, error: tErr } = await adminSupabase
      .from('tenants')
      .select('id, nombre, slug')
      .or(`slug.eq.${canonicalSlug},slug.eq.${cleanSlug}`)
      .maybeSingle();

    if (tErr || !tenant) {
      console.error('Tenant no encontrado para carné:', slug, tErr);
      return null;
    }

    // 2. Resolver configuración visual del tenant
    const { data: config } = await adminSupabase
      .from('configuracion_portal')
      .select('nombre_doctor, titulo_doctor, especialidad, logo_url, color_primario, color_acento, telefono, direccion')
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    // 3. Resolver paciente por token_acceso
    const { data: paciente, error: pErr } = await adminSupabase
      .from('pacientes')
      .select('id, nombres, apellidos, documento, tipo_documento, fecha_nacimiento, genero, eps, token_acceso')
      .eq('token_acceso', token)
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    if (pErr || !paciente) {
      console.error('Paciente no encontrado para carné:', token, pErr);
      return null;
    }

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
