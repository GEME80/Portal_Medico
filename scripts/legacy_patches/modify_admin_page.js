const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const newLogic = `
  const inventarioData = inventarioRes.data || [];
  const categoriasData = categoriasRes.data || [];
  const movimientosData = movimientosRes.data || [];
    
  // --- KPI Calculations ---
  
  // 1. Capital Invertido y Desglose
  let capitalInvertido = 0;
  const capitalPorCategoria = {};
  categoriasData.forEach(c => capitalPorCategoria[c.id] = { nombre: c.nombre, total: 0 });

  // 4. Ítems en Riesgo Crítico
  const itemsEnRiesgo = [];

  // 3. Top Margen de Contribución
  const margenItems = [];

  inventarioData.forEach(item => {
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
    .map(c => \`\${c.nombre}: \${Math.round((c.total / capitalInvertido) * 100)}%\`)
    .join(" | ");

  const topMargen = margenItems.sort((a, b) => b.margen - a.margen).slice(0, 3);

  // 2. Costo de Merma
  let costoMerma = 0;
  
  // 5. Ítems Inactivos (30 días)
  // 6. Flujo Mensual
  let entradasMes = 0;
  let salidasMes = 0;
  
  const treintaDiasAtras = new Date();
  treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
  
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const itemsConSalidaReciente = new Set();

  movimientosData.forEach(m => {
    const fechaMov = new Date(m.fecha);
    const item = inventarioData.find(i => i.id === m.item_id);
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
    if (fechaMov >= inicioMes) {
        if (m.tipo_movimiento === "ENTRADA") entradasMes += m.cantidad;
        if (m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) salidasMes += m.cantidad;
    }
  });

  const itemsInactivos = inventarioData.filter(i => !itemsConSalidaReciente.has(i.id)).length;
`;

const oldLogicRegex = /const inventarioData = inventarioRes\.data \|\| \[\];[\s\S]*?const utilidadProyectada = ingresoPotencial - capitalInvertido;/g;

content = content.replace(oldLogicRegex, newLogic);

const oldKpisRegex = /\{\/\* KPIs Grid \*\/\}[\s\S]*?<\/div>\n\n        <DashboardCharts/g;

const newKpis = `{/* KPIs Grid */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "16px" }}>💰 KPIs Financieros</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💎</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>\${(capitalInvertido/1000000).toFixed(1)}M</div>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Capital Invertido Actual</div>
                </div>
              </div>
              {capitalDesglose && <div style={{ fontSize: "12px", color: "var(--slate-500)", background: "var(--slate-50)", padding: "8px", borderRadius: "6px" }}>{capitalDesglose}</div>}
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🗑️</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>\${costoMerma.toLocaleString()}</div>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Costo de Merma (Scrap Value)</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📈</div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>Top Margen Contribución</div>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                {topMargen.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>{t.nombre}</span>
                    <span style={{ fontWeight: 600, color: "var(--slate-700)" }}>+\${t.margen.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "16px" }}>📦 KPIs de Gestión Operativa</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", border: itemsEnRiesgo.length > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: itemsEnRiesgo.length > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)", color: itemsEnRiesgo.length > 0 ? "#f59e0b" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{itemsEnRiesgo.length > 0 ? "⚠️" : "✅"}</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: itemsEnRiesgo.length > 0 ? "#d97706" : "var(--slate-900)", lineHeight: 1 }}>{itemsEnRiesgo.length}</div>
                  <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ítems en Riesgo Crítico</div>
                </div>
              </div>
              {itemsEnRiesgo.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {itemsEnRiesgo.map((item, idx) => (
                    <span key={idx} style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>{item.nombre}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(100, 116, 139, 0.1)", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>⏳</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{itemsInactivos}</div>
                <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ítems Inactivos (30d)</div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(168, 85, 247, 0.1)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🔄</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{entradasMes} <span style={{fontSize: "14px", fontWeight: 500, color: "var(--slate-400)"}}>ent</span> / {salidasMes} <span style={{fontSize: "14px", fontWeight: 500, color: "var(--slate-400)"}}>sal</span></div>
                <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Flujo Mensual</div>
              </div>
            </div>

          </div>
        </div>

        <DashboardCharts`;

content = content.replace(oldKpisRegex, newKpis);

fs.writeFileSync(file, content);
console.log("Admin page logic updated successfully");
