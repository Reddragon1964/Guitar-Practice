const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Update Lucide Imports
content = content.replace(
  /import \{ CheckCircle2, Circle, Trash2, Plus, LogOut, Guitar, Edit2, Sparkles, Loader2, Printer \} from "lucide-react";/,
  'import { CheckCircle2, Circle, Trash2, Plus, LogOut, Guitar, Edit2, Sparkles, Loader2, Printer, Play, Pause, RotateCcw, Timer } from "lucide-react";'
);

// 2. Add State
const stateAnchor = `  const [duration, setDuration] = useState("");`;
const stateInjection = `  const [duration, setDuration] = useState("");
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);`;
content = content.replace(stateAnchor, stateInjection);

// 3. Update resetPracticeForm
const resetAnchor = `    setDuration("");
    setIsPartial(false);
    setPracticeDate(new Date().toISOString().split('T')[0]);`;
const resetInjection = `    setDuration("");
    setIsPartial(false);
    setPracticeDate(new Date().toISOString().split('T')[0]);
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);`;
content = content.replace(resetAnchor, resetInjection);

// 4. Update Edit practice (handleEditPractice)
const editAnchor = `    setDuration(p.duration ? p.duration.toString() : "");
    setIsPartial(p.isPartial || false);
    setPracticeDate(p.date);`;
const editInjection = `    setDuration(p.duration ? p.duration.toString() : "");
    setIsPartial(p.isPartial || false);
    setPracticeDate(p.date);
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);`;
content = content.replace(editAnchor, editInjection);

// 5. Add stopwatch logic (put it after resetPracticeForm)
const logicAnchor = `  const resetPracticeForm = () => {`;
const logicInjection = `  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const formatStopwatch = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return \`\${m}:\${s}\`;
  };

  const handleStopwatchToggle = () => {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false);
      const mins = Math.max(1, Math.ceil(stopwatchSeconds / 60));
      setDuration(mins.toString());
    } else {
      setIsStopwatchRunning(true);
    }
  };

  const handleStopwatchReset = () => {
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);
  };

  const resetPracticeForm = () => {`;
content = content.replace(logicAnchor, logicInjection);

// 6. Update UI
// Find the exact location where we want to insert. Let's put it right before the Speed field.
const uiAnchor = `<div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <input 
                          type="checkbox" 
                          id="isPartial"`;
const uiInjection = `<div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-indigo-200 flex items-center gap-2">
                        <Timer className="w-4 h-4" /> Practice Duration
                      </label>
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex-1 w-full">
                          <Input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Duration in minutes (e.g. 15)" />
                        </div>
                        <div className="flex items-center gap-3 bg-indigo-950/50 p-2 rounded-lg border border-indigo-800/50">
                          <div className="font-mono text-xl tabular-nums text-indigo-100 w-16 text-center">
                            {formatStopwatch(stopwatchSeconds)}
                          </div>
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="outline" 
                            className={\`w-8 h-8 rounded-full \${isStopwatchRunning ? 'border-amber-500 text-amber-500 hover:bg-amber-950' : 'border-emerald-500 text-emerald-500 hover:bg-emerald-950'}\`}
                            onClick={handleStopwatchToggle}
                          >
                            {isStopwatchRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </Button>
                          <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost" 
                            className="w-8 h-8 rounded-full text-indigo-400 hover:text-indigo-200"
                            onClick={handleStopwatchReset}
                            disabled={stopwatchSeconds === 0 && !isStopwatchRunning}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <input 
                          type="checkbox" 
                          id="isPartial"`;
content = content.replace(uiAnchor, uiInjection);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log("Updated Dashboard with stopwatch.");
