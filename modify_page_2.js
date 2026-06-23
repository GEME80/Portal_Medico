const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/inventario/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update InventarioItem type
content = content.replace(
  `interface InventarioItem {
  id: string;
  categoria_id: string;
  nombre: string;
  nombreGenerico: string;
  laboratorio: string;`,
  `interface InventarioItem {
  id: string;
  categoria_id: string;
  nombre: string;
  valorMayorista?: string;`
);

content = content.replace(
  `nombreGenerico: v.nombre_generico || "",
          laboratorio: v.laboratorio || "",`,
  `valorMayorista: v.valor_mayorista ? String(v.valor_mayorista) : "0",`
);

// 2. Update newForm state
content = content.replace(
  `const [newForm, setNewForm] = useState({
    categoria_id: "", nombre: "", nombreGenerico: "", laboratorio: "", enfermedad: "",
    viaAdmin: "", esquemaDosis: "", stockMinimo: "5",
    precioVenta: "", temperatura: "Temperatura ambiente", descripcion: "",
  });`,
  `const [newForm, setNewForm] = useState({
    categoria_id: "", nombre: "", enfermedad: "", viaAdmin: "",
    esquemaDosis: "", stockMinimo: "5", valorMayorista: "",
    precioVenta: "", temperatura: "2-8°C"
  });`
);

content = content.replace(
  `setNewForm({ categoria_id: "", nombre: "", nombreGenerico: "", laboratorio: "", enfermedad: "", viaAdmin: "", esquemaDosis: "", stockMinimo: "5", precioVenta: "", temperatura: "Temperatura ambiente", descripcion: "" });`,
  `setNewForm({ categoria_id: "", nombre: "", enfermedad: "", viaAdmin: "", esquemaDosis: "", stockMinimo: "5", valorMayorista: "", precioVenta: "", temperatura: "2-8°C" });`
);

// 3. Update handleNuevaVacuna Insert logic
content = content.replace(
  `          nombre: newForm.nombre,
          nombre_generico: newForm.nombreGenerico,
          laboratorio: newForm.laboratorio,
          enfermedad: newForm.enfermedad,
          via_admin: newForm.viaAdmin,
          esquema_dosis: newForm.esquemaDosis,
          stock_minimo: parseInt(newForm.stockMinimo) || 5,
          stock_actual: 0,
          precio_venta: parseFloat(newForm.precioVenta) || 0,
          temperatura: newForm.temperatura,
          descripcion: newForm.descripcion,`,
  `          nombre: newForm.nombre,
          enfermedad: newForm.enfermedad || null,
          via_admin: newForm.viaAdmin || null,
          esquema_dosis: newForm.esquemaDosis || null,
          stock_minimo: parseInt(newForm.stockMinimo) || 5,
          stock_actual: 0,
          valor_mayorista: parseFloat(newForm.valorMayorista) || 0,
          precio_venta: parseFloat(newForm.precioVenta) || 0,
          temperatura: newForm.temperatura,`
);

// 4. Rewrite the new item modal body
const oldBodyRegex = /<div className="modal-body">[\s\S]*?<\/div>\s*<\/div>\s*<div className="modal-footer">/;
const newBody = `<div className="modal-body">
            <div className="form-grid">

              <div className="form-group full-width">
                <label className="form-label" htmlFor="categoria_id">Categoría <span className="required-mark">*</span></label>
                <select id="categoria_id" name="categoria_id" className="form-select" value={newForm.categoria_id} onChange={handleNewFormChange} required>
                  <option value="" disabled>Seleccione una categoría...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="nombre">Nombre comercial <span className="required-mark">*</span></label>
                <input id="nombre" name="nombre" type="text" className="form-input"
                  value={newForm.nombre} onChange={handleNewFormChange}
                  required minLength={2} placeholder="ej: Hepatitis B" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="enfermedad">Enfermedad que previene</label>
                <input id="enfermedad" name="enfermedad" type="text" className="form-input"
                  value={newForm.enfermedad} onChange={handleNewFormChange}
                  placeholder="ej: Hepatitis B crónica" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="viaAdmin">Vía de administración</label>
                <select id="viaAdmin" name="viaAdmin" className="form-select" value={newForm.viaAdmin} onChange={handleNewFormChange}>
                  <option value="">No aplica</option>
                  <option value="Intramuscular">Intramuscular</option>
                  <option value="Subcutánea">Subcutánea</option>
                  <option value="Oral">Oral</option>
                  <option value="Intradérmica">Intradérmica</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="temperatura">Temperatura de almacenamiento</label>
                <select id="temperatura" name="temperatura" className="form-select" value={newForm.temperatura} onChange={handleNewFormChange} required>
                  <option value="2-8°C">2-8°C (Refrigeración)</option>
                  <option value="-15 a -25°C">-15 a -25°C (Congelación)</option>
                  <option value="Temperatura ambiente">Temperatura ambiente</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="esquemaDosis">Esquema de dosis</label>
                <input id="esquemaDosis" name="esquemaDosis" type="text" className="form-input"
                  value={newForm.esquemaDosis} onChange={handleNewFormChange}
                  placeholder="ej: 3 dosis: 2, 4, 6 meses" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="stockMinimo">Stock mínimo de alerta <span className="required-mark">*</span></label>
                <input id="stockMinimo" name="stockMinimo" type="text" inputMode="numeric" pattern="[0-9]*" className="form-input"
                  value={newForm.stockMinimo} onChange={handleNewFormChange}
                  required placeholder="ej: 10" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="valorMayorista">Valor mayorista (Costo) <span className="required-mark">*</span></label>
                <input id="valorMayorista" name="valorMayorista" type="text" inputMode="decimal" className="form-input"
                  value={newForm.valorMayorista} onChange={handleNewFormChange}
                  required placeholder="ej: 30000" autoComplete="off" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="precioVenta">Valor precio de venta <span className="required-mark">*</span></label>
                <input id="precioVenta" name="precioVenta" type="text" inputMode="decimal" className="form-input"
                  value={newForm.precioVenta} onChange={handleNewFormChange}
                  required placeholder="ej: 45000" autoComplete="off" />
              </div>

            </div>
          </div>
          <div className="modal-footer">`;

content = content.replace(oldBodyRegex, newBody);

// 5. Update the table UI to remove laboratorio
content = content.replace(
  `<span className="vaccine-name-generic">{v.laboratorio}</span>`,
  `<span className="vaccine-name-generic">{categorias.find(c => c.id === v.categoria_id)?.nombre || "Sin Categoría"}</span>`
);

// 6. Update the title of the modal
content = content.replace(
  `id="dialog-nueva-title">➕ Registrar Nueva Vacuna</div>`,
  `id="dialog-nueva-title">➕ Registrar Nuevo Ítem</div>`
);

fs.writeFileSync(file, content);
console.log("Replaced successfully.");
