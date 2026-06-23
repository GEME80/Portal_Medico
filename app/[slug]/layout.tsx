import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import { headers } from "next/headers";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TenantLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nombre")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) return { title: "Portal Médico" };

  const { data: config } = await supabase
    .from("configuracion_portal")
    .select("meta_titulo, meta_descripcion")
    .eq("tenant_id", tenant.id)
    .single();

  return {
    title: config?.meta_titulo || tenant.nombre,
    description: config?.meta_descripcion || "",
  };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isAdmin = pathname.includes("/admin");

  const supabase = await createClient();

  // Validate tenant exists and is active
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, slug, nombre")
    .eq("slug", slug)
    .eq("activo", true)
    .single();

  if (!tenant) notFound();

  if (isAdmin) {
    return <>{children}</>;
  }

  // Load portal config and active alert in parallel
  const [configRes, alertRes] = await Promise.all([
    supabase
      .from("configuracion_portal")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single(),
    supabase
      .from("alertas_epidemiologicas")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("activa", true)
      .order("created_at", { ascending: false })
      .limit(1)
  ]);

  const config = configRes.data;
  const alerta = alertRes.data?.[0] || null;

  const nombreMenuVacunas = config?.nombre_menu_vacunas || "EcoVaccine";
  const habilitarMenuVacunas = config?.habilitar_menu_vacunas !== false;
  const logoUrl = config?.logo_url || "";

  return (
    <>
      <Navbar
        tenantSlug={slug}
        nombreClinica={config?.nombre_clinica || config?.nombre_doctor || tenant.nombre}
        logoUrl={logoUrl}
        nombreMenuVacunas={nombreMenuVacunas}
        habilitarMenuVacunas={habilitarMenuVacunas}
      />
      {alerta && (
        <div className={`alert-banner level-${alerta.nivel}`}>
          <div className="container">
            <div className="alert-inner">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <strong className="alert-title">{alerta.titulo}</strong>
                {alerta.descripcion && <p className="alert-desc">{alerta.descripcion}</p>}
              </div>
              <span className="badge" style={{
                background: "rgba(180, 83, 9, 0.1)",
                color: "#b45309",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                padding: "4px 10px",
                borderRadius: "30px"
              }}>
                ACTUALIZADO
              </span>
            </div>
          </div>
        </div>
      )}
      <main>{children}</main>
      <Footer
        tenantSlug={slug}
        nombreDoctor={config?.nombre_doctor || ""}
        email={config?.email || ""}
        telefono={config?.telefono || ""}
        logoUrl={logoUrl}
        nombreMenuVacunas={nombreMenuVacunas}
        habilitarMenuVacunas={habilitarMenuVacunas}
      />
    </>
  );
}
