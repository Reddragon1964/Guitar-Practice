const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update state
const oldState = `const [milestoneFilterDate, setMilestoneFilterDate] = useState("");`;
const newState = `const [milestoneFilterStartDate, setMilestoneFilterStartDate] = useState("");
  const [milestoneFilterEndDate, setMilestoneFilterEndDate] = useState("");`;
content = content.replace(oldState, newState);

// Update filter logic
const oldFilter = `const filteredGoals = goals.filter(g => {
    const matchSong = milestoneFilterSong ? g.songTitle === milestoneFilterSong : true;
    const matchDate = milestoneFilterDate ? g.targetDate === milestoneFilterDate : true;
    return matchSong && matchDate;
  });`;
const newFilter = `const filteredGoals = goals.filter(g => {
    const matchSong = milestoneFilterSong ? g.songTitle === milestoneFilterSong : true;
    const matchStart = milestoneFilterStartDate ? g.targetDate >= milestoneFilterStartDate : true;
    const matchEnd = milestoneFilterEndDate ? g.targetDate <= milestoneFilterEndDate : true;
    return matchSong && matchStart && matchEnd;
  });`;
content = content.replace(oldFilter, newFilter);

// Update UI
const oldUi = `<div className="flex gap-2">
                        <Input 
                          type="date" 
                          className="w-full sm:w-auto"
                          value={milestoneFilterDate} 
                          onChange={(e) => setMilestoneFilterDate(e.target.value)}
                        />
                        {(milestoneFilterSong || milestoneFilterDate) && (
                          <Button variant="ghost" onClick={() => { setMilestoneFilterSong(''); setMilestoneFilterDate(''); }}>
                            Clear
                          </Button>
                        )}
                      </div>`;
const newUi = `<div className="flex gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-indigo-300">From</span>
                          <Input 
                            type="date" 
                            className="h-8 text-xs w-full sm:w-auto"
                            value={milestoneFilterStartDate} 
                            onChange={(e) => setMilestoneFilterStartDate(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-indigo-300">To</span>
                          <Input 
                            type="date" 
                            className="h-8 text-xs w-full sm:w-auto"
                            value={milestoneFilterEndDate} 
                            onChange={(e) => setMilestoneFilterEndDate(e.target.value)}
                          />
                        </div>
                        {(milestoneFilterSong || milestoneFilterStartDate || milestoneFilterEndDate) && (
                          <Button variant="ghost" size="sm" onClick={() => { setMilestoneFilterSong(''); setMilestoneFilterStartDate(''); setMilestoneFilterEndDate(''); }} className="h-8 px-2 text-xs">
                            Clear
                          </Button>
                        )}
                      </div>`;
content = content.replace(oldUi, newUi);

fs.writeFileSync(file, content);
console.log("Updated!");
