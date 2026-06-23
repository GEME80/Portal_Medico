const fs = require('fs');

// 1. UPDATE PAGE.TSX
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/inventario/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// A. Add state for cobrarMayorista
content = content.replace(
  `const [dosisNotas, setDosisNotas] = useState("");`,
  `const [dosisNotas, setDosisNotas] = useState("");\n  const [cobrarMayorista, setCobrarMayorista] = useState(false);`
);

// B. Reset state on openUsarModal
content = content.replace(
  `setDosisNotas("");`,
  `setDosisNotas("");\n    setCobrarMayorista(false);`
);

// C. Update handleUsarDosis insert
content = content.replace(
  `tenant_id: tenantId, item_id: selectedId, tipo_movimiento: "SALIDA", cantidad: 1, notas: dosisNotas, fecha: today()`,
  `tenant_id: tenantId, item_id: selectedId, tipo_movimiento: "SALIDA", cantidad: 1, notas: dosisNotas + (cobrarMayorista ? " [PRECIO MAYORISTA]" : ""), fecha: today(), valor_unitario_cobrado: cobrarMayorista ? selectedVacuna.valorMayorista : selectedVacuna.precioVenta`
);

// D. Add styles to dialog to center it
content = content.replace(
  `<dialog ref={usarRef} id="modal-usar" aria-labelledby="dialog-usar-title">`,
  `<dialog ref={usarRef} id="modal-usar" aria-labelledby="dialog-usar-title" style={{ margin: "auto", position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>`
);

// E. Add checkbox to form
const notasFormGroup = `<div className="form-group full-width">
                <label className="form-label" htmlFor="dosisNotas">Notas (opcional)</label>
                <input id="dosisNotas" name="notas" type="text" className="form-input"
                  value={dosisNotas} onChange={e => setDosisNotas(e.target.value)}
                  placeholder="ej: Aplicado en brazo izquierdo" autoComplete="off" />
              </div>`;
const checkboxUi = `<div className="form-group full-width" style={{ marginTop: "12px", padding: "12px", background: "var(--slate-50)", borderRadius: "8px", border: "1px solid var(--slate-200)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", fontWeight: 600, color: "var(--slate-700)" }}>
                  <input type="checkbox" checked={cobrarMayorista} onChange={(e) => setCobrarMayorista(e.target.checked)} style={{ width: "18px", height: "18px", accentColor: primaryColor }} />
                  Cobrar precio mayorista (Costo)
                </label>
                <div style={{ fontSize: "12px", color: "var(--slate-500)", marginLeft: "28px", marginTop: "4px" }}>
                  Al marcar esta opción, el ingreso registrado será el valor mayorista base (${\`\${parseInt(selectedVacuna?.valorMayorista || "0").toLocaleString("es-CO")}\`}) en lugar del precio de venta final (${\`\${parseInt(selectedVacuna?.precioVenta || "0").toLocaleString("es-CO")}\`}).
                </div>
              </div>`;

content = content.replace(notasFormGroup, `${notasFormGroup}\n              ${checkboxUi}`);

fs.writeFileSync(file, content);

// 2. UPDATE DASHBOARDCHARTS.TSX
const file2 = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/DashboardCharts.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

// Update income calc in Rendimiento graph
content2 = content2.replace(
  `data[monthIndex].cobrado += (item.precio_venta || 0) * m.cantidad;`,
  `data[monthIndex].cobrado += (m.valor_unitario_cobrado !== undefined && m.valor_unitario_cobrado !== null ? Number(m.valor_unitario_cobrado) : (item.precio_venta || 0)) * m.cantidad;`
);

// Update income calc in Top Items
content2 = content2.replace(
  `itemsMap[item.id].ingresos += (item.precio_venta || 0) * m.cantidad;`,
  `itemsMap[item.id].ingresos += (m.valor_unitario_cobrado !== undefined && m.valor_unitario_cobrado !== null ? Number(m.valor_unitario_cobrado) : (item.precio_venta || 0)) * m.cantidad;`
);

fs.writeFileSync(file2, content2);
console.log("Updated using scripts.");
