const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/DashboardCharts.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add activeTab and selectedMonth state
const stateRegex = /const \[selectedCatPie, setSelectedCatPie\] = useState<string>\("all"\);/;
content = content.replace(stateRegex, `const [selectedCatPie, setSelectedCatPie] = useState<string>("all");\n  const [activeTab, setActiveTab] = useState<"general" | "diaria">("general");\n  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));`);

// 2. Generate daily chart data
const chartDataRegex = /\/\/ 1\. Gráfica Principal: Flujo Histórico/;
const newDailyChartsLogic = `// --- VISTA DIARIA LOGIC ---
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

  // `;

content = content.replace(chartDataRegex, newDailyChartsLogic + "\n  // 1. Gráfica Principal: Flujo Histórico");


// 3. Wrap existing UI in Tabs
const returnRegex = /return \(\n    <div style=\{\{ display: "flex", flexDirection: "column", gap: "24px" \}\}>\n      <div style=\{\{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px" \}\}>/g;

const tabsUI = `return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* TABS */}
      <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid var(--slate-200)", marginTop: "16px" }}>
        <button 
          onClick={() => setActiveTab("general")}
          style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "general" ? \`2px solid \${primaryColor}\` : "2px solid transparent", color: activeTab === "general" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "general" ? 700 : 500, cursor: "pointer", fontSize: "15px" }}
        >
          📊 Vista General (Anual)
        </button>
        <button 
          onClick={() => setActiveTab("diaria")}
          style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "diaria" ? \`2px solid \${primaryColor}\` : "2px solid transparent", color: activeTab === "diaria" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "diaria" ? 700 : 500, cursor: "pointer", fontSize: "15px" }}
        >
          📅 Vista Diaria (Mes)
        </button>
      </div>

      {activeTab === "general" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>`;

content = content.replace(returnRegex, tabsUI);

// 4. Add the Daily View UI block and close the general view tag
// We need to find the very end of the component return.
const endRegex = /<\/div>\n    <\/div>\n  \);\n\}/g;

const dailyUI = `</div>
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
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} formatter={(val: any) => \`\${val} vacunas\`} labelFormatter={(val) => \`Día \${val}\`} />
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
                    <RechartsTooltip labelFormatter={(val) => \`Día \${val}\`} />
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
}`;

content = content.replace(endRegex, dailyUI);

fs.writeFileSync(file, content);
console.log("Dashboard daily charts injected successfully");
