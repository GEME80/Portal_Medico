"use client";
import { useState, useRef, useCallback } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────
type EstadoStock = "ok" | "low" | "critical";
type TipoMovimiento = "ENTRADA" | "SALIDA";

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

interface Vacuna {
  id: string;
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

// ─── MOCK DATA ───────────────────────────────────────────────────────────
const INITIAL_VACUNAS: Vacuna[] = [
  {
    id: "1", nombre: "Hepatitis B", nombreGenerico: "Vacuna recombinante HBsAg",
    laboratorio: "GSK Biologicals", enfermedad: "Hepatitis B crónica",
    viaAdmin: "Intramuscular", esquemaDosis: "3 dosis: RN, 2, 6 meses",
    stockMinimo: 10, stockActual: 24, precioVenta: "45000",
    temperatura: "2-8°C", descripcion: "Previene infección por VHB y complicaciones a largo plazo.",
    loteActivo: "LOT-2025-HB01",
    movimientos: [
      { id: "m1", tipo: "ENTRADA", cantidad: 30, motivo: "Compra a proveedor", fecha: "2026-06-01" },
      { id: "m2", tipo: "SALIDA", cantidad: 6, motivo: "Aplicación de dosis", fecha: "2026-06-15" },
    ],
    lotes: [{ id: "l1", numero: "LOT-2025-HB01", cantidad: 30, fechaFabricacion: "2025-01-10", fechaVencimiento: "2027-01-10", proveedor: "Tecnoquímicas S.A.", fechaRegistro: "2026-06-01" }],
  },
  {
    id: "2", nombre: "Pentavalente", nombreGenerico: "DPT-HB-Hib",
    laboratorio: "Sanofi Pasteur", enfermedad: "Difteria, Pertussis, Tétanos, HB, Hib",
    viaAdmin: "Intramuscular", esquemaDosis: "3 dosis + refuerzos (2, 4, 6, 18 meses)",
    stockMinimo: 15, stockActual: 8, precioVenta: "68000",
    temperatura: "2-8°C", descripcion: "Vacuna combinada de 5 antígenos. Base del PAI colombiano.",
    loteActivo: "PEN-2026-A2",
    movimientos: [
      { id: "m3", tipo: "ENTRADA", cantidad: 20, motivo: "Compra a proveedor", fecha: "2026-05-20" },
      { id: "m4", tipo: "SALIDA", cantidad: 12, motivo: "Aplicación de dosis", fecha: "2026-06-10" },
    ],
    lotes: [{ id: "l2", numero: "PEN-2026-A2", cantidad: 20, fechaFabricacion: "2025-06-01", fechaVencimiento: "2027-06-01", proveedor: "Sanofi Colombia", fechaRegistro: "2026-05-20" }],
  },
  {
    id: "3", nombre: "Neumococo PCV13", nombreGenerico: "Vacuna Neumocócica Conjugada 13-valente",
    laboratorio: "Pfizer", enfermedad: "Neumonía, meningitis, otitis por S. pneumoniae",
    viaAdmin: "Intramuscular", esquemaDosis: "3 dosis: 2, 4, 12 meses",
    stockMinimo: 8, stockActual: 0, precioVenta: "120000",
    temperatura: "2-8°C", descripcion: "Protección frente a 13 serotipos de neumococo.",
    loteActivo: "—",
    movimientos: [
      { id: "m5", tipo: "ENTRADA", cantidad: 10, motivo: "Compra a proveedor", fecha: "2026-04-01" },
      { id: "m6", tipo: "SALIDA", cantidad: 10, motivo: "Aplicación de dosis", fecha: "2026-06-05" },
    ],
    lotes: [],
  },
  {
    id: "4", nombre: "MMR (SRP)", nombreGenerico: "Vacuna Sarampión-Rubéola-Paperas",
    laboratorio: "MSD Vacunas", enfermedad: "Sarampión, Rubéola, Parotiditis",
    viaAdmin: "Subcutánea", esquemaDosis: "2 dosis: 12 y 18 meses",
    stockMinimo: 10, stockActual: 12, precioVenta: "55000",
    temperatura: "2-8°C", descripcion: "Vacuna triple viral. Erradicó el sarampión endémico en las Américas.",
    loteActivo: "MMR-26B-010",
    movimientos: [],
    lotes: [{ id: "l3", numero: "MMR-26B-010", cantidad: 15, fechaFabricacion: "2025-08-01", fechaVencimiento: "2027-08-01", proveedor: "MSD Colombia", fechaRegistro: "2026-05-15" }],
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────
const getStockStatus = (v: Vacuna): EstadoStock => {
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

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split("T")[0];
const formatDate = (d: string) => new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────

/** Toast system */
interface Toast { id: string; msg: string; type: "success" | "error" | "info"; }

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} role="status">
          {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

/** KPI Card */
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

// ─── MAIN PAGE ───────────────────────────────────────────────────────────
export default function AdminVacunasPage() {
  const [vacunas, setVacunas] = useState<Vacuna[]>(INITIAL_VACUNAS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");

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
    const id = uid();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  // ── NUEVA VACUNA FORM ──────────────────────────────────────────────
  const [newForm, setNewForm] = useState({
    nombre: "", nombreGenerico: "", laboratorio: "", enfermedad: "",
    viaAdmin: "Intramuscular", esquemaDosis: "", stockMinimo: "5",
    precioVenta: "", temperatura: "2-8°C", descripcion: "",
  });

  const handleNewFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setNewForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleNuevaVacuna = (e: React.FormEvent) => {
    e.preventDefault();
    const nueva: Vacuna = {
      id: uid(),
      ...newForm,
      stockMinimo: parseInt(newForm.stockMinimo) || 5,
      stockActual: 0,
      loteActivo: "—",
      movimientos: [],
      lotes: [],
    };
    setVacunas(prev => [nueva, ...prev]);
    newVacunaRef.current?.close();
    setNewForm({ nombre: "", nombreGenerico: "", laboratorio: "", enfermedad: "", viaAdmin: "Intramuscular", esquemaDosis: "", stockMinimo: "5", precioVenta: "", temperatura: "2-8°C", descripcion: "" });
    addToast(`Vacuna "${nueva.nombre}" registrada correctamente.`);
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

  const handleAgregarLote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const cantidad = parseInt(loteForm.cantidad);
    if (isNaN(cantidad) || cantidad < 1) return;

    const nuevoLote: Lote = {
      id: uid(), ...loteForm, cantidad,
      fechaRegistro: today(),
    };
    const nuevoMov: Movimiento = {
      id: uid(), tipo: "ENTRADA", cantidad,
      motivo: "Compra a proveedor", fecha: today(),
    };

    setVacunas(prev => prev.map(v =>
      v.id === selectedId
        ? {
          ...v,
          stockActual: v.stockActual + cantidad,
          loteActivo: nuevoLote.numero,
          lotes: [nuevoLote, ...v.lotes],
          movimientos: [nuevoMov, ...v.movimientos],
        }
        : v
    ));
    loteRef.current?.close();
    setLoteForm({ numero: "", cantidad: "", fechaFabricacion: "", fechaVencimiento: "", proveedor: "", precioCompra: "", factura: "" });
    const vacNombre = vacunas.find(v => v.id === selectedId)?.nombre;
    addToast(`Lote agregado a ${vacNombre}. Stock actualizado.`);
  };

  // ── USAR DOSIS ────────────────────────────────────────────────────
  const openUsarModal = (id: string) => {
    setSelectedId(id);
    setDosisNotas("");
    usarRef.current?.showModal();
  };

  const handleUsarDosis = () => {
    if (!selectedId) return;
    const nuevoMov: Movimiento = {
      id: uid(), tipo: "SALIDA", cantidad: 1,
      motivo: "Aplicación de dosis", fecha: today(),
      notas: dosisNotas || undefined,
    };
    setVacunas(prev => prev.map(v =>
      v.id === selectedId
        ? { ...v, stockActual: Math.max(0, v.stockActual - 1), movimientos: [nuevoMov, ...v.movimientos] }
        : v
    ));
    usarRef.current?.close();
    const vacNombre = vacunas.find(v => v.id === selectedId)?.nombre;
    const newStock = (vacunas.find(v => v.id === selectedId)?.stockActual ?? 1) - 1;
    if (newStock === 0) {
      addToast(`⚠️ ${vacNombre} agotada. Solicitar lote al proveedor.`, "error");
    } else {
      addToast(`Dosis de ${vacNombre} registrada como aplicada.`);
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

  // ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* TOP BAR */}
      <div className="admin-topbar">
        <h1 className="admin-topbar-title">💉 Control de Vacunas</h1>
        <div className="admin-topbar-right">
          <button
            id="btn-nueva-vacuna"
            className="btn btn-primary"
            style={{ padding: "10px 20px", fontSize: "13px" }}
            onClick={() => newVacunaRef.current?.showModal()}
          >
            ＋ Nueva Vacuna
          </button>
        </div>
      </div>

      <div className="admin-content">

        {/* ── KPI CARDS ─────────────────────────────────────────── */}
        <div className="kpi-grid">
          <KPICard icon="💊" iconClass="kpi-icon-teal"    number={totalVacunas} label="Vacunas registradas"     trend="Total" trendClass="kpi-trend-neu" />
          <KPICard icon="📦" iconClass="kpi-icon-emerald" number={totalDosis}   label="Dosis disponibles"       trend={totalDosis > 20 ? "Buen stock" : "Stock bajo"} trendClass={totalDosis > 20 ? "kpi-trend-up" : "kpi-trend-warn"} />
          <KPICard icon="⚠️" iconClass="kpi-icon-rose"    number={criticas}     label="Vacunas sin stock OK"    trend={criticas > 0 ? "Requiere atención" : "Todo OK"} trendClass={criticas > 0 ? "kpi-trend-warn" : "kpi-trend-up"} />
          <KPICard icon="💉" iconClass="kpi-icon-amber"   number={dosisHoy}     label="Dosis aplicadas hoy"     trend="Hoy" trendClass="kpi-trend-neu" />
        </div>

        {/* ── INVENTORY TABLE ───────────────────────────────────── */}
        <div className="section-header">
          <h2 className="section-title">Inventario de Vacunas</h2>
          <input
            type="search"
            id="search-vacunas"
            placeholder="Buscar por nombre o laboratorio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input"
            style={{ width: "260px" }}
            aria-label="Buscar vacunas"
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
                          : <span className="lot-badge">{v.loteActivo}</span>
                        }
                      </td>
                      <td>
                        <div className="stock-cell">
                          <span className="stock-number" style={{
                            color: status === "critical" ? "var(--rose-500)" : status === "low" ? "#b45309" : "var(--teal-800)"
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
                      <td style={{ fontWeight: 700, color: "var(--teal-800)" }}>
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
                    <span style={{ fontWeight: 700, fontSize: "14px" }}>
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
                    onClick={() => openLoteModal(v.id)}
                  >
                    ＋ Agregar lote
                  </button>
                </div>
              );
            })}
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
            <button type="submit" className="btn btn-primary">
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
          <div className="confirm-icon" style={{ background: "rgba(10,77,92,.10)" }}>💉</div>

          <h2 className="confirm-title" id="dialog-usar-title">Confirmar Uso de Dosis</h2>
          <p className="confirm-msg">
            Vas a registrar una dosis aplicada de{" "}
            <strong>{selectedVacuna?.nombre}</strong>.
            Esta acción descontará 1 unidad del inventario.
          </p>

          {selectedVacuna && (
            <div className="stock-preview">
              <div className="stock-before">
                <div className="stock-before-num">{selectedVacuna.stockActual}</div>
                <div className="stock-before-label">Stock actual</div>
              </div>
              <div className="stock-arrow">→</div>
              <div className="stock-before">
                <div className="stock-after-num">{Math.max(0, selectedVacuna.stockActual - 1)}</div>
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
