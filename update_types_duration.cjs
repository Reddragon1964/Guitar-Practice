const fs = require('fs');
const file = 'src/types.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'speed: number;',
  'speed: number;\n  duration?: number; // duration in minutes'
);

fs.writeFileSync(file, content);
