const fs = require('fs');

const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state variables
const stateHookStr = `const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'practice' | 'goal' | 'song', message: string } | null>(null);`;
if (content.includes(stateHookStr)) {
  content = content.replace(stateHookStr, stateHookStr + `\n  const [sessionFilterName, setSessionFilterName] = useState("");\n  const [sessionFilterDate, setSessionFilterDate] = useState("");`);
}

// 2. Add filter logic
const computeFiltered = `
  const filteredPractices = practices.filter(p => {
    const matchName = p.songTitle.toLowerCase().includes(sessionFilterName.toLowerCase());
    const matchDate = sessionFilterDate ? p.date === sessionFilterDate : true;
    return matchName && matchDate;
  });
`;

// Insert it somewhere near the top of the component, or maybe right before the return statement.
const returnStr = `  return (
    <div className="min-h-screen`;
if (content.includes(returnStr)) {
  content = content.replace(returnStr, computeFiltered + '\n' + returnStr);
}

// 3. Add UI and update mapping
const targetTableStr = `<CardContent>
                    <div className="overflow-x-auto">
                      <table`;
const newTableStr = `<CardContent>
                    <div className="mb-4 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Input 
                          placeholder="Filter by song name..." 
                          value={sessionFilterName} 
                          onChange={(e) => setSessionFilterName(e.target.value)}
                        />
                      </div>
                      <div className="sm:w-48">
                        <Input 
                          type="date" 
                          value={sessionFilterDate} 
                          onChange={(e) => setSessionFilterDate(e.target.value)}
                        />
                      </div>
                      {(sessionFilterName || sessionFilterDate) && (
                        <Button variant="ghost" onClick={() => { setSessionFilterName(''); setSessionFilterDate(''); }}>
                          Clear
                        </Button>
                      )}
                    </div>
                    <div className="overflow-x-auto">
                      <table`;

if (content.includes(targetTableStr)) {
  content = content.replace(targetTableStr, newTableStr);
}

// 4. Update the mapping from `practices.map` to `filteredPractices.map`
const mapStr = `<tbody>
                          {practices.map((p) => (`;
const newMapStr = `<tbody>
                          {filteredPractices.map((p) => (`;

if (content.includes(mapStr)) {
  content = content.replace(mapStr, newMapStr);
}

fs.writeFileSync(file, content);
console.log("Updated Dashboard.tsx");
