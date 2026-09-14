const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'setAiAnalysis("Failed to analyze data.");',
  'setAiAnalysis(data.error || "Failed to analyze data.");'
);

content = content.replace(
  'setAiAnalysis("Error connecting to AI Coach.");',
  'setAiAnalysis(err instanceof Error ? err.message : "Error connecting to AI Coach.");'
);

fs.writeFileSync(file, content);
