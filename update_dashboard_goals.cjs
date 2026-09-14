const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add goalSongTitle state
const stateStr = `const [goalTitle, setGoalTitle] = useState("");`;
const newStateStr = `const [goalTitle, setGoalTitle] = useState("");\n  const [goalSongTitle, setGoalSongTitle] = useState("");`;
content = content.replace(stateStr, newStateStr);

// Update handleAddGoal
const handleAddGoalStr = `const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !goalTitle || !goalDate) return;

    const newGoal = {
      userId: auth.currentUser.uid,
      title: goalTitle,
      targetDate: goalDate,
      achieved: false,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, "goals"), newGoal);
      setView("dashboard");
      setGoalTitle("");
      setGoalDate("");`;

const newHandleAddGoalStr = `const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !goalTitle || !goalDate) return;

    const newGoal = {
      userId: auth.currentUser.uid,
      title: goalTitle,
      songTitle: goalSongTitle,
      targetDate: goalDate,
      achieved: false,
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, "goals"), newGoal);
      setView("dashboard");
      setGoalTitle("");
      setGoalSongTitle("");
      setGoalDate("");`;
content = content.replace(handleAddGoalStr, newHandleAddGoalStr);

// Update add-goal form
const goalFormStr = `<div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200">Goal Description</label>
                    <Input required value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g. Play Master of Puppets at 100% speed" />
                  </div>`;
const newGoalFormStr = `<div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200">Target Song (Optional)</label>
                    <Select value={goalSongTitle} onChange={e => setGoalSongTitle(e.target.value)}>
                      <option value="">No specific song</option>
                      {songs.map(s => (
                        <option key={s.id} value={s.title}>{s.title}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-indigo-200">Goal Description</label>
                    <Input required value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g. Master the solo" />
                  </div>`;
content = content.replace(goalFormStr, newGoalFormStr);

// Display the songTitle in the Milestones list
const goalItemStr = `<div className="flex-1 min-w-0">
                            <div className={cn(
                              "font-medium truncate",
                              g.achieved ? "text-indigo-400 line-through" : "text-indigo-50"
                            )}>
                              {g.title}
                            </div>
                            <div className="text-xs text-indigo-300 mt-1 flex items-center gap-1">`;
const newGoalItemStr = `<div className="flex-1 min-w-0">
                            <div className={cn(
                              "font-medium truncate",
                              g.achieved ? "text-indigo-400 line-through" : "text-indigo-50"
                            )}>
                              {g.title}
                            </div>
                            {g.songTitle && (
                              <div className={cn(
                                "text-xs mt-0.5 truncate",
                                g.achieved ? "text-indigo-400/80 line-through" : "text-indigo-200 font-medium"
                              )}>
                                {g.songTitle}
                              </div>
                            )}
                            <div className="text-xs text-indigo-300 mt-1 flex items-center gap-1">`;
content = content.replace(goalItemStr, newGoalItemStr);

fs.writeFileSync(file, content);
console.log("Updated Dashboard.tsx with goal song Title functionality");
