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
  primaryColor: string;
  accentColor: string;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function DashboardCharts({ inventario, categorias, movimientos, primaryColor, accentColor }: Props) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedCatPie, setSelectedCatPie] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"general" | "diaria">("general");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // Derive unique years from movimientos for the selector
  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);
    movimientos.forEach(m => {
      if (m.fecha) {
        years.add(new Date(m.fecha).getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [movimientos, currentYear]);

  // 1. Gráfica Principal: Aplicaciones por Mes (Costo vs Cobrado)
  // --- VISTA DIARIA LOGIC ---
  const chartDataDiariaAplicaciones = useMemo(() => {
    // Array de 31 días
    const daysInMonth = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate();
    const data = Array.from({length: daysInMonth}, (_, i) => ({ dia: i + 1, aplicaciones: 0 }));

    movimientos.forEach(m => {
      if (m.fecha && m.fecha.startsWith(selectedMonth)) {
        if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
          const d = parseInt(m.fecha.split('-')[2]);
          if (data[d - 1]) data[d - 1].aplicaciones += m.cantidad;
        }
      }
    });
    return data;
  }, [movimientos, selectedMonth]);

  const chartDataDiariaFlujo = useMemo(() => {
    const daysInMonth = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate();
    const data = Array.from({length: daysInMonth}, (_, i) => ({ dia: i + 1, entradas: 0, salidas: 0 }));

    movimientos.forEach(m => {
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
  }, [movimientos, selectedMonth]);

  const resumenDiario = useMemo(() => {
    let totalAplicadas = 0;
    let totalMermas = 0;
    
    movimientos.forEach(m => {
      if (m.fecha && m.fecha.startsWith(selectedMonth)) {
        if (m.tipo_movimiento === "SALIDA") {
          if (m.motivo && m.motivo.startsWith("MERMA")) {
            totalMermas += m.cantidad;
          } else {
            totalAplicadas += m.cantidad;
          }
        }
      }
    });
    return { totalAplicadas, totalMermas };
  }, [movimientos, selectedMonth]);

  // 
  // 1. Gráfica Principal: Flujo Histórico (Entradas vs Salidas)
  const chartDataFlujo = useMemo(() => {
    const data = MONTHS.map(m => ({ mes: m, entradas: 0, salidas: 0 }));
    
    movimientos.forEach(m => {
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
  }, [movimientos, selectedYear]);

  // 2. Gráfica: Participación de Ítems (Volumen de Aplicación)
  const chartDataParticipacionItems = useMemo(() => {
    const dataMap: Record<string, { name: string, value: number, color: string }> = {};
    
    // Asignar colores aleatorios o predefinidos a los ítems (usaremos la paleta de la categoría o algo similar)
    const itemColors = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

    movimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
        const item = inventario.find(i => i.id === m.item_id);
        if (item) {
          // Filtrar por categoría seleccionada si no es "all"
          if (selectedCatPie !== "all" && item.categoria_id !== selectedCatPie) return;

          if (!dataMap[item.id]) {
            dataMap[item.id] = { 
              name: item.nombre, 
              value: 0, 
              color: itemColors[Object.keys(dataMap).length % itemColors.length] 
            };
          }
          dataMap[item.id].value += m.cantidad;
        }
      }
    });

    return Object.values(dataMap).sort((a, b) => b.value - a.value);
  }, [movimientos, inventario, selectedYear, selectedCatPie]);

  // 3. Gráfica: Tendencia de Aplicación (Salidas) por Categoría a lo largo del año
  const chartDataTendenciaCat = useMemo(() => {
    const data = MONTHS.map(m => {
      const obj: any = { mes: m };
      categorias.forEach(c => obj[c.nombre] = 0);
      return obj;
    });

    movimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA") {
        const item = inventario.find(i => i.id === m.item_id);
        if (item && item.categoria_id) {
          const cat = categorias.find(c => c.id === item.categoria_id);
          if (cat) {
            data[d.getMonth()][cat.nombre] += m.cantidad;
          }
        }
      }
    });
    return data;
  }, [movimientos, inventario, categorias, selectedYear]);

  // 4. Tabla/Top: Ítems más rentables (Mayor volumen cobrado) en el año
  const topItems = useMemo(() => {
    const itemsMap: Record<string, { nombre: string, cantidad: number, ingresos: number, costo: number }> = {};
    
    movimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
        const item = inventario.find(i => i.id === m.item_id);
        if (item) {
          if (!itemsMap[item.id]) {
            itemsMap[item.id] = { nombre: item.nombre, cantidad: 0, ingresos: 0, costo: 0 };
          }
          itemsMap[item.id].cantidad += m.cantidad;
        }
      }
    });

    return Object.values(itemsMap)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5); // Top 5
  }, [movimientos, inventario, selectedYear]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* TABS */}
      <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--slate-200)", marginTop: "16px" }}>
        <button 
          onClick={() => setActiveTab("general")}
          style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "general" ? `2px solid ${primaryColor}` : "2px solid transparent", color: activeTab === "general" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "general" ? 700 : 500, cursor: "pointer", fontSize: "15px" }}
        >
          📊 Vista General (Anual)
        </button>
        <button 
          onClick={() => setActiveTab("diaria")}
          style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "diaria" ? `2px solid ${primaryColor}` : "2px solid transparent", color: activeTab === "diaria" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "diaria" ? 700 : 500, cursor: "pointer", fontSize: "15px" }}
        >
          📅 Vista Diaria (Mes)
        </button>
      </div>

      {activeTab === "general" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
        <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>
          Análisis de Rendimiento Operativo
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "var(--slate-500)", fontWeight: 600 }}>AÑO DE REPORTE:</span>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="form-select"
            style={{ width: "100px", padding: "6px 12px", background: "white" }}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        {/* Flujo Histórico */}
        <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Flujo Histórico de Inventario</h3>
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

        {/* Tendencia por Categorías */}
        <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Unidades Aplicadas por Categoría</h3>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataTendenciaCat} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                <RechartsTooltip />
                <Legend iconType="circle" />
                {categorias.map((c, i) => (
                  <Area key={c.id} type="monotone" dataKey={c.nombre} stackId="1" stroke={c.color || primaryColor} fill={c.color || primaryColor} fillOpacity={0.6 + (i*0.1)} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        {/* Participación de Ítems */}
        <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)" }}>Participación por Ítem (Volumen)</h3>
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
               <div style={{ color: "var(--slate-400)", fontSize: "13px" }}>Sin datos de aplicación en este año para la selección</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDataParticipacionItems} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartDataParticipacionItems.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: any) => `${val} aplicados`} />
                  <Legend iconType="circle" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Items Table */}
        <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Top 5 Ítems Mayor Rotación ({selectedYear})</h3>
          {topItems.length === 0 ? (
            <div style={{ color: "var(--slate-400)", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>Sin salidas registradas en este año.</div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              {topItems.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: idx < topItems.length - 1 ? "1px solid var(--slate-100)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--slate-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "var(--slate-500)" }}>{idx + 1}</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-800)" }}>{item.nombre}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: accentColor }}>{item.cantidad}</div>
                    <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>Aplicaciones</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
        </>
      )}

      {activeTab === "diaria" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>
              Análisis Diario de Gestión
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", color: "var(--slate-500)", fontWeight: 600 }}>MES DE ANÁLISIS:</span>
              <input 
                type="month" 
                className="form-input" 
                style={{ padding: "6px 12px", background: "white", fontSize: "14px" }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "8px" }}>
             <div className="card" style={{ padding: "16px 20px", background: "white", borderRadius: "12px", border: "1px solid var(--slate-200)", display: "flex", alignItems: "center", gap: "16px" }}>
               <div style={{ fontSize: "24px", color: "#3b82f6" }}>💉</div>
               <div>
                 <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>{resumenDiario.totalAplicadas}</div>
                 <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>APLICACIONES DEL MES</div>
               </div>
             </div>
             <div className="card" style={{ padding: "16px 20px", background: "white", borderRadius: "12px", border: "1px solid var(--slate-200)", display: "flex", alignItems: "center", gap: "16px" }}>
               <div style={{ fontSize: "24px", color: "#f43f5e" }}>🗑️</div>
               <div>
                 <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>{resumenDiario.totalMermas}</div>
                 <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>MERMAS DEL MES</div>
               </div>
             </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
            
            {/* Aplicaciones por Día */}
            <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Aplicaciones Diarias</h3>
              <div style={{ height: "250px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataDiariaAplicaciones} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                    <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `${val} vacunas`} labelFormatter={(val) => `Día ${val}`} />
                    <Bar dataKey="aplicaciones" name="Unidades Aplicadas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Flujo Diario */}
            <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Flujo Diario de Inventario (Entradas vs Salidas)</h3>
              <div style={{ height: "300px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataDiariaFlujo} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                    <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                    <RechartsTooltip labelFormatter={(val) => `Día ${val}`} />
                    <Legend iconType="circle" />
                    <Area type="monotone" dataKey="entradas" name="Unidades Entrantes" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="salidas" name="Unidades Salientes" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
