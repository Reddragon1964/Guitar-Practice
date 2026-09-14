const fs = require('fs');
const file = 'server.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'res.status(500).json({ error: "Failed to generate analysis." });',
  'res.status(500).json({ error: "Failed to generate analysis. " + String(error) });'
);

fs.writeFileSync(file, content);
