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
  valorMayorista?: string;
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

interface ParsedCategoria {
  id: string;
  nombre: string;
  color: string;
  uf: boolean;
  p: boolean;
}

const parseCategory = (c: Categoria): ParsedCategoria => {
  try {
    if (c.nombre.startsWith("{") && c.nombre.endsWith("}")) {
      const parsed = JSON.parse(c.nombre);
      return {
        id: c.id,
        nombre: parsed.n || "",
        color: c.color,
        uf: parsed.uf !== undefined ? parsed.uf : true,
        p: parsed.p !== undefined ? parsed.p : true,
      };
    }
  } catch (e) {
    // Ignore
  }
  return {
    id: c.id,
    nombre: c.nombre,
    color: c.color,
    uf: true,
    p: true,
  };
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const supabase = createClient();

  // Modal refs
  const newVacunaRef = useRef<HTMLDialogElement>(null);
  const loteRef      = useRef<HTMLDialogElement>(null);
  const usarRef      = useRef<HTMLDialogElement>(null);
  const mermaRef     = useRef<HTMLDialogElement>(null);
  const comprasHistoricasRef = useRef<HTMLDialogElement>(null);
  const [mermaCantidad, setMermaCantidad] = useState(1);
  const [mermaMotivo, setMermaMotivo] = useState("MERMA - Vencimiento");
  const catRef       = useRef<HTMLDialogElement>(null);

  // Selected vaccine for actions
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dosisNotas, setDosisNotas] = useState("");
  const [pacienteNombre, setPacienteNombre] = useState("");
  const [pacienteEdad, setPacienteEdad] = useState("");
  const [pacienteEdadUnidad, setPacienteEdadUnidad] = useState("Años");
  const [cobrarMayorista, setCobrarMayorista] = useState(false);

  const [catIsUF, setCatIsUF] = useState(true);
  const [catIsP, setCatIsP] = useState(true);

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
          valorMayorista: v.valor_mayorista ? String(v.valor_mayorista) : "0",
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

  // ── CATEGORY FORM ──────────────────────────────────────────────────
  const [catForm, setCatForm] = useState({
    id: "", nombre: "", color: "#0A4D5C"
  });

  const handleCatChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCatForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const openNewCategoria = () => {
    setCatForm({ id: "", nombre: "", color: primaryColor });
    setCatIsUF(true);
    setCatIsP(true);
    catRef.current?.showModal();
  };

  const openEditCategoria = (cat: Categoria) => {
    const pc = parseCategory(cat);
    setCatForm({ id: pc.id, nombre: pc.nombre, color: pc.color || primaryColor });
    setCatIsUF(pc.uf);
    setCatIsP(pc.p);
    catRef.current?.showModal();
  };

  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.nombre) return;
    
    const serializedName = JSON.stringify({
      n: catForm.nombre,
      uf: catIsUF,
      p: catIsP
    });
    
    try {
      if (catForm.id) {
        // Edit
        const { error } = await supabase.from("categorias_inventario")
          .update({ nombre: serializedName, color: catForm.color })
          .eq("id", catForm.id);
        if (error) throw error;
        addToast(`Categoría "${catForm.nombre}" actualizada.`);
      } else {
        // Insert
        const { error } = await supabase.from("categorias_inventario")
          .insert({ tenant_id: tenantId, nombre: serializedName, color: catForm.color, activo: true });
        if (error) throw error;
        addToast(`Categoría "${catForm.nombre}" creada.`);
      }
      catRef.current?.close();
      await loadData(tenantId);
    } catch (err: any) {
      console.error(err);
      addToast("Error al guardar categoría: " + err.message, "error");
    }
  };

  // ── NUEVA VACUNA FORM ──────────────────────────────────────────────
  const [newForm, setNewForm] = useState({
    categoria_id: "", nombre: "", enfermedad: "", viaAdmin: "",
    esquemaDosis: "", stockMinimo: "5", valorMayorista: "",
    precioVenta: "", temperatura: "2-8°C"
  });

  const openNewItemForCategory = (categoryId: string) => {
    setNewForm(prev => ({ ...prev, categoria_id: categoryId }));
    setActiveTab("catalogo");
    // small delay to let tab switch render the button
    setTimeout(() => {
      newVacunaRef.current?.showModal();
    }, 100);
  };

  const handleNewFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setNewForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleNuevaVacuna = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCat = categorias.find(c => c.id === newForm.categoria_id);
      const isUF = selectedCat ? parseCategory(selectedCat).uf : true;
      const { error } = await supabase
        .from("inventario_medico")
        .insert({
          tenant_id: tenantId,
          categoria_id: newForm.categoria_id || (categorias.length > 0 ? categorias[0].id : null),
          nombre: newForm.nombre,
          enfermedad: newForm.enfermedad || null,
          via_admin: newForm.viaAdmin || null,
          esquema_dosis: newForm.esquemaDosis || null,
          stock_minimo: parseInt(newForm.stockMinimo) || 5,
          stock_actual: 0,
          valor_mayorista: parseFloat(newForm.valorMayorista) || 0,
          precio_venta: isUF ? (parseFloat(newForm.precioVenta) || 0) : 0,
          temperatura: newForm.temperatura,
          lote_activo: "—"
        });

      if (error) throw error;

      newVacunaRef.current?.close();
      setNewForm({ categoria_id: "", nombre: "", enfermedad: "", viaAdmin: "", esquemaDosis: "", stockMinimo: "5", valorMayorista: "", precioVenta: "", temperatura: "2-8°C" });
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
      const selectedVacCat = selectedVacuna ? categorias.find(c => c.id === selectedVacuna.categoria_id) : null;
      const isP = selectedVacCat ? parseCategory(selectedVacCat).p : true;
      // 1. Insert lot
      const { error: lotErr } = await supabase
        .from("lotes_inventario")
        .insert({
          tenant_id: tenantId,
          item_id: selectedId,
          numero_lote: loteForm.numero,
          cantidad: cantidad,
          fecha_fabricacion: loteForm.fechaFabricacion || null,
          fecha_vencimiento: isP ? loteForm.fechaVencimiento : null,
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
    setPacienteNombre("");
    setPacienteEdad("");
    setPacienteEdadUnidad("Años");
    setCobrarMayorista(false);
    usarRef.current?.showModal();
  };

  const openMermaModal = (id: string) => {
    setSelectedId(id);
    setMermaCantidad(1);
    setMermaMotivo("MERMA - Vencimiento");
    mermaRef.current?.showModal();
  };

  const openComprasHistoricasModal = (id: string) => {
    setSelectedId(id);
    comprasHistoricasRef.current?.showModal();
  };

  const handleUsarDosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !selectedVacuna) return;
    if (!pacienteNombre || !pacienteEdad) {
      addToast("Por favor ingrese el nombre y edad del paciente.", "error");
      return;
    }
    try {
      const valorUnitario = cobrarMayorista ? selectedVacuna.valorMayorista : selectedVacuna.precioVenta;
      const notesParts = [
        `Paciente: ${pacienteNombre}`,
        `Edad: ${pacienteEdad} ${pacienteEdadUnidad}`
      ];
      if (dosisNotas) notesParts.push(`Notas: ${dosisNotas}`);
      if (cobrarMayorista) notesParts.push("[COBRO PRECIO MAYORISTA]");
      
      const notasFinales = notesParts.join(" - ");
      
      const { error: movErr } = await supabase.from("movimientos_inventario").insert({
        tenant_id: tenantId,
        item_id: selectedId,
        tipo_movimiento: "SALIDA",
        cantidad: 1,
        motivo: "Aplicación de dosis",
        notas: notasFinales || null,
        fecha: today(),
        valor_unitario_cobrado: valorUnitario
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

  const handleRegistrarMerma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !selectedVacuna || mermaCantidad <= 0) return;
    try {
      const { error: movErr } = await supabase.from("movimientos_inventario").insert({
        tenant_id: tenantId,
        item_id: selectedId,
        tipo_movimiento: "SALIDA",
        cantidad: mermaCantidad,
        motivo: mermaMotivo,
        notas: `Registro de merma/desperdicio. Stock afectado: ${mermaCantidad}`,
        fecha: today(),
        valor_unitario_cobrado: 0 // La merma no genera ingreso
      });

      if (movErr) throw movErr;

      const currentStock = selectedVacuna?.stockActual || 0;
      const newStock = Math.max(0, currentStock - mermaCantidad);
      
      const { error: updErr } = await supabase
        .from("inventario_medico")
        .update({ stock_actual: newStock })
        .eq("id", selectedId);

      if (updErr) throw updErr;

      mermaRef.current?.close();
      addToast(`Merma registrada correctamente (${mermaCantidad} unidades).`);
      await loadData(tenantId);
    } catch (err: any) {
      console.error(err);
      addToast("Error al registrar merma: " + err.message, "error");
    }
  };

  const handleGenerarPruebas = async () => {
    if (!confirm("¿Generar datos de prueba para los últimos 6 meses?")) return;
    
    const items = vacunas;
    if (items.length === 0) {
      alert("Debes crear al menos un ítem primero.");
      return;
    }

    try {
      const newMovements = [];
      const newLotes = [];
      const todayDate = new Date();
      
      // Generar 30 salidas aleatorias
      for (let i = 0; i < 30; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const randomMonthOffset = Math.floor(Math.random() * 6); // 0 a 5 meses atras
        const testDate = new Date();
        testDate.setMonth(todayDate.getMonth() - randomMonthOffset);
        testDate.setDate(Math.floor(Math.random() * 28) + 1);
        
        newMovements.push({
          tenant_id: tenantId,
          item_id: randomItem.id,
          tipo_movimiento: "SALIDA",
          cantidad: 1,
          notas: "Prueba generada",
          fecha: testDate.toISOString().split("T")[0],
          valor_unitario_cobrado: Math.random() > 0.5 ? randomItem.valorMayorista : randomItem.precioVenta
        });
      }

      // Generar 2 lotes para algunos ítems para probar inflación
      for (let i = 0; i < Math.min(3, items.length); i++) {
        const item = items[i];
        const basePrice = Number(item.valorMayorista) || 10000;
        
        // Lote antiguo (hace 2 meses)
        const dateAntiguo = new Date();
        dateAntiguo.setMonth(todayDate.getMonth() - 2);
        newLotes.push({
          tenant_id: tenantId,
          item_id: item.id,
          lote: `TEST-A-${i}`,
          cantidad_inicial: 10,
          fecha_vencimiento: new Date(todayDate.getFullYear() + 1, 0, 1).toISOString(),
          precio_compra: basePrice,
          fecha_registro: dateAntiguo.toISOString()
        });

        // Lote nuevo (este mes) con 15-30% de inflación
        const inflacion = 1 + (Math.floor(Math.random() * 15) + 15) / 100;
        newLotes.push({
          tenant_id: tenantId,
          item_id: item.id,
          lote: `TEST-N-${i}`,
          cantidad_inicial: 10,
          fecha_vencimiento: new Date(todayDate.getFullYear() + 2, 0, 1).toISOString(),
          precio_compra: Math.floor(basePrice * inflacion),
          fecha_registro: todayDate.toISOString()
        });
      }
      
      await supabase.from("movimientos_inventario").insert(newMovements);
      if (newLotes.length > 0) {
        await supabase.from("lotes_inventario").insert(newLotes);
      }
      alert("Datos generados. Ve al Dashboard para ver las gráficas de inflación.");
      await loadData(tenantId);
    } catch (err) {
      console.error(err);
      alert("Error al generar pruebas.");
    }
  };

  const handleResetearPruebas = async () => {
    if (!confirm("⚠️ PELIGRO: Esto borrará TODOS los movimientos y dejará el stock en 0. ¿Estás seguro?")) return;
    try {
      await supabase.from("movimientos_inventario").delete().eq("tenant_id", tenantId);
      await supabase.from("inventario_medico").update({ stock_actual: 0 }).eq("tenant_id", tenantId);
      alert("Sistema reseteado a 0.");
      await loadData(tenantId);
    } catch (err) {
      console.error(err);
      alert("Error al resetear el sistema.");
    }
  };

  // ── FILTERED ──────────────────────────────────────────────────────
  const filtered = vacunas.filter(v =>
    (selectedCategoryFilter === "all" || v.categoria_id === selectedCategoryFilter) &&
    (v.nombre.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    const getStatusWeight = (v: any) => {
      const status = getStockStatus(v);
      if (status === "critical") return 0;
      if (status === "low") return 1;
      return 2; // ok
    };
    const weightA = getStatusWeight(a);
    const weightB = getStatusWeight(b);
    if (weightA !== weightB) return weightA - weightB;
    return a.nombre.localeCompare(b.nombre);
  });

  // ── DERIVED KPIs ──────────────────────────────────────────────────
  const totalVacunas       = filtered.length;
  const totalDosis         = filtered.reduce((s, v) => s + v.stockActual, 0);
  const criticas           = filtered.filter(v => getStockStatus(v) !== "ok").length;
  const dosisHoy           = filtered.flatMap(v => v.movimientos)
    .filter(m => m.tipo === "SALIDA" && m.fecha === today()).reduce((s, m) => s + m.cantidad, 0);

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
        <div className="admin-topbar-right" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {activeTab === "catalogo" && (
            <>
              <button className="btn btn-outline" style={{ borderColor: "#f59e0b", color: "#d97706", padding: "10px 20px", fontSize: "13px", fontWeight: 700 }} onClick={handleGenerarPruebas}>
                🧪 Generar Pruebas
              </button>
              <button className="btn btn-outline" style={{ borderColor: "#ef4444", color: "#dc2626", padding: "10px 20px", fontSize: "13px", fontWeight: 700 }} onClick={handleResetearPruebas}>
                🗑 Resetear Todo
              </button>
              <button
                id="btn-nueva-vacuna"
                className="btn btn-primary"
                style={{ padding: "10px 20px", fontSize: "13px", background: primaryColor }}
                onClick={() => newVacunaRef.current?.showModal()}
              >
                ＋ Nuevo Ítem
              </button>
            </>
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
            {/* ── FILTROS SUPERIORES ────────────────────────────────── */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "260px" }}>
                <label className="form-label" htmlFor="search-vacunas-top" style={{ marginBottom: "6px", display: "block" }}>Buscar Ítem</label>
                <input
                  type="search"
                  id="search-vacunas-top"
                  placeholder="Buscar por nombre o laboratorio..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-input"
                  style={{ width: "100%" }}
                  aria-label="Buscar ítems"
                />
              </div>
              <div style={{ width: "220px" }}>
                <label className="form-label" htmlFor="filter-categoria-top" style={{ marginBottom: "6px", display: "block" }}>Categoría</label>
                <select
                  id="filter-categoria-top"
                  className="form-select"
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px" }}
                >
                  <option value="all">Todas las Categorías</option>
                  {categorias.map(c => {
                    const pc = parseCategory(c);
                    return <option key={pc.id} value={pc.id}>{pc.nombre}</option>;
                  })}
                </select>
              </div>
            </div>

            {/* ── KPI CARDS ─────────────────────────────────────────── */}
            <div className="kpi-grid">
              <KPICard icon="💊" iconClass="kpi-icon-teal"    number={totalVacunas} label="Ítems registrados"     trend="Total" trendClass="kpi-trend-neu" />
              <KPICard icon="📦" iconClass="kpi-icon-emerald" number={totalDosis}   label="Unidades disponibles"    trend={totalDosis > 20 ? "Buen stock" : "Stock bajo"} trendClass={totalDosis > 20 ? "kpi-trend-up" : "kpi-trend-warn"} />
              <KPICard icon="⚠️" iconClass="kpi-icon-rose"    number={criticas}     label="Ítems sin stock OK"    trend={criticas > 0 ? "Requiere atención" : "Todo OK"} trendClass={criticas > 0 ? "kpi-trend-warn" : "kpi-trend-up"} />
              <KPICard icon="💉" iconClass="kpi-icon-amber"   number={dosisHoy}     label="Salidas hoy"             trend="Hoy" trendClass="kpi-trend-neu" />
            </div>

            {/* ── ALERTAS DE INVENTARIO ─────────────────────────────── */}
            {criticas > 0 && (
              <div style={{ marginTop: "24px", marginBottom: "32px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "15px", fontWeight: 800, color: "var(--slate-700)" }}>
                  🔔 Alertas de Inventario
                </h3>
                {filtered.filter(v => getStockStatus(v) !== "ok").map(v => {
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
                        {(() => {
                          const cat = categorias.find(c => c.id === v.categoria_id);
                          const parsedCat = cat ? parseCategory(cat) : null;
                          return parsedCat ? (
                            <span style={{
                              marginLeft: "8px",
                              padding: "2px 8px",
                              fontSize: "11px",
                              borderRadius: "12px",
                              background: `${parsedCat.color || primaryColor}22`,
                              color: parsedCat.color || primaryColor,
                              fontWeight: 700
                            }}>
                              {parsedCat.nombre}
                            </span>
                          ) : null;
                        })()}
                        <span style={{ fontSize: "12px", color: "var(--slate-500)", marginLeft: "8px" }}>
                          {v.stockActual} unidades restantes (mín. {v.stockMinimo})
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

            {/* ── INVENTORY TABLE ───────────────────────────────────── */}
            <div className="section-header">
              <h2 className="section-title" style={{ color: "var(--slate-900)" }}>Catálogo de Ítems</h2>
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
                  <th scope="col">P. Unitario Compra</th>
                  <th scope="col">P. Unitario Venta</th>
                  <th scope="col">P. Total Compra</th>
                  <th scope="col" style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const status = getStockStatus(v);
                  // Calculate P. Total Compra summing all active lotes (cantidad * precio_compra).
                  let pTotalCompra = 0;
                  let pUnitarioCompra = parseInt(v.valorMayorista || "0");
                  
                  if (v.lotes && v.lotes.length > 0) {
                     // Find active lotes (cantidad > 0)
                     const lotesActivos = v.lotes.filter(l => l.cantidad > 0);
                     if (lotesActivos.length > 0) {
                        pTotalCompra = lotesActivos.reduce((acc, l) => acc + (l.cantidad * parseInt(l.precioCompra || "0")), 0);
                        // The reference unitario compra could be the last added lote price
                        pUnitarioCompra = parseInt(lotesActivos[0].precioCompra || "0");
                     } else {
                        // If no lotes explicitly active but stock is > 0 (data inconsistency fallback)
                        pTotalCompra = v.stockActual * pUnitarioCompra;
                        pUnitarioCompra = parseInt(v.lotes[0].precioCompra || "0");
                     }
                  } else {
                     pTotalCompra = v.stockActual * pUnitarioCompra;
                  }

                  return (
                    <tr key={v.id}>
                      <td>
                        <div className="vaccine-name-cell">
                          <span className="vaccine-name-main">{v.nombre}</span>
                          <span className="vaccine-name-generic">
                            {(() => {
                              const cat = categorias.find(c => c.id === v.categoria_id);
                              return cat ? parseCategory(cat).nombre : "Sin Categoría";
                            })()}
                          </span>
                        </div>
                      </td>
                      <td>
                        {v.loteActivo === "—"
                          ? <span style={{ color: "var(--slate-400)", fontSize: "12px" }}>Sin lote</span>
                          : <span className="lot-badge" style={{ background: `${accentColor}22`, color: primaryColor, cursor: "pointer" }} onClick={() => openLoteModal(v.id)} title="Ver detalles y lotes">{v.loteActivo}</span>
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
                      <td style={{ color: "var(--slate-500)" }}>
                        ${pUnitarioCompra.toLocaleString("es-CO")}
                      </td>
                      <td style={{ fontWeight: 700, color: primaryColor }}>
                        {(() => {
                          const cat = categorias.find(c => c.id === v.categoria_id);
                          const isUF = cat ? parseCategory(cat).uf : true;
                          return isUF ? `$${parseInt(v.precioVenta || "0").toLocaleString("es-CO")}` : "Uso Interno";
                        })()}
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--slate-700)" }}>
                        ${pTotalCompra.toLocaleString("es-CO")}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-row" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="action-btn action-btn-ghost"
                            onClick={() => openComprasHistoricasModal(v.id)}
                            title="Ver compras históricas (lotes)"
                            type="button"
                            style={{ borderColor: primaryColor, color: primaryColor, background: "transparent" }}
                          >
                            📋 Compras
                          </button>
                          <button
                            className="action-btn action-btn-emerald"
                            onClick={() => openLoteModal(v.id)}
                            title="Agregar nuevo lote de dosis o ver historial"
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
                          <button
                            className="action-btn action-btn-danger"
                            onClick={() => openMermaModal(v.id)}
                            disabled={v.stockActual === 0}
                            style={v.stockActual > 0 ? { background: "#ef4444", color: "white" } : undefined}
                            title={v.stockActual === 0 ? "Sin stock disponible" : "Registrar pérdida o merma"}
                            type="button"
                          >
                            🗑️ Merma
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


      </>
        )}

        {/* ── CATEGORÍAS ─────────────────────────────────────────── */}
        {activeTab === "categorias" && (
          <div className="categorias-section">
            <div className="section-header">
              <h2 className="section-title" style={{ color: "var(--slate-900)" }}>Categorías de Inventario</h2>
              <button className="btn btn-primary" onClick={openNewCategoria}>＋ Nueva Categoría</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {categorias.length === 0 ? (
                <div style={{ gridColumn: "1/-1", padding: "40px", textAlign: "center", color: "var(--slate-500)", background: "var(--slate-50)", borderRadius: "var(--radius-lg)" }}>
                  No hay categorías registradas. Se usarán ítems sin clasificar.
                </div>
              ) : categorias.map(c => {
                const pc = parseCategory(c);
                return (
                  <div key={c.id} className="card" style={{ padding: "20px", borderLeft: `4px solid ${c.color || primaryColor}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--slate-900)" }}>{pc.nombre}</h3>
                        <button type="button" onClick={() => openEditCategoria(c)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }} title="Editar categoría">✏️</button>
                      </div>
                      <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--slate-500)", marginBottom: "20px" }}>
                        {vacunas.filter(v => v.categoria_id === c.id).length} ítems en esta categoría
                      </div>
                    </div>
                    <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: "13px" }} onClick={() => openNewItemForCategory(c.id)}>
                      ➕ Añadir Ítem
                    </button>
                  </div>
                );
              })}
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
            <div className="modal-title" id="dialog-nueva-title">➕ Registrar Nuevo Ítem</div>
            <div className="modal-subtitle">Complete todos los campos obligatorios marcados con *</div>
          </div>
          <button className="modal-close" onClick={() => newVacunaRef.current?.close()} type="button" aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleNuevaVacuna} noValidate>
          <div className="modal-body">
            <div className="form-grid">

              <div className="form-group full-width">
                <label className="form-label" htmlFor="categoria_id">Categoría <span className="required-mark">*</span></label>
                <select id="categoria_id" name="categoria_id" className="form-select" value={newForm.categoria_id} onChange={handleNewFormChange} required>
                  <option value="" disabled>Seleccione una categoría...</option>
                  {categorias.map(c => {
                    const pc = parseCategory(c);
                    return <option key={pc.id} value={pc.id}>{pc.nombre}</option>;
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="nombre">Nombre comercial <span className="required-mark">*</span></label>
                <input id="nombre" name="nombre" type="text" className="form-input"
                  value={newForm.nombre} onChange={handleNewFormChange}
                  required minLength={2} placeholder="ej: Hepatitis B" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="enfermedad">Enfermedad que previene</label>
                <input id="enfermedad" name="enfermedad" type="text" className="form-input"
                  value={newForm.enfermedad} onChange={handleNewFormChange}
                  placeholder="ej: Hepatitis B crónica" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="viaAdmin">Vía de administración</label>
                <select id="viaAdmin" name="viaAdmin" className="form-select" value={newForm.viaAdmin} onChange={handleNewFormChange}>
                  <option value="">No aplica</option>
                  <option value="Intramuscular">Intramuscular</option>
                  <option value="Subcutánea">Subcutánea</option>
                  <option value="Oral">Oral</option>
                  <option value="Intradérmica">Intradérmica</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="temperatura">Temperatura de almacenamiento</label>
                <select id="temperatura" name="temperatura" className="form-select" value={newForm.temperatura} onChange={handleNewFormChange} required>
                  <option value="2-8°C">2-8°C (Refrigeración)</option>
                  <option value="-15 a -25°C">-15 a -25°C (Congelación)</option>
                  <option value="Temperatura ambiente">Temperatura ambiente</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="esquemaDosis">Esquema de dosis</label>
                <input id="esquemaDosis" name="esquemaDosis" type="text" className="form-input"
                  value={newForm.esquemaDosis} onChange={handleNewFormChange}
                  placeholder="ej: 3 dosis: 2, 4, 6 meses" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="stockMinimo">Stock mínimo de alerta <span className="required-mark">*</span></label>
                <input id="stockMinimo" name="stockMinimo" type="text" inputMode="numeric" pattern="[0-9]*" className="form-input"
                  value={newForm.stockMinimo} onChange={handleNewFormChange}
                  required placeholder="ej: 10" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="valorMayorista">Valor mayorista (Costo) <span className="required-mark">*</span></label>
                <input id="valorMayorista" name="valorMayorista" type="text" inputMode="decimal" className="form-input"
                  value={newForm.valorMayorista} onChange={handleNewFormChange}
                  required placeholder="ej: 30000" autoComplete="off" />
              </div>

              {(() => {
                const selectedNewCat = categorias.find(c => c.id === newForm.categoria_id);
                const isUF = selectedNewCat ? parseCategory(selectedNewCat).uf : true;
                return isUF ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="precioVenta">Valor precio de venta <span className="required-mark">*</span></label>
                    <input id="precioVenta" name="precioVenta" type="text" inputMode="decimal" className="form-input"
                      value={newForm.precioVenta} onChange={handleNewFormChange}
                      required placeholder="ej: 45000" autoComplete="off" />
                  </div>
                ) : null;
              })()}

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

              {(() => {
                const selectedVacCat = selectedVacuna ? categorias.find(c => c.id === selectedVacuna.categoria_id) : null;
                const isP = selectedVacCat ? parseCategory(selectedVacCat).p : true;
                return isP ? (
                  <div className="form-group">
                    <label className="form-label" htmlFor="lote-vencimiento">Fecha de vencimiento <span className="required-mark">*</span></label>
                    <input id="lote-vencimiento" name="fechaVencimiento" type="date" className="form-input"
                      value={loteForm.fechaVencimiento} onChange={handleLoteChange}
                      required min={today()} />
                    <span className="form-hint">Debe ser una fecha futura</span>
                  </div>
                ) : null;
              })()}

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
      <dialog ref={usarRef} id="dialog-usar-dosis" className="confirm-dialog" aria-labelledby="dialog-usar-title" style={{ margin: "auto" }}>
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

          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", textAlign: "left", marginTop: "16px" }}>
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label" htmlFor="paciente-nombre">Nombre del Paciente <span className="required-mark">*</span></label>
              <input
                id="paciente-nombre"
                type="text"
                className="form-input"
                value={pacienteNombre}
                onChange={e => setPacienteNombre(e.target.value)}
                placeholder="ej: Juan Pérez"
                autoComplete="off"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="paciente-edad">Edad <span className="required-mark">*</span></label>
              <input
                id="paciente-edad"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-input"
                value={pacienteEdad}
                onChange={e => setPacienteEdad(e.target.value)}
                placeholder="ej: 6"
                autoComplete="off"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="paciente-edad-unidad">Unidad</label>
              <select
                id="paciente-edad-unidad"
                className="form-select"
                value={pacienteEdadUnidad}
                onChange={e => setPacienteEdadUnidad(e.target.value)}
              >
                <option value="Años">Años</option>
                <option value="Meses">Meses</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ textAlign: "left", marginTop: "16px" }}>
            <label className="form-label" htmlFor="dosis-notes">Notas adicionales (opcional)</label>
            <input
              id="dosis-notes"
              type="text"
              className="form-input"
              value={dosisNotas}
              onChange={e => setDosisNotas(e.target.value)}
              placeholder="ej: Ninguna observación"
              autoComplete="off"
            />
          </div>

          <div className="form-group" style={{ marginTop: "16px", padding: "12px", background: "var(--slate-50)", borderRadius: "8px", border: "1px solid var(--slate-200)", textAlign: "left" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "var(--slate-700)" }}>
              <input type="checkbox" checked={cobrarMayorista} onChange={(e) => setCobrarMayorista(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: primaryColor }} />
              Cobrar precio mayorista (Costo)
            </label>
            <div style={{ fontSize: "12px", color: "var(--slate-500)", marginLeft: "28px", marginTop: "4px" }}>
              Al marcar esta opción, el ingreso registrado será el valor mayorista base (${parseInt(selectedVacuna?.valorMayorista || "0").toLocaleString("es-CO")}) en lugar del precio de venta final (${parseInt(selectedVacuna?.precioVenta || "0").toLocaleString("es-CO")}).
            </div>
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
            💉 Registrar Aplicación
          </button>
        </div>
      </dialog>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: COMPRAS HISTÓRICAS (LOTES)
      ═══════════════════════════════════════════════════════════ */}
      <dialog ref={comprasHistoricasRef} id="modal-compras-historicas" aria-labelledby="dialog-compras-title" style={{ maxWidth: "800px", width: "90%", margin: "auto" }}>
        <div className="modal-header">
          <div>
            <div className="modal-title" id="dialog-compras-title">📋 Historial de Compras de Lotes</div>
            <div className="modal-subtitle">
              {selectedVacuna ? `Item: ${selectedVacuna.nombre}` : ""}
            </div>
          </div>
          <button className="modal-close" onClick={() => comprasHistoricasRef.current?.close()} type="button" aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {selectedVacuna && selectedVacuna.lotes && selectedVacuna.lotes.length > 0 ? (
            <div className="inv-table-wrap" style={{ margin: 0 }}>
              <table className="inv-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Fecha Registro</th>
                    <th>Nro Lote</th>
                    <th>Proveedor</th>
                    <th>Cantidad</th>
                    <th>Costo Unitario</th>
                    <th>Total Pagado</th>
                    <th>Factura</th>
                    <th>Vencimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedVacuna.lotes.map(l => {
                    const cant = l.cantidad || 0;
                    const precio = parseInt(l.precioCompra || "0");
                    const total = cant * precio;
                    return (
                      <tr key={l.id}>
                        <td style={{ fontSize: "13px" }}>{l.fechaRegistro ? l.fechaRegistro.split("T")[0] : "—"}</td>
                        <td>
                          <span className="lot-badge" style={{ background: `${accentColor}22`, color: primaryColor }}>
                            {l.numero}
                          </span>
                        </td>
                        <td style={{ fontSize: "13px" }}>{l.proveedor || "—"}</td>
                        <td>{cant}</td>
                        <td style={{ fontSize: "13px" }}>${precio.toLocaleString("es-CO")}</td>
                        <td style={{ fontSize: "13px", fontWeight: 700 }}>${total.toLocaleString("es-CO")}</td>
                        <td style={{ fontSize: "13px" }}>{l.factura || "—"}</td>
                        <td style={{ fontSize: "13px" }}>
                          {l.fechaVencimiento ? (
                            <span style={{ color: new Date(l.fechaVencimiento) < new Date() ? "var(--rose-500)" : "inherit" }}>
                              {l.fechaVencimiento}
                            </span>
                          ) : (
                            <span style={{ color: "var(--slate-400)" }}>No perecedero</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-500)" }}>
              No se han registrado compras/lotes para este ítem.
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" style={{ background: primaryColor }} onClick={() => comprasHistoricasRef.current?.close()}>
            Cerrar
          </button>
        </div>
      </dialog>

      {/* ═══════════════════════════════════════════════════════════
          DIALOG: REGISTRAR MERMA
      ═══════════════════════════════════════════════════════════ */}
      <dialog ref={mermaRef} id="dialog-registrar-merma" className="confirm-dialog" aria-labelledby="dialog-merma-title" style={{ margin: "auto", maxWidth: "450px", width: "90%" }}>
        <div className="modal-body" style={{ padding: "32px 28px" }}>
          <div className="confirm-icon" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>🗑️</div>

          <h2 className="confirm-title" id="dialog-merma-title" style={{ color: "var(--slate-900)" }}>Registrar Merma</h2>
          <p className="confirm-msg" style={{ color: "var(--slate-600)" }}>
            Vas a registrar una pérdida o descarte de{" "}
            <strong>{selectedVacuna?.nombre}</strong>.
          </p>

          <form onSubmit={handleRegistrarMerma} noValidate style={{ textAlign: "left", marginTop: "16px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="merma-cantidad">Cantidad a descartar <span className="required-mark">*</span></label>
              <input
                id="merma-cantidad"
                type="number"
                min="1"
                max={selectedVacuna?.stockActual || 1}
                className="form-input"
                value={mermaCantidad}
                onChange={e => setMermaCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                required
              />
            </div>

            <div className="form-group" style={{ marginTop: "12px" }}>
              <label className="form-label" htmlFor="merma-motivo">Motivo de la merma <span className="required-mark">*</span></label>
              <select
                id="merma-motivo"
                className="form-select"
                value={mermaMotivo}
                onChange={e => setMermaMotivo(e.target.value)}
                required
              >
                <option value="MERMA - Vencimiento">Vencimiento de lote</option>
                <option value="MERMA - Rotura de frío">Rotura de cadena de frío</option>
                <option value="MERMA - Accidente / Rotura">Accidente / Rotura física</option>
                <option value="MERMA - Otro">Otro / Descarte técnico</option>
              </select>
            </div>

            <div className="modal-footer" style={{ marginTop: "24px", padding: 0 }}>
              <button type="button" className="btn btn-outline" onClick={() => mermaRef.current?.close()}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: "#ef4444" }}
              >
                Registrar Pérdida
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: CATEGORÍA
      ═══════════════════════════════════════════════════════════ */}
      <dialog ref={catRef} id="modal-categoria" aria-labelledby="dialog-cat-title">
        <div className="modal-header">
          <div>
            <div className="modal-title" id="dialog-cat-title">{catForm.id ? "✏️ Editar Categoría" : "➕ Nueva Categoría"}</div>
            <div className="modal-subtitle">Organiza tu inventario en secciones lógicas</div>
          </div>
          <button className="modal-close" onClick={() => catRef.current?.close()} type="button" aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSaveCategoria} noValidate>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label" htmlFor="cat-nombre">Nombre de la Categoría <span className="required-mark">*</span></label>
                <input id="cat-nombre" name="nombre" type="text" className="form-input"
                  value={catForm.nombre} onChange={handleCatChange}
                  required placeholder="ej: Sueros, Insumos Odontológicos..."
                  autoComplete="off" />
              </div>
              <div className="form-group full-width">
                <label className="form-label" htmlFor="cat-color">Color representativo</label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input id="cat-color" name="color" type="color" 
                    value={catForm.color} onChange={handleCatChange}
                    style={{ width: "40px", height: "40px", padding: "0", border: "none", cursor: "pointer", borderRadius: "8px" }} />
                  <span style={{ fontSize: "13px", color: "var(--slate-500)" }}>Elige un color para identificar esta categoría.</span>
                </div>
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={catIsUF} onChange={e => setCatIsUF(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: primaryColor }} />
                  ¿Es para Usuario Final?
                </label>
                <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>Requiere precio de venta al público y genera ingresos.</span>
              </div>

              <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input type="checkbox" checked={catIsP} onChange={e => setCatIsP(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: primaryColor }} />
                  ¿Es Perecedero?
                </label>
                <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>Requiere fecha de vencimiento obligatoria al registrar lotes.</span>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => catRef.current?.close()}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: primaryColor }}>
              ✓ Guardar Categoría
            </button>
          </div>
        </form>
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
