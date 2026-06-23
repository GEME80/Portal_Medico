const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
content = content.replace(
  `import { notFound } from "next/navigation";`,
  `import { notFound } from "next/navigation";\nimport DashboardCharts from "./DashboardCharts";`
);

// 2. Add queries for categorias and movimientos
const queriesToReplace = `  // Fetch all items to accurately calculate low stock (stock_actual <= stock_minimo)
  const { data: inventarioData } = await supabase
    .from("inventario_medico")
    .select("stock_actual, stock_minimo, precio_venta")
    .eq("tenant_id", tenant.id);`;

const newQueries = `  // Fetch all items, categories and movements
  const [inventarioRes, categoriasRes, movimientosRes] = await Promise.all([
    supabase.from("inventario_medico").select("*").eq("tenant_id", tenant.id),
    supabase.from("categorias_inventario").select("*").eq("tenant_id", tenant.id),
    supabase.from("movimientos_inventario").select("*").eq("tenant_id", tenant.id)
  ]);
  
  const inventarioData = inventarioRes.data || [];
  const categoriasData = categoriasRes.data || [];
  const movimientosData = movimientosRes.data || [];`;

content = content.replace(queriesToReplace, newQueries);

// 3. Update KPI calculation
const kpiCalcOld = `  let stockCriticoCount = 0;
  let valorInventario = 0;
  if (inventarioData) {
    inventarioData.forEach(item => {
      if (item.stock_actual <= item.stock_minimo) stockCriticoCount++;
      valorInventario += (item.stock_actual * (item.precio_venta || 0));
    });
  }`;

const kpiCalcNew = `  let stockCriticoCount = 0;
  let capitalInvertido = 0;
  let ingresoPotencial = 0;
  
  inventarioData.forEach(item => {
    if (item.stock_actual <= item.stock_minimo) stockCriticoCount++;
    capitalInvertido += (item.stock_actual * (item.valor_mayorista || 0));
    ingresoPotencial += (item.stock_actual * (item.precio_venta || 0));
  });
  const utilidadProyectada = ingresoPotencial - capitalInvertido;`;

content = content.replace(kpiCalcOld, kpiCalcNew);

// 4. Update JSX logic: replace the modules and KPIs
const oldJsxStart = `<div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>📦</div>`;

const newJsx = `<div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>💸</div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>$\{(capitalInvertido/1000000).toFixed(1)}M</div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Capital Invertido</div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(14, 165, 233, 0.1)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>💰</div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>$\{(ingresoPotencial/1000000).toFixed(1)}M</div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ingreso Potencial</div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>📈</div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--slate-900)", lineHeight: 1 }}>$\{(utilidadProyectada/1000000).toFixed(1)}M</div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Utilidad Proyectada</div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px", border: stockCriticoCount > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: stockCriticoCount > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(34, 197, 94, 0.1)", color: stockCriticoCount > 0 ? "#f59e0b" : "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>{stockCriticoCount > 0 ? "⚠️" : "✅"}</div>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: stockCriticoCount > 0 ? "#d97706" : "var(--slate-900)", lineHeight: 1 }}>{stockCriticoCount}</div>
              <div style={{ fontSize: "12px", color: "var(--slate-500)", marginTop: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ítems en Riesgo</div>
            </div>
          </div>
        </div>

        <DashboardCharts 
          inventario={inventarioData}
          categorias={categoriasData}
          movimientos={movimientosData}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      </div>
    </>
  );
}`;

const endOfFileRegex = /<div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>[\s\S]*?(?=<\/div>\s*<\/div>\s*<\/>\s*\);\s*\})/g;

content = content.replace(endOfFileRegex, newJsx);

// Clean up unused 'modules' and 'noticias_posts'
content = content.replace(/const \{ count: totalNoticias \} = await supabase[\s\S]*?\.eq\("publicado", true\);/, "");
content = content.replace(/const modules = \[[\s\S]*?\];/, "");

fs.writeFileSync(file, content);
console.log("Admin Dashboard replaced successfully.");
