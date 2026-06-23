import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardCharts from "./DashboardCharts";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TenantAdminDashboard({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Load configuration and tenant in parallel for speed
  const [tenantRes, configRes] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, nombre")
      .eq("slug", slug)
      .eq("activo", true)
      .single(),
    supabase
      .from("configuracion_portal")
      .select("nombre_doctor, color_primario, color_acento, nombre_menu_vacunas")
      .eq("tenant_id", (await supabase.from('tenants').select('id').eq('slug', slug).single()).data?.id)
      .single()
  ]);

  const tenant = tenantRes.data;
  if (!tenant) notFound();
  
  const config = configRes.data;
  const doctorName = config?.nombre_doctor || "Doctor";
  const primaryColor = config?.color_primario || "#0A4D5C";
  const accentColor = config?.color_acento || "#00D4AA";
  const inventoryName = config?.nombre_menu_vacunas || "Inventario Médico";

  // KPIs Queries
  const { count: totalInventario } = await supabase
    .from("inventario_medico")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  const { count: stockBajo } = await supabase
    .from("inventario_medico")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .lte("stock_actual", 5); // Simplification: we'd ideally compare stock_actual <= stock_minimo but PostgREST can't do column comparison easily without RPC, so we fetch low stock or assume a generic threshold, or we fetch all and filter.
    
  // Fetch all items, categories and movements
  const [inventarioRes, categoriasRes, movimientosRes] = await Promise.all([
    supabase.from("inventario_medico").select("*").eq("tenant_id", tenant.id),
    supabase.from("categorias_inventario").select("*").eq("tenant_id", tenant.id),
    supabase.from("movimientos_inventario").select("*").eq("tenant_id", tenant.id)
  ]);
  
  const inventarioData = inventarioRes.data || [];
  const categoriasData = categoriasRes.data || [];
  const movimientosData = movimientosRes.data || [];
    
  let stockCriticoCount = 0;
  let capitalInvertido = 0;
  let ingresoPotencial = 0;
  
  inventarioData.forEach(item => {
    if (item.stock_actual <= item.stock_minimo) stockCriticoCount++;
    capitalInvertido += (item.stock_actual * (item.valor_mayorista || 0));
    ingresoPotencial += (item.stock_actual * (item.precio_venta || 0));
  });
  const utilidadProyectada = ingresoPotencial - capitalInvertido;

  // Lotes por vencer (90 días)
  const noventaDias = new Date();
  noventaDias.setDate(noventaDias.getDate() + 90);
  const { count: lotesVencer } = await supabase
    .from("lotes_inventario")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .lte("fecha_vencimiento", noventaDias.toISOString())
    .gt("cantidad", 0);

  


  

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
            Resumen de tu operación. Selecciona un módulo para gestionar tu portal.
          </p>
        </div>

        {/* KPIs Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>💸</div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${(capitalInvertido/1000000).toFixed(1)}M</div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Capital Invertido</div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>💰</div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${(ingresoPotencial/1000000).toFixed(1)}M</div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ingreso Potencial</div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>📈</div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${(utilidadProyectada/1000000).toFixed(1)}M</div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Utilidad Proyectada</div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", border: stockCriticoCount > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: stockCriticoCount > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)", color: stockCriticoCount > 0 ? "#f59e0b" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>{stockCriticoCount > 0 ? "⚠️" : "✅"}</div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: stockCriticoCount > 0 ? "#d97706" : "var(--slate-900)", lineHeight: 1 }}>{stockCriticoCount}</div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ítems en Riesgo</div>
            </div>
          </div>
        </div>

        <DashboardCharts 
          inventario={inventarioData}
          categorias={categoriasData}
          movimientos={movimientosData}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      </div>
    </>
  );
}
