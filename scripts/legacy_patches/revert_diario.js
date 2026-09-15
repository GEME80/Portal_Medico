const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/inventario/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove state
content = content.replace(/const \[activeTab, setActiveTab\] = useState<"catalogo" \| "categorias" \| "diario">/, 'const [activeTab, setActiveTab] = useState<"catalogo" | "categorias">');
content = content.replace(/  const \[diarioMonth, setDiarioMonth\] = useState<string>\(new Date\(\)\.toISOString\(\)\.slice\(0, 7\)\);\n/, '');

// 2. Remove Tab button
content = content.replace(/<button \n\s*className=\{\`tab-btn \$\{activeTab === "diario" \? "active" : ""\}\`\}[\s\S]*?<\/button>\n/, '');

// 3. Remove content
content = content.replace(/\{activeTab === "diario" && \([\s\S]*?\}\n        \)\}\n\n        \{\/\* MODAL NUEVA CATEGORIA \*\/\}/, '{/* MODAL NUEVA CATEGORIA */}');

fs.writeFileSync(file, content);
console.log("Diario view removed successfully");
