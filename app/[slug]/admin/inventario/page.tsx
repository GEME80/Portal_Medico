"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import CustomConfirmModal from "@/components/CustomConfirmModal";
import { Package, Plus } from "lucide-react";

type EstadoStock = "ok" | "low" | "critical";
type TipoMovimiento = "ENTRADA" | "SALIDA";
type QuickFilterType = "all" | "critical" | "expiring" | "refrigerated";

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
  valorUnitarioCobrado?: number;
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
  esRefrigerado: boolean;
  ubicacion: string;
  unidadMedida: string;
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
  tipo: "v" | "i";
}

const parseCategory = (c: Categoria): ParsedCategoria => {
  try {
    const trimmed = c.nombre.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      return {
        id: c.id,
        nombre: parsed.n || "",
        color: c.color,
        uf: parsed.uf !== undefined ? parsed.uf : true,
        p: parsed.p !== undefined ? parsed.p : true,
        tipo: parsed.tipo || "v",
      };
    }
  } catch (e) {
    // Ignore parse error fallback
  }
  return {
    id: c.id,
    nombre: c.nombre,
    color: c.color,
    uf: true,
    p: true,
    tipo: "v",
  };
};

const stockChipLabel: Record<EstadoStock, string> = {
  ok: "✓ OK",
  low: "⚠️ Stock Bajo",
  critical: "🔴 Agotado",
};

const stockChipClass: Record<EstadoStock, string> = {
  ok: "chip-ok",
  low: "chip-low",
  critical: "chip-critical",
};

const today = () => new Date().toISOString().split("T")[0];

