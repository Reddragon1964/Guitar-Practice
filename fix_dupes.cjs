const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('    setDuration("");\n    setDuration("");', '    setDuration("");');

fs.writeFileSync(file, content);
