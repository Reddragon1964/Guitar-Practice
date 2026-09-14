const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update imports for Recharts
content = content.replace(
  'import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";',
  'import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";'
);

// 2. Add duration state
content = content.replace(
  'const [speed, setSpeed] = useState("");',
  'const [speed, setSpeed] = useState("");\n  const [duration, setDuration] = useState("");'
);

// 3. Update resetPracticeForm
content = content.replace(
  'setSpeed("");',
  'setSpeed("");\n    setDuration("");'
);

// 4. Update handleEditPractice
content = content.replace(
  'setSpeed(p.speed.toString());',
  'setSpeed(p.speed.toString());\n    setDuration(p.duration ? p.duration.toString() : "");'
);

// 5. Update handleAddPractice
content = content.replace(
  'const spd = parseInt(speed);',
  'const spd = parseInt(speed);\n    const dur = duration ? parseInt(duration) : 15;'
);

content = content.replace(
  'correctNotes: correct,',
  'correctNotes: correct,\n            duration: dur,'
);

content = content.replace(
  'correctNotes: correct,\n          totalNotes: total,',
  'correctNotes: correct,\n          duration: dur,\n          totalNotes: total,'
);

// 6. Generate barChartData
const chartDataStr = `const { chartData, songKeys } = React.useMemo(() => {`;
const barChartDataStr = `const barChartData = React.useMemo(() => {
    const data = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data[dateStr] = {
        label: format(d, "EEE"), // e.g. Mon, Tue
        totalMinutes: 0
      };
    }

    practices.forEach(p => {
      if (data[p.date]) {
        data[p.date].totalMinutes += (p.duration || 15);
      }
    });

    return Object.values(data);
  }, [practices]);

  const { chartData, songKeys } = React.useMemo(() => {`;
content = content.replace(chartDataStr, barChartDataStr);

// 7. Add BarChart UI
const chartSection = `{/* Chart */}`;
const barChartUi = `{/* Practice Time Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Practice Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#3730a3" vertical={false} />
                          <XAxis dataKey="label" stroke="#818cf8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#818cf8" fontSize={12} tickLine={false} axisLine={false} unit="m" />
                          <Tooltip
                            cursor={{ fill: '#312e81' }}
                            contentStyle={{ backgroundColor: '#1e1b4b', borderRadius: '8px', border: '1px solid #3730a3', color: '#e0e7ff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                            itemStyle={{ color: '#e0e7ff' }}
                          />
                          <Bar dataKey="totalMinutes" name="Minutes" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Chart */}`;
content = content.replace(chartSection, barChartUi);

// 8. Add Duration field to add-practice form
const formSpeedField = `<div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-indigo-300">Speed (BPM)</label>
                      <Input type="number" min="0" max="100" required value={speed} onChange={e => setSpeed(e.target.value)} placeholder="e.g. 100" />
                    </div>`;
const formSpeedAndDur = `<div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-indigo-300">Speed (BPM)</label>
                      <Input type="number" min="0" max="999" required value={speed} onChange={e => setSpeed(e.target.value)} placeholder="e.g. 100" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-indigo-300">Duration (mins)</label>
                      <Input type="number" min="1" max="600" required value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 15" />
                    </div>`;
content = content.replace(formSpeedField, formSpeedAndDur);

// Fix correctNotes replacement because I replaced twice in handleAddPractice
// Wait, I will use file manipulation carefully. Let's write the whole file with a script instead.
fs.writeFileSync(file, content);
console.log("Updated Dashboard");
