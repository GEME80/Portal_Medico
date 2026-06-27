"use server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

/** Save the configuracion_portal row for a given tenant */
export async function saveConfigAction(
  tenantId: string,
  slug: string,
  payload: Record<string, unknown>
) {
  if (!tenantId || !slug) {
    return { success: false, error: "tenantId y slug son requeridos" };
  }

  const supabase = createAdminClient();

  // Remove primary/foreign keys to avoid PGRST204
  const EXCLUDED = ["id", "tenant_id", "created_at"];
  const cleanPayload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (!EXCLUDED.includes(k)) cleanPayload[k] = v;
  }

  const { error } = await supabase
    .from("configuracion_portal")
    .update(cleanPayload)
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("saveConfigAction error:", error);
    return { success: false, error: error.message };
  }

  try {
    revalidatePath(`/${slug}`, "layout");
  } catch (rv) {
    console.warn("revalidatePath warning:", rv);
  }

  return { success: true };
}

/** Save (upsert) an epidemiological alert for a given tenant */
export async function saveAlertAction(
  tenantId: string,
  slug: string,
  alertId: string | null,
  payload: {
    titulo: string;
    descripcion: string;
    nivel: string;
    activa: boolean;
  }
) {
  if (!tenantId) return { success: false, error: "tenantId requerido" };
  if (!payload.titulo?.trim()) return { success: false, error: "El título es obligatorio" };

  const supabase = createAdminClient();
  let newAlertId: string | null = alertId;

  if (alertId) {
    const { error } = await supabase
      .from("alertas_epidemiologicas")
      .update({
        titulo: payload.titulo,
        descripcion: payload.descripcion,
        nivel: payload.nivel,
        activa: payload.activa,
      })
      .eq("id", alertId);

    if (error) {
      console.error("saveAlertAction update error:", error);
      return { success: false, error: error.message };
    }
  } else {
    const { data, error } = await supabase
      .from("alertas_epidemiologicas")
      .insert({
        tenant_id: tenantId,
        titulo: payload.titulo,
        descripcion: payload.descripcion,
        nivel: payload.nivel,
        activa: payload.activa,
      })
      .select()
      .single();

    if (error) {
      console.error("saveAlertAction insert error:", error);
      return { success: false, error: error.message };
    }
    if (data) newAlertId = data.id;
  }

  try {
    revalidatePath(`/${slug}`, "layout");
  } catch (rv) {
    console.warn("revalidatePath warning:", rv);
  }

  return { success: true, alertId: newAlertId };
}
