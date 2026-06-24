const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/DashboardCharts.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace topItems sorting
const topItemsRegex = /const topItems = useMemo\(\(\) => \{[\s\S]*?\}, \[movimientos, inventario, selectedYear\]\);/;
const newTopItems = `const topItems = useMemo(() => {
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
  }, [movimientos, inventario, selectedYear]);`;

content = content.replace(topItemsRegex, newTopItems);

// Replace UI for Top 5
const top5UIRegex = /<h3 style=\{\{ fontSize: "15px", fontWeight: 700, color: "var\(--slate-700\)", marginBottom: "20px" \}\}>Top 5 Ítems Más Rentables \(\{selectedYear\}\)<\/h3>[\s\S]*?<\/div>\n          \)\}\n        <\/div>/;

const newTop5UI = `<h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)", marginBottom: "20px" }}>Top 5 Ítems Mayor Rotación ({selectedYear})</h3>
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
        </div>`;

content = content.replace(top5UIRegex, newTop5UI);

fs.writeFileSync(file, content);
console.log("Top 5 updated successfully");
