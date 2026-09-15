const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Calculate new metrics in page.tsx
const calculationRegex = /const itemsInactivos = vacunas\.filter\(v => \{\n      return v\.stockActual \> 0 && \!itemsConMovimiento\.has\(v\.id\);\n    \}\)\.length;/;
const newCalculations = `const itemsInactivos = vacunas.filter(v => {
      return v.stockActual > 0 && !itemsConMovimiento.has(v.id);
    }).length;

    const totalUnidadesInventario = vacunas.reduce((acc, v) => acc + (v.stockActual || 0), 0);
    const itemsAgotados = vacunas.filter(v => v.stockActual === 0).length;`;

content = content.replace(calculationRegex, newCalculations);

// 2. Remove Financial KPIs and restructure Operational KPIs
const kpiGridRegex = /<h3 style=\{\{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 700, color: "var\(--slate-800\)", marginBottom: "16px" \}\}>💰 KPIs Financieros<\/h3>[\s\S]*?<h3 style=\{\{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 700, color: "var\(--slate-800\)", marginBottom: "16px" \}\}>📦 KPIs de Gestión Operativa<\/h3>[\s\S]*?<div style=\{\{ display: "grid", gridTemplateColumns: "repeat\(auto-fit, minmax\(280px, 1fr\)\)", gap: "20px" \}\}>/;

const newOperativeKpis = `<h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--slate-800)", marginBottom: "16px" }}>📦 Estado Físico del Inventario (Global)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            
            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>📦</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>{totalUnidadesInventario}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Total Unidades Físicas
                  <span title="Suma total de todas las dosis de todos los ítems almacenados." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "12px", position: "relative" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: itemsAgotados > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)", color: itemsAgotados > 0 ? "#ef4444" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{itemsAgotados > 0 ? "🛑" : "✅"}</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: itemsAgotados > 0 ? "#ef4444" : "var(--slate-900)", lineHeight: 1 }}>{itemsAgotados}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ítems Agotados (Stock 0)
                  <span title="Medicamentos que no tienen ninguna dosis disponible actualmente." style={{cursor: "help", fontSize: "14px"}}>ⓘ</span>
                </div>
              </div>
            </div>`;

content = content.replace(kpiGridRegex, newOperativeKpis);

// 3. Remove the ending div of the financial KPIs section which is now hanging.
// Wait, the regex replaced from 💰 KPIs Financieros down to the start of the Operative Grid.
// The structure was: 
// <div style={{ marginBottom: "24px" }}> <h3 💰> ... </div> </div>
// <div style={{ marginBottom: "40px" }}> <h3 📦> ... <div grid>

// Let's ensure the HTML brackets match.
// I will just read the file and replace the whole KPIs Grid block.
