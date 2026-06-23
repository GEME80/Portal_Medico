import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TenantAdminDashboard({ params }: Props) {
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

  // Load configuration
  const { data: config } = await supabase
    .from("configuracion_portal")
    .select("nombre_doctor, color_primario, color_acento")
    .eq("tenant_id", tenant.id)
    .single();

  const doctorName = config?.nombre_doctor || "Doctor";
  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";

  const modules = [
    { href: `/${slug}/admin/vacunas`, icon: "💉", title: "Control de Vacunas", desc: "Gestión de inventario, lotes, alertas de stock y registro de dosis aplicadas.", color: primaryColor },
    { href: `/${slug}/admin/personalizar`, icon: "🎨", title: "Personalizar Portal", desc: "Configura el contenido y colores de tu página web de presentación pública.", color: accentColor },
  ];

  return (
    <>
      <div className="admin-topbar">
        <h1 className="admin-topbar-title">Dashboard</h1>
        <div className="admin-topbar-right">
          <span className="badge badge-emerald">Sistema activo</span>
        </div>
      </div>

      <div className="admin-content">
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "22px", fontWeight: 800, marginBottom: "8px", color: "var(--slate-900)" }}>
            Bienvenido, {doctorName} 👋
          </h2>
          <p style={{ color: "var(--slate-500)", fontSize: "14px" }}>
            Selecciona un módulo del panel de navegación para comenzar.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
          {modules.map((m, i) => (
            <Link key={i} href={m.href} style={{ textDecoration: "none" }}>
              <div className="card" style={{ padding: "28px", cursor: "pointer", height: "100%" }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "var(--radius-md)",
                  background: m.color, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "24px", marginBottom: "16px",
                  color: "white"
                }}>{m.icon}</div>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "16px", fontWeight: 800, marginBottom: "8px", color: "var(--slate-900)" }}>
                  {m.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--slate-500)", lineHeight: 1.6 }}>{m.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
