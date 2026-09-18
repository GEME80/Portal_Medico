'use server';
// Trigger redeploy to apply Vercel environment variables change (CLINICAL_ENCRYPTION_KEY)

import { cookies } from 'next/headers';
import { encryptClinicalData, decryptClinicalData } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { HistoriaClinicaSchema, PacienteSchema } from '@/lib/validations/clinical';

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'UNAUTHORIZED' | 'TENANT_NOT_FOUND' | 'VALIDATION_FAILED' | 'DATABASE_ERROR' | 'INTERNAL_ERROR' | string;
}

export async function guardarHistoriaClinica(data: any, slug: string): Promise<ActionResponse> {
  try {
    const validatedData = HistoriaClinicaSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        success: false,
        error: 'Error de validación: ' + validatedData.error.issues.map((e: any) => e.message).join(', '),
        code: 'VALIDATION_FAILED'
      };
    }
    data = validatedData.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autorizado: Sesión inválida', code: 'UNAUTHORIZED' };
    }

    const userRole = user.app_metadata?.role;
    if (userRole === 'recepcion') {
      return {
        success: false,
        error: 'Acceso denegado: El personal administrativo no tiene autorización legal para crear o modificar historias clínicas (Resolución 1995 de 1999 de MinSalud).',
        code: 'FORBIDDEN_CLINICAL_OPERATION'
      };
    }

    let tenantId = user.app_metadata?.tenant_id;
    if (!tenantId) {
      const slug_to_use = user.app_metadata?.tenant_slug || slug;
      const { data: t } = await supabase.from('tenants').select('id').eq('slug', slug_to_use).single();
      if (t) tenantId = t.id;
    }
    if (!tenantId) {
      return { success: false, error: 'No autorizado: Sin tenant_id asignado', code: 'TENANT_NOT_FOUND' };
    }

    let snapshotDemografico = null;
    const isCierre = data.estado === 'cerrado';

    if (isCierre) {
      // Tomar snapshot del paciente
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', data.paciente_id)
        .eq('tenant_id', tenantId)
        .single();

      if (paciente) {
        snapshotDemografico = paciente;
      }
    }

    // Encriptar solo campos de evolución médica, dejando el resto en texto plano/JSONB
    const historiaData = {
      tenant_id: tenantId,
      paciente_id: data.paciente_id,
      medico_id: user.id,
      estado: data.estado,
      enfermedad_actual: encryptClinicalData(data.enfermedad_actual),
      motivo_consulta: encryptClinicalData(data.motivo_consulta),
      anamnesis: encryptClinicalData(data.anamnesis),
      plan_manejo: encryptClinicalData(data.plan_manejo),
      impresion_diagnostica: data.impresion_diagnostica || [],
      procedimientos: data.procedimientos || [],
      facturacion: data.facturacion || {},
      metadatos_atencion: data.metadatos_atencion || {},
      signos_vitales: data.signos_vitales || {},
      snapshot_demografico: snapshotDemografico,
      parent_id: data.parent_id || null,
      closed_at: isCierre ? new Date().toISOString() : null,
    };

    const { data: nuevaHistoria, error } = await supabase
      .from('historias_clinicas')
      .insert([historiaData])
      .select()
      .single();

    if (error) {
      console.error("Error al guardar historia:", error);
      return { success: false, error: 'Error al guardar la historia clínica: ' + error.message, code: 'DATABASE_ERROR' };
    }

    // Log de auditoría
    await supabase.from('logs_auditoria').insert([{
      tenant_id: tenantId,
      usuario_id: user.id,
      accion: isCierre ? 'CIERRE_HISTORIA' : 'GUARDAR_BORRADOR',
      entidad: 'historias_clinicas',
      entidad_id: nuevaHistoria.id,
      detalles: 'Historia guardada correctamente',
      ip_address: '127.0.0.1'
    }]);

    revalidatePath(`/${slug}/admin/pacientes`);
    return { success: true, data: nuevaHistoria };
  } catch (err: any) {
    console.error("Crash al guardar historia clinica:", err);
    return { success: false, error: err.message || 'Error inesperado al guardar la historia clínica.', code: 'INTERNAL_ERROR' };
  }
}

