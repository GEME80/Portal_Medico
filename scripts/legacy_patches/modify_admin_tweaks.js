const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change Flujo Mensual to Flujo Anual
content = content.replace(/let entradasMes = 0;\n  let salidasMes = 0;/, `let entradasAnio = 0;\n  let salidasAnio = 0;`);
content = content.replace(/const inicioMes = new Date\(\);\n  inicioMes\.setDate\(1\);\n  inicioMes\.setHours\(0, 0, 0, 0\);/, `const inicioAnio = new Date();\n  inicioAnio.setMonth(0, 1);\n  inicioAnio.setHours(0, 0, 0, 0);`);

content = content.replace(/if \(fechaMov >= inicioMes\) \{/, `if (fechaMov >= inicioAnio) {`);
content = content.replace(/entradasMes \+= m\.cantidad;/, `entradasAnio += m.cantidad;`);
content = content.replace(/salidasMes \+= m\.cantidad;/, `salidasAnio += m.cantidad;`);

// 2. Add Info tooltips to the cards
content = content.replace(
  /<div className="card" style=\{\{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" \}\}>/g,
  `<div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>`
);

// We need to carefully inject the `title` tooltips to the titles.
const kpisRegex = /\{\/\* KPIs Grid \*\/\}[\s\S]*?<\/div>\n        <\/div>\n\n        <DashboardCharts/g;

const newKpis = `{/* KPIs Grid */}
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "16px" }}>💰 KPIs Financieros</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>💎</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>\${(capitalInvertido/1000000).toFixed(1)}M</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Capital Invertido Actual
                    <span title="Suma total de todo el stock físico multiplicado por su costo de compra." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                  </div>
                </div>
              </div>
              {capitalDesglose && <div style={{ fontSize: "12px", color: "var(--slate-500)", background: "var(--slate-50)", padding: "8px", borderRadius: "6px" }}>{capitalDesglose}</div>}
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🗑️</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>\${costoMerma.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Costo de Merma
                    <span title="Dinero perdido por vacunas desechadas debido a vencimiento o daño. (Suma de Salidas por Merma x Costo)." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📈</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>Top Ganancia Neta por Unidad</div>
                  <span title="Los ítems que te dejan la mayor ganancia neta. Fórmula: (Precio Venta al Paciente - Costo de Compra)." style={{cursor: "help", fontSize: "14px", color: "var(--slate-500)"}}>ⓘ</span>
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                {topMargen.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span>{t.nombre}</span>
                    <span style={{ fontWeight: 600, color: "var(--slate-700)" }}>+\${t.margen.toLocaleString()} ganancia neta</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "16px" }}>📦 KPIs de Gestión Operativa</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            
            <div className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", position: "relative", border: itemsEnRiesgo.length > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: itemsEnRiesgo.length > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)", color: itemsEnRiesgo.length > 0 ? "#f59e0b" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{itemsEnRiesgo.length > 0 ? "⚠️" : "✅"}</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: itemsEnRiesgo.length > 0 ? "#d97706" : "var(--slate-900)", lineHeight: 1 }}>{itemsEnRiesgo.length}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Ítems en Riesgo Crítico
                    <span title="Ítems cuyo stock actual es menor o igual a su stock mínimo de alerta." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                  </div>
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

            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(100, 116, 139, 0.1)", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>⏳</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{itemsInactivos}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ítems Inactivos (30d)
                  <span title="Medicamentos que no han tenido ninguna salida (aplicación) en los últimos 30 días." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(168, 85, 247, 0.1)", color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>🔄</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{entradasAnio} <span style={{fontSize: "14px", fontWeight: 500, color: "var(--slate-400)"}}>ent</span> / {salidasAnio} <span style={{fontSize: "14px", fontWeight: 500, color: "var(--slate-400)"}}>sal</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Flujo Anual
                  <span title="Relación de cuántas unidades de inventario ingresaron frente a cuántas salieron en todo el año en curso." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <Link href={\`/\${slug}/admin/inventario\`} className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 700, borderColor: primaryColor, color: primaryColor }}>
            📅 Ver Auditoría de Control Diario →
          </Link>
        </div>

        <DashboardCharts`;

content = content.replace(kpisRegex, newKpis);

fs.writeFileSync(file, content);
console.log("Admin tweaks injected successfully");
