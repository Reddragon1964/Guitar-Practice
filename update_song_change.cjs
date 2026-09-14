const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetFunction = `  const resetPracticeForm = () => {`;
const insertFunction = `  const handleSongTitleChange = (newTitle: string) => {
    setSongTitle(newTitle);
    if (!editingPracticeId) {
      const lastPractice = practices.find(p => p.songTitle === newTitle);
      if (lastPractice) {
        setDifficulty(lastPractice.difficulty);
        setTotalNotes(lastPractice.totalNotes.toString());
        setSpeed(lastPractice.speed.toString());
      } else {
        setDifficulty(1);
        setTotalNotes("");
        setSpeed("");
      }
    }
  };

  const resetPracticeForm = () => {`;

content = content.replace(targetFunction, insertFunction);

const targetSelect = `<Select required value={songTitle} onChange={e => setSongTitle(e.target.value)}>`;
const insertSelect = `<Select required value={songTitle} onChange={e => handleSongTitleChange(e.target.value)}>`;

content = content.replace(targetSelect, insertSelect);

fs.writeFileSync(file, content);
console.log("Updated Dashboard.tsx");
