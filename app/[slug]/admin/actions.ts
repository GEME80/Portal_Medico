"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Simulates a successful payment for a tenant.
 * Sets estado_pago='activo', activo=true, clears fecha_vencimiento.
 */
export async function payInvoiceAction(tenantSlug: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("tenants")
    .update({
      estado_pago: "activo",
      activo: true,
      fecha_vencimiento: null,
    })
    .eq("slug", tenantSlug);

  if (error) {
    console.error("Error paying invoice:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/${tenantSlug}/admin`, "layout");
  revalidatePath(`/${tenantSlug}`, "layout");
  return { success: true };
}

