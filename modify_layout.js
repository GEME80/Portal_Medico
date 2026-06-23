const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/inventario/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Move Alertas section
const alertasRegex = /\{\/\* ── ALERTAS DE REORDEN ────────────────────────────────── \*\/\}[\s\S]*?🔔 Alertas de Reorden[\s\S]*?(?:<\/div>\s*<\/div>\s*\)\s*\}\s*<\/div>\s*\)\s*\}\s*<\/>)/;
// Wait, the regex might be tricky since there's nested divs. 
// It's better to find the start and end carefully.
