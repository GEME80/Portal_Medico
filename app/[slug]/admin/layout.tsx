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
    .select("id, nombre")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) notFound();

  // Load configuration for branding
  const { data: config } = await supabase
    .from("configuracion_portal")
    .select("nombre_doctor, color_primario, color_acento")
    .eq("tenant_id", tenant.id)
    .single();

  const doctorName = config?.nombre_doctor || "Doctor";
  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  return (
    <AdminShell
      tenantSlug={slug}
      doctorName={doctorName}
      primaryColor={primaryColor}
      accentColor={accentColor}
    >
      {children}
    </AdminShell>
  );
}
