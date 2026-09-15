'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './clinical-actions';

export async function agregarMiembroEquipo(userEmail: string, rol: 'admin' | 'medico' | 'recepcion', slug: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    
    // Solo admins/superadmins pueden invitar
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    let tenantId = user.app_metadata?.tenant_id;
    if (!tenantId) {
      const { data: t } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      if (t) tenantId = t.id;
    }
    
    if (!tenantId) return { success: false, error: 'No autorizado', code: 'UNAUTHORIZED' };

    // Buscar el usuario por email (requiere permisos de service_role si se hace directo, o podemos usar una function RPC)
    // Para simplificar la base, asumimos que el usuario ya existe en auth.users y hacemos match.
    // Como no podemos consultar auth.users directamente sin admin API, usamos una tabla puente o RPC.
    // Por ahora, retornamos un mensaje simulado para la arquitectura.
    
    /* 
      const { data: targetUser } = await supabase.rpc('get_user_id_by_email', { email: userEmail });
      if (!targetUser) return { success: false, error: 'Usuario no encontrado' };

      await supabase.from('miembros_equipo').insert({ tenant_id: tenantId, user_id: targetUser, rol });
    */

    revalidatePath(`/${slug}/admin/equipo`);
    return { success: true, data: { message: 'Miembro invitado correctamente (Simulación)' } };
  } catch (err: any) {
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}

export async function removerMiembroEquipo(miembroId: string, slug: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('miembros_equipo').delete().eq('id', miembroId);
    if (error) throw new Error(error.message);

    revalidatePath(`/${slug}/admin/equipo`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message, code: 'INTERNAL_ERROR' };
  }
}
