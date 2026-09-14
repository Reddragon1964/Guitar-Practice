const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const stateStr = `const [sessionFilterDate, setSessionFilterDate] = useState("");`;
const newStateStr = `const [sessionFilterDate, setSessionFilterDate] = useState("");\n  const [chartFilterStartDate, setChartFilterStartDate] = useState("");\n  const [chartFilterEndDate, setChartFilterEndDate] = useState("");`;
content = content.replace(stateStr, newStateStr);

const memoStr = `  const { chartData, songKeys } = React.useMemo(() => {
    const groupedByDate: Record<string, Record<string, { totalAcc: number; count: number }>> = {};
    const keys = new Set<string>();

    [...practices].sort((a, b) => a.date.localeCompare(b.date)).forEach(p => {`;
const newMemoStr = `  const { chartData, songKeys } = React.useMemo(() => {
    const groupedByDate: Record<string, Record<string, { totalAcc: number; count: number }>> = {};
    const keys = new Set<string>();

    const filtered = practices.filter(p => {
      const matchStart = chartFilterStartDate ? p.date >= chartFilterStartDate : true;
      const matchEnd = chartFilterEndDate ? p.date <= chartFilterEndDate : true;
      return matchStart && matchEnd;
    });

    [...filtered].sort((a, b) => a.date.localeCompare(b.date)).forEach(p => {`;

content = content.replace(memoStr, newMemoStr);

const depStr = `  }, [practices]);`;
const newDepStr = `  }, [practices, chartFilterStartDate, chartFilterEndDate]);`;
content = content.replace(depStr, newDepStr);

const uiStr = `                <Card>
                  <CardHeader>
                    <CardTitle>Historical Accuracy by Song</CardTitle>
                  </CardHeader>
                  <CardContent>`;
const newUiStr = `                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <CardTitle>Historical Accuracy by Song</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-300">From</span>
                        <Input type="date" className="h-8 text-xs" value={chartFilterStartDate} onChange={e => setChartFilterStartDate(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-300">To</span>
                        <Input type="date" className="h-8 text-xs" value={chartFilterEndDate} onChange={e => setChartFilterEndDate(e.target.value)} />
                      </div>
                      {(chartFilterStartDate || chartFilterEndDate) && (
                        <Button variant="ghost" size="sm" onClick={() => { setChartFilterStartDate(""); setChartFilterEndDate(""); }} className="h-8 px-2 text-xs">
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>`;

content = content.replace(uiStr, newUiStr);

fs.writeFileSync(file, content);
console.log("Updated Dashboard.tsx with chart filters");