export async function crearPacienteExpress(data: any, slug: string): Promise<ActionResponse> {
  try {
    const validatedData = PacienteSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        success: false,
        error: 'Error de validación: ' + validatedData.error.issues.map((e: any) => e.message).join(', '),
        code: 'VALIDATION_FAILED'
      };
    }
    data = validatedData.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };
    }

    let tenantId = user.app_metadata?.tenant_id;
    if (!tenantId) {
      const slug_to_use = user.app_metadata?.tenant_slug || slug;
      const { data: t } = await supabase.from('tenants').select('id').eq('slug', slug_to_use).single();
      if (t) tenantId = t.id;
    }
    if (!tenantId) {
      return { success: false, error: 'No autorizado: Sin tenant_id', code: 'TENANT_NOT_FOUND' };
    }

    const { data: nuevoPaciente, error } = await supabase
      .from('pacientes')
      .insert([{
        tenant_id: tenantId,
        documento: data.documento,
        tipo_documento: data.tipo_documento || 'CC',
        nombres: data.nombres,
        apellidos: data.apellidos,
        fecha_nacimiento: data.fecha_nacimiento,
        genero: data.genero,
        eps: data.eps,
        prepagada: data.prepagada,
        tipo_sangre: data.tipo_sangre,
        telefono: data.telefono,
        padre: data.padre,
        telefono_padre: data.telefono_padre,
        madre: data.madre,
        telefono_madre: data.telefono_madre,
        acompanante: data.acompanante,
        telefono_acompanante: data.telefono_acompanante
      }])
      .select()
      .single();

    if (error) {
      console.error("Error al crear paciente:", error);
      return { success: false, error: 'Error al crear el paciente. Verifique que el documento no exista: ' + error.message, code: 'DATABASE_ERROR' };
    }

    // Log auditoria
    await supabase.from('logs_auditoria').insert([{
      tenant_id: tenantId,
      usuario_id: user.id,
      accion: 'CREAR_PACIENTE_EXPRESS',
      entidad: 'pacientes',
      entidad_id: nuevoPaciente.id,
      detalles: 'Paciente creado desde formulario de consulta'
    }]);

    return { success: true, data: nuevoPaciente };
  } catch (err: any) {
    console.error("Crash al crear paciente:", err);
    return { success: false, error: err.message || 'Error inesperado al crear el paciente.', code: 'INTERNAL_ERROR' };
  }
}

export async function getHistoriaClinicaDetalle(historiaId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No autorizado');
  }

  const userRole = user.app_metadata?.role;
  if (userRole === 'recepcion') {
    throw new Error('Acceso denegado: Información clínica confidencial reservada exclusivamente al profesional médico (Resolución 1995 de 1999).');
  }

  const { data: historia, error } = await supabase
    .from('historias_clinicas')
    .select('*, pacientes(*)')
    .eq('id', historiaId)
    .single();

  if (error || !historia) {
    throw new Error('Historia no encontrada');
  }

  const safeDecrypt = (val: any) => {
    if (!val) return val;
    try {
      const dec = decryptClinicalData(val);
      return dec || val;
    } catch {
      return val;
    }
  };

  return {
    ...historia,
    enfermedad_actual: safeDecrypt(historia.enfermedad_actual),
    motivo_consulta: safeDecrypt(historia.motivo_consulta),
    anamnesis: safeDecrypt(historia.anamnesis),
    plan_manejo: safeDecrypt(historia.plan_manejo),
  };
}

