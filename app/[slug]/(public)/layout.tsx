import { createAdminClient, createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TenantLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, nombre")
    .eq("slug", cleanSlug)
    .maybeSingle();

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
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
  
  // Use admin client for data reads so suspended tenants (activo=false)
  // are still readable — with automatic fallback to anon client if needed.
  const adminSupabase = createAdminClient();

  // Validate tenant exists and check status
  let { data: tenant, error: tenantErr } = await adminSupabase
    .from("tenants")
    .select("id, slug, nombre, activo, estado_pago")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (!tenant && tenantErr) {
    const authSupabase = await createClient();
    const fallbackRes = await authSupabase
      .from("tenants")
      .select("id, slug, nombre, activo, estado_pago")
      .eq("slug", cleanSlug)
      .maybeSingle();
    tenant = fallbackRes.data;
  }

  if (!tenant) notFound();

  // Get user session to bypass suspension if superadmin
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  const isSuperadmin = user?.email?.toLowerCase() === process.env.SUPERADMIN_EMAIL?.toLowerCase() || user?.email?.toLowerCase() === "gerkof@gmail.com" || user?.app_metadata?.role === "superadmin";
  const isSuspended = (!tenant.activo || tenant.estado_pago === "suspendido") && !isSuperadmin;

  // Load portal config and active alert in parallel
  const [configRes, alertRes] = await Promise.all([
    adminSupabase
      .from("configuracion_portal")
      .select("*")
      .eq("tenant_id", tenant.id)
      .single(),
    adminSupabase
      .from("alertas_epidemiologicas")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("activa", true)
      .order("created_at", { ascending: false })
      .limit(1)
  ]);

  const config = configRes.data;
  const alerta = alertRes.data?.[0] || null;

  let heroData = {
    habilitar_menu_vacunas: true,
    nombre_menu_vacunas: "HubMed"
  };
  if (config?.hero_badge_texto) {
    try {
      const parsed = JSON.parse(config.hero_badge_texto);
      if (parsed) {
        heroData = { ...heroData, ...parsed };
      }
    } catch (e) {}
  }

  const nombreMenuVacunas = heroData.nombre_menu_vacunas || "HubMed";
  const habilitarMenuVacunas = heroData.habilitar_menu_vacunas !== false;
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
      {isSuspended ? (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(11, 15, 25, 0.8)",
          backdropFilter: "blur(20px)",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px"
        }}>
          <div style={{
            maxWidth: "480px",
            width: "100%",
            background: "#0f172a",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "24px",
            padding: "40px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(239, 68, 68, 0.1)",
            textAlign: "center",
            fontFamily: "'Outfit', sans-serif"
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "64px",
              height: "64px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "20px",
              fontSize: "32px",
              marginBottom: "24px",
              color: "#ef4444"
            }}>
              🔒
            </div>
            
            <h2 style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#ffffff",
              margin: "0 0 12px 0",
              letterSpacing: "-0.02em"
            }}>
              Portal Suspendido
            </h2>
            <p style={{
              fontSize: "15px",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              margin: "0 0 32px 0"
            }}>
              Este portal médico no está disponible temporalmente por falta de pago. Si eres el administrador del sitio, ponte en contacto con soporte técnico para regularizar tu estado de suscripción.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <a
                href="mailto:soporte@hubmed.app?subject=Reactivacion%20de%20Cuenta"
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  borderRadius: "12px",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-block",
                  transition: "opacity 0.15s",
                  fontFamily: "inherit"
                }}
              >
                Contactar Soporte
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
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
                    fontSize: "12px",
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    padding: "6px 12px",
                    borderRadius: "30px",
                    whiteSpace: "nowrap"
                  }}>
                    {new Date(alerta.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )}
          <main>{children}</main>
        </>
      )}
      <Footer
        tenantSlug={slug}
        nombreDoctor={config?.nombre_doctor || ""}
        email={config?.email || ""}
        telefono={config?.telefono || ""}
        logoUrl={logoUrl}
        nombreMenuVacunas={nombreMenuVacunas}
        habilitarMenuVacunas={habilitarMenuVacunas}
        direccion={config?.direccion || ""}
        whatsapp={config?.whatsapp || ""}
      />
    </>
  );
}
