import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AdminShell from "./AdminShell";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TenantAdminLayout({ children, params }: Props) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  // Load tenant with resilient fallback (auth client first, then admin client)
  let tenant: any = null;
  const { data: authTenant } = await authSupabase
    .from("tenants")
    .select("id, nombre, activo, estado_pago, fecha_vencimiento")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (authTenant) {
    tenant = authTenant;
  } else {
    try {
      const adminSupabase = createAdminClient();
      const { data: adminTenant } = await adminSupabase
        .from("tenants")
        .select("id, nombre, activo, estado_pago, fecha_vencimiento")
        .eq("slug", cleanSlug)
        .maybeSingle();
      if (adminTenant) tenant = adminTenant;
    } catch (_) {}
  }

  if (!tenant) notFound();

  // Load configuration for branding
  let config: any = null;
  const { data: confData } = await authSupabase
    .from("configuracion_portal")
    .select("nombre_doctor, color_primario, color_acento, hero_badge_texto")
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  config = confData;

  let heroData: any = {};
  if (config?.hero_badge_texto) {
    try {
      if (typeof config.hero_badge_texto === "string" && config.hero_badge_texto.startsWith("{")) {
        heroData = JSON.parse(config.hero_badge_texto);
      }
    } catch (_) {}
  }

  const doctorName = config?.nombre_doctor || tenant.nombre || "Doctor";
  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";
  const inventoryName = heroData?.nombre_menu_vacunas || "Inventario Médico";
  const habilitarMenuVacunas = heroData?.habilitar_menu_vacunas !== false;

  // Check if current user is superadmin (auth session is not affected by RLS)
  const isSuperadmin = user?.email?.toLowerCase() === process.env.SUPERADMIN_EMAIL?.toLowerCase() || user?.email?.toLowerCase() === "gerkof@gmail.com" || user?.app_metadata?.role === "superadmin";
  const userMetadataPerm = user?.user_metadata?.inventario_enabled;
  const inventarioHabilitado = isSuperadmin || (userMetadataPerm !== undefined ? Boolean(userMetadataPerm) : habilitarMenuVacunas);

  // Determine role and permissions
  let userRole: "superadmin" | "admin" | "medico" | "recepcion" = "medico";
  let userPermisos: any = {
    citas: true,
    pacientes_demograficos: true,
    inventario: true,
    noticias: true,
  };
  let userDisplayName = doctorName;

  if (isSuperadmin) {
    userRole = "superadmin";
  } else if (user) {
    const { data: memberData } = await authSupabase
      .from("miembros_equipo")
      .select("rol, nombre, permisos, activo")
      .eq("tenant_id", tenant.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberData) {
      userRole = memberData.rol;
      if (memberData.nombre) userDisplayName = memberData.nombre;
      if (memberData.permisos) userPermisos = memberData.permisos;
    } else if (user.app_metadata?.role) {
      userRole = user.app_metadata.role;
      if (user.user_metadata?.nombre) userDisplayName = user.user_metadata.nombre;
      if (user.user_metadata?.permisos) userPermisos = user.user_metadata.permisos;
    }
  }

  const isMora = tenant.estado_pago === "mora";
  const isSuspended = !tenant.activo || tenant.estado_pago === "suspendido";

  let daysRemaining = 5;
  if (tenant.fecha_vencimiento) {
    daysRemaining = Math.max(0, Math.ceil((new Date(tenant.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <AdminShell
      tenantSlug={slug}
      doctorName={doctorName}
      userDisplayName={userDisplayName}
      userRole={userRole}
      userPermisos={userPermisos}
      primaryColor={primaryColor}
      accentColor={accentColor}
      inventoryName={inventoryName}
      isMora={isMora && !isSuperadmin}
      isSuspended={isSuspended && !isSuperadmin}
      daysRemaining={daysRemaining}
      isSuperadmin={isSuperadmin}
      inventarioHabilitado={inventarioHabilitado}
    >
      {children}
    </AdminShell>
  );
}
