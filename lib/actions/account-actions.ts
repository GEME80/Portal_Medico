"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileInput {
  nombre?: string;
  email?: string;
  tenantSlug?: string;
}

/**
 * Updates the current authenticated user's password.
 */
export async function updateCurrentUserPasswordAction(newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
    }

    const authSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no válida o expirada. Por favor vuelve a iniciar sesión." };
    }

    // Update using admin client to ensure reliable immediate update
    const adminSupabase = createAdminClient();
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Error al actualizar contraseña:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, message: "Contraseña actualizada exitosamente." };
  } catch (err: any) {
    console.error("Unexpected error in updateCurrentUserPasswordAction:", err);
    return { success: false, error: err.message || "Error inesperado al actualizar la contraseña." };
  }
}

/**
 * Updates the current authenticated user's profile (name and/or email).
 */
export async function updateCurrentUserProfileAction(input: UpdateProfileInput) {
  try {
    const authSupabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Sesión no válida o expirada. Por favor vuelve a iniciar sesión." };
    }

    const adminSupabase = createAdminClient();
    const updates: any = {};
    const newEmail = input.email?.trim().toLowerCase();
    const newNombre = input.nombre?.trim();

    // Determine if user is superadmin
    const isSuperadmin =
      user.email?.toLowerCase() === process.env.SUPERADMIN_EMAIL?.toLowerCase() ||
      user.email?.toLowerCase() === "gerkof@gmail.com" ||
      user.app_metadata?.role === "superadmin";

    if (newEmail && newEmail !== user.email?.toLowerCase()) {
      // Basic email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        return { success: false, error: "Por favor proporciona una dirección de correo válida." };
      }
      updates.email = newEmail;
      updates.email_confirm = true; // Avoid email lockout
    }

    // Preserve metadata and role
    const currentMetadata = user.user_metadata || {};
    const appMetadata = user.app_metadata || {};

    if (newNombre !== undefined) {
      updates.user_metadata = {
        ...currentMetadata,
        nombre: newNombre,
        full_name: newNombre,
      };
    }

    if (isSuperadmin) {
      updates.app_metadata = {
        ...appMetadata,
        role: "superadmin",
      };
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, updates);
      if (updateError) {
        console.error("Error al actualizar usuario auth:", updateError);
        return { success: false, error: updateError.message };
      }
    }

    // If tenantSlug is supplied, check and update team membership if exists
    if (input.tenantSlug) {
      const { data: tenant } = await adminSupabase
        .from("tenants")
        .select("id")
        .eq("slug", input.tenantSlug)
        .maybeSingle();

      if (tenant) {
        const teamUpdates: any = {};
        if (newNombre) teamUpdates.nombre = newNombre;
        if (newEmail) teamUpdates.email = newEmail;

        if (Object.keys(teamUpdates).length > 0) {
          await adminSupabase
            .from("miembros_equipo")
            .update(teamUpdates)
            .eq("user_id", user.id)
            .eq("tenant_id", tenant.id);
        }
      }
      revalidatePath(`/${input.tenantSlug}/admin`, "layout");
    }

    revalidatePath("/superadmin", "layout");

    return { success: true, message: "Datos de usuario actualizados exitosamente." };
  } catch (err: any) {
    console.error("Unexpected error in updateCurrentUserProfileAction:", err);
    return { success: false, error: err.message || "Error inesperado al actualizar el perfil." };
  }
}
