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
  const [
    { data: inventarioData, error: invErr },
    { data: categoriasData },
    { data: movimientosData },
    { data: lotesData }
  ] = await Promise.all([
    supabase.from("inventario_medico").select("*").eq("tenant_id", tenant.id),
    supabase.from("categorias_inventario").select("*").eq("tenant_id", tenant.id),
    supabase.from("movimientos_inventario").select("*").eq("tenant_id", tenant.id),
    supabase.from("lotes_inventario").select("*").eq("tenant_id", tenant.id).order("fecha_registro", { ascending: false })
  ]);

  if (invErr) {
    console.error(invErr);
    return <div style={{ padding: "40px", color: "red" }}>Error al cargar datos del dashboard.</div>;
  }

  const safeCategorias = categoriasData || [];
  const safeMovimientos = movimientosData || [];
  const safeInventario = inventarioData || [];
  const safeLotes = lotesData || [];
    
  // --- KPI Calculations ---
  
  // 1. Capital Invertido y Desglose
  let capitalInvertido = 0;
  const capitalPorCategoria: Record<string, {nombre: string, total: number}> = {};
  safeCategorias.forEach((c: any) => capitalPorCategoria[c.id] = { nombre: c.nombre, total: 0 });

  // 4. Ítems en Riesgo Crítico
  const itemsEnRiesgo: any[] = [];

  // 3. Top Margen de Contribución
  const margenItems: any[] = [];

  safeInventario.forEach(item => {
    // Capital
    const valorItem = (item.stock_actual * (item.valor_mayorista || 0));
    capitalInvertido += valorItem;
    if (item.categoria_id && capitalPorCategoria[item.categoria_id]) {
      capitalPorCategoria[item.categoria_id].total += valorItem;
    }

    // Riesgo
    if (item.stock_actual <= item.stock_minimo) {
      itemsEnRiesgo.push(item);
    }

    // Margen
    const margen = (item.precio_venta || 0) - (item.valor_mayorista || 0);
    margenItems.push({ nombre: item.nombre, margen });
  });

  const capitalDesglose = Object.values(capitalPorCategoria)
    .filter(c => c.total > 0)
    .map(c => `${c.nombre}: ${Math.round((c.total / capitalInvertido) * 100)}%`)
    .join(" | ");

  const topMargen = margenItems.sort((a, b) => b.margen - a.margen).slice(0, 3);

  // 2. Costo de Merma
  let costoMerma = 0;
  
  // 5. Ítems Inactivos (30 días)
  // 6. Flujo Mensual
  let entradasAnio = 0;
  let salidasAnio = 0;
  
  const treintaDiasAtras = new Date();
  treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
  
  const inicioAnio = new Date();
  inicioAnio.setMonth(0, 1);
  inicioAnio.setHours(0, 0, 0, 0);

  const itemsConSalidaReciente = new Set();
  
  const categoriasMap: Record<string, string> = {};
  safeCategorias.forEach(c => {
    categoriasMap[c.id] = c.nombre;
  });

  // Iterar movimientos de salida para varios cálculos
  safeMovimientos.forEach(m => {
    const fechaMov = new Date(m.fecha);
    const item = safeInventario.find(i => i.id === m.item_id);
    const costoUnitario = item?.valor_mayorista || 0;

    // Mermas
    if (m.tipo_movimiento === "SALIDA" && m.motivo && m.motivo.startsWith("MERMA")) {
        costoMerma += (m.cantidad * costoUnitario);
    }

    // Inactivos
    if (m.tipo_movimiento === "SALIDA" && fechaMov >= treintaDiasAtras && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
        itemsConSalidaReciente.add(m.item_id);
    }

    // Flujo Mensual
    if (fechaMov >= inicioAnio) {
        if (m.tipo_movimiento === "ENTRADA") entradasAnio += m.cantidad;
        if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) salidasAnio += m.cantidad;
    }
  });

  const itemsInactivos = safeInventario.filter(i => !itemsConSalidaReciente.has(i.id)).length;
  
  const totalUnidadesInventario = safeInventario.reduce((acc, v) => acc + (v.stock_actual || 0), 0);
  const itemsAgotados = safeInventario.filter(v => v.stock_actual === 0).length;
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

        {/* KPIs Operativos (Globales) */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "16px" }}>📦 Estado Físico del Inventario (Global)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            
            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📦</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{totalUnidadesInventario}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Total Unidades Físicas
                  <span title="Suma total de todas las dosis de todos los ítems almacenados." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: itemsAgotados > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", color: itemsAgotados > 0 ? "#ef4444" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{itemsAgotados > 0 ? "🛑" : "✅"}</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: itemsAgotados > 0 ? "#ef4444" : "var(--slate-900)", lineHeight: 1 }}>{itemsAgotados}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ítems Agotados (Stock 0)
                  <span title="Medicamentos que no tienen ninguna dosis disponible actualmente." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", border: itemsEnRiesgo.length > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: itemsEnRiesgo.length > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)", color: itemsEnRiesgo.length > 0 ? "#f59e0b" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{itemsEnRiesgo.length > 0 ? "⚠️" : "✅"}</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: itemsEnRiesgo.length > 0 ? "#d97706" : "var(--slate-900)", lineHeight: 1 }}>{itemsEnRiesgo.length}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ítems en Riesgo Crítico
                    <span title="Ítems cuyo stock actual es menor o igual a su stock mínimo de alerta." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                  </div>
                </div>
              </div>
              {itemsEnRiesgo.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {itemsEnRiesgo.map((item, idx) => (
                    <span key={idx} style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>{item.nombre}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(100, 116, 139, 0.1)", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>⏳</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{itemsInactivos}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ítems Inactivos (30d)
                  <span title="Medicamentos que no han tenido ninguna salida (aplicación) en los últimos 30 días." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                </div>
              </div>
            </div>

          </div>
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
