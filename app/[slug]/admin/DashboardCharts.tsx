"use client";

import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

interface Props {
  inventario: any[];
  categorias: any[];
  movimientos: any[];
  lotes: any[];
  primaryColor: string;
  accentColor: string;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// --- Custom Interactive Tooltip ---
const HelpTooltip = ({ text }: { text: string }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span 
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '6px', cursor: 'help' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(!visible)}
    >
      <span style={{ color: 'var(--slate-400)', fontSize: '13px', display: 'inline-block', lineHeight: 1 }}>ⓘ</span>
      {visible && (
        <span style={{
          position: 'absolute',
          bottom: '125%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1e293b', // slate-800
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 500,
          whiteSpace: 'normal',
          width: '220px',
          zIndex: 9999,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
          lineHeight: '1.4',
          textAlign: 'center',
          pointerEvents: 'none',
          fontFamily: 'Outfit, system-ui, -apple-system, sans-serif'
        }}>
          {text}
          <span style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            marginLeft: '-5px',
            borderWidth: '5px',
            borderStyle: 'solid',
            borderColor: '#1e293b transparent transparent transparent'
          }} />
        </span>
      )}
    </span>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = data.total || 1;
    const percent = ((data.value / total) * 100).toFixed(1);
    return (
      <div style={{ background: "white", padding: "10px", border: "1px solid var(--slate-200)", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
        <p style={{ margin: 0, fontWeight: 700, color: "var(--slate-800)", fontSize: "13px" }}>{data.name}</p>
        <p style={{ margin: 0, color: data.color, fontWeight: 800, fontSize: "14px", marginTop: "4px" }}>
          {data.value} dosis ({percent}%)
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ inventario, categorias, movimientos, lotes, primaryColor, accentColor }: Props) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCatPie, setSelectedCatPie] = useState<string>("all");
  const [selectedCatPieDiario, setSelectedCatPieDiario] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"general" | "diaria" | "compras">("general");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // --- FILTRO CATEGORÍA GLOBAL ---
  const [selectedCategoryGlobal, setSelectedCategoryGlobal] = useState<string>("all");

  // Cascading Filters states for Compras Tab
  const [selectedLab, setSelectedLab] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<string>("all");

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    movimientos.forEach(m => {
      if (m.fecha) {
        years.add(new Date(m.fecha).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [movimientos, currentYear]);

  // --- DATA FILTERING BY GLOBAL CATEGORY ---
  const filteredInventario = useMemo(() => {
    if (selectedCategoryGlobal === "all") return inventario;
    return inventario.filter(i => i.categoria_id === selectedCategoryGlobal);
  }, [inventario, selectedCategoryGlobal]);

  const filteredInventarioIds = useMemo(() => {
    return new Set(filteredInventario.map(i => i.id));
  }, [filteredInventario]);

  const filteredMovimientos = useMemo(() => {
    return movimientos.filter(m => filteredInventarioIds.has(m.item_id));
  }, [movimientos, filteredInventarioIds]);

  const filteredLotes = useMemo(() => {
    return lotes.filter(l => filteredInventarioIds.has(l.item_id));
  }, [lotes, filteredInventarioIds]);

  // --- DINAMIC OPERATIONAL KPIS ---
  const kpisOperativos = useMemo(() => {
    const totalUnidades = filteredInventario.reduce((acc, v) => acc + (v.stock_actual || 0), 0);
    const itemsAgotados = filteredInventario.filter(v => v.stock_actual === 0).length;
    const itemsEnRiesgo = filteredInventario.filter(v => v.stock_actual <= v.stock_minimo);

    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
    
    const itemsConSalidaReciente = new Set();
    filteredMovimientos.forEach(m => {
      const fechaMov = new Date(m.fecha);
      if (m.tipo_movimiento === "SALIDA" && fechaMov >= treintaDiasAtras && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
        itemsConSalidaReciente.add(m.item_id);
      }
    });
    const itemsInactivos = filteredInventario.filter(i => !itemsConSalidaReciente.has(i.id)).length;

    return { totalUnidades, itemsAgotados, itemsEnRiesgo, itemsInactivos };
  }, [filteredInventario, filteredMovimientos]);


  // ================= GENERAL VIEW LOGIC =================
  const finanzasAnual = useMemo(() => {
    let inversion = 0;
    let ingresos = 0;
    let costoMerma = 0;
    const gananciasItems: Record<string, { nombre: string, ganancia: number }> = {};
    let totalIncrementos = 0;
    let countIncrementos = 0;
    const incrementosItems: Record<string, { nombre: string, incremento: number }> = {};

    // 1. Inflacion (Compras)
    filteredInventario.forEach(item => {
      const itemLotes = filteredLotes.filter(l => l.item_id === item.id).sort((a,b) => new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime());
      const lotesInPeriod = itemLotes.filter(l => l.fecha_registro && new Date(l.fecha_registro).getFullYear() === selectedYear);

      if (lotesInPeriod.length > 0) {
        const ultimoLotePeriodo = lotesInPeriod[lotesInPeriod.length - 1];
        const indexUltimo = itemLotes.findIndex(l => l.id === ultimoLotePeriodo.id);
        if (indexUltimo > 0) {
           const loteAnterior = itemLotes[indexUltimo - 1];
           const precioActual = parseFloat(ultimoLotePeriodo.precio_compra) || 0;
           const precioAnterior = parseFloat(loteAnterior.precio_compra) || 0;
           if (precioAnterior > 0 && precioActual > 0) {
              const incremento = ((precioActual - precioAnterior) / precioAnterior) * 100;
              incrementosItems[item.id] = { nombre: item.nombre, incremento };
              totalIncrementos += incremento;
              countIncrementos++;
           }
        }
      }
    });

    // 2. Ventas y Mermas
    filteredMovimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA") {
        const item = filteredInventario.find(i => i.id === m.item_id);
        if (item) {
          const costoUnitario = item.valor_mayorista || 0;
          if (m.motivo && m.motivo.startsWith("MERMA")) {
            costoMerma += (m.cantidad * costoUnitario);
          } else {
            const precioVenta = (m.valor_unitario_cobrado !== undefined && m.valor_unitario_cobrado !== null ? Number(m.valor_unitario_cobrado) : (item.precio_venta || 0));
            inversion += (m.cantidad * costoUnitario);
            ingresos += (m.cantidad * precioVenta);
            
            const gananciaAcumulada = (precioVenta - costoUnitario) * m.cantidad;
            if (!gananciasItems[item.id]) gananciasItems[item.id] = { nombre: item.nombre, ganancia: 0 };
            gananciasItems[item.id].ganancia += gananciaAcumulada;
          }
        }
      }
    });
    
    const topGanancias = Object.values(gananciasItems).sort((a, b) => b.ganancia - a.ganancia).slice(0, 5);
    const topAlertas = Object.values(incrementosItems).sort((a, b) => b.incremento - a.incremento).slice(0, 5);
    const gananciasNetas = ingresos - inversion;
    const variacionPromedio = countIncrementos > 0 ? (totalIncrementos / countIncrementos) : 0;

    return { inversion, ingresos, gananciasNetas, costoMerma, topGanancias, variacionPromedio, topAlertas };
  }, [filteredMovimientos, filteredInventario, filteredLotes, selectedYear]);

  const chartDataRendimientoAnual = useMemo(() => {
    const data = MONTHS.map(m => ({ mes: m, ingreso: 0, costo: 0 }));
    filteredMovimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
        const item = filteredInventario.find(i => i.id === m.item_id);
        if (item) {
          const mIndex = d.getMonth();
          const costoUnitario = item.valor_mayorista || 0;
          const precioVenta = (m.valor_unitario_cobrado !== undefined && m.valor_unitario_cobrado !== null ? Number(m.valor_unitario_cobrado) : (item.precio_venta || 0));
          data[mIndex].ingreso += (m.cantidad * precioVenta);
          data[mIndex].costo += (m.cantidad * costoUnitario);
        }
      }
    });
    return data;
  }, [filteredMovimientos, filteredInventario, selectedYear]);

  const chartDataFlujo = useMemo(() => {
    const data = MONTHS.map(m => ({ mes: m, entradas: 0, salidas: 0 }));
    filteredMovimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear) {
        const monthIndex = d.getMonth();
        if (m.tipo_movimiento === "ENTRADA") {
          data[monthIndex].entradas += m.cantidad;
        } else if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
          data[monthIndex].salidas += m.cantidad;
        }
      }
    });
    return data;
  }, [filteredMovimientos, selectedYear]);

  const chartDataParticipacionItems = useMemo(() => {
    const dataMap: Record<string, { name: string, value: number, color: string, total: number }> = {};
    const itemColors = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];
    let totalSalidas = 0;

    filteredMovimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
        const item = filteredInventario.find(i => i.id === m.item_id);
        if (item) {
          if (selectedCatPie !== "all" && item.categoria_id !== selectedCatPie) return;
          if (!dataMap[item.id]) {
            dataMap[item.id] = { name: item.nombre, value: 0, color: itemColors[Object.keys(dataMap).length % itemColors.length], total: 0 };
          }
          dataMap[item.id].value += m.cantidad;
          totalSalidas += m.cantidad;
        }
      }
    });
    return Object.values(dataMap).sort((a, b) => b.value - a.value).map(d => ({ ...d, total: totalSalidas }));
  }, [filteredMovimientos, filteredInventario, selectedYear, selectedCatPie]);

  const topItemsAnual = useMemo(() => {
    const itemsMap: Record<string, { nombre: string, aplicaciones: number }> = {};
    filteredMovimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
        const item = filteredInventario.find(i => i.id === m.item_id);
        if (item) {
          if (!itemsMap[item.id]) itemsMap[item.id] = { nombre: item.nombre, aplicaciones: 0 };
          itemsMap[item.id].aplicaciones += m.cantidad;
        }
      }
    });
    return Object.values(itemsMap).sort((a, b) => b.aplicaciones - a.aplicaciones);
  }, [filteredMovimientos, filteredInventario, selectedYear]);

  const cobroGeneral = useMemo(() => {
    let cobroFinal = 0;
    let cobroMayorista = 0;
    filteredMovimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
        if (m.notas && m.notas.includes("Mayorista")) cobroMayorista += m.cantidad;
        else cobroFinal += m.cantidad;
      }
    });
    return { cobroFinal, cobroMayorista };
  }, [filteredMovimientos, selectedYear]);


  // ================= DIARIA VIEW LOGIC =================
  const daysInSelectedMonth = useMemo(() => {
    if (!selectedMonth) return 30;
    const [y, m] = selectedMonth.split('-');
    return new Date(parseInt(y), parseInt(m), 0).getDate();
  }, [selectedMonth]);

  const finanzasDiario = useMemo(() => {
    let inversion = 0;
    let ingresos = 0;
    let costoMerma = 0;
    const gananciasItems: Record<string, { nombre: string, ganancia: number }> = {};
    let totalIncrementos = 0;
    let countIncrementos = 0;
    const incrementosItems: Record<string, { nombre: string, incremento: number }> = {};

    // 1. Inflacion (Mes)
    filteredInventario.forEach(item => {
      const itemLotes = filteredLotes.filter(l => l.item_id === item.id).sort((a,b) => new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime());
      const lotesInPeriod = itemLotes.filter(l => l.fecha_registro && l.fecha_registro.startsWith(selectedMonth));

      if (lotesInPeriod.length > 0) {
        const ultimoLotePeriodo = lotesInPeriod[lotesInPeriod.length - 1];
        const indexUltimo = itemLotes.findIndex(l => l.id === ultimoLotePeriodo.id);
        if (indexUltimo > 0) {
           const loteAnterior = itemLotes[indexUltimo - 1];
           const precioActual = parseFloat(ultimoLotePeriodo.precio_compra) || 0;
           const precioAnterior = parseFloat(loteAnterior.precio_compra) || 0;
           if (precioAnterior > 0 && precioActual > 0) {
              const incremento = ((precioActual - precioAnterior) / precioAnterior) * 100;
              incrementosItems[item.id] = { nombre: item.nombre, incremento };
              totalIncrementos += incremento;
              countIncrementos++;
           }
        }
      }
    });

    // 2. Movimientos
    filteredMovimientos.forEach(m => {
      if (m.fecha && m.fecha.startsWith(selectedMonth)) {
        if (m.tipo_movimiento === "SALIDA") {
          const item = filteredInventario.find(i => i.id === m.item_id);
          if (item) {
            const costoUnitario = item.valor_mayorista || 0;
            if (m.motivo && m.motivo.startsWith("MERMA")) {
              costoMerma += (m.cantidad * costoUnitario);
            } else {
              const precioVenta = (m.valor_unitario_cobrado !== undefined && m.valor_unitario_cobrado !== null ? Number(m.valor_unitario_cobrado) : (item.precio_venta || 0));
              inversion += (m.cantidad * costoUnitario);
              ingresos += (m.cantidad * precioVenta);
              
              const gananciaAcumulada = (precioVenta - costoUnitario) * m.cantidad;
              if (!gananciasItems[item.id]) gananciasItems[item.id] = { nombre: item.nombre, ganancia: 0 };
              gananciasItems[item.id].ganancia += gananciaAcumulada;
            }
          }
        }
      }
    });
    
    const topGanancias = Object.values(gananciasItems).sort((a, b) => b.ganancia - a.ganancia).slice(0, 5);
    const topAlertas = Object.values(incrementosItems).sort((a, b) => b.incremento - a.incremento).slice(0, 5);
    const gananciasNetas = ingresos - inversion;
    const variacionPromedio = countIncrementos > 0 ? (totalIncrementos / countIncrementos) : 0;

    return { inversion, ingresos, gananciasNetas, costoMerma, topGanancias, variacionPromedio, topAlertas };
  }, [filteredMovimientos, filteredInventario, filteredLotes, selectedMonth]);

  const chartDataDiariaAplicaciones = useMemo(() => {
    const data = Array.from({length: daysInSelectedMonth}, (_, i) => ({ dia: i + 1, aplicaciones: 0 }));
    filteredMovimientos.forEach(m => {
      if (m.fecha && m.fecha.startsWith(selectedMonth)) {
        if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
          const d = parseInt(m.fecha.split('-')[2]);
          if (data[d - 1]) data[d - 1].aplicaciones += m.cantidad;
        }
      }
    });
    return data;
  }, [filteredMovimientos, selectedMonth, daysInSelectedMonth]);

  const chartDataDiariaFlujo = useMemo(() => {
    const data = Array.from({length: daysInSelectedMonth}, (_, i) => ({ dia: i + 1, entradas: 0, salidas: 0 }));
    filteredMovimientos.forEach(m => {
      if (m.fecha && m.fecha.startsWith(selectedMonth)) {
        const d = parseInt(m.fecha.split('-')[2]);
        if (m.tipo_movimiento === "ENTRADA") {
          if (data[d - 1]) data[d - 1].entradas += m.cantidad;
        } else if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
          if (data[d - 1]) data[d - 1].salidas += m.cantidad;
        }
      }
    });
    return data;
  }, [filteredMovimientos, selectedMonth, daysInSelectedMonth]);

  const chartDataDiariaFinanzas = useMemo(() => {
    const data = Array.from({length: daysInSelectedMonth}, (_, i) => ({ dia: i + 1, ingreso: 0, costo: 0 }));
    filteredMovimientos.forEach(m => {
      if (m.fecha && m.fecha.startsWith(selectedMonth)) {
        const d = parseInt(m.fecha.split('-')[2]);
        const item = filteredInventario.find(i => i.id === m.item_id);
        if (item && data[d - 1]) {
          if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
            data[d - 1].ingreso += (m.valor_unitario_cobrado !== undefined && m.valor_unitario_cobrado !== null ? Number(m.valor_unitario_cobrado) : (item.precio_venta || 0)) * m.cantidad;
            data[d - 1].costo += (item.valor_mayorista || 0) * m.cantidad;
          }
        }
      }
    });
    return data;
  }, [filteredMovimientos, filteredInventario, selectedMonth, daysInSelectedMonth]);

  const topItemsDiario = useMemo(() => {
    const itemsMap: Record<string, { nombre: string, aplicaciones: number }> = {};
    filteredMovimientos.forEach(m => {
      if (m.fecha && m.fecha.startsWith(selectedMonth)) {
        if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
          const item = filteredInventario.find(i => i.id === m.item_id);
          if (item) {
            if (!itemsMap[item.id]) itemsMap[item.id] = { nombre: item.nombre, aplicaciones: 0 };
            itemsMap[item.id].aplicaciones += m.cantidad;
          }
        }
      }
    });
    return Object.values(itemsMap).sort((a, b) => b.aplicaciones - a.aplicaciones).slice(0, 10);
  }, [filteredMovimientos, filteredInventario, selectedMonth]);

  const chartDataParticipacionDiaria = useMemo(() => {
    const dataMap: Record<string, { name: string, value: number, color: string, total: number }> = {};
    const itemColors = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];
    let totalSalidas = 0;

    filteredMovimientos.forEach(m => {
      if (m.fecha && m.fecha.startsWith(selectedMonth)) {
        if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
          const item = filteredInventario.find(i => i.id === m.item_id);
          if (item) {
            if (selectedCatPieDiario !== "all" && item.categoria_id !== selectedCatPieDiario) return;
            if (!dataMap[item.id]) {
              dataMap[item.id] = { name: item.nombre, value: 0, color: itemColors[Object.keys(dataMap).length % itemColors.length], total: 0 };
            }
            dataMap[item.id].value += m.cantidad;
            totalSalidas += m.cantidad;
          }
        }
      }
    });
    return Object.values(dataMap).sort((a, b) => b.value - a.value).map(d => ({ ...d, total: totalSalidas }));
  }, [filteredMovimientos, filteredInventario, selectedMonth, selectedCatPieDiario]);

  const resumenDiario = useMemo(() => {
    let totalAplicadas = 0;
    let cobroFinal = 0;
    let cobroMayorista = 0;
    filteredMovimientos.forEach(m => {
      if (m.fecha && m.fecha.startsWith(selectedMonth)) {
        if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
          totalAplicadas += m.cantidad;
          if (m.notas && m.notas.includes("Mayorista")) cobroMayorista += m.cantidad;
          else cobroFinal += m.cantidad;
        }
      }
    });
    return { totalAplicadas, cobroFinal, cobroMayorista };
  }, [filteredMovimientos, selectedMonth]);

  // Current financial dataset depending on general vs daily
  const finanzas = activeTab === "general" ? finanzasAnual : finanzasDiario;


  // ================= COMPRAS TAB LOGIC =================
  const availableLabs = useMemo(() => {
    const labs = new Set<string>();
    filteredInventario.forEach(i => {
      if (i.laboratorio) {
        labs.add(i.laboratorio.trim());
      }
    });
    return Array.from(labs).sort();
  }, [filteredInventario]);

  const availableItemsForTab = useMemo(() => {
    return filteredInventario.filter(i => {
      if (selectedLab !== "all" && i.laboratorio !== selectedLab) return false;
      return true;
    });
  }, [filteredInventario, selectedLab]);

  const filteredLotesForTab = useMemo(() => {
    return filteredLotes.filter(l => {
      // 1. Filter by selected year
      if (l.fecha_registro) {
        const y = new Date(l.fecha_registro).getFullYear();
        if (y !== selectedYear) return false;
      }

      // 2. Filter by Item selection
      if (selectedItem !== "all") {
        return l.item_id === selectedItem;
      }

      // 3. Filter by Lab selection
      if (selectedLab !== "all") {
        const item = filteredInventario.find(i => i.id === l.item_id);
        if (!item || item.laboratorio !== selectedLab) return false;
      }

      return true;
    });
  }, [filteredLotes, filteredInventario, selectedLab, selectedItem, selectedYear]);

  const filteredItemsForTab = useMemo(() => {
    return filteredInventario.filter(i => {
      if (selectedLab !== "all" && i.laboratorio !== selectedLab) return false;
      if (selectedItem !== "all" && i.id !== selectedItem) return false;
      return true;
    });
  }, [filteredInventario, selectedLab, selectedItem]);

  const inversionCompras = useMemo(() => {
    return filteredLotesForTab.reduce((acc, l) => {
      const qty = Number(l.cantidad) || 0;
      const prc = Number(l.precio_compra) || 0;
      return acc + (qty * prc);
    }, 0);
  }, [filteredLotesForTab]);

  const volumenAdquirido = useMemo(() => {
    return filteredLotesForTab.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);
  }, [filteredLotesForTab]);

  const costoCompraPromedio = volumenAdquirido > 0 ? (inversionCompras / volumenAdquirido) : 0;

  const precioVentaPromedio = useMemo(() => {
    if (filteredItemsForTab.length === 0) return 0;
    const sum = filteredItemsForTab.reduce((acc, i) => acc + (Number(i.precio_venta) || 0), 0);
    return sum / filteredItemsForTab.length;
  }, [filteredItemsForTab]);

  const margenUnitarioVal = precioVentaPromedio - costoCompraPromedio;
  const margenPorcentajeVal = precioVentaPromedio > 0 ? (margenUnitarioVal / precioVentaPromedio) * 100 : 0;

  // Concentración de compras por laboratorio
  const chartDataConcentracionLab = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredLotesForTab.forEach(l => {
      const item = filteredInventario.find(i => i.id === l.item_id);
      const lab = item?.laboratorio || "Sin Marca/Lab";
      const totalCost = (Number(l.cantidad) || 0) * (Number(l.precio_compra) || 0);
      groups[lab] = (groups[lab] || 0) + totalCost;
    });

    const totalVal = Object.values(groups).reduce((acc, v) => acc + v, 0) || 1;
    const itemColors = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

    return Object.entries(groups).map(([name, value], index) => ({
      name,
      value,
      color: itemColors[index % itemColors.length],
      total: totalVal
    })).sort((a,b) => b.value - a.value);
  }, [filteredLotesForTab, filteredInventario]);

  // Estructura de Margen: Compra vs Venta
  const chartDataEstructuraMargen = useMemo(() => {
    return filteredItemsForTab.map(item => {
      const itemLotes = filteredLotesForTab.filter(l => l.item_id === item.id);
      const totalCost = itemLotes.reduce((acc, l) => acc + (Number(l.cantidad) || 0) * (Number(l.precio_compra) || 0), 0);
      const totalQty = itemLotes.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);
      const costProm = totalQty > 0 ? (totalCost / totalQty) : (Number(item.valor_mayorista) || 0);
      const sellPrice = Number(item.precio_venta) || 0;
      return {
        name: item.nombre,
        costo: costProm,
        precio: sellPrice,
        margen: sellPrice - costProm
      };
    }).filter(d => d.costo > 0 || d.precio > 0).slice(0, 10);
  }, [filteredItemsForTab, filteredLotesForTab]);


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* TABS Y FILTRO GLOBAL DE CATEGORÍA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--slate-200)", paddingBottom: "8px", flexWrap: "wrap", gap: "16px" }}>
        
        {/* Selector de Pestañas */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={() => setActiveTab("general")}
            style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "general" ? `3px solid ${primaryColor}` : "3px solid transparent", color: activeTab === "general" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "general" ? 800 : 500, cursor: "pointer", fontSize: "14px" }}
          >
            📊 Vista General (Anual)
          </button>
          <button 
            onClick={() => setActiveTab("diaria")}
            style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "diaria" ? `3px solid ${primaryColor}` : "3px solid transparent", color: activeTab === "diaria" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "diaria" ? 800 : 500, cursor: "pointer", fontSize: "14px" }}
          >
            📅 Vista Diaria (Mes)
          </button>
          <button 
            onClick={() => setActiveTab("compras")}
            style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "compras" ? `3px solid ${primaryColor}` : "3px solid transparent", color: activeTab === "compras" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "compras" ? 800 : 500, cursor: "pointer", fontSize: "14px" }}
          >
            🛒 Análisis de Compras
          </button>
        </div>

        {/* Selectores de Filtro a la derecha */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", padding: "4px 0" }}>
          
          {/* FILTRO GLOBAL DE CATEGORÍA */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Categoría:</span>
            <select 
              value={selectedCategoryGlobal} 
              onChange={(e) => {
                setSelectedCategoryGlobal(e.target.value);
                setSelectedLab("all");
                setSelectedItem("all");
              }}
              className="form-select"
              style={{ minWidth: "160px", padding: "6px 12px", background: "white", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: "1px solid var(--slate-200)" }}
            >
              <option value="all">Todas las Categorías</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          {activeTab === "general" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Año:</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="form-select"
                style={{ width: "90px", padding: "6px 12px", background: "white", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: "1px solid var(--slate-200)" }}
              >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {activeTab === "diaria" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mes:</span>
              <input 
                type="month" 
                className="form-input" 
                style={{ padding: "5px 12px", background: "white", fontSize: "13px", borderRadius: "8px", border: "1px solid var(--slate-200)", fontWeight: 600 }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          )}

          {activeTab === "compras" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Año Compras:</span>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="form-select"
                style={{ width: "90px", padding: "6px 12px", background: "white", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: "1px solid var(--slate-200)" }}
              >
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

        </div>
      </div>


      {/* ================= CONTENIDO DE VISTA GENERAL (ANUAL) ================= */}
      {activeTab === "general" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* 💵 ESPACIO FINANCIERO Y CONTROL DE MÁRGENES */}
          <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--slate-900)", marginBottom: "20px", display: "flex", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
              💵 ESPACIO FINANCIERO Y CONTROL DE MÁRGENES
              <HelpTooltip text="Indicadores contables y gráficos financieros que reflejan el rendimiento económico, costos de adquisición de dosis aplicadas, facturación al paciente e incrementos por inflación." />
            </h3>

            {/* KPI Cards Financieros */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              
              {/* Inversión */}
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📉</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${finanzas.inversion.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Inversión (Costo de Salidas)
                    <HelpTooltip text="Costo total de adquisición de las dosis aplicadas en el período seleccionado, calculado con el costo de compra unitario específico de su respectivo lote." />
                  </div>
                </div>
              </div>

              {/* Ingresos Brutos */}
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💎</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${finanzas.ingresos.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ingresos Brutos
                    <HelpTooltip text="Dinero total recaudado por la aplicación de dosis al precio cobrado al paciente en el período seleccionado." />
                  </div>
                </div>
              </div>

              {/* Ganancias Netas y Top 5 */}
              <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", gridRow: "span 2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📈</div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${finanzas.gananciasNetas.toLocaleString()}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Ganancias Netas
                      <HelpTooltip text="Utilidad neta generada en el período (Ingresos Brutos menos Inversión). No incluye pérdidas por mermas." />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "8px", borderTop: "1px solid var(--slate-100)", paddingTop: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "8px" }}>Top Ganancias Acumuladas</div>
                  {finanzas.topGanancias.length > 0 ? finanzas.topGanancias.map((t, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                      <span style={{ color: "var(--slate-600)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "120px" }}>{t.nombre}</span>
                      <span style={{ fontWeight: 700, color: "#10b981" }}>+${t.ganancia.toLocaleString()}</span>
                    </div>
                  )) : <div style={{ fontSize: "12px", color: "var(--slate-400)" }}>Sin datos</div>}
                </div>
              </div>

              {/* Variación de Costos & Top Alertas */}
              <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", gridRow: "span 2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: finanzas.variacionPromedio > 0 ? "rgba(244, 63, 94, 0.1)" : "rgba(34, 197, 94, 0.1)", color: finanzas.variacionPromedio > 0 ? "#f43f5e" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                    {finanzas.variacionPromedio > 0 ? "⚠️" : "⚖️"}
                  </div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: finanzas.variacionPromedio > 0 ? "#e11d48" : "var(--slate-900)", lineHeight: 1 }}>
                      {finanzas.variacionPromedio > 0 ? "+" : ""}{finanzas.variacionPromedio.toFixed(1)}%
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Variación de Costos
                      <HelpTooltip text="Porcentaje promedio de inflación o incremento de costos en las compras de nuevos lotes respecto al lote anterior del mismo ítem." />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "8px", borderTop: "1px solid var(--slate-100)", paddingTop: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "8px" }}>Top Alertas de Incremento</div>
                  {finanzas.topAlertas.length > 0 ? finanzas.topAlertas.map((t, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                      <span style={{ color: "var(--slate-600)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "120px" }}>{t.nombre}</span>
                      <span style={{ fontWeight: 700, color: t.incremento > 0 ? "#e11d48" : "#22c55e" }}>
                        {t.incremento > 0 ? "+" : ""}{t.incremento.toFixed(1)}%
                      </span>
                    </div>
                  )) : <div style={{ fontSize: "12px", color: "var(--slate-400)" }}>Sin compras con incremento</div>}
                </div>
              </div>

              {/* Costo de Merma */}
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🗑️</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${finanzas.costoMerma.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Costo de Merma
                    <HelpTooltip text="Valor monetario de las dosis/unidades desechadas o perdidas (vencimiento, daño) calculado a precio de costo de compra." />
                  </div>
                </div>
              </div>

            </div>

            {/* Comprobantes de Cobro */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div className="card" style={{ padding: "16px 20px", background: "white", borderRadius: "12px", border: "1px solid var(--slate-200)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ fontSize: "24px", color: "#10b981" }}>💵</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>{cobroGeneral.cobroFinal}</div>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, display: "flex", alignItems: "center" }}>
                    DOSIS A PRECIO FINAL
                    <HelpTooltip text="Aplicaciones cobradas al paciente al precio de venta estándar (ganancia completa)." />
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: "16px 20px", background: "white", borderRadius: "12px", border: "1px solid var(--slate-200)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ fontSize: "24px", color: "#f59e0b" }}>🤝</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>{cobroGeneral.cobroMayorista}</div>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, display: "flex", alignItems: "center" }}>
                    DOSIS A COSTO MAYORISTA
                    <HelpTooltip text="Aplicaciones que se cobraron a precio de costo (por convenios, subsidios o programas del PAI)." />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos Financieros General */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
              
              {/* Rendimiento Financiero Mensual */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", display: "flex", alignItems: "center" }}>
                  Rendimiento Financiero (Ingreso vs Costo por Mes)
                  <HelpTooltip text="Compara los ingresos brutos generados por aplicaciones contra su costo de compra acumulado para cada mes." />
                </h4>
                <div style={{ height: "300px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataRendimientoAnual} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} tickFormatter={(val) => `$${(val/1000)}k`} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `$${val.toLocaleString()}`} />
                      <Legend iconType="circle" />
                      <Bar dataKey="ingreso" name="Ventas (Ingreso)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="costo" name="Costo" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de Inflación Anual */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", height: "400px", overflowY: "auto" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", position: "sticky", top: 0, background: "white", zIndex: 10, paddingBottom: "10px", display: "flex", alignItems: "center" }}>
                  Análisis de Inflación: Incremento de Costos Anuales
                  <HelpTooltip text="Muestra el porcentaje en que aumentó el costo de adquisición de cada producto comparando la última compra del año frente a la anterior." />
                </h4>
                <div style={{ height: `${Math.max(300, finanzasAnual.topAlertas.length * 40)}px`, width: "100%" }}>
                  {finanzasAnual.topAlertas.length === 0 ? (
                    <div style={{ color: "var(--slate-400)", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>No se detectaron incrementos de costos en compras de este año.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={finanzasAnual.topAlertas} margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--slate-200)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} tickFormatter={(val) => `+${val}%`} />
                        <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate-700)", fontWeight: 600 }} width={140} />
                        <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `+${val.toFixed(1)}%`} />
                        <Bar dataKey="incremento" name="Incremento %" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 📦 ESPACIO DE GESTIÓN DE INVENTARIO Y ROTACIÓN */}
          <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--slate-900)", marginBottom: "20px", display: "flex", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
              📦 ESPACIO DE GESTIÓN DE INVENTARIO Y ROTACIÓN
              <HelpTooltip text="Indicadores físicos de existencias, flujo de stock (entradas/salidas), productos críticos con bajo stock e ítems sin movimiento en el dispensario." />
            </h3>

            {/* KPI Cards Operativos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              
              {/* Total Unidades Físicas */}
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📦</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{kpisOperativos.totalUnidades}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Total Unidades Físicas
                    <HelpTooltip text="Suma total de todas las dosis o unidades individuales disponibles en el dispensario de todos los lotes activos." />
                  </div>
                </div>
              </div>

              {/* Ítems Agotados */}
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: kpisOperativos.itemsAgotados > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", color: kpisOperativos.itemsAgotados > 0 ? "#ef4444" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{kpisOperativos.itemsAgotados > 0 ? "🛑" : "✅"}</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: kpisOperativos.itemsAgotados > 0 ? "#ef4444" : "var(--slate-900)", lineHeight: 1 }}>{kpisOperativos.itemsAgotados}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ítems Agotados (Stock 0)
                    <HelpTooltip text="Productos o vacunas configurados en tu inventario pero que actualmente no tienen ninguna dosis disponible." />
                  </div>
                </div>
              </div>

              {/* Ítems en Riesgo Crítico */}
              <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", border: kpisOperativos.itemsEnRiesgo.length > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: kpisOperativos.itemsEnRiesgo.length > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)", color: kpisOperativos.itemsEnRiesgo.length > 0 ? "#f59e0b" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{kpisOperativos.itemsEnRiesgo.length > 0 ? "⚠️" : "✅"}</div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: kpisOperativos.itemsEnRiesgo.length > 0 ? "#d97706" : "var(--slate-900)", lineHeight: 1 }}>{kpisOperativos.itemsEnRiesgo.length}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Ítems en Riesgo Crítico
                      <HelpTooltip text="Productos cuyo stock disponible actual es inferior o igual a la cantidad mínima configurada de alerta." />
                    </div>
                  </div>
                </div>
                {kpisOperativos.itemsEnRiesgo.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {kpisOperativos.itemsEnRiesgo.map((item, idx) => (
                      <span key={idx} style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>{item.nombre} ({item.stock_actual})</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ítems Inactivos */}
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(100, 116, 139, 0.1)", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>⏳</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{kpisOperativos.itemsInactivos}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ítems Inactivos (30d)
                    <HelpTooltip text="Medicamentos o insumos que no han registrado ninguna salida (aplicación o uso) en los últimos 30 días." />
                  </div>
                </div>
              </div>

            </div>

            {/* Gráficos de Gestión de Inventario */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px", marginBottom: "24px" }}>
              
              {/* Flujo Histórico */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", display: "flex", alignItems: "center" }}>
                  Flujo Histórico de Inventario (Entradas vs Salidas)
                  <HelpTooltip text="Visualiza el balance del movimiento físico de existencias: cuántas unidades ingresaron (compras) vs cuántas salieron (aplicadas) cada mes." />
                </h4>
                <div style={{ height: "300px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataFlujo} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                      <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                      <RechartsTooltip />
                      <Legend iconType="circle" />
                      <Area type="monotone" dataKey="entradas" name="Unidades Entrantes" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="salidas" name="Unidades Salientes (Aplicadas)" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Participación de Ítems */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", display: "flex", alignItems: "center" }}>
                    Participación por Ítem (Volumen)
                    <HelpTooltip text="Proporción que representa cada producto sobre el volumen total de salidas en el dispensario." />
                  </h4>
                  <select 
                    className="form-select" 
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                    value={selectedCatPie}
                    onChange={(e) => setSelectedCatPie(e.target.value)}
                  >
                    <option value="all">Todas las Categorías</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                
                <div style={{ height: "250px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
                  {chartDataParticipacionItems.length === 0 ? (
                     <div style={{ color: "var(--slate-400)", fontSize: "13px" }}>Sin datos en este año para la selección</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartDataParticipacionItems} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {chartDataParticipacionItems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                        <Legend iconType="circle" verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Ranking de Rotación Total */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", height: "400px", overflowY: "auto" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", position: "sticky", top: 0, background: "white", zIndex: 10, paddingBottom: "10px", display: "flex", alignItems: "center" }}>
                  Ranking Total de Rotación
                  <HelpTooltip text="Ordena de mayor a menor todos tus productos según la cantidad de unidades/dosis totales aplicadas durante el año." />
                </h4>
                <div style={{ height: `${Math.max(300, topItemsAnual.length * 40)}px`, width: "100%" }}>
                  {topItemsAnual.length === 0 ? (
                    <div style={{ color: "var(--slate-400)", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>Sin salidas registradas en este año.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={topItemsAnual} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--slate-200)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                        <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate-700)", fontWeight: 600 }} width={140} />
                        <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `${val} unidades`} />
                        <Bar dataKey="aplicaciones" name="Aplicaciones" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>
      )}


      {/* ================= CONTENIDO DE VISTA DIARIA (MENSUAL) ================= */}
      {activeTab === "diaria" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* 💵 ESPACIO FINANCIERO Y CONTROL DE MÁRGENES (MENSUAL) */}
          <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--slate-900)", marginBottom: "20px", display: "flex", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
              💵 ESPACIO FINANCIERO Y CONTROL DE MÁRGENES (MENSUAL)
              <HelpTooltip text="Indicadores contables y gráficos diarios específicos para el mes seleccionado." />
            </h3>

            {/* KPI Cards Financieros Diario */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📉</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${finanzas.inversion.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Inversión (Costo de Salidas)
                    <HelpTooltip text="Costo total de adquisición de las dosis aplicadas en el período seleccionado, calculado con el costo de compra unitario específico de su respectivo lote." />
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💎</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${finanzas.ingresos.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ingresos Brutos
                    <HelpTooltip text="Dinero total recaudado por la aplicación de dosis al precio cobrado al paciente en el período seleccionado." />
                  </div>
                </div>
              </div>

              {/* Ganancia Neta */}
              <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", gridRow: "span 2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📈</div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${finanzas.gananciasNetas.toLocaleString()}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Ganancias Netas
                      <HelpTooltip text="Utilidad neta generada en el período (Ingresos Brutos menos Inversión). No incluye pérdidas por mermas." />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "8px", borderTop: "1px solid var(--slate-100)", paddingTop: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "8px" }}>Top Ganancias Acumuladas</div>
                  {finanzas.topGanancias.length > 0 ? finanzas.topGanancias.map((t, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                      <span style={{ color: "var(--slate-600)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "120px" }}>{t.nombre}</span>
                      <span style={{ fontWeight: 700, color: "#10b981" }}>+${t.ganancia.toLocaleString()}</span>
                    </div>
                  )) : <div style={{ fontSize: "12px", color: "var(--slate-400)" }}>Sin datos</div>}
                </div>
              </div>

              {/* Inflacion / Incremento */}
              <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", gridRow: "span 2" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: finanzas.variacionPromedio > 0 ? "rgba(244, 63, 94, 0.1)" : "rgba(34, 197, 94, 0.1)", color: finanzas.variacionPromedio > 0 ? "#f43f5e" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                    {finanzas.variacionPromedio > 0 ? "⚠️" : "⚖️"}
                  </div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: finanzas.variacionPromedio > 0 ? "#e11d48" : "var(--slate-900)", lineHeight: 1 }}>
                      {finanzas.variacionPromedio > 0 ? "+" : ""}{finanzas.variacionPromedio.toFixed(1)}%
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Variación de Costos (Mes)
                      <HelpTooltip text="Porcentaje promedio de inflación o incremento de costos en las compras de nuevos lotes respecto al lote anterior del mismo ítem." />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "8px", borderTop: "1px solid var(--slate-100)", paddingTop: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "8px" }}>Top Alertas de Incremento</div>
                  {finanzas.topAlertas.length > 0 ? finanzas.topAlertas.map((t, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px" }}>
                      <span style={{ color: "var(--slate-600)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "120px" }}>{t.nombre}</span>
                      <span style={{ fontWeight: 700, color: t.incremento > 0 ? "#e11d48" : "#22c55e" }}>
                        {t.incremento > 0 ? "+" : ""}{t.incremento.toFixed(1)}%
                      </span>
                    </div>
                  )) : <div style={{ fontSize: "12px", color: "var(--slate-400)" }}>Sin compras en este mes</div>}
                </div>
              </div>

              {/* Costo Merma */}
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🗑️</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${finanzas.costoMerma.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Costo de Merma
                    <HelpTooltip text="Valor monetario de las dosis/unidades desechadas o perdidas (vencimiento, daño) calculado a precio de costo de compra." />
                  </div>
                </div>
              </div>

            </div>

            {/* Cobros Diario */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div className="card" style={{ padding: "16px 20px", background: "white", borderRadius: "12px", border: "1px solid var(--slate-200)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ fontSize: "24px", color: "#10b981" }}>💵</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>{resumenDiario.cobroFinal}</div>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, display: "flex", alignItems: "center" }}>
                    DOSIS A PRECIO FINAL
                    <HelpTooltip text="Aplicaciones cobradas al paciente al precio de venta estándar (ganancia completa)." />
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: "16px 20px", background: "white", borderRadius: "12px", border: "1px solid var(--slate-200)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ fontSize: "24px", color: "#f59e0b" }}>🤝</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>{resumenDiario.cobroMayorista}</div>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600, display: "flex", alignItems: "center" }}>
                    DOSIS A COSTO MAYORISTA
                    <HelpTooltip text="Aplicaciones que se cobraron a precio de costo (por convenios, subsidios o programas del PAI)." />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos Financieros Diario */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
              
              {/* Rendimiento Financiero Diario */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", display: "flex", alignItems: "center" }}>
                  Rendimiento Financiero Diario (Ingreso vs Costo)
                  <HelpTooltip text="Grafica la facturación diaria vs el costo de compra de las dosis aplicadas en cada día del mes." />
                </h4>
                <div style={{ height: "300px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataDiariaFinanzas} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                      <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} tickFormatter={(val) => `$${(val/1000)}k`} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `$${val.toLocaleString()}`} labelFormatter={(val) => `Día ${val}`} />
                      <Legend iconType="circle" />
                      <Area type="monotone" dataKey="ingreso" name="Ventas (Ingreso)" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="costo" name="Costo" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inflacion Diario */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", display: "flex", alignItems: "center" }}>
                  Análisis de Inflación: Incremento de Costos (Mes)
                  <HelpTooltip text="Lista los productos que registraron alza en su costo de adquisición durante el mes seleccionado." />
                </h4>
                <div style={{ height: "250px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {finanzasDiario.topAlertas.length === 0 ? (
                      <div style={{ color: "var(--slate-400)", fontSize: "13px", textAlign: "center", marginTop: "40px", height: "100%" }}>No se detectaron incrementos de costos en este mes.</div>
                    ) : (
                      <BarChart layout="vertical" data={finanzasDiario.topAlertas} margin={{ top: 5, right: 40, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--slate-200)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} tickFormatter={(val) => `+${val}%`} />
                        <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate-700)", fontWeight: 600 }} width={120} />
                        <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `+${val.toFixed(1)}%`} />
                        <Bar dataKey="incremento" name="Incremento %" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

          {/* 📦 ESPACIO DE GESTIÓN DE INVENTARIO Y ROTACIÓN (MENSUAL) */}
          <div style={{ background: "#f8fafc", padding: "24px", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--slate-900)", marginBottom: "20px", display: "flex", alignItems: "center", borderBottom: "2px solid #e2e8f0", paddingBottom: "10px" }}>
              📦 ESPACIO DE GESTIÓN DE INVENTARIO Y ROTACIÓN (MENSUAL)
              <HelpTooltip text="Flujos físicos diarios de existencias, productos aplicados y su rotación correspondiente al mes actual." />
            </h3>

            {/* KPI Cards Operativos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📦</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{kpisOperativos.totalUnidades}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Total Unidades Físicas
                    <HelpTooltip text="Suma total de todas las dosis o unidades individuales disponibles en el dispensario de todos los lotes activos." />
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: kpisOperativos.itemsAgotados > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", color: kpisOperativos.itemsAgotados > 0 ? "#ef4444" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{kpisOperativos.itemsAgotados > 0 ? "🛑" : "✅"}</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: kpisOperativos.itemsAgotados > 0 ? "#ef4444" : "var(--slate-900)", lineHeight: 1 }}>{kpisOperativos.itemsAgotados}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ítems Agotados (Stock 0)
                    <HelpTooltip text="Productos o vacunas configurados en tu inventario pero que actualmente no tienen ninguna dosis disponible." />
                  </div>
                </div>
              </div>
              <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", border: kpisOperativos.itemsEnRiesgo.length > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: kpisOperativos.itemsEnRiesgo.length > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)", color: kpisOperativos.itemsEnRiesgo.length > 0 ? "#f59e0b" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{kpisOperativos.itemsEnRiesgo.length > 0 ? "⚠️" : "✅"}</div>
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 800, color: kpisOperativos.itemsEnRiesgo.length > 0 ? "#d97706" : "var(--slate-900)", lineHeight: 1 }}>{kpisOperativos.itemsEnRiesgo.length}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Ítems en Riesgo Crítico
                      <HelpTooltip text="Productos cuyo stock disponible actual es inferior o igual a la cantidad mínima configurada de alerta." />
                    </div>
                  </div>
                </div>
                {kpisOperativos.itemsEnRiesgo.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {kpisOperativos.itemsEnRiesgo.map((item, idx) => (
                      <span key={idx} style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>{item.nombre} ({item.stock_actual})</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(100, 116, 139, 0.1)", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>⏳</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{kpisOperativos.itemsInactivos}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ítems Inactivos (30d)
                    <HelpTooltip text="Medicamentos o insumos que no han registrado ninguna salida (aplicación o uso) en los últimos 30 días." />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos Operativos Diarios */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
              
              {/* Aplicaciones Diarias */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", display: "flex", alignItems: "center" }}>
                  Aplicaciones Diarias
                  <HelpTooltip text="Cantidad total de dosis o unidades de insumos administrados en cada día del mes." />
                </h4>
                <div style={{ height: "250px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataDiariaAplicaciones} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                      <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `${val} unidades`} labelFormatter={(val) => `Día ${val}`} />
                      <Bar dataKey="aplicaciones" name="Unidades Aplicadas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Flujo Diario */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", display: "flex", alignItems: "center" }}>
                  Flujo Diario (Entradas vs Salidas)
                  <HelpTooltip text="Muestra los ingresos físicos de stock frente a los consumos diarios en el mes." />
                </h4>
                <div style={{ height: "250px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataDiariaFlujo} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                      <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                      <RechartsTooltip labelFormatter={(val) => `Día ${val}`} />
                      <Legend iconType="circle" />
                      <Area type="monotone" dataKey="entradas" name="Entrantes" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="salidas" name="Aplicadas" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distribución Mensual por Ítem */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", display: "flex", alignItems: "center" }}>
                    Distribución de Aplicaciones (Mensual)
                    <HelpTooltip text="Proporción que representó cada vacuna/insumo en el total de consumo del mes." />
                  </h4>
                  <select 
                    className="form-select" 
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                    value={selectedCatPieDiario}
                    onChange={(e) => setSelectedCatPieDiario(e.target.value)}
                  >
                    <option value="all">Todas las Categorías</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                
                <div style={{ height: "250px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
                  {chartDataParticipacionDiaria.length === 0 ? (
                    <div style={{ color: "var(--slate-400)", fontSize: "13px" }}>Sin datos en este mes</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartDataParticipacionDiaria} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {chartDataParticipacionDiaria.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip content={<CustomPieTooltip />} />
                        <Legend iconType="circle" verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Top Ítems del Mes */}
              <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
                <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", display: "flex", alignItems: "center" }}>
                  Top Ítems Aplicados (Mes)
                  <HelpTooltip text="Ranking de los productos con mayor número de salidas registradas durante este mes." />
                </h4>
                <div style={{ height: "250px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={topItemsDiario} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--slate-200)" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                      <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate-700)", fontWeight: 600 }} width={120} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `${val} unidades`} />
                      <Bar dataKey="aplicaciones" name="Aplicaciones" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}


      {/* ================= CONTENIDO DE VISTA "ANÁLISIS DE COMPRAS" ================= */}
      {activeTab === "compras" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Tarjeta de Filtros en Cascada */}
          <div className="card" style={{ padding: "20px", background: "white", border: "1px solid var(--slate-200)", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", color: "var(--slate-800)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🔍 Filtros de Abastecimiento (Año: {selectedYear})
            </h4>
            
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              
              {/* Laboratorio / Marca */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "200px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-500)" }}>LABORATORIO / PROVEEDOR:</label>
                <select
                  value={selectedLab}
                  onChange={(e) => {
                    setSelectedLab(e.target.value);
                    setSelectedItem("all");
                  }}
                  className="form-select"
                  style={{ padding: "8px 12px", background: "white", borderRadius: "8px", border: "1px solid var(--slate-200)" }}
                >
                  <option value="all">Todos los Laboratorios</option>
                  {availableLabs.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Producto / Ítem */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1, minWidth: "250px" }}>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--slate-500)" }}>PRODUCTO / ÍTEM ESPECÍFICO:</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="form-select"
                  style={{ padding: "8px 12px", background: "white", borderRadius: "8px", border: "1px solid var(--slate-200)" }}
                >
                  <option value="all">Todos los Productos ({availableItemsForTab.length})</option>
                  {availableItemsForTab.map(i => <option key={i.id} value={i.id}>{i.nombre} {i.laboratorio ? `(${i.laboratorio})` : ""}</option>)}
                </select>
              </div>

            </div>
          </div>

          {/* Tarjetas de KPIs Financieros de Compras */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            
            {/* Inversión en Compras */}
            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🛍️</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${inversionCompras.toLocaleString()}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600 }}>
                  Inversión en Compras
                  <HelpTooltip text="Dinero total pagado por la adquisición de lotes en el año y filtros seleccionados." />
                </div>
              </div>
            </div>

            {/* Volumen Adquirido */}
            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📦</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{volumenAdquirido.toLocaleString()}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600 }}>
                  Volumen Adquirido
                  <HelpTooltip text="Cantidad total de dosis o unidades compradas (lotes ingresados)." />
                </div>
              </div>
            </div>

            {/* Costo Unitario Promedio */}
            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🏷️</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${costoCompraPromedio.toLocaleString()}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600 }}>
                  Costo de Compra Prom.
                  <HelpTooltip text="Costo unitario promedio ponderado de compra del lote en el período." />
                </div>
              </div>
            </div>

            {/* Precio Venta Promedio */}
            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💎</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>${precioVentaPromedio.toLocaleString()}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600 }}>
                  Precio Final Venta
                  <HelpTooltip text="Precio promedio actual de venta al paciente para los ítems seleccionados." />
                </div>
              </div>
            </div>

            {/* Margen Promedio */}
            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: margenUnitarioVal > 0 ? "rgba(139, 92, 246, 0.1)" : "rgba(239, 68, 68, 0.1)", color: margenUnitarioVal > 0 ? "#8b5cf6" : "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📈</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: margenUnitarioVal > 0 ? "#8b5cf6" : "#ef4444", lineHeight: 1 }}>
                  {margenPorcentajeVal.toFixed(1)}%
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600 }}>
                  Margen Comercial Prom.
                  <HelpTooltip text="Porcentaje de ganancia comercial potencial calculado como: (Precio Venta Promedio - Costo Compra Promedio) / Precio Venta Promedio." />
                </div>
              </div>
            </div>

          </div>

          {/* Gráficos de Análisis de Compras */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
            
            {/* Concentración de compras por Laboratorio */}
            <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", display: "flex", flexDirection: "column" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", display: "flex", alignItems: "center" }}>
                Concentración de Compras por Laboratorio ($ Adquisición)
                <HelpTooltip text="Porcentaje del presupuesto anual de compras invertido en cada laboratorio/proveedor fabricante." />
              </h4>
              <div style={{ height: "250px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
                {chartDataConcentracionLab.length === 0 ? (
                  <div style={{ color: "var(--slate-400)", fontSize: "13px" }}>Sin datos de compras registradas en este año.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartDataConcentracionLab} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {chartDataConcentracionLab.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: any, name, props) => {
                        const total = props.payload.payload.total || 1;
                        const percent = ((val / total) * 100).toFixed(1);
                        return [`$${val.toLocaleString()} (${percent}%)`, "Inversión"];
                      }} />
                      <Legend iconType="circle" verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Estructura de Margen: Costo vs Venta */}
            <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
              <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px", display: "flex", alignItems: "center" }}>
                Estructura de Margen: Costo de Compra vs Precio de Venta
                <HelpTooltip text="Compara directamente el costo unitario de adquisición promedio ponderado contra el precio de venta final configurado para cada producto." />
              </h4>
              <div style={{ height: "250px", width: "100%" }}>
                {chartDataEstructuraMargen.length === 0 ? (
                  <div style={{ color: "var(--slate-400)", fontSize: "13px", textAlign: "center", marginTop: "60px" }}>Sin datos de margen comercial disponibles.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataEstructuraMargen} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--slate-500)" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate-500)" }} tickFormatter={(val) => `$${val}`} />
                      <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `$${val.toLocaleString()}`} />
                      <Legend iconType="circle" />
                      <Bar dataKey="costo" name="Costo Compra Prom." fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="precio" name="Precio Venta Final" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Bitácora de Compras Históricas (Tabla) */}
          <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
            <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "16px", display: "flex", alignItems: "center" }}>
              📋 Bitácora de Adquisición de Lotes (Historial de Compras)
              <HelpTooltip text="Registro detallado y ordenado cronológicamente de cada compra de lote realizada, mostrando el costo unitario específico, volumen, facturación y margen neta potencial." />
            </h4>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--slate-200)", fontSize: "11px", color: "var(--slate-500)", fontWeight: 700, textTransform: "uppercase" }}>
                    <th style={{ padding: "12px 8px" }}>Producto</th>
                    <th style={{ padding: "12px 8px" }}>Categoría</th>
                    <th style={{ padding: "12px 8px" }}>Laboratorio</th>
                    <th style={{ padding: "12px 8px" }}>Nro. Lote</th>
                    <th style={{ padding: "12px 8px" }}>Fecha Compra</th>
                    <th style={{ padding: "12px 8px", textAlign: "right" }}>Cantidad</th>
                    <th style={{ padding: "12px 8px", textAlign: "right" }}>Costo U. Compra</th>
                    <th style={{ padding: "12px 8px", textAlign: "right" }}>Total Compra</th>
                    <th style={{ padding: "12px 8px", textAlign: "right" }}>Precio Venta Paciente</th>
                    <th style={{ padding: "12px 8px", textAlign: "right" }}>Margen Unitario</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLotesForTab.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: "24px 8px", textAlign: "center", color: "var(--slate-400)", fontSize: "13px" }}>
                        Sin compras registradas en este período bajo los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredLotesForTab.map((l) => {
                      const item = filteredInventario.find(i => i.id === l.item_id);
                      const catName = categorias.find(c => c.id === item?.categoria_id)?.nombre || "Insumos";
                      const qty = Number(l.cantidad) || 0;
                      const costU = Number(l.precio_compra) || 0;
                      const costT = qty * costU;
                      const sellPrice = Number(item?.precio_venta) || 0;
                      const marginVal = sellPrice - costU;
                      const marginPct = sellPrice > 0 ? (marginVal / sellPrice) * 100 : 0;

                      return (
                        <tr key={l.id} style={{ borderBottom: "1px solid var(--slate-100)", fontSize: "13px", color: "var(--slate-700)" }}>
                          <td style={{ padding: "12px 8px", fontWeight: 600 }}>{item?.nombre || "Sin nombre"}</td>
                          <td style={{ padding: "12px 8px" }}>
                            <span style={{ background: "var(--slate-100)", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>{catName}</span>
                          </td>
                          <td style={{ padding: "12px 8px" }}>{item?.laboratorio || "N/A"}</td>
                          <td style={{ padding: "12px 8px", fontFamily: "monospace" }}>{l.numero_lote}</td>
                          <td style={{ padding: "12px 8px" }}>{l.fecha_registro}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right" }}>{qty}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right" }}>${costU.toLocaleString()}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 600 }}>${costT.toLocaleString()}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right" }}>${sellPrice.toLocaleString()}</td>
                          <td style={{ padding: "12px 8px", textAlign: "right", color: marginVal > 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                            ${marginVal.toLocaleString()} ({marginPct.toFixed(0)}%)
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
