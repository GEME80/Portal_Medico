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

  // Use service-role client to fetch tenant so that suspended tenants
  // (activo=false) are still readable — RLS blocks anon/authenticated reads
  // when activo=false, which would cause a 404 instead of the suspension overlay.
  const adminSupabase = createAdminClient();

  // Load tenant
  const { data: tenant } = await adminSupabase
    .from("tenants")
    .select("id, nombre, activo, estado_pago, fecha_vencimiento")
    .eq("slug", slug)
    .single();

  if (!tenant) notFound();

  // Load configuration for branding (use admin client — tenant may be inactive)
  const { data: config } = await adminSupabase
    .from("configuracion_portal")
    .select("nombre_doctor, color_primario, color_acento, nombre_menu_vacunas")
    .eq("tenant_id", tenant.id)
    .single();

  const doctorName = config?.nombre_doctor || tenant.nombre || "Doctor";
  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";
  const inventoryName = config?.nombre_menu_vacunas || "Inventario Médico";

  // Check if current user is superadmin (auth session is not affected by RLS)
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  const isSuperadmin = user?.email === process.env.SUPERADMIN_EMAIL || user?.app_metadata?.role === "superadmin";
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
      primaryColor={primaryColor}
      accentColor={accentColor}
      inventoryName={inventoryName}
      isMora={isMora && !isSuperadmin}
      isSuspended={isSuspended && !isSuperadmin}
      daysRemaining={daysRemaining}
    >
      {children}
    </AdminShell>
  );
}
