const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/DashboardCharts.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace chartDataRendimiento with chartDataFlujo
content = content.replace(
  /const chartDataRendimiento = useMemo\(\(\) => \{[\s\S]*?\}, \[movimientos, inventario, selectedYear\]\);/,
  `// 1. Gráfica Principal: Flujo Histórico (Entradas vs Salidas)
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
  }, [movimientos, selectedYear]);`
);

// Replace the UI for Rendimiento with Flujo
const rendimientoUIRegex = /\{\/\* Rendimiento Financiero \*\/\}[\s\S]*?<\/BarChart>[\s\S]*?<\/ResponsiveContainer>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const flujoUI = `{/* Flujo Histórico */}
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
        </div>`;

content = content.replace(rendimientoUIRegex, flujoUI);

fs.writeFileSync(file, content);
console.log("Flujo historico injected successfully");
