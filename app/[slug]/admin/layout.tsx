import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AdminShell from "./AdminShell";

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TenantAdminLayout({ children, params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Load tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nombre, estado_pago")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) notFound();

  // Load configuration for branding
  const { data: config } = await supabase
    .from("configuracion_portal")
    .select("nombre_doctor, color_primario, color_acento, nombre_menu_vacunas")
    .eq("tenant_id", tenant.id)
    .single();

  const doctorName = config?.nombre_doctor || tenant.nombre || "Doctor";
  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";
  const inventoryName = config?.nombre_menu_vacunas || "Inventario Médico";

  // Check if current user is superadmin (allows bypass of billing block)
  const { data: { user } } = await supabase.auth.getUser();
  const isSuperadmin = user?.email === process.env.SUPERADMIN_EMAIL || user?.app_metadata?.role === "superadmin";
  const isMora = tenant.estado_pago === "mora";

  return (
    <AdminShell
      tenantSlug={slug}
      doctorName={doctorName}
      primaryColor={primaryColor}
      accentColor={accentColor}
      inventoryName={inventoryName}
      isMora={isMora && !isSuperadmin}
    >
      {children}
    </AdminShell>
  );
}
