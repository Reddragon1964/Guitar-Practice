const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium break-words", g.achieved ? "line-through text-indigo-400" : "text-indigo-50")}>
                              {g.title}
                            </p>
                            <p className="text-xs text-indigo-400 mt-1">
                              Target: {format(parseISO(g.targetDate), "MMM d, yyyy")}
                            </p>
                          </div>`;

const newTargetStr = `                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium break-words", g.achieved ? "line-through text-indigo-400" : "text-indigo-50")}>
                              {g.title}
                            </p>
                            {g.songTitle && (
                              <p className={cn("text-xs mt-0.5 truncate", g.achieved ? "line-through text-indigo-500" : "text-indigo-300 font-medium")}>
                                {g.songTitle}
                              </p>
                            )}
                            <p className="text-xs text-indigo-400 mt-1">
                              Target: {format(parseISO(g.targetDate), "MMM d, yyyy")}
                            </p>
                          </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, newTargetStr);
  fs.writeFileSync(file, content);
  console.log("Updated goal display");
} else {
  console.log("Target not found!");
}

