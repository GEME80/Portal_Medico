const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/inventario/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add references and state for Merma
const stateRegex = /const usarRef = useRef<HTMLDialogElement>\(null\);/g;
content = content.replace(stateRegex, `const usarRef = useRef<HTMLDialogElement>(null);\n  const mermaRef = useRef<HTMLDialogElement>(null);\n  const [mermaCantidad, setMermaCantidad] = useState(1);\n  const [mermaMotivo, setMermaMotivo] = useState("Vencimiento");`);

// 2. Add open handler
const openUsarRegex = /const openUsarModal = \(id: string\) => \{[\s\S]*?\};/g;
content = content.replace(openUsarRegex, (match) => {
  return match + `\n\n  const openMermaModal = (id: string) => {
    setSelectedId(id);
    const v = vacunas.find(x => x.id === id);
    setSelectedVacuna(v || null);
    setMermaCantidad(1);
    setMermaMotivo("MERMA - Vencimiento");
    mermaRef.current?.showModal();
  };`;
});

// 3. Add submit handler (handleRegistrarMerma)
const handleUsarRegex = /const handleUsarDosis = async \(e: React\.FormEvent\) => \{[\s\S]*?\n  \};\n/g;
content = content.replace(handleUsarRegex, (match) => {
  return match + `\n  const handleRegistrarMerma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !selectedVacuna || mermaCantidad <= 0) return;
    try {
      const { error: movErr } = await supabase.from("movimientos_inventario").insert({
        tenant_id: tenantId,
        item_id: selectedId,
        tipo_movimiento: "SALIDA",
        cantidad: mermaCantidad,
        motivo: mermaMotivo,
        notas: \`Registro de merma/desperdicio. Stock afectado: \${mermaCantidad}\`,
        fecha: today(),
        valor_unitario_cobrado: 0 // La merma no genera ingreso
      });

      if (movErr) throw movErr;

      const currentStock = selectedVacuna?.stockActual || 0;
      const newStock = Math.max(0, currentStock - mermaCantidad);
      
      const { error: updErr } = await supabase
        .from("inventario_medico")
        .update({ stock_actual: newStock })
        .eq("id", selectedId);

      if (updErr) throw updErr;

      mermaRef.current?.close();
      addToast(\`Merma registrada correctamente (\${mermaCantidad} unidades).\`);
      await loadData(tenantId);
    } catch (err: any) {
      console.error(err);
      addToast("Error al registrar merma: " + err.message, "error");
    }
  };\n`;
});

// 4. Add the button in the action-row
const actionRowRegex = /<button\s*className="action-btn action-btn-primary"\s*onClick=\{\(\) => openUsarModal\(v\.id\)\}\s*disabled=\{v\.stockActual === 0\}\s*title="Registrar aplicación de dosis"\s*type="button"\s*>\s*💉 Usar\s*<\/button>/g;
content = content.replace(actionRowRegex, (match) => {
  return match + `\n                          <button
                            className="action-btn"
                            style={{ background: "transparent", border: "1px solid #ef4444", color: "#dc2626" }}
                            onClick={() => openMermaModal(v.id)}
                            disabled={v.stockActual === 0}
                            title="Registrar merma o desperdicio"
                            type="button"
                          >
                            🗑 Merma
                          </button>`;
});

// 5. Add the Dialog HTML at the end before </main>
const dialogRegex = /<\/main>/g;
content = content.replace(dialogRegex, `
      {/* MODAL REGISTRAR MERMA */}
      <dialog ref={mermaRef} id="dialog-registrar-merma" className="confirm-dialog" aria-labelledby="dialog-merma-title" style={{ margin: "auto" }}>
        <div className="modal-header">
          <h3 id="dialog-merma-title" style={{ color: "#dc2626" }}>Registrar Merma / Desperdicio</h3>
          <button type="button" className="modal-close" onClick={() => mermaRef.current?.close()}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: "16px", color: "var(--slate-600)", fontSize: "14px", lineHeight: "1.5" }}>
            Vas a registrar una pérdida de inventario para <strong>{selectedVacuna?.nombre}</strong>. Esta acción descontará unidades del stock actual pero no registrará ingresos.
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--slate-50)", padding: "16px", borderRadius: "8px", border: "1px solid var(--slate-200)" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--slate-800)" }}>{selectedVacuna?.stockActual}</div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>Stock actual</div>
            </div>
            <div style={{ color: "var(--slate-400)", padding: "0 10px" }}>→</div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "#dc2626" }}>
                {Math.max(0, (selectedVacuna?.stockActual || 0) - mermaCantidad)}
              </div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", fontWeight: 600 }}>Después de merma</div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "16px" }}>
            <label>Cantidad a desechar</label>
            <input
              type="number"
              className="form-input"
              value={mermaCantidad}
              onChange={(e) => setMermaCantidad(parseInt(e.target.value) || 1)}
              min="1"
              max={selectedVacuna?.stockActual || 1}
            />
          </div>

          <div className="form-group" style={{ marginTop: "16px" }}>
            <label>Motivo de la merma</label>
            <select
              className="form-input"
              value={mermaMotivo}
              onChange={(e) => setMermaMotivo(e.target.value)}
            >
              <option value="MERMA - Vencimiento">Vencimiento de Lote</option>
              <option value="MERMA - Cadena de frío">Ruptura de Cadena de Frío</option>
              <option value="MERMA - Daño físico">Daño Físico / Ruptura</option>
              <option value="MERMA - Otro">Otro Motivo</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={() => mermaRef.current?.close()}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: "#dc2626", borderColor: "#dc2626" }}
            onClick={handleRegistrarMerma}
          >
            Registrar Merma
          </button>
        </div>
      </dialog>
</main>`);

fs.writeFileSync(file, content);
console.log("Merma logic injected successfully");