export async function getHistoriasClinicas(pacienteId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("getHistoriasClinicas: No autorizado (user nulo)");
      throw new Error('No autorizado');
    }

    const { data: historias, error } = await supabase
      .from('historias_clinicas')
      .select('id, created_at, estado, motivo_consulta, impresion_diagnostica')
      .eq('paciente_id', pacienteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("getHistoriasClinicas: error al consultar supabase", error);
      return [];
    }
    if (!historias) {
      return [];
    }

    return historias.map(hist => {
      let motivo = hist.motivo_consulta;
      if (motivo) {
        try {
          const descifrado = decryptClinicalData(motivo);
          if (descifrado) motivo = descifrado;
        } catch (e) {
          // Ignorar si falla
        }
      }
      return {
        ...hist,
        motivo_consulta: motivo
      };
    });
  } catch (err) {
    console.error("getHistoriasClinicas: UNHANDLED ERROR", err);
    throw err;
  }
}

export async function buscarCIE10(searchQuery: string) {
  if (!searchQuery || searchQuery.length < 2) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No autorizado');
  }

  const { data, error } = await supabase
    .from('catalogo_cie10')
    .select('codigo, descripcion')
    .eq('activo', true)
    .or(`codigo.ilike.%${searchQuery}%,descripcion.ilike.%${searchQuery}%`)
    .limit(20);

  if (error) {
    console.error("Error buscando CIE10:", error);
    return [];
  }

  return data || [];
}

// ---------------------------------------------------------
// OMS - Curvas de Crecimiento (Z-Scores)
// ---------------------------------------------------------

export async function getCurvasOMS(genero: string, esMayor24: boolean, parametro: string) {
  const supabase = await createClient();
  const tabla = esMayor24 ? 'oms_zscore_ninos_2_5a' : 'oms_zscore_infantil_0_24m';
  
  const mappedGenero = genero === 'Femenino' ? 'F' : (genero === 'Masculino' ? 'M' : genero);

  const { data, error } = await supabase
    .from(tabla)
    .select('*')
    .eq('genero', mappedGenero)
    .eq('parametro', parametro)
    .order('eje_x', { ascending: true });

  if (error) {
    console.error("Error fetching OMS curves:", error);
    return [];
  }
  return data;
}

export async function getPuntosCrecimientoPaciente(pacienteId: string) {
  const supabase = await createClient();
  
  // 1. Obtener de historias clinicas
  const { data: historias, error: errorH } = await supabase
    .from('historias_clinicas')
    .select('id, created_at, signos_vitales, metadatos_atencion')
    .eq('paciente_id', pacienteId)
    .order('created_at', { ascending: true });

  if (errorH) console.error("Error fetching patient points (historias):", errorH);

  // 2. Obtener de tabla historica independiente
  const { data: historicos, error: errorM } = await supabase
    .from('paciente_mediciones_antropometricas')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha_medicion', { ascending: true });

  if (errorM) console.error("Error fetching patient points (mediciones):", errorM);

  const merged = [];
  
  // Transformar historias
  if (historias) {
    for (const h of historias) {
      if (h.signos_vitales) {
        merged.push({
          id: h.id,
          created_at: h.created_at,
          signos_vitales: h.signos_vitales,
          metadatos_atencion: h.metadatos_atencion,
          tipo: 'consulta'
        });
      }
    }
  }

  // Transformar historicos
  if (historicos) {
    for (const m of historicos) {
      merged.push({
        id: m.id,
        created_at: m.fecha_medicion, // usamos fecha_medicion para el chart
        signos_vitales: { peso: m.peso, talla: m.talla, perimetro_cefalico: m.perimetro_cefalico },
        tipo: 'registro_historico'
      });
    }
  }

  // Ordenar por fecha
  merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return merged;
}

