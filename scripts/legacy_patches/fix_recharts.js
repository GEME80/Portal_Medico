const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/DashboardCharts.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/formatter=\{\(val: number\)/g, 'formatter={(val: any)');
fs.writeFileSync(file, content);