const getDaysUntilExpiration = (dateStr: string): number => {
  if (!dateStr) return 999;
  const target = new Date(dateStr).getTime();
  const now = new Date(today()).getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

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
  const [hasAccess, setHasAccess] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"catalogo" | "categorias" | "movimientos">("catalogo");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>("all");

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const supabase = createClient();

  // Modal refs
  const newVacunaRef = useRef<HTMLDialogElement>(null);
  const loteRef      = useRef<HTMLDialogElement>(null);
  const usarRef      = useRef<HTMLDialogElement>(null);
  const mermaRef     = useRef<HTMLDialogElement>(null);
  const comprasHistoricasRef = useRef<HTMLDialogElement>(null);
  const catRef       = useRef<HTMLDialogElement>(null);

  const [mermaCantidad, setMermaCantidad] = useState(1);
  const [mermaMotivo, setMermaMotivo] = useState("MERMA - Vencimiento de lote");

  // Selected item for actions
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dosisNotas, setDosisNotas] = useState("");
  const [pacienteNombre, setPacienteNombre] = useState("");
  const [pacienteEdad, setPacienteEdad] = useState("");
  const [pacienteEdadUnidad, setPacienteEdadUnidad] = useState("Años");
  const [cobrarMayorista, setCobrarMayorista] = useState(false);

  const [catIsUF, setCatIsUF] = useState(true);
  const [catIsP, setCatIsP] = useState(true);
  const [catTipo, setCatTipo] = useState<"v" | "i">("v");

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

        const tempStr = v.temperatura || "2-8°C";
        const isRefrig = Boolean(v.es_refrigerado) || tempStr.includes("2-8") || tempStr.includes("Refrigeración") || tempStr.includes("Congelación");

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
          temperatura: tempStr,
          esRefrigerado: isRefrig,
          ubicacion: v.ubicacion || (isRefrig ? "Nevera #1" : "Estante Principal"),
          unidadMedida: v.unidad_medida || "Dosis",
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
            notas: m.notas || "",
            valorUnitarioCobrado: m.valor_unitario_cobrado
          }))
        };
      }));

      setVacunas(enrichedVacs);
    } catch (err: any) {
      console.error("Error loading inventory:", err);
      addToast("Error al cargar inventario: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    params.then(async (p) => {
      setSlug(p.slug);
      const { data: { user } } = await supabase.auth.getUser();
      const superadminCheck = user?.email?.toLowerCase() === "gerkof@gmail.com" || user?.app_metadata?.role === "superadmin";
      setIsSuperadmin(superadminCheck);

      const { data: tenant } = await supabase.from("tenants").select("id").eq("slug", p.slug).single();
      if (!tenant) return;
      setTenantId(tenant.id);

      const { data: config } = await supabase
        .from("configuracion_portal")
        .select("color_primario, color_acento, habilitar_menu_vacunas")
        .eq("tenant_id", tenant.id)
        .single();

      if (config) {
        if (config.color_primario) setPrimaryColor(config.color_primario);
        if (config.color_acento) setAccentColor(config.color_acento);
        
        const userMetadataPerm = user?.user_metadata?.inventario_enabled;
        const permGranted = superadminCheck || (userMetadataPerm !== undefined ? Boolean(userMetadataPerm) : (config.habilitar_menu_vacunas !== false));
        setHasAccess(permGranted);
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
    setCatTipo("v");
    catRef.current?.showModal();
  };

  const openEditCategoria = (cat: Categoria) => {
    const pc = parseCategory(cat);
    setCatForm({ id: pc.id, nombre: pc.nombre, color: pc.color || primaryColor });
    setCatIsUF(pc.uf);
    setCatIsP(pc.p);
    setCatTipo(pc.tipo);
    catRef.current?.showModal();
  };

  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.nombre) return;
    
    const serializedName = JSON.stringify({
      n: catForm.nombre,
      uf: catIsUF,
      p: catIsP,
      tipo: catTipo
    });
    
    try {
      if (catForm.id) {
        const { error } = await supabase.from("categorias_inventario")
          .update({ nombre: serializedName, color: catForm.color })
          .eq("id", catForm.id);
        if (error) throw error;
        addToast(`Categoría "${catForm.nombre}" actualizada.`);
      } else {
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

  // ── NUEVO ITEM FORM ───────────────────────────────────────────────
  const [newForm, setNewForm] = useState({
    categoria_id: "", nombre: "", enfermedad: "", viaAdmin: "",
    esquemaDosis: "", stockMinimo: "5", valorMayorista: "",
    precioVenta: "", temperatura: "2-8°C", esRefrigerado: true,
    ubicacion: "Nevera #1", unidadMedida: "Dosis"
  });

  const openNewItemForCategory = (categoryId: string) => {
    setNewForm(prev => ({ ...prev, categoria_id: categoryId }));
    setActiveTab("catalogo");
    setTimeout(() => {
      newVacunaRef.current?.showModal();
    }, 100);
  };

  const handleNewFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setNewForm(prev => ({ ...prev, [target.name]: value }));
  };

  const handleNuevaVacuna = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedCat = categorias.find(c => c.id === newForm.categoria_id);
      const parsedCat = selectedCat ? parseCategory(selectedCat) : null;
      const isUF = parsedCat ? parsedCat.uf : true;
      const isVacuna = parsedCat ? parsedCat.tipo === "v" : true;

      const { error } = await supabase
        .from("inventario_medico")
        .insert({
          tenant_id: tenantId,
          categoria_id: newForm.categoria_id || (categorias.length > 0 ? categorias[0].id : null),
          nombre: newForm.nombre,
          enfermedad: isVacuna ? (newForm.enfermedad || null) : null,
          via_admin: isVacuna ? (newForm.viaAdmin || "Intramuscular") : "No aplica",
          esquema_dosis: isVacuna ? (newForm.esquemaDosis || null) : null,
          stock_minimo: parseInt(newForm.stockMinimo) || 5,
          stock_actual: 0,
          valor_mayorista: parseFloat(newForm.valorMayorista) || 0,
          precio_venta: isUF ? (parseFloat(newForm.precioVenta) || 0) : 0,
          temperatura: newForm.esRefrigerado ? newForm.temperatura : "Temperatura ambiente",
          es_refrigerado: newForm.esRefrigerado,
          ubicacion: newForm.ubicacion,
          unidad_medida: newForm.unidadMedida,
          lote_activo: "—"
        });

      if (error) throw error;

      newVacunaRef.current?.close();
      setNewForm({
        categoria_id: "", nombre: "", enfermedad: "", viaAdmin: "", esquemaDosis: "",
        stockMinimo: "5", valorMayorista: "", precioVenta: "", temperatura: "2-8°C",
        esRefrigerado: true, ubicacion: "Nevera #1", unidadMedida: "Dosis"
      });
      addToast(`Ítem "${newForm.nombre}" registrado correctamente.`);
      await loadData(tenantId);
    } catch (err: any) {
      console.error(err);
      addToast("Error al guardar ítem: " + err.message, "error");
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
      addToast(`Lote registrado. Stock actualizado.`);
      await loadData(tenantId);
    } catch (err: any) {
      console.error(err);
      addToast("Error al agregar lote: " + err.message, "error");
    }
  };

  // ── ACTIONS ───────────────────────────────────────────────────────
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
    setMermaMotivo("MERMA - Vencimiento de lote");
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
        motivo: "Aplicación / Consumo paciente",
        notas: notasFinales || null,
        fecha: today(),
        valor_unitario_cobrado: valorUnitario
      });

      if (movErr) throw movErr;

      const currentStock = selectedVacuna?.stockActual || 0;
      const newStock = Math.max(0, currentStock - 1);
      const { error: updErr } = await supabase
        .from("inventario_medico")
        .update({ stock_actual: newStock })
        .eq("id", selectedId);

      if (updErr) throw updErr;

      usarRef.current?.close();
      if (newStock === 0) {
        addToast(`⚠️ ${selectedVacuna?.nombre} agotado. Solicitar reabastecimiento.`, "error");
      } else {
        addToast(`Salida de "${selectedVacuna?.nombre}" registrada correctamente.`);
      }
      await loadData(tenantId);
    } catch (err: any) {
      console.error(err);
      addToast("Error al aplicar consumo: " + err.message, "error");
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
        notas: `Descarte de inventario por merma. Cantidad: ${mermaCantidad}`,
        fecha: today(),
        valor_unitario_cobrado: 0
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

  // ── FILTERED ITEMS ────────────────────────────────────────────────
  const filtered = vacunas.filter(v => {
    const matchesSearch = v.nombre.toLowerCase().includes(search.toLowerCase()) ||
                          v.loteActivo.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "all" || v.categoria_id === selectedCategoryFilter;
    
    let matchesQuickFilter = true;
    if (quickFilter === "critical") {
      matchesQuickFilter = getStockStatus(v) !== "ok";
    } else if (quickFilter === "expiring") {
      const activeLot = v.lotes?.find(l => l.numero === v.loteActivo || l.cantidad > 0);
      const days = activeLot?.fechaVencimiento ? getDaysUntilExpiration(activeLot.fechaVencimiento) : 999;
      matchesQuickFilter = days <= 30;
    } else if (quickFilter === "refrigerated") {
      matchesQuickFilter = v.esRefrigerado;
    }

    return matchesSearch && matchesCategory && matchesQuickFilter;
  }).sort((a, b) => {
    const getStatusWeight = (v: any) => {
      const status = getStockStatus(v);
      if (status === "critical") return 0;
      if (status === "low") return 1;
      return 2;
    };
    const weightA = getStatusWeight(a);
    const weightB = getStatusWeight(b);
    if (weightA !== weightB) return weightA - weightB;
    return a.nombre.localeCompare(b.nombre);
  });

  // ── ALL MOVEMENTS FOR HISTORY TAB ─────────────────────────────────
  const allMovements = vacunas.flatMap(v => 
    v.movimientos.map(m => ({
      ...m,
      itemNombre: v.nombre,
      categoriaId: v.categoria_id
    }))
  ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // ── DERIVED KPIs ──────────────────────────────────────────────────
  const totalItemsCount = vacunas.length;
  const totalValuation  = vacunas.reduce((sum, v) => sum + (v.stockActual * (parseFloat(v.valorMayorista || "0") || 0)), 0);
  const criticasCount   = vacunas.filter(v => getStockStatus(v) !== "ok").length;
  
  const expiringCount = vacunas.filter(v => {
    const lot = v.lotes?.find(l => l.numero === v.loteActivo || l.cantidad > 0);
    if (!lot || !lot.fechaVencimiento) return false;
    const days = getDaysUntilExpiration(lot.fechaVencimiento);
    return days <= 30;
  }).length;

  const coldChainCount  = vacunas.filter(v => v.esRefrigerado).length;
  
  const currentMonthStr = today().substring(0, 7);
  const monthMovements  = allMovements.filter(m => m.fecha.startsWith(currentMonthStr)).length;

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", color: "var(--slate-500)", gap: "12px" }}>
        <div style={{ fontSize: "28px" }}>⏳</div>
        <div style={{ fontWeight: 600 }}>Cargando módulo de inventario clínico...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: "800px", margin: "40px auto", textAlign: "center" }}>
        <div className="card" style={{ padding: "40px 30px", borderTop: `4px solid #ef4444`, background: "white", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--slate-900)", marginBottom: "8px" }}>Acceso Restringido al Inventario</h2>
          <p style={{ color: "var(--slate-600)", fontSize: "14px", lineHeight: "1.6", maxWidth: "540px", margin: "0 auto 24px" }}>
            El módulo de inventario clínico no está habilitado para tu cuenta de usuario. Contacta al <strong>Superadministrador</strong> de la clínica para activar los permisos de gestión de inventario en tu perfil.
          </p>
          <Link href={`/${slug}/admin`} className="btn btn-primary" style={{ background: primaryColor, display: "inline-flex", alignItems: "center", gap: "8px" }}>
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── TOP BAR ───────────────────────────────────────────────── */}
      <div className="admin-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: "rgba(10, 77, 92, 0.08)",
            color: "var(--doc-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Package size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="admin-topbar-title" style={{ margin: 0, lineHeight: 1.2 }}>Inventario Médico y Farmacia</h1>
            <p style={{ fontSize: "12px", color: "var(--slate-500)", margin: "2px 0 0" }}>
              Gestión de stock, lotes, insumos refrigerados y trazabilidad de vencimientos
            </p>
          </div>
        </div>
        <div className="admin-topbar-right" style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {activeTab === "catalogo" && (
            <button
              id="btn-nueva-vacuna"
              className="btn btn-primary"
              style={{ padding: "8px 18px", fontSize: "13px", background: primaryColor, display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => newVacunaRef.current?.showModal()}
            >
              <Plus size={15} /> Registrar Nuevo Ítem
            </button>
          )}
          {activeTab === "categorias" && (
            <button
              className="btn btn-primary"
              style={{ padding: "8px 18px", fontSize: "13px", background: primaryColor, display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={openNewCategoria}
            >
              <Plus size={15} /> Nueva Categoría
            </button>
          )}
        </div>
      </div>

      {/* ── HIGH IMPACT KPI CARDS HEADER ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        
        <div 
          onClick={() => { setQuickFilter("all"); setActiveTab("catalogo"); }}
          className="kpi-card" 
          style={{ cursor: "pointer", borderLeft: `4px solid ${primaryColor}`, transition: "transform 0.15s ease" }}
        >
          <div className="kpi-card-header">
            <div className="kpi-icon kpi-icon-teal">💊</div>
            <span className="kpi-trend kpi-trend-neu">Catálogo</span>
          </div>
          <div className="kpi-number">{totalItemsCount}</div>
          <div className="kpi-label">Ítems Registrados</div>
          <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600 }}>
            Valor: ${totalValuation.toLocaleString("es-CO")}
          </div>
        </div>

        <div 
          onClick={() => { setQuickFilter("critical"); setActiveTab("catalogo"); }}
          className="kpi-card" 
          style={{ cursor: "pointer", borderLeft: `4px solid ${criticasCount > 0 ? "#ef4444" : "#10b981"}`, transition: "transform 0.15s ease" }}
        >
          <div className="kpi-card-header">
            <div className="kpi-icon kpi-icon-rose">⚠️</div>
            <span className={`kpi-trend ${criticasCount > 0 ? "kpi-trend-warn" : "kpi-trend-up"}`}>
              {criticasCount > 0 ? "Reabastecer" : "Stock OK"}
            </span>
          </div>
          <div className="kpi-number" style={{ color: criticasCount > 0 ? "#ef4444" : "inherit" }}>{criticasCount}</div>
          <div className="kpi-label">Stock Crítico / Agotado</div>
          <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "4px" }}>
            Ítems en umbral bajo
          </div>
        </div>

        <div 
          onClick={() => { setQuickFilter("expiring"); setActiveTab("catalogo"); }}
          className="kpi-card" 
          style={{ cursor: "pointer", borderLeft: `4px solid ${expiringCount > 0 ? "#f59e0b" : "#3b82f6"}`, transition: "transform 0.15s ease" }}
        >
          <div className="kpi-card-header">
            <div className="kpi-icon kpi-icon-amber">⏰</div>
            <span className={`kpi-trend ${expiringCount > 0 ? "kpi-trend-warn" : "kpi-trend-neu"}`}>
              {expiringCount > 0 ? "Atención" : "Al día"}
            </span>
          </div>
          <div className="kpi-number" style={{ color: expiringCount > 0 ? "#d97706" : "inherit" }}>{expiringCount}</div>
          <div className="kpi-label">Vencimientos (≤ 30 días)</div>
          <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "4px" }}>
            Lotes próximos a vencer
          </div>
        </div>

        <div 
          onClick={() => { setQuickFilter("refrigerated"); setActiveTab("catalogo"); }}
          className="kpi-card" 
          style={{ cursor: "pointer", borderLeft: `4px solid #06b6d4`, transition: "transform 0.15s ease" }}
        >
          <div className="kpi-card-header">
            <div className="kpi-icon" style={{ background: "rgba(6, 182, 212, 0.1)", color: "#0891b2" }}>❄️</div>
            <span className="kpi-trend kpi-trend-neu">Frío 2-8°C</span>
          </div>
          <div className="kpi-number" style={{ color: "#0891b2" }}>{coldChainCount}</div>
          <div className="kpi-label">Cadena de Frío</div>
          <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "4px" }}>
            Biológicos y Vacunas
          </div>
        </div>

        <div 
          onClick={() => setActiveTab("movimientos")}
          className="kpi-card" 
          style={{ cursor: "pointer", borderLeft: `4px solid ${accentColor}`, transition: "transform 0.15s ease" }}
        >
          <div className="kpi-card-header">
            <div className="kpi-icon kpi-icon-emerald">📜</div>
            <span className="kpi-trend kpi-trend-neu">Este Mes</span>
          </div>
          <div className="kpi-number">{monthMovements}</div>
          <div className="kpi-label">Movimientos Registrados</div>
          <div style={{ fontSize: "11px", color: "var(--slate-500)", marginTop: "4px" }}>
            Entradas, salidas y mermas
          </div>
        </div>

      </div>

      {/* ── MAIN TABS NAV ─────────────────────────────────────────── */}
      <div className="admin-tabs" style={{ marginBottom: "20px" }}>
        <button 
          className={`tab-btn ${activeTab === "catalogo" ? "active" : ""}`} 
          onClick={() => setActiveTab("catalogo")}
          style={{ padding: "12px 18px", background: "none", border: "none", borderBottom: activeTab === "catalogo" ? `3px solid ${primaryColor}` : "3px solid transparent", color: activeTab === "catalogo" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "catalogo" ? 700 : 500, cursor: "pointer" }}
        >
          📦 Catálogo de Ítems ({filtered.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === "categorias" ? "active" : ""}`} 
          onClick={() => setActiveTab("categorias")}
          style={{ padding: "12px 18px", background: "none", border: "none", borderBottom: activeTab === "categorias" ? `3px solid ${primaryColor}` : "3px solid transparent", color: activeTab === "categorias" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "categorias" ? 700 : 500, cursor: "pointer" }}
        >
          🏷️ Categorías ({categorias.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === "movimientos" ? "active" : ""}`} 
          onClick={() => setActiveTab("movimientos")}
          style={{ padding: "12px 18px", background: "none", border: "none", borderBottom: activeTab === "movimientos" ? `3px solid ${primaryColor}` : "3px solid transparent", color: activeTab === "movimientos" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "movimientos" ? 700 : 500, cursor: "pointer" }}
        >
          📜 Historial de Movimientos ({allMovements.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "catalogo" && (
          <>
            {/* ── FILTER BAR & QUICK PILLS ─────────────────────────── */}
            <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <input
                    type="search"
                    placeholder="🔍 Buscar por nombre de ítem o número de lote..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="form-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                  <select
                    className="form-select"
                    value={selectedCategoryFilter}
                    onChange={e => setSelectedCategoryFilter(e.target.value)}
                    style={{ padding: "8px 12px", fontSize: "13px" }}
                  >
                    <option value="all">Todas las Categorías</option>
                    {categorias.map(c => {
                      const pc = parseCategory(c);
                      return <option key={pc.id} value={pc.id}>{pc.nombre}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* QUICK PILLS */}
              <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setQuickFilter("all")}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "1px solid",
                    background: quickFilter === "all" ? primaryColor : "white",
                    color: quickFilter === "all" ? "white" : "var(--slate-600)",
                    borderColor: quickFilter === "all" ? primaryColor : "var(--slate-200)"
                  }}
                >
                  Todos ({vacunas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFilter("critical")}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "1px solid",
                    background: quickFilter === "critical" ? "#ef4444" : "white",
                    color: quickFilter === "critical" ? "white" : "#dc2626",
                    borderColor: quickFilter === "critical" ? "#ef4444" : "#fca5a5"
                  }}
                >
                  🔴 Críticos / Agotados ({criticasCount})
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFilter("expiring")}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "1px solid",
                    background: quickFilter === "expiring" ? "#f59e0b" : "white",
                    color: quickFilter === "expiring" ? "white" : "#d97706",
                    borderColor: quickFilter === "expiring" ? "#f59e0b" : "#fcd34d"
                  }}
                >
                  ⏰ Próximos a Vencer ({expiringCount})
                </button>
                <button
                  type="button"
                  onClick={() => setQuickFilter("refrigerated")}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: "1px solid",
                    background: quickFilter === "refrigerated" ? "#0891b2" : "white",
                    color: quickFilter === "refrigerated" ? "white" : "#0891b2",
                    borderColor: quickFilter === "refrigerated" ? "#0891b2" : "#a5f3fc"
                  }}
                >
                  ❄️ Cadena de Frío ({coldChainCount})
                </button>
              </div>
            </div>

            {/* BULK ACTIONS BANNER */}
            {selectedIds.length > 0 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 20px", background: "rgba(10, 77, 92, 0.05)",
                border: `1px dashed ${primaryColor}`, borderRadius: "12px", marginBottom: "16px",
                gap: "16px", flexWrap: "wrap"
              }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: primaryColor }}>
                  Seleccionados: {selectedIds.length} ítems
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: "6px 12px", fontSize: "12px", borderColor: primaryColor, color: primaryColor, background: "white" }}
                    onClick={() => {
                      const selectedItems = vacunas.filter(v => selectedIds.includes(v.id));
                      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
                        + ["Item,Categoria,Refrigerado,Stock,StockMinimo,PrecioVenta"].join(",") + "\n"
                        + selectedItems.map(v => {
                          const cat = categorias.find(c => c.id === v.categoria_id);
                          const catName = cat ? parseCategory(cat).nombre : "Sin Categoría";
                          return `"${v.nombre}","${catName}",${v.esRefrigerado ? "Si" : "No"},${v.stockActual},${v.stockMinimo},${v.precioVenta}`;
                        }).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `reporte_inventario_${today()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    📥 Exportar Selección (CSV)
                  </button>
                  <button
                    className="btn btn-outline"
                    style={{ padding: "6px 12px", fontSize: "12px", borderColor: "#ef4444", color: "#ef4444", background: "white" }}
                    onClick={() => setSelectedIds([])}
                  >
                    Desmarcar Todos
                  </button>
                </div>
              </div>
            )}

            {/* INVENTORY TABLE */}
            <div className="inv-table-wrap">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💊</div>
                  <div className="empty-state-title">No se encontraron ítems</div>
                  <div className="empty-state-sub">
                    Intenta ajustar los términos de búsqueda o cambiar el filtro rápido.
                  </div>
                </div>
              ) : (
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>
                        <input
                          type="checkbox"
                          checked={filtered.length > 0 && selectedIds.length === filtered.length}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(filtered.map(v => v.id));
                            else setSelectedIds([]);
                          }}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                      </th>
                      <th>Ítem / Insumo</th>
                      <th>Almacenamiento</th>
                      <th>Lote & Vencimiento</th>
                      <th>Stock Actual</th>
                      <th>Estado</th>
                      <th>Costo Unit.</th>
                      <th>Precio Venta</th>
                      <th style={{ textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(v => {
                      const status = getStockStatus(v);
                      const activeLot = v.lotes?.find(l => l.numero === v.loteActivo || l.cantidad > 0);
                      const daysToExp = activeLot?.fechaVencimiento ? getDaysUntilExpiration(activeLot.fechaVencimiento) : 999;
                      const isExpired = daysToExp <= 0;
                      const isExpiringSoon = daysToExp > 0 && daysToExp <= 30;

                      return (
                        <tr key={v.id} style={v.stockActual === 0 ? { backgroundColor: "rgba(244, 63, 94, 0.03)" } : undefined}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(v.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedIds(prev => [...prev, v.id]);
                                else setSelectedIds(prev => prev.filter(id => id !== v.id));
                              }}
                              style={{ width: "16px", height: "16px", cursor: "pointer" }}
                            />
                          </td>
                          <td>
                            <div className="vaccine-name-cell">
                              <span className="vaccine-name-main" style={{ fontWeight: 700 }}>{v.nombre}</span>
                              <span className="vaccine-name-generic">
                                {(() => {
                                  const cat = categorias.find(c => c.id === v.categoria_id);
                                  return cat ? parseCategory(cat).nombre : "Sin Categoría";
                                })()}
                              </span>
                            </div>
                          </td>
                          <td>
                            {v.esRefrigerado ? (
                              <div style={{ display: "inline-flex", flexDirection: "column", gap: "2px" }}>
                                <span style={{ padding: "3px 8px", borderRadius: "12px", background: "rgba(6, 182, 212, 0.12)", color: "#0891b2", fontWeight: 700, fontSize: "11px" }}>
                                  ❄️ {v.temperatura}
                                </span>
                                <span style={{ fontSize: "11px", color: "var(--slate-500)" }}>📍 {v.ubicacion}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                🌡️ Amb. (📍 {v.ubicacion})
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              {v.loteActivo === "—" ? (
                                <span style={{ color: "var(--slate-400)", fontSize: "12px" }}>Sin lote registrado</span>
                              ) : (
                                <span 
                                  className="lot-badge" 
                                  style={{ background: `${accentColor}22`, color: primaryColor, cursor: "pointer", width: "fit-content" }}
                                  onClick={() => openLoteModal(v.id)}
                                >
                                  🏷️ {v.loteActivo}
                                </span>
                              )}
                              {activeLot?.fechaVencimiento && (
                                <span style={{
                                  fontSize: "11px", fontWeight: 700,
                                  color: isExpired ? "#ef4444" : isExpiringSoon ? "#d97706" : "var(--slate-500)"
                                }}>
                                  {isExpired ? "🔴 Vencido" : isExpiringSoon ? `⏰ Vence en ${daysToExp}d` : `📅 Vence: ${activeLot.fechaVencimiento}`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="stock-cell">
                              <span className="stock-number" style={{
                                color: status === "critical" ? "#ef4444" : status === "low" ? "#b45309" : primaryColor
                              }}>
                                {v.stockActual}
                              </span>
                              <span className="stock-min" style={{ fontSize: "11px" }}>{v.unidadMedida}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`stock-chip ${stockChipClass[status]}`}>
                              {stockChipLabel[status]}
                            </span>
                          </td>
                          <td style={{ color: "var(--slate-600)", fontSize: "13px" }}>
                            ${parseFloat(v.valorMayorista || "0").toLocaleString("es-CO")}
                          </td>
                          <td style={{ fontWeight: 700, color: primaryColor, fontSize: "13px" }}>
                            {parseFloat(v.precioVenta || "0") > 0 ? `$${parseFloat(v.precioVenta || "0").toLocaleString("es-CO")}` : "Uso Interno"}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ position: "relative", display: "inline-block" }}>
                              <button
                                className="action-btn"
                                style={{ background: "var(--slate-100)", color: "var(--slate-800)", border: "1px solid var(--slate-200)", padding: "6px 12px", borderRadius: "8px", fontWeight: 600, fontSize: "12px" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(activeDropdownId === v.id ? null : v.id);
                                }}
                                type="button"
                              >
                                Acciones ▾
                              </button>
                              {activeDropdownId === v.id && (
                                <>
                                  <div 
                                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
                                    onClick={() => setActiveDropdownId(null)}
                                  />
                                  <div className="card" style={{ 
                                    position: "absolute", right: 0, marginTop: "4px", width: "170px", 
                                    background: "white", borderRadius: "8px", border: "1px solid var(--slate-200)",
                                    boxShadow: "var(--shadow-lg)", zIndex: 50, padding: "4px 0",
                                    display: "flex", flexDirection: "column", gap: "2px"
                                  }}>
                                    <button
                                      className="dropdown-item"
                                      style={{ padding: "8px 14px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--slate-700)" }}
                                      onClick={() => { setActiveDropdownId(null); openLoteModal(v.id); }}
                                    >
                                      📦 Ingresar Lote
                                    </button>
                                    <button
                                      className="dropdown-item"
                                      style={{ padding: "8px 14px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: v.stockActual === 0 ? "var(--slate-400)" : primaryColor }}
                                      disabled={v.stockActual === 0}
                                      onClick={() => { setActiveDropdownId(null); openUsarModal(v.id); }}
                                    >
                                      💉 Usar / Consumir
                                    </button>
                                    <button
                                      className="dropdown-item"
                                      style={{ padding: "8px 14px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: v.stockActual === 0 ? "var(--slate-400)" : "#ef4444" }}
                                      disabled={v.stockActual === 0}
                                      onClick={() => { setActiveDropdownId(null); openMermaModal(v.id); }}
                                    >
                                      🗑️ Registrar Merma
                                    </button>
                                    <button
                                      className="dropdown-item"
                                      style={{ padding: "8px 14px", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--slate-700)" }}
                                      onClick={() => { setActiveDropdownId(null); openComprasHistoricasModal(v.id); }}
                                    >
                                      📋 Historial Lotes
                                    </button>
                                  </div>
                                </>
                              )}
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

        {/* ── CATEGORÍAS TAB ──────────────────────────────────────── */}
        {activeTab === "categorias" && (
          <div className="categorias-section">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {categorias.length === 0 ? (
                <div style={{ gridColumn: "1/-1", padding: "40px", textAlign: "center", color: "var(--slate-500)", background: "white", borderRadius: "12px" }}>
                  No hay categorías registradas. Presiona "Nueva Categoría" para crear la primera.
                </div>
              ) : categorias.map(c => {
                const pc = parseCategory(c);
                const count = vacunas.filter(v => v.categoria_id === c.id).length;
                return (
                  <div key={c.id} className="card" style={{ padding: "20px", borderLeft: `4px solid ${c.color || primaryColor}`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)" }}>{pc.nombre}</h3>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: pc.tipo === "v" ? primaryColor : "#64748b", background: "var(--slate-100)", padding: "2px 6px", borderRadius: "4px" }}>
                            {pc.tipo === "v" ? "💉 Biológico / Vacuna" : "📦 Insumo General"}
                          </span>
                        </div>
                        <button type="button" onClick={() => openEditCategoria(c)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }} title="Editar categoría">✏️</button>
                      </div>
                      <div style={{ marginTop: "16px", fontSize: "13px", color: "var(--slate-500)", marginBottom: "16px" }}>
                        <strong>{count}</strong> {count === 1 ? "ítem registrado" : "ítems registrados"}
                      </div>
                    </div>
                    <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: "12px" }} onClick={() => openNewItemForCategory(c.id)}>
                      ➕ Añadir Ítem a esta categoría
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── HISTORIAL MOVIMIENTOS TAB ────────────────────────────── */}
        {activeTab === "movimientos" && (
          <div className="card" style={{ padding: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "16px" }}>📜 Kardex de Movimientos de Inventario</h2>
            {allMovements.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--slate-500)" }}>
                No hay movimientos registrados en el sistema.
              </div>
            ) : (
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Ítem / Insumo</th>
                      <th>Cantidad</th>
                      <th>Motivo</th>
                      <th>Notas / Paciente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allMovements.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontSize: "12px", color: "var(--slate-600)" }}>{m.fecha}</td>
                        <td>
                          <span style={{
                            padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700,
                            background: m.tipo === "ENTRADA" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            color: m.tipo === "ENTRADA" ? "#10b981" : "#ef4444"
                          }}>
                            {m.tipo === "ENTRADA" ? "📥 ENTRADA" : "📤 SALIDA"}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{m.itemNombre}</td>
                        <td style={{ fontWeight: 700, color: m.tipo === "ENTRADA" ? "#10b981" : "#ef4444" }}>
                          {m.tipo === "ENTRADA" ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </td>
                        <td style={{ fontSize: "13px" }}>{m.motivo}</td>
                        <td style={{ fontSize: "12px", color: "var(--slate-600)" }}>{m.notas || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: NUEVO ITEM / INSUMO
      ═══════════════════════════════════════════════════════════ */}
      <dialog ref={newVacunaRef} id="modal-nueva-vacuna">
        <div className="modal-header">
          <div>
            <div className="modal-title">➕ Registrar Nuevo Ítem / Insumo</div>
            <div className="modal-subtitle">Ingrese las características principales del producto</div>
          </div>
          <button className="modal-close" onClick={() => newVacunaRef.current?.close()} type="button">✕</button>
        </div>

        <form onSubmit={handleNuevaVacuna}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Categoría <span className="required-mark">*</span></label>
                <select name="categoria_id" className="form-select" value={newForm.categoria_id} onChange={handleNewFormChange} required>
                  <option value="" disabled>Seleccione categoría...</option>
                  {categorias.map(c => {
                    const pc = parseCategory(c);
                    return <option key={pc.id} value={pc.id}>{pc.nombre}</option>;
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Producto / Insumo <span className="required-mark">*</span></label>
                <input name="nombre" type="text" className="form-input" value={newForm.nombre} onChange={handleNewFormChange} required placeholder="ej: Vacuna Influenza, Amoxicilina 500mg..." />
              </div>

              <div className="form-group">
                <label className="form-label">Unidad de Medida</label>
                <select name="unidadMedida" className="form-select" value={newForm.unidadMedida} onChange={handleNewFormChange}>
                  <option value="Dosis">Dosis</option>
                  <option value="Frasco">Frasco</option>
                  <option value="Ampolla">Ampolla</option>
                  <option value="Caja">Caja</option>
                  <option value="Unidad">Unidad</option>
                  <option value="Jeringa">Jeringa</option>
                </select>
              </div>

              {/* REFRIGERACIÓN TOGGLE */}
              <div className="form-group full-width" style={{ padding: "12px", background: "rgba(6, 182, 212, 0.06)", borderRadius: "8px", border: "1px solid rgba(6, 182, 212, 0.2)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontWeight: 700, color: "#0891b2" }}>
                  <input type="checkbox" name="esRefrigerado" checked={newForm.esRefrigerado} onChange={handleNewFormChange} style={{ width: "18px", height: "18px", accentColor: "#0891b2" }} />
                  ❄️ Requiere Cadena de Frío (Refrigeración)
                </label>
                {newForm.esRefrigerado && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>Rango de Temperatura</label>
                      <select name="temperatura" className="form-select" value={newForm.temperatura} onChange={handleNewFormChange}>
                        <option value="2-8°C">2°C a 8°C (Refrigeración estándar)</option>
                        <option value="-15 a -25°C">-15°C a -25°C (Congelación)</option>
                        <option value="-70°C">-70°C (Ultra-congelación)</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>Ubicación Física</label>
                      <input name="ubicacion" type="text" className="form-input" value={newForm.ubicacion} onChange={handleNewFormChange} placeholder="ej: Nevera #1 - Estante B" />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Stock Mínimo de Alerta <span className="required-mark">*</span></label>
                <input name="stockMinimo" type="number" className="form-input" value={newForm.stockMinimo} onChange={handleNewFormChange} required min="1" />
              </div>

              <div className="form-group">
                <label className="form-label">Valor Mayorista / Costo <span className="required-mark">*</span></label>
                <input name="valorMayorista" type="number" className="form-input" value={newForm.valorMayorista} onChange={handleNewFormChange} required placeholder="ej: 35000" />
              </div>

              <div className="form-group">
                <label className="form-label">Precio Venta al Público</label>
                <input name="precioVenta" type="number" className="form-input" value={newForm.precioVenta} onChange={handleNewFormChange} placeholder="ej: 55000" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => newVacunaRef.current?.close()}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: primaryColor }}>✓ Guardar Ítem</button>
          </div>
        </form>
      </dialog>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: AGREGAR LOTE
      ═══════════════════════════════════════════════════════════ */}
      <dialog ref={loteRef} id="modal-agregar-lote">
        <div className="modal-header">
          <div>
            <div className="modal-title">📦 Registrar Nuevo Lote</div>
            <div className="modal-subtitle">{selectedVacuna ? `Ítem: ${selectedVacuna.nombre}` : ""}</div>
          </div>
          <button className="modal-close" onClick={() => loteRef.current?.close()} type="button">✕</button>
        </div>

        <form onSubmit={handleAgregarLote}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Número de Lote <span className="required-mark">*</span></label>
                <input name="numero" type="text" className="form-input" value={loteForm.numero} onChange={handleLoteChange} required placeholder="ej: LT-2026-09A" />
              </div>

              <div className="form-group">
                <label className="form-label">Cantidad a Ingresar <span className="required-mark">*</span></label>
                <input name="cantidad" type="number" className="form-input" value={loteForm.cantidad} onChange={handleLoteChange} required min="1" placeholder="ej: 50" />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Fabricación</label>
                <input name="fechaFabricacion" type="date" className="form-input" value={loteForm.fechaFabricacion} onChange={handleLoteChange} max={today()} />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Vencimiento <span className="required-mark">*</span></label>
                <input name="fechaVencimiento" type="date" className="form-input" value={loteForm.fechaVencimiento} onChange={handleLoteChange} required min={today()} />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Proveedor / Laboratorio <span className="required-mark">*</span></label>
                <input name="proveedor" type="text" className="form-input" value={loteForm.proveedor} onChange={handleLoteChange} required placeholder="ej: Sanofi Pasteur / Tecnoquímicas" />
              </div>

              <div className="form-group">
                <label className="form-label">Precio Compra Unitario (COP)</label>
                <input name="precioCompra" type="number" className="form-input" value={loteForm.precioCompra} onChange={handleLoteChange} placeholder="ej: 35000" />
              </div>

              <div className="form-group">
                <label className="form-label">Número Factura / Remisión</label>
                <input name="factura" type="text" className="form-input" value={loteForm.factura} onChange={handleLoteChange} placeholder="ej: FAC-8841" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => loteRef.current?.close()}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: primaryColor }}>✓ Registrar Lote</button>
          </div>
        </form>
      </dialog>

      {/* MODAL: USAR DOSIS */}
      <dialog ref={usarRef} id="dialog-usar-dosis" style={{ margin: "auto", maxWidth: "450px" }}>
        <div className="modal-body" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--slate-900)", marginBottom: "6px" }}>💉 Registrar Aplicación / Consumo</h2>
          <p style={{ fontSize: "13px", color: "var(--slate-600)", marginBottom: "16px" }}>
            Ítem: <strong>{selectedVacuna?.nombre}</strong> (Stock actual: {selectedVacuna?.stockActual})
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
            <div>
              <label className="form-label">Nombre del Paciente <span className="required-mark">*</span></label>
              <input type="text" className="form-input" value={pacienteNombre} onChange={e => setPacienteNombre(e.target.value)} required placeholder="ej: María López" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label className="form-label">Edad <span className="required-mark">*</span></label>
                <input type="number" className="form-input" value={pacienteEdad} onChange={e => setPacienteEdad(e.target.value)} required placeholder="ej: 28" />
              </div>
              <div>
                <label className="form-label">Unidad</label>
                <select className="form-select" value={pacienteEdadUnidad} onChange={e => setPacienteEdadUnidad(e.target.value)}>
                  <option value="Años">Años</option>
                  <option value="Meses">Meses</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Notas Adicionales</label>
              <input type="text" className="form-input" value={dosisNotas} onChange={e => setDosisNotas(e.target.value)} placeholder="ej: Sin reacciones inmediatas" />
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: "24px", padding: 0 }}>
            <button type="button" className="btn btn-outline" onClick={() => usarRef.current?.close()}>Cancelar</button>
            <button type="button" className="btn btn-primary" style={{ background: primaryColor }} onClick={handleUsarDosis}>✓ Registrar</button>
          </div>
        </div>
      </dialog>

      {/* MODAL: MERMA */}
      <dialog ref={mermaRef} id="dialog-registrar-merma" style={{ margin: "auto", maxWidth: "450px" }}>
        <div className="modal-body" style={{ padding: "28px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#ef4444", marginBottom: "6px" }}>🗑️ Registrar Merma / Pérdida</h2>
          <p style={{ fontSize: "13px", color: "var(--slate-600)", marginBottom: "16px" }}>
            Ítem: <strong>{selectedVacuna?.nombre}</strong>
          </p>

          <form onSubmit={handleRegistrarMerma} style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" }}>
            <div>
              <label className="form-label">Cantidad a Descartar <span className="required-mark">*</span></label>
              <input type="number" className="form-input" min="1" max={selectedVacuna?.stockActual || 1} value={mermaCantidad} onChange={e => setMermaCantidad(parseInt(e.target.value) || 1)} required />
            </div>

            <div>
              <label className="form-label">Motivo de Merma <span className="required-mark">*</span></label>
              <select className="form-select" value={mermaMotivo} onChange={e => setMermaMotivo(e.target.value)} required>
                <option value="MERMA - Vencimiento de lote">Vencimiento de Lote</option>
                <option value="MERMA - Rotura de frío">Rotura de Cadena de Frío</option>
                <option value="MERMA - Accidente / Rotura">Accidente / Rotura Física</option>
                <option value="MERMA - Empaque dañado">Empaque Dañado</option>
                <option value="MERMA - Descarte técnico">Descarte Técnico / Muestra</option>
              </select>
            </div>

            <div className="modal-footer" style={{ marginTop: "20px", padding: 0 }}>
              <button type="button" className="btn btn-outline" onClick={() => mermaRef.current?.close()}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ background: "#ef4444" }}>Confirmar Merma</button>
            </div>
          </form>
        </div>
      </dialog>

      {/* MODAL: HISTORIAL LOTES */}
      <dialog ref={comprasHistoricasRef} style={{ maxWidth: "700px", width: "90%", margin: "auto" }}>
        <div className="modal-header">
          <div className="modal-title">📋 Lotes Registrados</div>
          <button className="modal-close" onClick={() => comprasHistoricasRef.current?.close()} type="button">✕</button>
        </div>
        <div className="modal-body">
          {selectedVacuna?.lotes && selectedVacuna.lotes.length > 0 ? (
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Cantidad</th>
                  <th>Vencimiento</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                {selectedVacuna.lotes.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 700 }}>{l.numero}</td>
                    <td>{l.cantidad}</td>
                    <td>{l.fechaVencimiento || "—"}</td>
                    <td>{l.proveedor || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--slate-500)" }}>Sin lotes activos</div>
          )}
        </div>
      </dialog>

      {/* MODAL: CATEGORÍA */}
      <dialog ref={catRef} id="modal-categoria">
        <div className="modal-header">
          <div className="modal-title">{catForm.id ? "✏️ Editar Categoría" : "➕ Nueva Categoría"}</div>
          <button className="modal-close" onClick={() => catRef.current?.close()} type="button">✕</button>
        </div>

        <form onSubmit={handleSaveCategoria}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Nombre de Categoría <span className="required-mark">*</span></label>
                <input name="nombre" type="text" className="form-input" value={catForm.nombre} onChange={handleCatChange} required placeholder="ej: Vacunas, Medicamentos..." />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Color Identificador</label>
                <input name="color" type="color" value={catForm.color} onChange={handleCatChange} style={{ width: "50px", height: "40px", border: "none", cursor: "pointer" }} />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Tipo de Categoría</label>
                <select className="form-select" value={catTipo} onChange={e => setCatTipo(e.target.value as "v" | "i")}>
                  <option value="v">💉 Biológico / Vacuna / Medicamento</option>
                  <option value="i">📦 Insumo Médico General</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => catRef.current?.close()}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: primaryColor }}>Guardar Categoría</button>
          </div>
        </form>
      </dialog>

      {confirmConfig && (
        <CustomConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          isDanger={confirmConfig.isDanger}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
      <ToastContainer toasts={toasts} />
    </>
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
