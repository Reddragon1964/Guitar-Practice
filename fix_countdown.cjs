const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Replace state
content = content.replace(
  /const \[stopwatchSeconds, setStopwatchSeconds\] = useState\(0\);\n  const \[isStopwatchRunning, setIsStopwatchRunning\] = useState\(false\);/,
  `const [timerInitialMinutes, setTimerInitialMinutes] = useState(15);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(15 * 60);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);`
);

// Replace the useEffect for the timer
content = content.replace(
  /useEffect\(\(\) => \{\n    let interval: NodeJS\.Timeout;\n    if \(isStopwatchRunning\) \{\n      interval = setInterval\(\(\) => \{\n        setStopwatchSeconds\(prev => prev \+ 1\);\n      \}, 1000\);\n    \}\n    return \(\) => clearInterval\(interval\);\n  \}, \[isStopwatchRunning\]\);/,
  `useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStopwatchRunning && timerRemainingSeconds > 0) {
      interval = setInterval(() => {
        setTimerRemainingSeconds(prev => {
          if (prev <= 1) {
            setIsStopwatchRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning, timerRemainingSeconds]);`
);

// Replace formatStopwatch (stays the same, but let's check)

// Replace handleStopwatchToggle
content = content.replace(
  /const handleStopwatchToggle = \(\) => \{\n    if \(isStopwatchRunning\) \{\n      setIsStopwatchRunning\(false\);\n      const mins = Math\.max\(1, Math\.ceil\(stopwatchSeconds \/ 60\)\);\n      setDuration\(mins\.toString\(\)\);\n    \} else \{\n      setIsStopwatchRunning\(true\);\n    \}\n  \};/,
  `const handleStopwatchToggle = () => {
    if (isStopwatchRunning) {
      setIsStopwatchRunning(false);
      const practicedSeconds = (timerInitialMinutes * 60) - timerRemainingSeconds;
      const mins = Math.max(1, Math.ceil(practicedSeconds / 60));
      setDuration(mins.toString());
    } else {
      if (timerRemainingSeconds > 0) {
        setIsStopwatchRunning(true);
      }
    }
  };`
);

// Replace handleStopwatchReset
content = content.replace(
  /const handleStopwatchReset = \(\) => \{\n    setIsStopwatchRunning\(false\);\n    setStopwatchSeconds\(0\);\n  \};/,
  `const handleStopwatchReset = () => {
    setIsStopwatchRunning(false);
    setTimerRemainingSeconds(timerInitialMinutes * 60);
  };
  
  const handleAdjustTime = (delta: number) => {
    if (isStopwatchRunning) return;
    const newMins = Math.max(1, Math.min(120, timerInitialMinutes + delta));
    setTimerInitialMinutes(newMins);
    setTimerRemainingSeconds(newMins * 60);
  };`
);

// Replace occurrences in resetPracticeForm
content = content.replace(
  /setIsStopwatchRunning\(false\);\n      setStopwatchSeconds\(0\);/,
  `setIsStopwatchRunning(false);
      setTimerRemainingSeconds(timerInitialMinutes * 60);`
);

// We need to do it twice because there are multiple `setStopwatchSeconds(0)` if they exist?
// Let's just do a global replace for the remaining ones.
content = content.replace(/setStopwatchSeconds\(0\)/g, 'setTimerRemainingSeconds(timerInitialMinutes * 60)');

// Update UI
const oldUI = `<div className="font-mono text-4xl tabular-nums text-indigo-50 tracking-wider">
                        {formatStopwatch(stopwatchSeconds)}
                      </div>`;
const newUI = `<div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-full text-indigo-400 hover:text-indigo-200 disabled:opacity-30"
                          onClick={() => handleAdjustTime(-1)}
                          disabled={isStopwatchRunning || timerRemainingSeconds !== timerInitialMinutes * 60}
                        >-</Button>
                        <div className="font-mono text-4xl tabular-nums text-indigo-50 tracking-wider w-[120px] text-center">
                          {formatStopwatch(timerRemainingSeconds)}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-8 h-8 rounded-full text-indigo-400 hover:text-indigo-200 disabled:opacity-30"
                          onClick={() => handleAdjustTime(1)}
                          disabled={isStopwatchRunning || timerRemainingSeconds !== timerInitialMinutes * 60}
                        >+</Button>
                      </div>`;
content = content.replace(oldUI, newUI);

// Fix the disabled state of reset button
content = content.replace(
  /disabled=\{stopwatchSeconds === 0 && !isStopwatchRunning\}/g,
  `disabled={timerRemainingSeconds === timerInitialMinutes * 60 && !isStopwatchRunning}`
);

// Fix the Log Session button condition
content = content.replace(
  /\{!isStopwatchRunning && stopwatchSeconds > 0 && \(/g,
  `{!isStopwatchRunning && timerRemainingSeconds < timerInitialMinutes * 60 && (`
);

// Fix the Log session button mins calculation
content = content.replace(
  /const mins = Math\.max\(1, Math\.ceil\(stopwatchSeconds \/ 60\)\);/,
  `const practicedSeconds = (timerInitialMinutes * 60) - timerRemainingSeconds;
                              const mins = Math.max(1, Math.ceil(practicedSeconds / 60));`
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Countdown applied');
