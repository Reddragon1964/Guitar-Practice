const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
const stateStr = `const [sessionFilterDate, setSessionFilterDate] = useState("");`;
const newStateStr = `const [sessionFilterDate, setSessionFilterDate] = useState("");\n  const [milestoneFilterSong, setMilestoneFilterSong] = useState("");\n  const [milestoneFilterDate, setMilestoneFilterDate] = useState("");`;
content = content.replace(stateStr, newStateStr);

// 2. Add filteredGoals logic right before filteredPractices
const filterPracStr = `const filteredPractices = practices.filter(p => {`;
const newFilterPracStr = `const filteredGoals = goals.filter(g => {
    const matchSong = milestoneFilterSong ? g.songTitle === milestoneFilterSong : true;
    const matchDate = milestoneFilterDate ? g.targetDate === milestoneFilterDate : true;
    return matchSong && matchDate;
  });

  const filteredPractices = practices.filter(p => {`;
content = content.replace(filterPracStr, newFilterPracStr);

// 3. Update the UI for Milestones & Goals
const uiTargetStr = `<CardHeader>
                    <CardTitle className="text-purple-100">Milestones & Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {Object.entries(
                        goals.reduce((acc, g) => {`;
                        
const newUiTargetStr = `<CardHeader>
                    <CardTitle className="text-purple-100">Milestones & Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Select 
                          value={milestoneFilterSong} 
                          onChange={(e) => setMilestoneFilterSong(e.target.value)}
                        >
                          <option value="">All Songs</option>
                          {songs.map((s) => (
                            <option key={s.id} value={s.title}>{s.title}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="flex gap-2">
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
                      </div>
                    </div>
                    <div className="space-y-6">
                      {Object.entries(
                        filteredGoals.reduce((acc, g) => {`;
content = content.replace(uiTargetStr, newUiTargetStr);

// Update empty state
const emptyGoalsStr = `{goals.length === 0 && (
                        <div className="text-center text-sm text-indigo-400 py-6">
                          No active goals. Set a milestone to keep yourself motivated!
                        </div>
                      )}`;
const newEmptyGoalsStr = `{filteredGoals.length === 0 && (
                        <div className="text-center text-sm text-indigo-400 py-6">
                          {goals.length === 0 ? "No active goals. Set a milestone to keep yourself motivated!" : "No goals match your filters."}
                        </div>
                      )}`;
content = content.replace(emptyGoalsStr, newEmptyGoalsStr);

fs.writeFileSync(file, content);
console.log("Updated milestones filters successfully");