export async function agregarMedicionHistorica(pacienteId: string, peso: string, talla: string, fecha: string, perimetro_cefalico?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const { data: p } = await supabase.from('pacientes').select('tenant_id').eq('id', pacienteId).single();
  
  const payload: any = {
    tenant_id: p?.tenant_id,
    paciente_id: pacienteId,
    medico_id: user.id,
    fecha_medicion: fecha,
    peso: peso ? parseFloat(peso) : null,
    talla: talla ? parseFloat(talla) : null,
  };
  if (perimetro_cefalico) {
    payload.perimetro_cefalico = parseFloat(perimetro_cefalico);
  }

  const { data, error } = await supabase
    .from('paciente_mediciones_antropometricas')
    .insert([payload])
    .select()
    .single();
    
  if (error) throw new Error(`Error guardando medición: ${error.message}`);
  return data;
}

export async function getOmsChartCalibrations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('oms_chart_calibrations')
    .select('*');

  if (error) throw new Error(`Error obteniendo calibraciones: ${error.message}`);
  
  // Convertir a un mapa (Record)
  const map: Record<string, { left: number, bottom: number, width: number, height: number, image_url?: string }> = {};
  data.forEach((row: any) => {
    map[row.chart_id] = {
      left: Number(row.grid_left_pct),
      bottom: Number(row.grid_bottom_pct),
      width: Number(row.grid_width_pct),
      height: Number(row.grid_height_pct),
      image_url: row.image_url
    };
  });
  return map;
}

export async function saveOmsChartCalibration(chartId: string, left: number, bottom: number, width: number, height: number) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('oms_chart_calibrations')
    .upsert({
      chart_id: chartId,
      grid_left_pct: left,
      grid_bottom_pct: bottom,
      grid_width_pct: width,
      grid_height_pct: height,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`Error guardando calibración: ${error.message}`);
  
  revalidatePath(`/[slug]/admin/pacientes/[pacienteId]`, 'page');
  return data;
}

export async function saveOmsChartImage(chartId: string, imageUrl: string) {
  const supabase = await createClient();
  
  // Primero buscamos si existe
  const { data: existing } = await supabase.from('oms_chart_calibrations').select('*').eq('chart_id', chartId).single();

  let result;
  if (existing) {
    const { data, error } = await supabase.from('oms_chart_calibrations')
      .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
      .eq('chart_id', chartId)
      .select().single();
    if (error) throw new Error(`Error guardando imagen de gráfica: ${error.message}`);
    result = data;
  } else {
    const { data, error } = await supabase.from('oms_chart_calibrations')
      .insert({
        chart_id: chartId,
        image_url: imageUrl,
        grid_left_pct: 0,
        grid_bottom_pct: 0,
        grid_width_pct: 100,
        grid_height_pct: 100
      })
      .select().single();
    if (error) throw new Error(`Error guardando imagen de gráfica: ${error.message}`);
    result = data;
  }
  
  revalidatePath(`/[slug]/admin/personalizar`, 'page');
  revalidatePath(`/[slug]/admin/pacientes/[pacienteId]`, 'page');
  return result;
}

