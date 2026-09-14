const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Chart Filters
const chartUiStr = `<CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <CardTitle>Historical Accuracy by Song</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Select value={chartFilterSongName} onChange={e => setChartFilterSongName(e.target.value)} className="h-8 text-xs py-1">
                          <option value="">All Songs</option>
                          {songs.map((s) => (
                            <option key={s.id} value={s.title}>{s.title}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-300">From</span>
                        <Input type="date" className="h-8 text-xs" value={chartFilterStartDate} onChange={e => setChartFilterStartDate(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-300">To</span>
                        <Input type="date" className="h-8 text-xs" value={chartFilterEndDate} onChange={e => setChartFilterEndDate(e.target.value)} />
                      </div>
                      {(chartFilterStartDate || chartFilterEndDate || chartFilterSongName) && (
                        <Button variant="ghost" size="sm" onClick={() => { setChartFilterStartDate(""); setChartFilterEndDate(""); setChartFilterSongName(""); }} className="h-8 px-2 text-xs">
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>`;

const newChartUiStr = `<CardHeader className="flex flex-col gap-3">
                    <CardTitle>Historical Accuracy by Song</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={chartFilterSongName} onChange={e => setChartFilterSongName(e.target.value)} className="h-8 text-xs py-1 w-36">
                        <option value="">All Songs</option>
                        {songs.map((s) => (
                          <option key={s.id} value={s.title}>{s.title}</option>
                        ))}
                      </Select>
                      <Input type="number" placeholder="Speed" className="h-8 text-xs w-20" value={chartFilterSpeed} onChange={e => setChartFilterSpeed(e.target.value)} min={1} />
                      <Input type="number" placeholder="Level" className="h-8 text-xs w-20" value={chartFilterLevel} onChange={e => setChartFilterLevel(e.target.value)} min={1} />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-300">From</span>
                        <Input type="date" className="h-8 text-xs" value={chartFilterStartDate} onChange={e => setChartFilterStartDate(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-300">To</span>
                        <Input type="date" className="h-8 text-xs" value={chartFilterEndDate} onChange={e => setChartFilterEndDate(e.target.value)} />
                      </div>
                      {(chartFilterStartDate || chartFilterEndDate || chartFilterSongName || chartFilterSpeed || chartFilterLevel) && (
                        <Button variant="ghost" size="sm" onClick={() => { setChartFilterStartDate(""); setChartFilterEndDate(""); setChartFilterSongName(""); setChartFilterSpeed(""); setChartFilterLevel(""); }} className="h-8 px-2 text-xs">
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>`;

content = content.replace(chartUiStr, newChartUiStr);

// 2. Session Filters
const sessionUiStr = `<div className="mb-4 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <Select 
                          value={sessionFilterName} 
                          onChange={(e) => setSessionFilterName(e.target.value)}
                        >
                          <option value="">All Songs</option>
                          {songs.map((s) => (
                            <option key={s.id} value={s.title}>{s.title}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="sm:w-48">
                        <Input 
                          type="date" 
                          value={sessionFilterDate} 
                          onChange={(e) => setSessionFilterDate(e.target.value)}
                        />
                      </div>
                      {(sessionFilterName || sessionFilterDate) && (
                        <Button variant="ghost" onClick={() => { setSessionFilterName(''); setSessionFilterDate(''); }}>
                          Clear
                        </Button>
                      )}
                    </div>`;

const newSessionUiStr = `<div className="mb-4 flex flex-wrap gap-3">
                      <Select 
                        value={sessionFilterName} 
                        onChange={(e) => setSessionFilterName(e.target.value)}
                        className="w-48"
                      >
                        <option value="">All Songs</option>
                        {songs.map((s) => (
                          <option key={s.id} value={s.title}>{s.title}</option>
                        ))}
                      </Select>
                      <Input 
                        type="number" 
                        placeholder="Speed"
                        value={sessionFilterSpeed} 
                        onChange={(e) => setSessionFilterSpeed(e.target.value)}
                        className="w-24"
                        min={1}
                      />
                      <Input 
                        type="number" 
                        placeholder="Level"
                        value={sessionFilterLevel} 
                        onChange={(e) => setSessionFilterLevel(e.target.value)}
                        className="w-24"
                        min={1}
                      />
                      <Input 
                        type="date" 
                        value={sessionFilterDate} 
                        onChange={(e) => setSessionFilterDate(e.target.value)}
                        className="w-40"
                      />
                      {(sessionFilterName || sessionFilterDate || sessionFilterSpeed || sessionFilterLevel) && (
                        <Button variant="ghost" onClick={() => { setSessionFilterName(''); setSessionFilterDate(''); setSessionFilterSpeed(''); setSessionFilterLevel(''); }}>
                          Clear
                        </Button>
                      )}
                    </div>`;

content = content.replace(sessionUiStr, newSessionUiStr);

fs.writeFileSync(file, content);
console.log("Updated UI for both panels");
