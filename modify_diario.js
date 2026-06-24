const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/inventario/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add month state
content = content.replace(
  /const \[selectedCategoryFilter, setSelectedCategoryFilter\] = useState<string>\("all"\);/,
  `const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");\n  const [diarioMonth, setDiarioMonth] = useState<string>(new Date().toISOString().slice(0, 7));`
);

// Add Tab Button
const tabsRegex = /<button \n\s*className=\{\`tab-btn \$\{activeTab === "categorias" \? "active" : ""\}\`\}[\s\S]*?<\/button>/;
const tabsMatch = content.match(tabsRegex);
if(tabsMatch) {
  content = content.replace(tabsMatch[0], tabsMatch[0] + `\n        <button 
          className={\`tab-btn \${activeTab === "diario" ? "active" : ""}\`} 
          onClick={() => setActiveTab("diario")}
          style={{ padding: "12px 16px", background: "none", border: "none", borderBottom: activeTab === "diario" ? \`2px solid \${primaryColor}\` : "2px solid transparent", color: activeTab === "diario" ? primaryColor : "var(--slate-500)", fontWeight: activeTab === "diario" ? 700 : 500, cursor: "pointer" }}
        >
          📅 Control Diario
        </button>`);
}

// Add Diario Content at the end of the <div className="admin-content">
const contentEndRegex = /\{\/\* MODAL NUEVA CATEGORIA \*\/\}/;

const diarioJSX = `
        {activeTab === "diario" && (
          <div className="card" style={{ padding: "32px", borderRadius: "20px", background: "white", border: "1px solid var(--slate-200)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "20px", fontWeight: 800, color: "var(--slate-900)" }}>
                  Auditoría de Movimientos
                </h2>
                <p style={{ color: "var(--slate-500)", fontSize: "14px", marginTop: "4px" }}>
                  Listado cronológico de entradas, salidas y mermas del mes.
                </p>
              </div>
              <div>
                <input 
                  type="month" 
                  className="form-input" 
                  value={diarioMonth} 
                  onChange={(e) => setDiarioMonth(e.target.value)} 
                />
              </div>
            </div>

            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Ítem</th>
                    <th>Cantidad</th>
                    <th>Motivo / Notas</th>
                    <th>Responsable</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos
                    .filter(m => m.fecha && m.fecha.startsWith(diarioMonth))
                    .sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime() || b.id.localeCompare(a.id))
                    .map(m => {
                      const item = vacunas.find(v => v.id === m.item_id);
                      const isMerma = m.motivo?.startsWith("MERMA");
                      let tipoColor = "";
                      let tipoIcon = "";
                      let tipoText = "";

                      if (m.tipo_movimiento === "ENTRADA") {
                        tipoColor = "#10b981"; tipoIcon = "➕"; tipoText = "ENTRADA";
                      } else if (isMerma) {
                        tipoColor = "#f43f5e"; tipoIcon = "🗑️"; tipoText = "MERMA";
                      } else {
                        tipoColor = "#3b82f6"; tipoIcon = "💉"; tipoText = "APLICACIÓN";
                      }

                      return (
                        <tr key={m.id}>
                          <td style={{ color: "var(--slate-600)", fontWeight: 500 }}>
                            {m.fecha ? new Date(m.fecha).toLocaleDateString("es-ES") : "—"}
                          </td>
                          <td>
                            <span style={{ 
                              display: "inline-flex", alignItems: "center", gap: "6px",
                              padding: "4px 8px", borderRadius: "100px", fontSize: "11px", fontWeight: 700,
                              background: \`\${tipoColor}15\`, color: tipoColor
                            }}>
                              {tipoIcon} {tipoText}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: "var(--slate-800)" }}>{item?.nombre || "Ítem desconocido"}</td>
                          <td style={{ fontWeight: 800, color: tipoColor }}>
                            {m.tipo_movimiento === "ENTRADA" ? "+" : "-"}{m.cantidad}
                          </td>
                          <td style={{ color: "var(--slate-500)", fontSize: "13px" }}>
                            {m.motivo && <strong style={{color: "var(--slate-700)"}}>{m.motivo}: </strong>}
                            {m.notas || "—"}
                          </td>
                          <td style={{ color: "var(--slate-400)", fontSize: "12px" }}>Sistema / Admin</td>
                        </tr>
                      );
                    })}
                  {movimientos.filter(m => m.fecha && m.fecha.startsWith(diarioMonth)).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "40px 0", color: "var(--slate-400)" }}>
                        No hay movimientos registrados en {diarioMonth}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL NUEVA CATEGORIA */}`;

content = content.replace(contentEndRegex, diarioJSX);

fs.writeFileSync(file, content);
console.log("Diario view injected successfully");
