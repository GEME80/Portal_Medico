"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type EstadoStock = "ok" | "low" | "critical";
type TipoMovimiento = "ENTRADA" | "SALIDA";

interface Categoria {
  id: string;
  nombre: string;
  color: string;
}

interface Lote {
  id: string;
  numero: string;
  cantidad: number;
  fechaFabricacion: string;
  fechaVencimiento: string;
  proveedor: string;
  precioCompra?: string;
  factura?: string;
  fechaRegistro: string;
}

interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  fecha: string;
  notas?: string;
}

interface InventarioItem {
  id: string;
  categoria_id: string;
  nombre: string;
  nombreGenerico: string;
  laboratorio: string;
  enfermedad: string;
  viaAdmin: string;
  esquemaDosis: string;
  stockMinimo: number;
  stockActual: number;
  precioVenta: string;
  temperatura: string;
  descripcion: string;
  loteActivo: string;
  movimientos: Movimiento[];
  lotes: Lote[];
}

const getStockStatus = (v: InventarioItem): EstadoStock => {
  if (v.stockActual === 0) return "critical";
  if (v.stockActual <= v.stockMinimo) return "low";
  return "ok";
};

const stockChipLabel: Record<EstadoStock, string> = {
  ok: "✓ OK",
  low: "⚠ Stock Bajo",
  critical: "● Agotado",
};

const stockChipClass: Record<EstadoStock, string> = {
  ok: "chip-ok",
  low: "chip-low",
  critical: "chip-critical",
};

const today = () => new Date().toISOString().split("T")[0];

interface Toast { id: string; msg: string; type: "success" | "error" | "info"; }

interface Props {
  params: Promise<{ slug: string }>;
}

