const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Remove timer from the form
const formTimerAnchor = `<div className="space-y-2 sm:col-span-2">
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
                    </div>`;

const formDurationOnly = `<div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-indigo-200">Practice Duration (Minutes)</label>
                      <Input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 15" />
                    </div>`;

content = content.replace(formTimerAnchor, formDurationOnly);

// 2. Add the global timer card right above the practice time chart
const chartAnchor = `{/* Main Content (Chart & Table) */}
              <div className="lg:col-span-2 space-y-8 print:w-full">
                {/* Practice Time Chart */}`;

const globalTimerCard = `{/* Main Content (Chart & Table) */}
              <div className="lg:col-span-2 space-y-8 print:w-full">
                {/* Global Practice Timer */}
                <Card className="print:hidden border-indigo-500/30 bg-indigo-900/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-900/50 flex items-center justify-center border border-indigo-700">
                        <Timer className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-indigo-100">Live Practice Timer</h3>
                        <p className="text-sm text-indigo-400">Track your session duration accurately</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="font-mono text-4xl tabular-nums text-indigo-50 tracking-wider">
                        {formatStopwatch(stopwatchSeconds)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          type="button" 
                          size="icon" 
                          className={\`w-12 h-12 rounded-full \${isStopwatchRunning ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}\`}
                          onClick={handleStopwatchToggle}
                        >
                          {isStopwatchRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                        </Button>
                        <Button 
                          type="button" 
                          size="icon" 
                          variant="ghost" 
                          className="w-10 h-10 rounded-full text-indigo-400 hover:text-indigo-200 bg-indigo-900/30"
                          onClick={handleStopwatchReset}
                          disabled={stopwatchSeconds === 0 && !isStopwatchRunning}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Practice Time Chart */}`;

content = content.replace(chartAnchor, globalTimerCard);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Done');