export async function getDiagnosticosMasUsados(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  let tenantId = user.app_metadata?.tenant_id;
  if (!tenantId) {
    const { data: t } = await supabase.from('tenants').select('id').eq('slug', slug).single();
    if (t) tenantId = t.id;
  }
  if (!tenantId) throw new Error('No autorizado: Sin tenant_id');

  // Obtener las últimas 100 historias clínicas para extraer diagnósticos frecuentes
  const { data: historias, error } = await supabase
    .from('historias_clinicas')
    .select('impresion_diagnostica')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  const frequencyMap: Record<string, { codigo: string; descripcion: string; count: number }> = {};

  if (historias && !error) {
    historias.forEach(h => {
      const diagList = h.impresion_diagnostica;
      if (Array.isArray(diagList)) {
        diagList.forEach((d: any) => {
          if (d && d.codigo && d.descripcion) {
            if (frequencyMap[d.codigo]) {
              frequencyMap[d.codigo].count++;
            } else {
              frequencyMap[d.codigo] = {
                codigo: d.codigo,
                descripcion: d.descripcion,
                count: 1
              };
            }
          }
        });
      }
    });
  }

  // Ordenar de mayor a menor frecuencia
  const dynamicCommon = Object.values(frequencyMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 9)
    .map(d => ({ codigo: d.codigo, descripcion: d.descripcion }));

  // Diagnósticos estáticos por defecto (Enfoque pediátrico común)
  const staticCommon = [
    { codigo: 'J00', descripcion: 'Rinofaringitis aguda [resfriado común]' },
    { codigo: 'J02.9', descripcion: 'Faringitis aguda, no especificada' },
    { codigo: 'A09.9', descripcion: 'Gastroenteritis y colitis de origen no especificado' },
    { codigo: 'J20.9', descripcion: 'Bronquitis aguda, no especificada' },
    { codigo: 'H66.9', descripcion: 'Otitis media, no especificada' }
  ];

  // Mezclar dinámicos con estáticos sin duplicar hasta completar máximo 9
  const merged = [...dynamicCommon];
  for (const item of staticCommon) {
    if (merged.length >= 9) break;
    if (!merged.some(m => m.codigo === item.codigo)) {
      merged.push(item);
    }
  }

  return merged;
}

/**
 * Obtener datos completos para el visor público de Curvas de Crecimiento OMS
 * Acceso seguro mediante token_acceso del paciente
 */
export async function getCurvasDigitalPublico(slug: string, token: string) {
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
      console.error('Tenant no encontrado para curvas:', slug, tErr);
      return null;
    }

    // 2. Resolver configuración visual del portal del doctor
    const { data: config } = await adminSupabase
      .from('configuracion_portal')
      .select('nombre_doctor, titulo_doctor, especialidad, logo_url, color_primario, color_acento, telefono, direccion')
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    // 3. Resolver paciente por token_acceso o id
    const { data: paciente, error: pErr } = await adminSupabase
      .from('pacientes')
      .select('id, nombres, apellidos, documento, tipo_documento, fecha_nacimiento, genero, eps, telefono, token_acceso')
      .or(`token_acceso.eq.${token},id.eq.${token}`)
      .eq('tenant_id', tenant.id)
      .maybeSingle();

    if (pErr || !paciente) {
      console.error('Paciente no encontrado para curvas:', token, pErr);
      return null;
    }

    // 4. Obtener mediciones unificadas (historias clínicas + paciente_mediciones_antropometricas)
    const { data: historias } = await adminSupabase
      .from('historias_clinicas')
      .select('id, created_at, signos_vitales, metadatos_atencion')
      .eq('paciente_id', paciente.id)
      .order('created_at', { ascending: true });

    const { data: historicos } = await adminSupabase
      .from('paciente_mediciones_antropometricas')
      .select('*')
      .eq('paciente_id', paciente.id)
      .order('fecha_medicion', { ascending: true });

    const merged: any[] = [];
    if (historias) {
      for (const h of historias) {
        if (h.signos_vitales && (h.signos_vitales.peso || h.signos_vitales.talla)) {
          merged.push({
            id: h.id,
            created_at: h.created_at,
            fecha_medicion: h.created_at.split('T')[0],
            signos_vitales: h.signos_vitales,
            metadatos_atencion: h.metadatos_atencion,
            tipo: 'consulta'
          });
        }
      }
    }
    if (historicos) {
      for (const m of historicos) {
        merged.push({
          id: m.id,
          created_at: m.fecha_medicion,
          fecha_medicion: m.fecha_medicion,
          signos_vitales: { 
            peso: m.peso, 
            talla: m.talla, 
            perimetro_cefalico: m.perimetro_cefalico 
          },
          tipo: 'registro_historico'
        });
      }
    }
    merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return {
      tenant,
      config,
      paciente,
      mediciones: merged
    };
  } catch (err) {
    console.error('Error obteniendo curvas digitales públicas:', err);
    return null;
  }
}


