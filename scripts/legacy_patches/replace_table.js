const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/inventario/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const tableRegex = /<table className="inv-table">[\s\S]*?<\/table>/;

const newTable = `<table className="inv-table">
              <caption>Inventario de vacunas — {filtered.length} registros</caption>
              <thead>
                <tr>
                  <th scope="col">Vacuna</th>
                  <th scope="col">Lote Activo</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Mín.</th>
                  <th scope="col">Estado</th>
                  <th scope="col">P. Unitario Compra</th>
                  <th scope="col">P. Unitario Venta</th>
                  <th scope="col">P. Total Compra</th>
                  <th scope="col" style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => {
                  const status = getStockStatus(v);
                  // Calculate P. Total Compra summing all active lotes (cantidad * precio_compra).
                  let pTotalCompra = 0;
                  let pUnitarioCompra = parseInt(v.valorMayorista || "0");
                  
                  if (v.lotes && v.lotes.length > 0) {
                     // Find active lotes (cantidad > 0)
                     const lotesActivos = v.lotes.filter(l => l.cantidad > 0);
                     if (lotesActivos.length > 0) {
                        pTotalCompra = lotesActivos.reduce((acc, l) => acc + (l.cantidad * parseInt(l.precioCompra || "0")), 0);
                        // The reference unitario compra could be the last added lote price
                        pUnitarioCompra = parseInt(lotesActivos[0].precioCompra || "0");
                     } else {
                        // If no lotes explicitly active but stock is > 0 (data inconsistency fallback)
                        pTotalCompra = v.stockActual * pUnitarioCompra;
                        pUnitarioCompra = parseInt(v.lotes[0].precioCompra || "0");
                     }
                  } else {
                     pTotalCompra = v.stockActual * pUnitarioCompra;
                  }

                  return (
                    <tr key={v.id}>
                      <td>
                        <div className="vaccine-name-cell">
                          <span className="vaccine-name-main">{v.nombre}</span>
                          <span className="vaccine-name-generic">{categorias.find(c => c.id === v.categoria_id)?.nombre || "Sin Categoría"}</span>
                        </div>
                      </td>
                      <td>
                        {v.loteActivo === "—"
                          ? <span style={{ color: "var(--slate-400)", fontSize: "12px" }}>Sin lote</span>
                          : <span className="lot-badge" style={{ background: \`\${accentColor}22\`, color: primaryColor, cursor: "pointer" }} onClick={() => openLoteModal(v.id)} title="Ver detalles y lotes">{v.loteActivo}</span>
                        }
                      </td>
                      <td>
                        <div className="stock-cell">
                          <span className="stock-number" style={{
                            color: status === "critical" ? "var(--rose-500)" : status === "low" ? "#b45309" : primaryColor
                          }}>{v.stockActual}</span>
                          <span className="stock-min">dosis</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--slate-500)", fontSize: "13px" }}>{v.stockMinimo}</td>
                      <td>
                        <span className={\`stock-chip \${stockChipClass[status]}\`}>
                          {stockChipLabel[status]}
                        </span>
                      </td>
                      <td style={{ color: "var(--slate-500)" }}>
                        \${pUnitarioCompra.toLocaleString("es-CO")}
                      </td>
                      <td style={{ fontWeight: 700, color: primaryColor }}>
                        \${parseInt(v.precioVenta || "0").toLocaleString("es-CO")}
                      </td>
                      <td style={{ fontWeight: 700, color: "var(--slate-700)" }}>
                        \${pTotalCompra.toLocaleString("es-CO")}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-row" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="action-btn action-btn-emerald"
                            onClick={() => openLoteModal(v.id)}
                            title="Agregar nuevo lote de dosis o ver historial"
                            type="button"
                          >
                            ＋ Lote
                          </button>
                          <button
                            className="action-btn action-btn-primary"
                            onClick={() => openUsarModal(v.id)}
                            disabled={v.stockActual === 0}
                            style={v.stockActual > 0 ? { background: primaryColor } : undefined}
                            title={v.stockActual === 0 ? "Sin stock disponible" : "Registrar una dosis aplicada"}
                            type="button"
                          >
                            💉 Usar
                          </button>
                          <button
                            className="action-btn action-btn-danger"
                            onClick={() => openMermaModal(v.id)}
                            disabled={v.stockActual === 0}
                            style={v.stockActual > 0 ? { background: "#ef4444", color: "white" } : undefined}
                            title={v.stockActual === 0 ? "Sin stock disponible" : "Registrar pérdida o merma"}
                            type="button"
                          >
                            🗑️ Merma
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>`;

if (tableRegex.test(code)) {
    code = code.replace(tableRegex, newTable);
    fs.writeFileSync(file, code);
    console.log("Success replacing table");
} else {
    console.log("Regex did not match");
}
