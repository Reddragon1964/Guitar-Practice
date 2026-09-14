const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Remove Log Session button
const logSessionRegex = /\{!isStopwatchRunning && timerRemainingSeconds < timerInitialMinutes \* 60 && \([\s\S]*?<Plus className="w-4 h-4" \/> Log Session\n\s*<\/Button>\n\s*\)\}/;
content = content.replace(logSessionRegex, '');

// 2. Add message to the timer header
const descriptionRegex = /<p className="text-sm text-indigo-400">Track your session duration accurately<\/p>/;
const descriptionReplacement = `{timerRemainingSeconds === 0 ? (
                          <p className="text-sm font-medium text-emerald-400">*** Great work, time to take a break!!!</p>
                        ) : (
                          <p className="text-sm text-indigo-400">Track your session duration accurately</p>
                        )}`;
content = content.replace(descriptionRegex, descriptionReplacement);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Timer updated');
