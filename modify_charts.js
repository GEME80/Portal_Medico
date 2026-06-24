const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/DashboardCharts.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add selected category state
const selectedYearStateRegex = /const \[selectedYear, setSelectedYear\] = useState<number>\(currentYear\);/;
content = content.replace(selectedYearStateRegex, `const [selectedYear, setSelectedYear] = useState<number>(currentYear);\n  const [selectedCatPie, setSelectedCatPie] = useState<string>("all");`);

// 2. Add chartDataParticipacionItems logic
const chartDataCategoriasValorRegex = /\/\/ 2\. Gráfica: Distribución de Categorías en Inventario Actual \(Valor Potencial\)[\s\S]*?return categorias\.map\(c => \(\{[\s\S]*?\}\)\)\.filter\(c => c\.value > 0\);\n  \}, \[inventario, categorias, primaryColor\]\);/g;

const newPieLogic = `// 2. Gráfica: Participación de Ítems (Volumen de Aplicación)
  const chartDataParticipacionItems = useMemo(() => {
    const dataMap: Record<string, { name: string, value: number, color: string }> = {};
    
    // Asignar colores aleatorios o predefinidos a los ítems (usaremos la paleta de la categoría o algo similar)
    const itemColors = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

    movimientos.forEach(m => {
      const d = new Date(m.fecha);
      if (d.getFullYear() === selectedYear && m.tipo_movimiento === "SALIDA" && (!m.motivo || !m.motivo.startsWith("MERMA"))) {
        const item = inventario.find(i => i.id === m.item_id);
        if (item) {
          // Filtrar por categoría seleccionada si no es "all"
          if (selectedCatPie !== "all" && item.categoria_id !== selectedCatPie) return;

          if (!dataMap[item.id]) {
            dataMap[item.id] = { 
              name: item.nombre, 
              value: 0, 
              color: itemColors[Object.keys(dataMap).length % itemColors.length] 
            };
          }
          dataMap[item.id].value += m.cantidad;
        }
      }
    });

    return Object.values(dataMap).sort((a, b) => b.value - a.value);
  }, [movimientos, inventario, selectedYear, selectedCatPie]);`;

content = content.replace(chartDataCategoriasValorRegex, newPieLogic);

// 3. Update Pie Chart UI
const pieUIOriginalRegex = /\{\/\* Distribución Actual \*\/\}[\s\S]*?\{\/\* Top Items Table \*\/\}/;

const newPieUI = `{/* Participación de Ítems */}
        <div className="card" style={{ padding: "24px", background: "white", borderRadius: "16px", border: "1px solid var(--slate-200)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--slate-700)" }}>Participación por Ítem (Volumen)</h3>
            <select 
              className="form-select" 
              style={{ fontSize: "12px", padding: "4px 8px" }}
              value={selectedCatPie}
              onChange={(e) => setSelectedCatPie(e.target.value)}
            >
              <option value="all">Todas las Categorías</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          
          <div style={{ height: "250px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
            {chartDataParticipacionItems.length === 0 ? (
               <div style={{ color: "var(--slate-400)", fontSize: "13px" }}>Sin datos de aplicación en este año para la selección</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDataParticipacionItems} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartDataParticipacionItems.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: any) => \`\${val} aplicados\`} />
                  <Legend iconType="circle" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Items Table */}`;

content = content.replace(pieUIOriginalRegex, newPieUI);

fs.writeFileSync(file, content);
console.log("Charts updated successfully");
