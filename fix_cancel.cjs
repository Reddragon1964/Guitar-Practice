const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace all instances of `resetPracticeForm();` where we don't explicitly pass true/false
content = content.replace(/resetPracticeForm\(\);/g, 'resetPracticeForm(false);');

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Fixed cancels');
