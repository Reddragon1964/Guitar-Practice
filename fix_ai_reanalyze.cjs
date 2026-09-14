const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetFunc = `const handleAnalyze = async () => {
    setView("ai-analysis");
    if (aiAnalysis) return; // Already analyzed`;

const newFunc = `const handleAnalyze = async (force = false) => {
    setView("ai-analysis");
    if (aiAnalysis && !force) return; // Already analyzed`;

content = content.replace(targetFunc, newFunc);

const targetBtn = `<Button variant="outline" onClick={() => { setAiAnalysis(""); handleAnalyze(); }} className="gap-2">`;
const newBtn = `<Button variant="outline" onClick={() => { handleAnalyze(true); }} className="gap-2">`;

content = content.replace(targetBtn, newBtn);

fs.writeFileSync(file, content);
console.log("Fixed handleAnalyze");
