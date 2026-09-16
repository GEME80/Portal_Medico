'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './clinical-actions';
import { PermisosAdministrativos, normalizePermisos, isMedicalStaff } from '@/lib/auth/permissions';

export interface MiembroEquipoView {
  id: string;
  tenant_id: string;
  user_id: string;
  rol: 'admin' | 'medico' | 'recepcion';
  nombre: string;
  email: string;
  permisos: PermisosAdministrativos;
  activo: boolean;
  created_at: string;
}

/**
 * Obtiene el listado de miembros del equipo de un consultorio / clínica.
 */
export async function getMiembrosEquipo(slug: string): Promise<ActionResponse<MiembroEquipoView[]>> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    const adminSupabase = createAdminClient();
    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!tenant) return { success: false, error: 'Consultorio no encontrado', code: 'TENANT_NOT_FOUND' };

    const { data, error } = await adminSupabase
      .from('miembros_equipo')
      .select('id, tenant_id, user_id, rol, nombre, email, permisos, activo, created_at')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted: MiembroEquipoView[] = (data || []).map((m: any) => ({
      id: m.id,
      tenant_id: m.tenant_id,
      user_id: m.user_id,
      rol: m.rol,
      nombre: m.nombre || 'Colaborador',
      email: m.email || '',
      permisos: normalizePermisos(m.permisos),
      activo: m.activo !== false,
      created_at: m.created_at,
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error('Error al obtener miembros del equipo:', err);
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Registra y aprovisiona un nuevo colaborador administrativo en el equipo del consultorio.
 */
export async function crearMiembroAdministrativo(
  slug: string,
  payload: {
    nombre: string;
    email: string;
    password?: string;
    permisos: PermisosAdministrativos;
  }
): Promise<ActionResponse> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado: Sesión no válida', code: 'UNAUTHORIZED' };

    const adminSupabase = createAdminClient();

    // Obtener tenant
    const { data: tenant } = await adminSupabase
      .from('tenants')
      .select('id, nombre')
      .eq('slug', slug)
      .maybeSingle();

    if (!tenant) return { success: false, error: 'Consultorio no encontrado', code: 'TENANT_NOT_FOUND' };

    // Validar que quien crea sea médico/admin del tenant o superadmin
    const isSuperadmin = user.email?.toLowerCase() === 'gerkof@gmail.com' || user.app_metadata?.role === 'superadmin';
    const userRole = user.app_metadata?.role;
    
    if (!isSuperadmin && !isMedicalStaff(userRole)) {
      // Verificar en miembros_equipo si es admin
      const { data: callerMember } = await adminSupabase
        .from('miembros_equipo')
        .select('rol')
        .eq('tenant_id', tenant.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!callerMember || (callerMember.rol !== 'admin' && callerMember.rol !== 'medico')) {
        return {
          success: false,
          error: 'Acceso denegado: Solo el médico o administrador del consultorio puede crear colaboradores.',
          code: 'FORBIDDEN'
        };
      }
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanNombre = payload.nombre.trim();
    const securePassword = payload.password && payload.password.length >= 6 
      ? payload.password 
      : 'HubMed2026*' + Math.floor(1000 + Math.random() * 9000);
    const permisosNormalized = normalizePermisos(payload.permisos);

    // 1. Crear o localizar el usuario en Supabase Auth
    let targetUserId: string | null = null;

    const { data: createData, error: createErr } = await adminSupabase.auth.admin.createUser({
      email: cleanEmail,
      password: securePassword,
      email_confirm: true,
      user_metadata: {
        nombre: cleanNombre,
        permisos: permisosNormalized,
      },
      app_metadata: {
        role: 'recepcion',
        tenant_id: tenant.id,
        tenant_slug: slug,
      }
    });

    if (createErr) {
      if (createErr.message.toLowerCase().includes('already registered') || createErr.message.toLowerCase().includes('already exists')) {
        // Buscar el usuario existente
        const { data: listData, error: listErr } = await adminSupabase.auth.admin.listUsers();
        if (!listErr && listData?.users) {
          const found = listData.users.find((u: any) => u.email?.toLowerCase() === cleanEmail);
          if (found) {
            targetUserId = found.id;
            // Actualizar su metadata
            await adminSupabase.auth.admin.updateUserById(found.id, {
              user_metadata: { nombre: cleanNombre, permisos: permisosNormalized },
              app_metadata: { role: 'recepcion', tenant_id: tenant.id, tenant_slug: slug }
            });
          }
        }
        if (!targetUserId) {
          return { success: false, error: 'El correo ya está registrado en el sistema. Solicite credenciales al usuario.', code: 'USER_EXISTS' };
        }
      } else {
        return { success: false, error: 'Error al registrar usuario en autenticación: ' + createErr.message, code: 'AUTH_ERROR' };
      }
    } else {
      targetUserId = createData.user.id;
    }

    // 2. Insertar o actualizar registro en miembros_equipo
    const { data: existingTeamMember } = await adminSupabase
      .from('miembros_equipo')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existingTeamMember) {
      await adminSupabase
        .from('miembros_equipo')
        .update({
          nombre: cleanNombre,
          email: cleanEmail,
          rol: 'recepcion',
          permisos: permisosNormalized,
          activo: true,
        })
        .eq('id', existingTeamMember.id);
    } else {
      const { error: insertErr } = await adminSupabase
        .from('miembros_equipo')
        .insert({
          tenant_id: tenant.id,
          user_id: targetUserId,
          rol: 'recepcion',
          nombre: cleanNombre,
          email: cleanEmail,
          permisos: permisosNormalized,
          activo: true,
          creado_por: user.id,
        });

      if (insertErr) throw insertErr;
    }

    // 3. Log de auditoría inmutable
    try {
      await adminSupabase.from('logs_auditoria').insert({
        tenant_id: tenant.id,
        usuario_id: user.id,
        accion: 'CREAR_COLABORADOR_ADMINISTRATIVO',
        entidad: 'miembros_equipo',
        detalles: JSON.stringify({ email: cleanEmail, nombre: cleanNombre, permisos: permisosNormalized })
      });
    } catch (_) {}

    revalidatePath(`/${slug}/admin/equipo`);
    return {
      success: true,
      data: {
        message: 'Personal administrativo creado exitosamente.',
        passwordAsignada: securePassword,
      }
    };
  } catch (err: any) {
    console.error('Error al crear miembro administrativo:', err);
    return { success: false, error: err.message || 'Error inesperado', code: 'INTERNAL_ERROR' };
  }
}

/**
 * Actualiza los permisos específicos del colaborador administrativo.
 */
export async function actualizarPermisosMiembro(
  slug: string,
  miembroId: string,
  permisos: PermisosAdministrativos
): Promise<ActionResponse> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    const adminSupabase = createAdminClient();
    const cleanPermisos = normalizePermisos(permisos);

    // Obtener miembro actual
    const { data: miembro, error: mErr } = await adminSupabase
      .from('miembros_equipo')
      .select('id, tenant_id, user_id, nombre, email')
      .eq('id', miembroId)
      .single();

    if (mErr || !miembro) {
      return { success: false, error: 'Miembro no encontrado', code: 'NOT_FOUND' };
    }

    // Actualizar fila
    const { error: updErr } = await adminSupabase
      .from('miembros_equipo')
      .update({ permisos: cleanPermisos })
      .eq('id', miembroId);

    if (updErr) throw updErr;

    // Sincronizar en auth metadata
    if (miembro.user_id) {
      try {
        await adminSupabase.auth.admin.updateUserById(miembro.user_id, {
          user_metadata: { permisos: cleanPermisos }
        });
      } catch (authSyncErr) {
        console.warn('Aviso: no se sincronizó metadata en Auth:', authSyncErr);
      }
    }

    // Log auditoria
    try {
      await adminSupabase.from('logs_auditoria').insert({
        tenant_id: miembro.tenant_id,
        usuario_id: user.id,
        accion: 'ACTUALIZAR_PERMISOS_COLABORADOR',
        entidad: 'miembros_equipo',
        entidad_id: miembro.id,
        detalles: JSON.stringify({ email: miembro.email, nuevos_permisos: cleanPermisos })
      });
    } catch (_) {}

    revalidatePath(`/${slug}/admin/equipo`);
    return { success: true, data: { message: 'Permisos actualizados correctamente' } };
  } catch (err: any) {
    console.error('Error al actualizar permisos:', err);
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Activa o desactiva a un colaborador administrativo.
 */
export async function cambiarEstadoMiembro(
  slug: string,
  miembroId: string,
  activo: boolean
): Promise<ActionResponse> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from('miembros_equipo')
      .update({ activo })
      .eq('id', miembroId);

    if (error) throw error;

    revalidatePath(`/${slug}/admin/equipo`);
    return { success: true };
  } catch (err: any) {
    console.error('Error al cambiar estado de miembro:', err);
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

/**
 * Da de baja y remueve a un miembro del equipo del consultorio.
 */
export async function removerMiembroEquipo(miembroId: string, slug: string): Promise<ActionResponse> {
  try {
    const authSupabase = await createClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from('miembros_equipo').delete().eq('id', miembroId);
    if (error) throw new Error(error.message);

    revalidatePath(`/${slug}/admin/equipo`);
    return { success: true, data: { message: 'Colaborador removido del equipo' } };
  } catch (err: any) {
    console.error('Error al remover miembro:', err);
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}
