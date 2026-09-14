const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `{Object.entries(
                        goals.reduce((acc, g) => {
                          const key = g.songTitle || 'General Milestones';
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(g);
                          return acc;
                        }, {} as Record<string, Goal[]>)
                      ).map(([groupName, groupGoals]) => (`;

const replacement = `{Object.entries(
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
                            {(groupGoals as Goal[]).map((g) => (`;

// wait, I need to match the actual text
const fullTarget = `{Object.entries(
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
                            {groupGoals.map((g) => (`;

content = content.replace(fullTarget, replacement);
fs.writeFileSync(file, content);
console.log("Fixed typescript error");
