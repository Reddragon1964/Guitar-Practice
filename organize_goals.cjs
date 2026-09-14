const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                    <div className="space-y-4">
                      {goals.map((g) => (
                        <div key={g.id} className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-all",
                          g.achieved ? "bg-indigo-900/40 border-indigo-800 opacity-60" : "bg-indigo-950/60 backdrop-blur-md border-indigo-800 shadow-sm"
                        )}>
                          <button onClick={() => toggleGoal(g)} className="mt-0.5 shrink-0 transition-colors">
                            {g.achieved ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-indigo-600 hover:text-indigo-400" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
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
                          </div>
                          <button onClick={() => deleteGoal(g.id)} className="shrink-0 text-indigo-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {goals.length === 0 && (`;

const replacement = `                    <div className="space-y-6">
                      {Object.entries(
                        goals.reduce((acc, g) => {
                          const key = g.songTitle || 'General Milestones';
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(g);
                          return acc;
                        }, {} as Record<string, Goal[]>)
                      ).map(([groupName, groupGoals]) => (
                        <div key={groupName} className="space-y-3">
                          <h4 className="text-sm font-semibold text-purple-200 border-b border-indigo-800/50 pb-1">
                            {groupName}
                          </h4>
                          <div className="space-y-3">
                            {groupGoals.map((g) => (
                              <div key={g.id} className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                g.achieved ? "bg-indigo-900/40 border-indigo-800 opacity-60" : "bg-indigo-950/60 backdrop-blur-md border-indigo-800 shadow-sm"
                              )}>
                                <button onClick={() => toggleGoal(g)} className="mt-0.5 shrink-0 transition-colors">
                                  {g.achieved ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-indigo-600 hover:text-indigo-400" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm font-medium break-words", g.achieved ? "line-through text-indigo-400" : "text-indigo-50")}>
                                    {g.title}
                                  </p>
                                  <p className="text-xs text-indigo-400 mt-1">
                                    Target: {format(parseISO(g.targetDate), "MMM d, yyyy")}
                                  </p>
                                </div>
                                <button onClick={() => deleteGoal(g.id)} className="shrink-0 text-indigo-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {goals.length === 0 && (`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log("Updated grouped milestones display successfully");
} else {
  console.log("Target not found!");
}
