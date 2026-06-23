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
  const chartDataRendimiento = useMemo(() => {
    const data = MONTHS.map(m => ({ mes: m, costo: 0, cobrado: 0 }));
    
    movimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA") {
        const item = inventario.find(i => i.id === m.item_id);
        if (item) {
          const monthIndex = d.getMonth();
          // Costo total de esa salida
          data[monthIndex].costo += (item.valor_mayorista || 0) * m.cantidad;
          // Valor cobrado total
          data[monthIndex].cobrado += (item.precio_venta || 0) * m.cantidad;
        }
      }
    });
    return data;
  }, [movimientos, inventario, selectedYear]);

  // 2. Gráfica: Distribución de Categorías en Inventario Actual (Valor Potencial)
  const chartDataCategoriasValor = useMemo(() => {
    const dataMap: Record<string, number> = {};
    categorias.forEach(c => dataMap[c.id] = 0);
    
    inventario.forEach(item => {
      if (item.categoria_id && dataMap[item.categoria_id] !== undefined) {
        dataMap[item.categoria_id] += (item.stock_actual * (item.precio_venta || 0));
      }
    });

    return categorias.map(c => ({
      name: c.nombre,
      value: dataMap[c.id],
      color: c.color || primaryColor
    })).filter(c => c.value > 0);
  }, [inventario, categorias, primaryColor]);

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
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA") {
        const item = inventario.find(i => i.id === m.item_id);
        if (item) {
          if (!itemsMap[item.id]) {
            itemsMap[item.id] = { nombre: item.nombre, cantidad: 0, ingresos: 0, costo: 0 };
          }
          itemsMap[item.id].cantidad += m.cantidad;
          itemsMap[item.id].ingresos += (item.precio_venta || 0) * m.cantidad;
          itemsMap[item.id].costo += (item.valor_mayorista || 0) * m.cantidad;
        }
      }
    });

    return Object.values(itemsMap)
      .sort((a, b) => b.ingresos - a.ingresos)
      .slice(0, 5); // Top 5
  }, [movimientos, inventario, selectedYear]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px" }}>
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
        {/* Rendimiento Financiero */}
        <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Rendimiento Financiero Mensual</h3>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataRendimiento} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-200)" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--slate-500)" }} tickFormatter={(val) => `$${(val/1000)}k`} />
                <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => `$${val.toLocaleString()}`} />
                <Legend iconType="circle" />
                <Bar dataKey="costo" name="Costo Total" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="cobrado" name="Ingreso Total" fill={primaryColor} radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
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
        {/* Distribución Actual */}
        <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Valor Potencial por Categoría</h3>
          <div style={{ height: "250px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {chartDataCategoriasValor.length === 0 ? (
               <div style={{ color: "var(--slate-400)", fontSize: "13px" }}>Sin datos de inventario</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDataCategoriasValor} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartDataCategoriasValor.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: any) => `$${val.toLocaleString()}`} />
                  <Legend iconType="circle" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Items Table */}
        <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Top 5 Ítems Más Rentables ({selectedYear})</h3>
          {topItems.length === 0 ? (
            <div style={{ color: "var(--slate-400)", fontSize: "13px", textAlign: "center", marginTop: "40px" }}>Sin movimientos registrados en este año.</div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              {topItems.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: idx < topItems.length - 1 ? "1px solid var(--slate-100)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--slate-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "var(--slate-500)" }}>{idx + 1}</div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-800)" }}>{item.nombre}</div>
                      <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>{item.cantidad} aplicaciones</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: accentColor }}>+${(item.ingresos - item.costo).toLocaleString()}</div>
                    <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>Utilidad generada</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
