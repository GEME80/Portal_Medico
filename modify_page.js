const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/inventario/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update handleNuevaVacuna to insert categoria_id from newForm
content = content.replace(
  `categoria_id: categorias.length > 0 ? categorias[0].id : null, // Default to first category if available`,
  `categoria_id: newForm.categoria_id || (categorias.length > 0 ? categorias[0].id : null),`
);

content = content.replace(
  `setNewForm({ nombre: "", nombreGenerico: "", laboratorio: "", enfermedad: "", viaAdmin: "Intramuscular", esquemaDosis: "", stockMinimo: "5", precioVenta: "", temperatura: "2-8°C", descripcion: "" });`,
  `setNewForm({ categoria_id: "", nombre: "", nombreGenerico: "", laboratorio: "", enfermedad: "", viaAdmin: "", esquemaDosis: "", stockMinimo: "5", precioVenta: "", temperatura: "Temperatura ambiente", descripcion: "" });`
);

// 2. Filter update
content = content.replace(
  `const filtered = vacunas.filter(v =>`,
  `const filtered = vacunas.filter(v =>\n    (selectedCategoryFilter === "all" || v.categoria_id === selectedCategoryFilter) &&`
);

// 3. Category selector in UI near search
const searchInputStr = `<input
                type="search"
                id="search-vacunas"
                placeholder="Buscar por nombre o laboratorio..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input"
                style={{ width: "260px" }}
                aria-label="Buscar ítems"
              />`;

const searchInputReplace = `<div style={{ display: "flex", gap: "12px" }}>
              <select
                className="form-select"
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                style={{ width: "200px", padding: "8px 12px" }}
              >
                <option value="all">Todas las Categorías</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              ${searchInputStr}
              </div>`;
content = content.replace(searchInputStr, searchInputReplace);

// 4. Update Categories UI to replace the buttons
const catUIStr = `<button 
                className="btn btn-primary"
                onClick={() => addToast("Funcionalidad de agregar categoría en desarrollo", "info")}
              >
                ＋ Nueva Categoría
              </button>`;
content = content.replace(catUIStr, `<button className="btn btn-primary" onClick={openNewCategoria}>＋ Nueva Categoría</button>`);

const catCardStr = `<div key={c.id} className="card" style={{ padding: "20px", borderLeft: \`4px solid \${c.color || primaryColor}\` }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--slate-900)" }}>{c.nombre}</h3>
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--slate-500)" }}>
                    {vacunas.filter(v => v.categoria_id === c.id).length} ítems en esta categoría
                  </div>
                </div>`;
const catCardReplace = `<div key={c.id} className="card" style={{ padding: "20px", borderLeft: \`4px solid \${c.color || primaryColor}\`, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--slate-900)" }}>{c.nombre}</h3>
                      <button type="button" onClick={() => openEditCategoria(c)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px" }} title="Editar categoría">✏️</button>
                    </div>
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--slate-500)", marginBottom: "20px" }}>
                      {vacunas.filter(v => v.categoria_id === c.id).length} ítems en esta categoría
                    </div>
                  </div>
                  <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", fontSize: "13px" }} onClick={() => openNewItemForCategory(c.id)}>
                    ➕ Añadir Ítem
                  </button>
                </div>`;
content = content.replace(catCardStr, catCardReplace);

// 5. Update Nuevo Item modal inputs: add select, remove required from optional
content = content.replace(
  `<div className="form-group">
                <label className="form-label" htmlFor="nombre">Nombre comercial <span className="required-mark">*</span></label>`,
  `<div className="form-group full-width">
                <label className="form-label" htmlFor="categoria_id">Categoría <span className="required-mark">*</span></label>
                <select id="categoria_id" name="categoria_id" className="form-select" value={newForm.categoria_id} onChange={handleNewFormChange} required>
                  <option value="" disabled>Seleccione una categoría...</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="nombre">Nombre comercial <span className="required-mark">*</span></label>`
);

content = content.replace(/Enfermedad que previene <span className="required-mark">\*<\/span>/, 'Enfermedad que previene');
content = content.replace(/required placeholder="ej: Hepatitis B crónica"/, 'placeholder="ej: Hepatitis B crónica"');

content = content.replace(/Vía de administración <span className="required-mark">\*<\/span>/, 'Vía de administración');
content = content.replace(/value={newForm.viaAdmin} onChange={handleNewFormChange} required>/, 'value={newForm.viaAdmin} onChange={handleNewFormChange}> <option value="">No aplica</option>');

content = content.replace(/Esquema de dosis <span className="required-mark">\*<\/span>/, 'Esquema de dosis');
content = content.replace(/required placeholder="ej: 3 dosis: 2, 4, 6 meses"/, 'placeholder="ej: 3 dosis: 2, 4, 6 meses"');

// 6. Append the Categorias Modal at the very end before closing the main fragment
const catModalStr = `
      {/* ═══════════════════════════════════════════════════════════
          MODAL: CATEGORÍA
      ═══════════════════════════════════════════════════════════ */}
      <dialog ref={catRef} id="modal-categoria" aria-labelledby="dialog-cat-title">
        <div className="modal-header">
          <div>
            <div className="modal-title" id="dialog-cat-title">{catForm.id ? "✏️ Editar Categoría" : "➕ Nueva Categoría"}</div>
            <div className="modal-subtitle">Organiza tu inventario en secciones lógicas</div>
          </div>
          <button className="modal-close" onClick={() => catRef.current?.close()} type="button" aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSaveCategoria} noValidate>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label" htmlFor="cat-nombre">Nombre de la Categoría <span className="required-mark">*</span></label>
                <input id="cat-nombre" name="nombre" type="text" className="form-input"
                  value={catForm.nombre} onChange={handleCatChange}
                  required placeholder="ej: Sueros, Insumos Odontológicos..."
                  autoComplete="off" />
              </div>
              <div className="form-group full-width">
                <label className="form-label" htmlFor="cat-color">Color representativo</label>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <input id="cat-color" name="color" type="color" 
                    value={catForm.color} onChange={handleCatChange}
                    style={{ width: "40px", height: "40px", padding: "0", border: "none", cursor: "pointer", borderRadius: "8px" }} />
                  <span style={{ fontSize: "13px", color: "var(--slate-500)" }}>Elige un color para identificar esta categoría.</span>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => catRef.current?.close()}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ background: primaryColor }}>
              ✓ Guardar Categoría
            </button>
          </div>
        </form>
      </dialog>
`;

content = content.replace(`{/* TOASTS */}`, `${catModalStr}\n      {/* TOASTS */}`);

fs.writeFileSync(file, content);
console.log("Replaced correctly");
