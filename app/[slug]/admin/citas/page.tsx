import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminCitasManager from "./AdminCitasManager";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CitasPage({ params }: Props) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  if (!user) {
    redirect(`/${slug}/login`);
  }

  // Obtener tenant con fallback resiliente
  let tenant: any = null;
  const { data: authTenant } = await authSupabase
    .from("tenants")
    .select("id, nombre")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (authTenant) {
    tenant = authTenant;
  } else {
    try {
      const adminSupabase = createAdminClient();
      const { data: adminTenant } = await adminSupabase
        .from("tenants")
        .select("id, nombre")
        .eq("slug", cleanSlug)
        .maybeSingle();
      if (adminTenant) tenant = adminTenant;
    } catch (_) {}
  }

  if (!tenant) {
    redirect(`/${slug}/login`);
  }

  let citas: any[] = [];
  let tableMissing = false;
  let initialConfig = undefined;

  try {
    const { data: configRow } = await authSupabase
      .from("configuracion_portal")
      .select("hero_badge_texto")
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    if (configRow?.hero_badge_texto) {
      try {
        const parsed = typeof configRow.hero_badge_texto === "string"
          ? JSON.parse(configRow.hero_badge_texto)
          : configRow.hero_badge_texto;
        if (parsed?.agenda_config) {
          initialConfig = parsed.agenda_config;
        }
      } catch (e) {}
    }

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("citas_medicas")
      .select("*, pacientes(nombres, apellidos, documento)")
      .eq("tenant_id", tenant.id)
      .order("fecha_hora", { ascending: false });

    if (error) {
      if (error.message?.includes("does not exist")) {
        tableMissing = true;
      } else {
        console.error("Error al consultar citas:", error);
      }
    } else if (data) {
      citas = data;
    }
  } catch (err: any) {
    console.error("Error de conexión al consultar citas:", err);
    tableMissing = true;
  }

  return (
    <AdminCitasManager
      tenantSlug={slug}
      initialCitas={citas}
      initialConfig={initialConfig}
      tableMissing={tableMissing}
    />
  );
}
