"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface CreateTenantInput {
  nombre: string;
  slug: string;
  email: string;
  plan: "starter" | "pro" | "enterprise";
  custom_domain?: string;
  template_id?: string;
}

/**
 * Creates a new clinic/tenant, seeds default data, and invites the doctor as tenant admin.
 */
export async function createTenantAction(input: CreateTenantInput) {
  const supabase = createAdminClient();

  // 1. Clean and validate inputs
  const nombre = input.nombre.trim();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const email = input.email.trim().toLowerCase();
  const plan = input.plan;
  const customDomain = input.custom_domain?.trim().toLowerCase() || null;
  const templateId = input.template_id?.trim() || "standard";

  if (!nombre || !slug || !email) {
    return { success: false, error: "El nombre, el slug y el correo son campos obligatorios." };
  }

  // 2. Insert the tenant record
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      nombre,
      slug,
      plan,
      custom_domain: customDomain,
      template_id: templateId,
      activo: true,
      estado_pago: "activo"
    })
    .select()
    .single();

  if (tenantError) {
    console.error("Error creating tenant:", tenantError);
    if (tenantError.code === "23505") {
      return { success: false, error: "El slug o el dominio personalizado ya se encuentra registrado." };
    }
    return { success: false, error: `Error al crear la clínica: ${tenantError.message}` };
  }

  try {
    // 3. Auto-seed configuration portal
    const { error: configError } = await supabase
      .from("configuracion_portal")
      .insert({
        tenant_id: tenant.id,
        nombre_doctor: nombre,
        titulo_doctor: "Médico Especialista",
        especialidad: "Vacunología y Prevención",
        hero_titulo: "Ciencia, prevención y cuidado para tu familia",
        hero_subtitulo: `Consultorio Médico ${nombre}`,
        hero_badge_texto: "Portal Médico Activo",
        email: email,
        color_primario: "#0A4D5C",
        color_acento: "#00D4AA",
        meta_titulo: `${nombre} - Portal Médico`,
        meta_descripcion: `Portal de consulta, trayectoria e inventario de vacunas de ${nombre}.`,
      });

    if (configError) throw configError;

    // 4. Auto-seed lines of investigation
    await supabase.from("lineas_investigacion").insert({
      tenant_id: tenant.id,
      icono: "🔬",
      titulo: "Inmunología Clínica y Vacunas",
      descripcion: "Monitoreo y vigilancia de la efectividad inmunitaria en la población.",
      orden: 1,
      activo: true,
    });

    // 5. Auto-seed vaccine myths
    await supabase.from("mitos_vacunales").insert([
      {
        tenant_id: tenant.id,
        mito: "Las vacunas causan autismo",
        respuesta: "Es un mito falso originado en 1998 por un estudio fraudulento que fue retractado. Investigaciones globales con millones de niños descartan cualquier vínculo.",
        fuente: "Organización Mundial de la Salud (OMS)",
        orden: 1,
        activo: true,
      },
      {
        tenant_id: tenant.id,
        mito: "La inmunidad por enfermedad es mejor que la vacuna",
        respuesta: "Las vacunas activan el sistema inmunitario de forma segura, evitando los riesgos de muerte, secuelas graves o internaciones que causan los virus reales.",
        fuente: "Centros para el Control y Prevención de Enfermedades (CDC)",
        orden: 2,
        activo: true,
      }
    ]);

    // 6. Auto-seed vaccine inventory items
    await supabase.from("inventario_vacunas").insert([
      {
        tenant_id: tenant.id,
        nombre: "Hepatitis B Pediátrica",
        nombre_generico: "Antígeno recombinante de Hepatitis B",
        laboratorio: "GSK Biologicals",
        enfermedad: "Hepatitis B",
        stock_actual: 0,
        stock_minimo: 5,
        precio_venta: 120.00,
        via_admin: "Intramuscular",
        temperatura: "2-8°C",
        descripcion: "Inmunización activa contra la infección por el virus de la Hepatitis B."
      },
      {
        tenant_id: tenant.id,
        nombre: "SRP (Triple Viral)",
        nombre_generico: "Sarampión, Rubéola y Paperas",
        laboratorio: "MSD Vacunas",
        enfermedad: "Sarampión, Rubéola y Paperas",
        stock_actual: 0,
        stock_minimo: 5,
        precio_venta: 150.00,
        via_admin: "Subcutánea",
        temperatura: "2-8°C",
        descripcion: "Protección combinada contra sarampión, rubéola y parotiditis."
      }
    ]);

    // 7. Invite the doctor via Supabase Auth Admin API
    const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL 
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` 
      : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || vercelUrl || "https://portal-medico-five.vercel.app";
    
    // We send invitation
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback`,
      data: {
        role: "admin",
        tenant_id: tenant.id,
        tenant_slug: tenant.slug
      }
    });

    if (inviteError) {
      console.warn("Auth invitation failed, but tenant and seeds were created. Error:", inviteError.message);
      return { 
        success: true, 
        warning: `La clínica se creó correctamente, pero falló el envío del correo de invitación: ${inviteError.message}` 
      };
    }

    revalidatePath("/superadmin");
    return { success: true };
  } catch (err: any) {
    console.error("Auto-seeding failed for new tenant:", err);
    return { 
      success: true, 
      warning: "La clínica fue creada, pero ocurrió un error al inyectar los datos semilla de bienvenida." 
    };
  }
}

/**
 * Updates the active/inactive status of a tenant.
 */
export async function toggleTenantActiveAction(tenantId: string, currentStatus: boolean) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("tenants")
    .update({ activo: !currentStatus })
    .eq("id", tenantId);

  if (error) {
    console.error("Error toggling tenant status:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/superadmin");
  return { success: true };
}

/**
 * Updates the payment status (estado_pago) of a tenant.
 */
export async function updateTenantPaymentStatusAction(tenantId: string, estadoPago: "activo" | "mora" | "suspendido") {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("tenants")
    .update({ estado_pago: estadoPago })
    .eq("id", tenantId);

  if (error) {
    console.error("Error updating payment status:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/superadmin");
  return { success: true };
}

/**
 * Tests connection with Supabase database.
 */
export async function testDbConnectionAction() {
  const supabase = createAdminClient();

  try {
    const start = Date.now();
    const { data, error } = await supabase.from("tenants").select("id").limit(1);
    const latency = Date.now() - start;

    if (error) throw error;
    return { success: true, latency };
  } catch (err: any) {
    console.error("DB connection test failed:", err);
    return { success: false, error: err.message };
  }
}
