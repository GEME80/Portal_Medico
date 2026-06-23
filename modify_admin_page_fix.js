const fs = require('fs');
const file = '/Users/germanmorales/.gemini/antigravity/scratch/dr-carlos-torres-portal/app/[slug]/admin/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `}</div>\n      </div>\n    </>\n  );\n}`,
  ``
);

fs.writeFileSync(file, content);
