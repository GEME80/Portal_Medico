/**
 * Tipos y funciones de gobernanza de permisos y roles para HubMed Platform
 */

export interface PermisosAdministrativos {
  citas: boolean;
  pacientes_demograficos: boolean;
  inventario: boolean;
  noticias: boolean;
}

export const DEFAULT_PERMISOS_ADMIN: PermisosAdministrativos = {
  citas: true,
  pacientes_demograficos: true,
  inventario: false,
  noticias: false,
};

export type UserRole = 'superadmin' | 'admin' | 'medico' | 'recepcion' | 'paciente';

export interface MiembroEquipoData {
  id: string;
  tenant_id: string;
  user_id: string;
  rol: UserRole;
  nombre?: string | null;
  email?: string | null;
  permisos: PermisosAdministrativos;
  activo: boolean;
  created_at?: string;
}

/**
 * Determina si el rol corresponde a un profesional médico facultado
 * para atender pacientes y gestionar historias clínicas según MinSalud.
 */
export function isMedicalStaff(role?: string | null): boolean {
  if (!role) return false;
  const clean = role.trim().toLowerCase();
  return clean === 'medico' || clean === 'doctor' || clean === 'admin' || clean === 'superadmin';
}

/**
 * Determina si el rol tiene autorización para ver o redactar datos clínicos.
 * El personal de 'recepcion' o administrativo tiene PROHIBIDO el acceso (Resolución 1995 de 1999).
 */
export function canAccessClinicalRecords(role?: string | null): boolean {
  return isMedicalStaff(role);
}

/**
 * Normaliza un objeto JSON de permisos asegurando que todas las claves existan con booleano seguro.
 */
export function normalizePermisos(raw: any): PermisosAdministrativos {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PERMISOS_ADMIN };
  }
  return {
    citas: raw.citas !== undefined ? Boolean(raw.citas) : DEFAULT_PERMISOS_ADMIN.citas,
    pacientes_demograficos: raw.pacientes_demograficos !== undefined ? Boolean(raw.pacientes_demograficos) : DEFAULT_PERMISOS_ADMIN.pacientes_demograficos,
    inventario: raw.inventario !== undefined ? Boolean(raw.inventario) : DEFAULT_PERMISOS_ADMIN.inventario,
    noticias: raw.noticias !== undefined ? Boolean(raw.noticias) : DEFAULT_PERMISOS_ADMIN.noticias,
  };
}
