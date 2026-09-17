import { createAdminClient, createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardCharts from "./DashboardCharts";
import { 
  CalendarDays, 
  Users, 
  FileSpreadsheet, 
  ShieldCheck,
  Package,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TenantAdminDashboard({ params }: Props) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

  const authSupabase = await createClient();

  // Load tenant with resilient fallback
  let tenant: any = null;
  const { data: authTenant } = await authSupabase
    .from("tenants")
    .select("id, nombre, activo, estado_pago")
    .eq("slug", cleanSlug)
    .maybeSingle();

  if (authTenant) {
    tenant = authTenant;
  } else {
    try {
      const adminSupabase = createAdminClient();
      const { data: adminTenant } = await adminSupabase
        .from("tenants")
        .select("id, nombre, activo, estado_pago")
        .eq("slug", cleanSlug)
        .maybeSingle();
      if (adminTenant) tenant = adminTenant;
    } catch (_) {}
  }

  if (!tenant) notFound();

  // Load config
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

  const doctorName = config?.nombre_doctor || "Doctor";
  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";
  const inventoryName = heroData?.nombre_menu_vacunas || "Inventario Médico";

  const db = createAdminClient();

  // Calculate 90-day threshold for lotes expiration
  const noventaDias = new Date();
  noventaDias.setDate(noventaDias.getDate() + 90);

  // Fetch all counts concurrently using ultra-lightweight head: true requests alongside data
  const [
    { count: totalPacientes },
    { count: totalCitas },
    { count: totalInventario },
    { count: stockBajo },
    { count: lotesPorVencer },
    { data: inventarioData, error: invErr },
    { data: categoriasData },
    { data: movimientosData },
    { data: lotesData }
  ] = await Promise.all([
    db.from("pacientes").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("citas_medicas").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("inventario_medico").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("inventario_medico").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).lte("stock_actual", 5),
    db.from("lotes_inventario").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).lte("fecha_vencimiento", noventaDias.toISOString()).gt("cantidad", 0),
    db.from("inventario_medico").select("*").eq("tenant_id", tenant.id),
    db.from("categorias_inventario").select("*").eq("tenant_id", tenant.id),
    db.from("movimientos_inventario").select("*").eq("tenant_id", tenant.id),
    db.from("lotes_inventario").select("*").eq("tenant_id", tenant.id).order("fecha_registro", { ascending: false })
  ]);

  if (invErr) {
    console.error(invErr);
    return <div style={{ padding: "40px", color: "red" }}>Error al cargar datos del dashboard.</div>;
  }

  const safeCategorias = categoriasData || [];
  const safeMovimientos = movimientosData || [];
  const safeInventario = inventarioData || [];
  const safeLotes = lotesData || [];

  return (
    <>
      <div className="admin-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 className="admin-topbar-title">Dashboard Médico</h1>
          <span style={{ fontSize: "12px", color: "var(--doc-text-muted)" }}>/ Resumen Clínico</span>
        </div>
        <div className="admin-topbar-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className="rips-compliance-badge rips-badge-ready">
            <ShieldCheck size={14} /> MinSalud RIPS 2026
          </span>
          <span className="badge badge-emerald" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span className="pulse-dot" /> En Línea
          </span>
        </div>
      </div>

      <div className="admin-content">
        {/* ── HEADER CORPORATIVO Y ACCESOS RÁPIDOS ─────────────────── */}
        <div className="doc-dashboard-header">
          <div>
            <h2 className="doc-welcome-title">
              Dr. {doctorName}
            </h2>
            <p className="doc-welcome-sub">
              Control operacional y clínico centralizado · Consultorio Habilitado
            </p>
          </div>

          <div className="doc-quick-actions">
            <Link href={`/${slug}/admin/citas`} className="doc-btn doc-btn-accent">
              <CalendarDays size={16} />
              <span>Ver Agenda</span>
            </Link>
            <Link href={`/${slug}/admin/pacientes`} className="doc-btn doc-btn-primary">
              <Users size={16} />
              <span>Pacientes</span>
            </Link>
            <Link href={`/${slug}/admin/reportes`} className="doc-btn doc-btn-ghost">
              <FileSpreadsheet size={16} />
              <span>Reportes RIPS</span>
            </Link>
          </div>
        </div>

        {/* ── TIRA DE MÉTRICAS CLÍNICAS EJECUTIVAS ─────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "14px",
          marginBottom: "24px"
        }}>
          {/* Pacientes Registrados */}
          <Link href={`/${slug}/admin/pacientes`} style={{ textDecoration: "none" }}>
            <div className="card" style={{
              padding: "16px 18px",
              background: "#ffffff",
              border: "1px solid var(--slate-200)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(10, 77, 92, 0.08)",
                color: primaryColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Users size={20} />
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>
                  {totalPacientes || 0}
                </div>
                <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, marginTop: "4px" }}>
                  Pacientes Registrados
                </div>
              </div>
            </div>
          </Link>

          {/* Citas Agendadas */}
          <Link href={`/${slug}/admin/citas`} style={{ textDecoration: "none" }}>
            <div className="card" style={{
              padding: "16px 18px",
              background: "#ffffff",
              border: "1px solid var(--slate-200)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(0, 212, 170, 0.12)",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CalendarDays size={20} />
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>
                  {totalCitas || 0}
                </div>
                <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, marginTop: "4px" }}>
                  Citas Agendadas
                </div>
              </div>
            </div>
          </Link>

          {/* Biológicos e Insumos */}
          <Link href={`/${slug}/admin/inventario`} style={{ textDecoration: "none" }}>
            <div className="card" style={{
              padding: "16px 18px",
              background: "#ffffff",
              border: "1px solid var(--slate-200)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(14, 165, 233, 0.08)",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Package size={20} />
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>
                  {totalInventario || 0}
                </div>
                <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, marginTop: "4px" }}>
                  {inventoryName}
                </div>
              </div>
            </div>
          </Link>

          {/* Alertas de Stock y Vencimiento */}
          <Link href={`/${slug}/admin/inventario`} style={{ textDecoration: "none" }}>
            <div className="card" style={{
              padding: "16px 18px",
              background: "#ffffff",
              border: (stockBajo || 0) > 0 || (lotesPorVencer || 0) > 0 ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid var(--slate-200)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: (stockBajo || 0) > 0 || (lotesPorVencer || 0) > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.08)",
                color: (stockBajo || 0) > 0 || (lotesPorVencer || 0) > 0 ? "#d97706" : "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {(stockBajo || 0) > 0 || (lotesPorVencer || 0) > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: (stockBajo || 0) > 0 ? "#d97706" : "var(--slate-900)", lineHeight: 1 }}>
                  {(stockBajo || 0) + (lotesPorVencer || 0)}
                </div>
                <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, marginTop: "4px" }}>
                  {(stockBajo || 0) > 0 || (lotesPorVencer || 0) > 0 ? "Alertas de Stock / Lote" : "Inventario al Día"}
                </div>
              </div>
            </div>
          </Link>
        </div>

        <DashboardCharts 
          inventario={safeInventario}
          categorias={safeCategorias}
          movimientos={safeMovimientos}
          lotes={safeLotes}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      </div>
    </>
  );
}
