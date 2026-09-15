const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the "Ver Auditoría" link
content = content.replace(/<div style=\{\{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" \}\}>\n          <Link href=\{\`\/\$\{slug\}\/admin\/inventario\`\}[\s\S]*?<\/Link>\n        <\/div>/, '');

fs.writeFileSync(file, content);
console.log("Admin link removed successfully");
