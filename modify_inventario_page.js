const fs = require('fs');

const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/inventario/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add sorting logic to filtered array
const oldFiltered = `  const filtered = vacunas.filter(v =>
    (selectedCategoryFilter === "all" || v.categoria_id === selectedCategoryFilter) &&
    (v.nombre.toLowerCase().includes(search.toLowerCase()))
  );`;
const newFiltered = `  const filtered = vacunas.filter(v =>
    (selectedCategoryFilter === "all" || v.categoria_id === selectedCategoryFilter) &&
    (v.nombre.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    const getStatusWeight = (v: any) => {
      const status = getStockStatus(v);
      if (status === "empty") return 0;
      if (status === "low") return 1;
      return 2; // ok
    };
    const weightA = getStatusWeight(a);
    const weightB = getStatusWeight(b);
    if (weightA !== weightB) return weightA - weightB;
    return a.nombre.localeCompare(b.nombre);
  });`;
content = content.replace(oldFiltered, newFiltered);

// 2. Add testing functions
const handleUsarDosisEnd = `      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error al registrar dosis");
    }
  };`;

const testingFunctions = `      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error al registrar dosis");
    }
  };

  const handleGenerarPruebas = async () => {
    if (!confirm("¿Generar datos de prueba para los últimos 6 meses?")) return;
    
    // Obtener los items actuales (independiente del stock para pruebas, o solo los que tienen para no falsear tanto, pero bueno)
    const items = vacunas;
    if (items.length === 0) {
      alert("Debes crear al menos un ítem primero.");
      return;
    }

    try {
      const newMovements = [];
      const todayDate = new Date();
      
      // Generar 30 salidas aleatorias
      for (let i = 0; i < 30; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const randomMonthOffset = Math.floor(Math.random() * 6); // 0 a 5 meses atras
        const testDate = new Date();
        testDate.setMonth(todayDate.getMonth() - randomMonthOffset);
        testDate.setDate(Math.floor(Math.random() * 28) + 1);
        
        newMovements.push({
          tenant_id: tenantId,
          item_id: randomItem.id,
          tipo_movimiento: "SALIDA",
          cantidad: 1,
          notas: "Prueba generada",
          fecha: testDate.toISOString().split("T")[0],
          valor_unitario_cobrado: Math.random() > 0.5 ? randomItem.valorMayorista : randomItem.precioVenta
        });
      }
      
      await supabase.from("movimientos_inventario").insert(newMovements);
      alert("Datos generados. Ve al Dashboard para ver las gráficas.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error al generar pruebas.");
    }
  };

  const handleResetearPruebas = async () => {
    if (!confirm("⚠️ PELIGRO: Esto borrará TODOS los movimientos y dejará el stock en 0. ¿Estás seguro?")) return;
    try {
      await supabase.from("movimientos_inventario").delete().eq("tenant_id", tenantId);
      await supabase.from("inventario_medico").update({ stock_actual: 0 }).eq("tenant_id", tenantId);
      alert("Sistema reseteado a 0.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error al resetear el sistema.");
    }
  };`;
content = content.replace(handleUsarDosisEnd, testingFunctions);

// 3. Add Testing Tools UI in TopBar right
const topBarRight = `<div className="admin-topbar-right">
          {activeTab === "catalogo" && (
            <button className="btn btn-primary" onClick={openAddModal}>
              <span className="btn-icon">+</span> Nuevo Ítem
            </button>
          )}`;
const newTopBarRight = `<div className="admin-topbar-right" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {activeTab === "catalogo" && (
            <>
              <button className="btn btn-outline" style={{ borderColor: "#f59e0b", color: "#d97706" }} onClick={handleGenerarPruebas}>
                🧪 Generar Pruebas
              </button>
              <button className="btn btn-outline" style={{ borderColor: "#ef4444", color: "#dc2626" }} onClick={handleResetearPruebas}>
                🗑 Resetear Todo
              </button>
              <button className="btn btn-primary" onClick={openAddModal}>
                <span className="btn-icon">+</span> Nuevo Ítem
              </button>
            </>
          )}`;
content = content.replace(topBarRight, newTopBarRight);

// 4. Update Table Headers
content = content.replace(`<th scope="col">P. Compra</th>`, `<th scope="col">P. Unitario Compra</th>`);
content = content.replace(`<th scope="col">P. Venta</th>`, `<th scope="col">P. Total Compra</th>\n                  <th scope="col">P. Unitario Venta</th>`);

// 5. Update Table Rows (add total_compra column)
const oldTbodyRegex = /<td className="fw-700" style={{ color: "var\(--slate-700\)" }}>\s*\$\{\(v\.precioVenta \|\| 0\)\.toLocaleString\("es-CO"\)\}\s*<\/td>/g;
content = content.replace(oldTbodyRegex, `<td className="fw-700" style={{ color: "var(--slate-500)" }}>\n                      $\{(v.stockActual * (v.valorMayorista || 0)).toLocaleString("es-CO")}\n                    </td>\n                    <td className="fw-700" style={{ color: "var(--slate-700)" }}>\n                      $\{(v.precioVenta || 0).toLocaleString("es-CO")}\n                    </td>`);

// 6. Fix the "Confirmar — Registrar como Usada" text to "Registrar Aplicación"
content = content.replace(`Confirmar — Registrar como Usada`, `Registrar Aplicación`);

fs.writeFileSync(file, content);
console.log("Inventario page modified successfully");
