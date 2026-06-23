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

  // Load portal config for Navbar/Footer
  const { data: config } = await supabase
    .from("configuracion_portal")
    .select("nombre_doctor, nombre_clinica, email, telefono, color_primario, color_acento")
    .eq("tenant_id", tenant.id)
    .single();

  return (
    <>
      <Navbar
        tenantSlug={slug}
        nombreClinica={config?.nombre_clinica || config?.nombre_doctor || tenant.nombre}
      />
      <main>{children}</main>
      <Footer
        tenantSlug={slug}
        nombreDoctor={config?.nombre_doctor || ""}
        email={config?.email || ""}
        telefono={config?.telefono || ""}
      />
    </>
  );
}
