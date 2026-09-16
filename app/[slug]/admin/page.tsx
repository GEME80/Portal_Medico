import { createAdminClient, createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import DashboardCharts from "./DashboardCharts";
import { 
  CalendarDays, 
  Users, 
  FileSpreadsheet, 
  ShieldCheck 
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

  // Fetch all items, categories, movements and KPI counts concurrently in a single batch
  const [
    { count: totalInventario },
    { count: stockBajo },
    { data: inventarioData, error: invErr },
    { data: categoriasData },
    { data: movimientosData },
    { data: lotesData }
  ] = await Promise.all([
    db.from("inventario_medico").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
    db.from("inventario_medico").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).lte("stock_actual", 5),
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
    
  // --- KPI Calculations ---
  const parseCategoryName = (nombre: string): string => {
    try {
      const trimmed = nombre.trim();
      if (trimmed && trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const parsed = JSON.parse(trimmed);
        return parsed.n || nombre;
      }
    } catch (e) {
      // Ignore
    }
    return nombre || "";
  };
  
  // 1. Capital Invertido y Desglose
  let capitalInvertido = 0;
  const capitalPorCategoria: Record<string, {nombre: string, total: number}> = {};
  safeCategorias.forEach((c: any) => capitalPorCategoria[c.id] = { nombre: parseCategoryName(c.nombre), total: 0 });

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
    categoriasMap[c.id] = parseCategoryName(c.nombre);
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
  const { count: lotesVencer } = await db
    .from("lotes_inventario")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .lte("fecha_vencimiento", noventaDias.toISOString())
    .gt("cantidad", 0);

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