export default function TenantAdminVacunasPage({ params }: Props) {
  const [slug, setSlug] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0A4D5C");
  const [accentColor, setAccentColor] = useState("#00D4AA");
  const [vacunas, setVacunas] = useState<InventarioItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"catalogo" | "categorias">("catalogo");

  const supabase = createClient();

  // Modal refs
  const newVacunaRef = useRef<HTMLDialogElement>(null);
  const loteRef      = useRef<HTMLDialogElement>(null);
  const usarRef      = useRef<HTMLDialogElement>(null);

  // Selected vaccine for actions
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dosisNotas, setDosisNotas] = useState("");

  const selectedVacuna = vacunas.find(v => v.id === selectedId);

  // Toast helper
  const addToast = useCallback((msg: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const loadData = async (tId: string) => {
    try {
      const [vacsRes, catRes] = await Promise.all([
        supabase.from("inventario_medico").select("*, categoria_id").eq("tenant_id", tId).order("nombre"),
        supabase.from("categorias_inventario").select("*").eq("tenant_id", tId).order("nombre")
      ]);

      const vacs = vacsRes.data;
      if (vacsRes.error) throw vacsRes.error;
      
      setCategorias(catRes.data || []);

      const enrichedVacs = await Promise.all((vacs || []).map(async (v) => {
        const [lotsRes, movsRes] = await Promise.all([
          supabase.from("lotes_inventario").select("*").eq("item_id", v.id).order("fecha_registro", { ascending: false }),
          supabase.from("movimientos_inventario").select("*").eq("item_id", v.id).order("fecha", { ascending: false })
        ]);

        return {
          id: v.id,
          categoria_id: v.categoria_id,
          nombre: v.nombre,
          nombreGenerico: v.nombre_generico || "",
          laboratorio: v.laboratorio || "",
          enfermedad: v.enfermedad || "",
          viaAdmin: v.via_admin || "Intramuscular",
          esquemaDosis: v.esquema_dosis || "",
          stockMinimo: v.stock_minimo || 5,
          stockActual: v.stock_actual || 0,
          precioVenta: v.precio_venta ? String(v.precio_venta) : "0",
          temperatura: v.temperatura || "2-8°C",
          descripcion: v.descripcion || "",
          loteActivo: v.lote_activo || "—",
          lotes: (lotsRes.data || []).map(l => ({
            id: l.id,
            numero: l.numero_lote,
            cantidad: l.cantidad,
            fechaFabricacion: l.fecha_fabricacion || "",
            fechaVencimiento: l.fecha_vencimiento || "",
            proveedor: l.proveedor || "",
            precioCompra: l.precio_compra ? String(l.precio_compra) : "",
            factura: l.numero_factura || "",
            fechaRegistro: l.fecha_registro || ""
          })),
          movimientos: (movsRes.data || []).map(m => ({
            id: m.id,
            tipo: m.tipo_movimiento as "ENTRADA" | "SALIDA",
            cantidad: m.cantidad,
            motivo: m.motivo || "",
            fecha: m.fecha || "",
            notas: m.notas || ""
          }))
        };
      }));

      setVacunas(enrichedVacs);
    } catch (err: any) {
      console.error("Error loading vaccines:", err);
      addToast("Error al cargar vacunas: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);
      const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", p.slug).single();
      if (!tenant) return;
      setTenantId(tenant.id);

      const { data: config } = await supabase
        .from("configuracion_portal")
        .select("color_primario, color_acento")
        .eq("tenant_id", tenant.id)
        .single();

      if (config) {
        if (config.color_primario) setPrimaryColor(config.color_primario);
        if (config.color_acento) setAccentColor(config.color_acento);
      }

      await loadData(tenant.id);
    });
  }, []);

  // ── NUEVA VACUNA FORM ──────────────────────────────────────────────
  const [newForm, setNewForm] = useState({
    nombre: "", nombreGenerico: "", laboratorio: "", enfermedad: "",
    viaAdmin: "Intramuscular", esquemaDosis: "", stockMinimo: "5",
    precioVenta: "", temperatura: "2-8°C", descripcion: "",
  });

  const handleNewFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setNewForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleNuevaVacuna = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("inventario_medico")
        .insert({
          tenant_id: tenantId,
          categoria_id: categorias.length > 0 ? categorias[0].id : null, // Default to first category if available
          nombre: newForm.nombre,
          nombre_generico: newForm.nombreGenerico,
          laboratorio: newForm.laboratorio,
          enfermedad: newForm.enfermedad,
          via_admin: newForm.viaAdmin,
          esquema_dosis: newForm.esquemaDosis,
          stock_minimo: parseInt(newForm.stockMinimo) || 5,
          stock_actual: 0,
          precio_venta: parseFloat(newForm.precioVenta) || 0,
          temperatura: newForm.temperatura,
          descripcion: newForm.descripcion,
          lote_activo: "—"
        });

      if (error) throw error;

      newVacunaRef.current?.close();
      setNewForm({ nombre: "", nombreGenerico: "", laboratorio: "", enfermedad: "", viaAdmin: "Intramuscular", esquemaDosis: "", stockMinimo: "5", precioVenta: "", temperatura: "2-8°C", descripcion: "" });
      addToast(`Vacuna "${newForm.nombre}" registrada correctamente.`);
      await loadData(tenantId);
    } catch (err: any) {
      console.error(err);
      addToast("Error al guardar vacuna: " + err.message, "error");
    }
  };

  // ── LOTE FORM ─────────────────────────────────────────────────────
  const [loteForm, setLoteForm] = useState({
    numero: "", cantidad: "", fechaFabricacion: "", fechaVencimiento: "",
    proveedor: "", precioCompra: "", factura: "",
  });

  const handleLoteChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setLoteForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const openLoteModal = (id: string) => {
    setSelectedId(id);
    loteRef.current?.showModal();
  };

  const handleAgregarLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const cantidad = parseInt(loteForm.cantidad);
    if (isNaN(cantidad) || cantidad < 1) return;

    try {
      // 1. Insert lot
      const { error: lotErr } = await supabase
        .from("lotes_inventario")
        .insert({
          tenant_id: tenantId,
          item_id: selectedId,
          numero_lote: loteForm.numero,
          cantidad: cantidad,
          fecha_fabricacion: loteForm.fechaFabricacion || null,
          fecha_vencimiento: loteForm.fechaVencimiento,
          proveedor: loteForm.proveedor,
          precio_compra: loteForm.precioCompra ? parseFloat(loteForm.precioCompra) : null,
          numero_factura: loteForm.factura || null
        });

      if (lotErr) throw lotErr;

      // 2. Insert movement
      const { error: movErr } = await supabase
        .from("movimientos_inventario")
        .insert({
          tenant_id: tenantId,
          item_id: selectedId,
          tipo_movimiento: "ENTRADA",
          cantidad: cantidad,
          motivo: "Compra a proveedor",
          fecha: today()
        });

      if (movErr) throw movErr;

      // 3. Update stock and active lot in inventario_medico
      const currentStock = selectedVacuna?.stockActual || 0;
      const { error: updErr } = await supabase
        .from("inventario_medico")
        .update({
          stock_actual: currentStock + cantidad,
          lote_activo: loteForm.numero
        })
        .eq("id", selectedId);

      if (updErr) throw updErr;

      loteRef.current?.close();
      setLoteForm({ numero: "", cantidad: "", fechaFabricacion: "", fechaVencimiento: "", proveedor: "", precioCompra: "", factura: "" });
      addToast(`Lote agregado. Stock actualizado.`);
      await loadData(tenantId);
    } catch (err: any) {
      console.error(err);
      addToast("Error al agregar lote: " + err.message, "error");
    }
  };

  // ── USAR DOSIS ────────────────────────────────────────────────────
  const openUsarModal = (id: string) => {
    setSelectedId(id);
    setDosisNotas("");
    usarRef.current?.showModal();
  };

  const handleUsarDosis = async () => {
    if (!selectedId) return;
    try {
      // 1. Insert movement
      const { error: movErr } = await supabase
        .from("movimientos_inventario")
        .insert({
          tenant_id: tenantId,
          item_id: selectedId,
          tipo_movimiento: "SALIDA",
          cantidad: 1,
          motivo: "Aplicación de dosis",
          notas: dosisNotas || null,
          fecha: today()
        });

      if (movErr) throw movErr;

      // 2. Update stock in inventario_medico
      const currentStock = selectedVacuna?.stockActual || 0;
      const newStock = Math.max(0, currentStock - 1);
      const { error: updErr } = await supabase
        .from("inventario_medico")
        .update({
          stock_actual: newStock
        })
        .eq("id", selectedId);

      if (updErr) throw updErr;

      usarRef.current?.close();
      if (newStock === 0) {
        addToast(`⚠️ ${selectedVacuna?.nombre} agotada. Solicitar lote.`, "error");
      } else {
        addToast(`Dosis registrada como aplicada.`);
      }
      await loadData(tenantId);
    } catch (err: any) {
      console.error(err);
      addToast("Error al aplicar dosis: " + err.message, "error");
    }
  };

  // ── DERIVED KPIs ──────────────────────────────────────────────────
  const totalVacunas       = vacunas.length;
  const totalDosis         = vacunas.reduce((s, v) => s + v.stockActual, 0);
  const criticas           = vacunas.filter(v => getStockStatus(v) !== "ok").length;
  const dosisHoy           = vacunas.flatMap(v => v.movimientos)
    .filter(m => m.tipo === "SALIDA" && m.fecha === today()).reduce((s, m) => s + m.cantidad, 0);

  // ── FILTERED ──────────────────────────────────────────────────────
  const filtered = vacunas.filter(v =>
    v.nombre.toLowerCase().includes(search.toLowerCase()) ||
    v.laboratorio.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "var(--slate-400)" }}>
        Cargando inventario de vacunas...
      </div>
    );
  }

  return (
    <>
      {/* TOP BAR */}
      <div className="admin-topbar">
        <h1 className="admin-topbar-title">📦 Control de Inventario</h1>
        <div className="admin-topbar-right">
          {activeTab === "catalogo" && (
            <button
              id="btn-nueva-vacuna"
              className="btn btn-primary"
              style={{ padding: "10px 20px", fontSize: "13px", background: primaryColor }}
              onClick={() => newVacunaRef.current?.showModal()}
            >
              ＋ Nuevo Ítem
            </button>
          )}
        </div>
      </div>

      <div className="admin-tabs" style={{ display: "flex", gap: "16px", padding: "0 40px", borderBottom: "1px solid var(--slate-200)", marginBottom: "24px", background: "white" }}>
        <button 
          className={`tab-btn ${activeTab === "catalogo" ? "active" : ""}`} 
          onClick={() => setActiveTab("catalogo")}
          style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "catalogo" ? `2px solid ${primaryColor}` : "2px solid transparent", color: activeTab === "catalogo" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "catalogo" ? 700 : 500, cursor: "pointer" }}
        >
          📦 Catálogo de Ítems
        </button>
        <button 
          className={`tab-btn ${activeTab === "categorias" ? "active" : ""}`} 
          onClick={() => setActiveTab("categorias")}
          style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "categorias" ? `2px solid ${primaryColor}` : "2px solid transparent", color: activeTab === "categorias" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "categorias" ? 700 : 500, cursor: "pointer" }}
        >
          🏷️ Categorías
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "catalogo" && (
          <>
            {/* ── KPI CARDS ─────────────────────────────────────────── */}
            <div className="kpi-grid">
              <KPICard icon="💊" iconClass="kpi-icon-teal"    number={totalVacunas} label="Ítems registrados"     trend="Total" trendClass="kpi-trend-neu" />
              <KPICard icon="📦" iconClass="kpi-icon-emerald" number={totalDosis}   label="Unidades disponibles"    trend={totalDosis > 20 ? "Buen stock" : "Stock bajo"} trendClass={totalDosis > 20 ? "kpi-trend-up" : "kpi-trend-warn"} />
              <KPICard icon="⚠️" iconClass="kpi-icon-rose"    number={criticas}     label="Ítems sin stock OK"    trend={criticas > 0 ? "Requiere atención" : "Todo OK"} trendClass={criticas > 0 ? "kpi-trend-warn" : "kpi-trend-up"} />
              <KPICard icon="💉" iconClass="kpi-icon-amber"   number={dosisHoy}     label="Salidas hoy"             trend="Hoy" trendClass="kpi-trend-neu" />
            </div>

            {/* ── INVENTORY TABLE ───────────────────────────────────── */}
            <div className="section-header">
              <h2 className="section-title" style={{ color: "var(--slate-900)" }}>Catálogo de Ítems</h2>
              <input
                type="search"
                id="search-vacunas"
                placeholder="Buscar por nombre o laboratorio..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
                style={{ width: "260px" }}
                aria-label="Buscar ítems"
              />
            </div>

        <div className="inv-table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💉</div>
              <div className="empty-state-title">
                {search ? "No se encontraron vacunas" : "No hay vacunas registradas"}
              </div>
              <div className="empty-state-sub">
                {search ? "Intenta con otro término de búsqueda" : "Haz clic en \"Nueva Vacuna\" para comenzar"}
              </div>
            </div>
          ) : (
            <table className="inv-table">
              <caption>Inventario de vacunas — {filtered.length} registros</caption>
              <thead>
                <tr>
                  <th scope="col">Vacuna</th>
                  <th scope="col">Lote Activo</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Mín.</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Precio (COP)</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const status = getStockStatus(v);
                  return (
                    <tr key={v.id}>
                      <td>
                        <div className="vaccine-name-cell">
                          <span className="vaccine-name-main">{v.nombre}</span>
                          <span className="vaccine-name-generic">{v.laboratorio}</span>
                        </div>
                      </td>
                      <td>
                        {v.loteActivo === "—"
                          ? <span style={{ color: "var(--slate-400)", fontSize: "12px" }}>Sin lote</span>
                          : <span className="lot-badge" style={{ background: `${accentColor}22`, color: primaryColor }}>{v.loteActivo}</span>
                        }
                      </td>
                      <td>
                        <div className="stock-cell">
                          <span className="stock-number" style={{
                            color: status === "critical" ? "var(--rose-500)" : status === "low" ? "#b45309" : primaryColor
                          }}>{v.stockActual}</span>
                          <span className="stock-min">dosis</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--slate-500)", fontSize: "13px" }}>{v.stockMinimo}</td>
                      <td>
                        <span className={`stock-chip ${stockChipClass[status]}`}>
                          {stockChipLabel[status]}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: primaryColor }}>
                        ${parseInt(v.precioVenta || "0").toLocaleString("es-CO")}
                      </td>
                      <td>
                        <div className="action-row">
                          <button
                            className="action-btn action-btn-emerald"
                            onClick={() => openLoteModal(v.id)}
                            title="Agregar nuevo lote de dosis"
                            type="button"
                          >
                            ＋ Lote
                          </button>
                          <button
                            className="action-btn action-btn-primary"
                            onClick={() => openUsarModal(v.id)}
                            disabled={v.stockActual === 0}
                            style={v.stockActual > 0 ? { background: primaryColor } : undefined}
                            title={v.stockActual === 0 ? "Sin stock disponible" : "Registrar una dosis aplicada"}
                            type="button"
                          >
                            💉 Usar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── ALERTAS DE REORDEN ────────────────────────────────── */}
        {criticas > 0 && (
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "15px", fontWeight: 800, color: "var(--slate-700)" }}>
              🔔 Alertas de Reorden
            </h3>
            {vacunas.filter(v => getStockStatus(v) !== "ok").map(v => {
              const status = getStockStatus(v);
              return (
                <div key={v.id} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "14px 20px", borderRadius: "var(--radius-lg)",
                  background: status === "critical" ? "rgba(244,63,94,.06)" : "rgba(245,158,11,.06)",
                  border: `1px solid ${status === "critical" ? "rgba(244,63,94,.2)" : "rgba(245,158,11,.2)"}`,
                }}>
                  <span style={{ fontSize: "20px" }}>{status === "critical" ? "🔴" : "🟠"}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--slate-800)" }}>
                      {status === "critical"
                        ? `AGOTADO: ${v.nombre}`
                        : `Stock bajo: ${v.nombre}`}
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--slate-500)", marginLeft: "8px" }}>
                      {v.stockActual} dosis restantes (mín. {v.stockMinimo})
                    </span>
                  </div>
                  <button
                    className="action-btn action-btn-ghost"
                    type="button"
                    style={{ color: primaryColor }}
                    onClick={() => openLoteModal(v.id)}
                  >
                    ＋ Agregar lote
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </>
        )}

        {/* ── CATEGORÍAS ─────────────────────────────────────────── */}
        {activeTab === "categorias" && (
          <div className="categorias-section">
            <div className="section-header">
              <h2 className="section-title" style={{ color: "var(--slate-900)" }}>Categorías de Inventario</h2>
              <button 
                className="btn btn-primary"
                onClick={() => addToast("Funcionalidad de agregar categoría en desarrollo", "info")}
              >
                ＋ Nueva Categoría
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {categorias.length === 0 ? (
                <div style={{ gridColumn: "1/-1", padding: "40px", textAlign: "center", color: "var(--slate-500)", background: "var(--slate-50)", borderRadius: "var(--radius-lg)" }}>
                  No hay categorías registradas. Se usarán ítems sin clasificar.
                </div>
              ) : categorias.map(c => (
                <div key={c.id} className="card" style={{ padding: "20px", borderLeft: `4px solid ${c.color || primaryColor}` }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--slate-900)" }}>{c.nombre}</h3>
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--slate-500)" }}>
                    {vacunas.filter(v => v.categoria_id === c.id).length} ítems en esta categoría
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: NUEVA VACUNA
      ═══════════════════════════════════════════════════════════ */}
      <dialog ref={newVacunaRef} id="modal-nueva-vacuna" aria-labelledby="dialog-nueva-title">
        <div className="modal-header">
          <div>
            <div className="modal-title" id="dialog-nueva-title">➕ Registrar Nueva Vacuna</div>
            <div className="modal-subtitle">Complete todos los campos obligatorios marcados con *</div>
          </div>
          <button className="modal-close" onClick={() => newVacunaRef.current?.close()} type="button" aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleNuevaVacuna} noValidate>
          <div className="modal-body">
            <div className="form-grid">

              <div className="form-group">
                <label className="form-label" htmlFor="nombre">Nombre comercial <span className="required-mark">*</span></label>
                <input id="nombre" name="nombre" type="text" className="form-input"
                  value={newForm.nombre} onChange={handleNewFormChange}
                  required minLength={2} placeholder="ej: Hepatitis B"
                  autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="nombreGenerico">Nombre genérico / Principio activo <span className="required-mark">*</span></label>
                <input id="nombreGenerico" name="nombreGenerico" type="text" className="form-input"
                  value={newForm.nombreGenerico} onChange={handleNewFormChange}
                  required placeholder="ej: Vacuna recombinante HBsAg"
                  autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="laboratorio">Laboratorio fabricante <span className="required-mark">*</span></label>
                <input id="laboratorio" name="laboratorio" type="text" className="form-input"
                  value={newForm.laboratorio} onChange={handleNewFormChange}
                  required placeholder="ej: GSK Biologicals"
                  autoComplete="organization" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="enfermedad">Enfermedad que previene <span className="required-mark">*</span></label>
                <input id="enfermedad" name="enfermedad" type="text" className="form-input"
                  value={newForm.enfermedad} onChange={handleNewFormChange}
                  required placeholder="ej: Hepatitis B crónica"
                  autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="viaAdmin">Vía de administración <span className="required-mark">*</span></label>
                <select id="viaAdmin" name="viaAdmin" className="form-select"
                  value={newForm.viaAdmin} onChange={handleNewFormChange} required>
                  <option value="Intramuscular">Intramuscular</option>
                  <option value="Subcutánea">Subcutánea</option>
                  <option value="Oral">Oral</option>
                  <option value="Intradérmica">Intradérmica</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="temperatura">Temperatura de almacenamiento <span className="required-mark">*</span></label>
                <select id="temperatura" name="temperatura" className="form-select"
                  value={newForm.temperatura} onChange={handleNewFormChange} required>
                  <option value="2-8°C">2-8°C (Refrigeración)</option>
                  <option value="-15 a -25°C">-15 a -25°C (Congelación)</option>
                  <option value="Temperatura ambiente">Temperatura ambiente</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="esquemaDosis">Esquema de dosis <span className="required-mark">*</span></label>
                <input id="esquemaDosis" name="esquemaDosis" type="text" className="form-input"
                  value={newForm.esquemaDosis} onChange={handleNewFormChange}
                  required placeholder="ej: 3 dosis: 2, 4, 6 meses"
                  autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="stockMinimo">Stock mínimo de alerta <span className="required-mark">*</span></label>
                <input id="stockMinimo" name="stockMinimo" type="text" inputMode="numeric"
                  pattern="[0-9]*" className="form-input"
                  value={newForm.stockMinimo} onChange={handleNewFormChange}
                  required placeholder="ej: 10"
                  autoComplete="off" />
                <span className="form-hint">Se activará alerta cuando el stock baje de este número</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="precioVenta">Precio de venta (COP) <span className="required-mark">*</span></label>
                <input id="precioVenta" name="precioVenta" type="text" inputMode="decimal"
                  className="form-input"
                  value={newForm.precioVenta} onChange={handleNewFormChange}
                  required placeholder="ej: 45000"
                  autoComplete="off" />
              </div>

              <div className="form-group full-width">
                <label className="form-label" htmlFor="descripcion">Descripción / Notas</label>
                <textarea id="descripcion" name="descripcion" className="form-textarea"
                  value={newForm.descripcion} onChange={handleNewFormChange}
                  placeholder="Información adicional sobre la vacuna, contraindicaciones, etc."
                  rows={3} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => newVacunaRef.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: primaryColor }}>
              ✓ Registrar Vacuna
            </button>
          </div>
        </form>
      </dialog>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: AGREGAR LOTE
      ═══════════════════════════════════════════════════════════ */}
      <dialog ref={loteRef} id="modal-agregar-lote" aria-labelledby="dialog-lote-title">
        <div className="modal-header">
          <div>
            <div className="modal-title" id="dialog-lote-title">📦 Agregar Lote de Dosis</div>
            <div className="modal-subtitle">
              {selectedVacuna ? `Vacuna: ${selectedVacuna.nombre}` : ""}
            </div>
          </div>
          <button className="modal-close" onClick={() => loteRef.current?.close()} type="button" aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleAgregarLote} noValidate>
          <div className="modal-body">
            <div className="form-grid">

              <div className="form-group">
                <label className="form-label" htmlFor="lote-numero">Número de lote <span className="required-mark">*</span></label>
                <input id="lote-numero" name="numero" type="text" className="form-input"
                  value={loteForm.numero} onChange={handleLoteChange}
                  required placeholder="ej: LOT-2026-HB02"
                  autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lote-cantidad">Cantidad de dosis <span className="required-mark">*</span></label>
                <input id="lote-cantidad" name="cantidad" type="text" inputMode="numeric"
                  pattern="[0-9]*" className="form-input"
                  value={loteForm.cantidad} onChange={handleLoteChange}
                  required placeholder="ej: 25"
                  autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lote-fabricacion">Fecha de fabricación <span className="required-mark">*</span></label>
                <input id="lote-fabricacion" name="fechaFabricacion" type="date" className="form-input"
                  value={loteForm.fechaFabricacion} onChange={handleLoteChange}
                  required max={today()} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lote-vencimiento">Fecha de vencimiento <span className="required-mark">*</span></label>
                <input id="lote-vencimiento" name="fechaVencimiento" type="date" className="form-input"
                  value={loteForm.fechaVencimiento} onChange={handleLoteChange}
                  required min={today()} />
                <span className="form-hint">Debe ser una fecha futura</span>
              </div>

              <div className="form-group full-width">
                <label className="form-label" htmlFor="lote-proveedor">Proveedor / Distribuidor <span className="required-mark">*</span></label>
                <input id="lote-proveedor" name="proveedor" type="text" className="form-input"
                  value={loteForm.proveedor} onChange={handleLoteChange}
                  required placeholder="ej: Tecnoquímicas S.A."
                  autoComplete="organization" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lote-precio">Precio de compra (COP)</label>
                <input id="lote-precio" name="precioCompra" type="text" inputMode="decimal"
                  className="form-input"
                  value={loteForm.precioCompra} onChange={handleLoteChange}
                  placeholder="ej: 38000" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lote-factura">Número de factura</label>
                <input id="lote-factura" name="factura" type="text" className="form-input"
                  value={loteForm.factura} onChange={handleLoteChange}
                  placeholder="ej: FAC-2026-0452" autoComplete="off" />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => loteRef.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-emerald">
              ✓ Registrar Lote
            </button>
          </div>
        </form>
      </dialog>

      {/* ═══════════════════════════════════════════════════════════
          DIALOG: CONFIRMAR USO DE DOSIS
      ═══════════════════════════════════════════════════════════ */}
      <dialog ref={usarRef} id="dialog-usar-dosis" className="confirm-dialog" aria-labelledby="dialog-usar-title">
        <div className="modal-body" style={{ padding: "32px 28px" }}>
          <div className="confirm-icon" style={{ background: "rgba(10,77,92,.10)", color: primaryColor }}>💉</div>

          <h2 className="confirm-title" id="dialog-usar-title" style={{ color: "var(--slate-900)" }}>Confirmar Uso de Dosis</h2>
          <p className="confirm-msg" style={{ color: "var(--slate-600)" }}>
            Vas a registrar una dosis aplicada de{" "}
            <strong>{selectedVacuna?.nombre}</strong>.
            Esta acción descontará 1 unidad del inventario.
          </p>

          {selectedVacuna && (
            <div className="stock-preview">
              <div className="stock-before">
                <div className="stock-before-num" style={{ color: primaryColor }}>{selectedVacuna.stockActual}</div>
                <div className="stock-before-label">Stock actual</div>
              </div>
              <div className="stock-arrow" style={{ color: primaryColor }}>→</div>
              <div className="stock-before">
                <div className="stock-after-num" style={{ color: accentColor }}>{Math.max(0, selectedVacuna.stockActual - 1)}</div>
                <div className="stock-before-label">Después de aplicar</div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="dosis-notas">Notas del paciente (opcional)</label>
            <input
              id="dosis-notas"
              type="text"
              className="form-input"
              value={dosisNotas}
              onChange={e => setDosisNotas(e.target.value)}
              placeholder="ej: Paciente Juan Pérez, 6 meses, 1ª dosis"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={() => usarRef.current?.close()}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: primaryColor }}
            onClick={handleUsarDosis}
          >
            💉 Confirmar — Registrar como Usada
          </button>
        </div>
      </dialog>

      {/* TOASTS */}
      <ToastContainer toasts={toasts} />
    </>
  );
}

// Helper components
function KPICard({ icon, iconClass, number, label, trend, trendClass }: {
  icon: string; iconClass: string; number: number | string;
  label: string; trend?: string; trendClass?: string;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-card-header">
        <div className={`kpi-icon ${iconClass}`}>{icon}</div>
        {trend && <span className={`kpi-trend ${trendClass}`}>{trend}</span>}
      </div>
      <div className="kpi-number">{number}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} role="status">
          {t.type === "success" ? "✅ " : t.type === "error" ? "❌ " : "ℹ️ "}
          {t.msg}
        </div>
      ))}
    </div>
  );
}
