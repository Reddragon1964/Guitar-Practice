const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state variable
const stateStr = `const [chartFilterEndDate, setChartFilterEndDate] = useState("");`;
const newStateStr = `const [chartFilterEndDate, setChartFilterEndDate] = useState("");\n  const [chartFilterSongName, setChartFilterSongName] = useState("");`;
content = content.replace(stateStr, newStateStr);

// 2. Add to useMemo filtering logic
const filterLogicStr = `    const filtered = practices.filter(p => {
      const matchStart = chartFilterStartDate ? p.date >= chartFilterStartDate : true;
      const matchEnd = chartFilterEndDate ? p.date <= chartFilterEndDate : true;
      return matchStart && matchEnd;
    });`;
const newFilterLogicStr = `    const filtered = practices.filter(p => {
      const matchStart = chartFilterStartDate ? p.date >= chartFilterStartDate : true;
      const matchEnd = chartFilterEndDate ? p.date <= chartFilterEndDate : true;
      const matchSong = chartFilterSongName ? p.songTitle === chartFilterSongName : true;
      return matchStart && matchEnd && matchSong;
    });`;
content = content.replace(filterLogicStr, newFilterLogicStr);

// 3. Update dependency array
const depStr = `}, [practices, chartFilterStartDate, chartFilterEndDate]);`;
const newDepStr = `}, [practices, chartFilterStartDate, chartFilterEndDate, chartFilterSongName]);`;
content = content.replace(depStr, newDepStr);

// 4. Update UI
const uiStr = `<div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-300">From</span>
                        <Input type="date" className="h-8 text-xs" value={chartFilterStartDate} onChange={e => setChartFilterStartDate(e.target.value)} />
                      </div>`;
const newUiStr = `<div className="flex items-center gap-1">
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
                      </div>`;
content = content.replace(uiStr, newUiStr);

// 5. Update Clear button condition
const clearStr = `{(chartFilterStartDate || chartFilterEndDate) && (
                        <Button variant="ghost" size="sm" onClick={() => { setChartFilterStartDate(""); setChartFilterEndDate(""); }} className="h-8 px-2 text-xs">
                          Clear
                        </Button>
                      )}`;
const newClearStr = `{(chartFilterStartDate || chartFilterEndDate || chartFilterSongName) && (
                        <Button variant="ghost" size="sm" onClick={() => { setChartFilterStartDate(""); setChartFilterEndDate(""); setChartFilterSongName(""); }} className="h-8 px-2 text-xs">
                          Clear
                        </Button>
                      )}`;
content = content.replace(clearStr, newClearStr);

fs.writeFileSync(file, content);
console.log("Updated chart filter successfully");
