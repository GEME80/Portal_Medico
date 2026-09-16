import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import RipsManager, { HistoriaItem } from "./RipsManager";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ReportesPage({ params }: Props) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();

  if (!user) {
    redirect(`/${cleanSlug}/login`);
  }

  // Load tenant
  let tenant: { id: string; nombre: string; slug: string } | null = null;
  const { data: authTenant } = await authSupabase
    .from("tenants")
    .select("id, nombre, slug")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (authTenant) {
    tenant = authTenant;
  } else {
    try {
      const adminClient = createAdminClient();
      const { data: adminTenant } = await adminClient
        .from("tenants")
        .select("id, nombre, slug")
        .eq("slug", cleanSlug)
        .maybeSingle();
      if (adminTenant) tenant = adminTenant;
    } catch {
      // ignore
    }
  }

  if (!tenant) notFound();

  // Load historias clínicas for RIPS report (safe metadata projection only)
  const adminClient = createAdminClient();
  const { data: historias, error } = await adminClient
    .from("historias_clinicas")
    .select(`
      id,
      created_at,
      estado,
      impresion_diagnostica,
      procedimientos,
      snapshot_demografico,
      pacientes (
        id,
        documento,
        tipo_documento,
        nombres,
        apellidos
      )
    `)
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading clinical records for RIPS:", error);
  }

  const safeHistorias = (historias || []) as unknown as HistoriaItem[];

  return (
    <div className="admin-content" style={{ padding: "28px" }}>
      <RipsManager
        tenantSlug={cleanSlug}
        tenantName={tenant.nombre}
        historias={safeHistorias}
      />
    </div>
  );
}
