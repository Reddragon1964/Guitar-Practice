const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject state and useEffect
const stateAnchor = `const [chartFilterLevel, setChartFilterLevel] = useState("");`;
const injectedCode = `const [chartFilterLevel, setChartFilterLevel] = useState("");
  const [printMode, setPrintMode] = useState<"all" | "weekly" | "historical" | "recent" | "milestones" | null>(null);

  const handlePrint = (mode: "all" | "weekly" | "historical" | "recent" | "milestones") => {
    setPrintMode(mode);
  };

  useEffect(() => {
    if (printMode) {
      const timer = setTimeout(() => {
        window.print();
        setPrintMode(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [printMode]);`;
content = content.replace(stateAnchor, injectedCode);

// 2. Update Main Print Button
content = content.replace(
  '<Button onClick={() => window.print()} variant="outline" className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800">',
  '<Button onClick={() => handlePrint("all")} variant="outline" className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800">'
);
content = content.replace(
  '<Printer className="w-4 h-4" /> Print\n                </Button>',
  '<Printer className="w-4 h-4" /> Print All\n                </Button>'
);

// 3. Weekly Practice Time
content = content.replace(
  '{/* Practice Time Chart */}\n                <Card>',
  '{/* Practice Time Chart */}\n                <Card className={printMode && printMode !== "weekly" && printMode !== "all" ? "print:hidden" : ""}>'
);
content = content.replace(
  '<CardHeader>\n                    <CardTitle>Weekly Practice Time</CardTitle>\n                  </CardHeader>',
  `<CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Weekly Practice Time</CardTitle>
                    <Button variant="ghost" size="sm" className="print:hidden h-8" onClick={() => handlePrint("weekly")}>
                      <Printer className="w-4 h-4 text-indigo-400" />
                    </Button>
                  </CardHeader>`
);

// 4. Historical Accuracy by Song
content = content.replace(
  '{/* Chart */}\n                <Card>',
  '{/* Chart */}\n                <Card className={printMode && printMode !== "historical" && printMode !== "all" ? "print:hidden" : ""}>'
);
content = content.replace(
  '<CardTitle>Historical Accuracy by Song</CardTitle>',
  `<div className="flex flex-row items-center justify-between space-y-0">
                      <CardTitle>Historical Accuracy by Song</CardTitle>
                      <Button variant="ghost" size="sm" className="print:hidden h-8" onClick={() => handlePrint("historical")}>
                        <Printer className="w-4 h-4 text-indigo-400" />
                      </Button>
                    </div>`
);

// 5. Recent Sessions
content = content.replace(
  '{/* Table */}\n                <Card>',
  '{/* Table */}\n                <Card className={printMode && printMode !== "recent" && printMode !== "all" ? "print:hidden" : ""}>'
);
const recentHeaderTarget = `<CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Recent Sessions</CardTitle>
                    <Button variant="ghost" size="sm" className="print:hidden" onClick={() => { resetPracticeForm(); setView("add-practice"); }}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </CardHeader>`;
const recentHeaderReplacement = `<CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Recent Sessions</CardTitle>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="ghost" size="sm" onClick={() => handlePrint("recent")}>
                        <Printer className="w-4 h-4 text-indigo-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { resetPracticeForm(); setView("add-practice"); }}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardHeader>`;
content = content.replace(recentHeaderTarget, recentHeaderReplacement);

// 6. Milestones & Goals
content = content.replace(
  '              {/* Sidebar (Goals) */}\n              <div className="space-y-8 print:hidden">',
  '              {/* Sidebar (Goals) */}\n              <div className={`space-y-8 ${printMode === "milestones" || printMode === "all" ? "" : "print:hidden"}`}>'
);
content = content.replace(
  '<Card className="h-full border-indigo-800 bg-purple-900/20">',
  '<Card className={`h-full border-indigo-800 bg-purple-900/20 ${printMode && printMode !== "milestones" && printMode !== "all" ? "print:hidden" : ""}`}>'
);
const milestoneHeaderTarget = `<CardHeader>
                    <CardTitle className="text-purple-100">Milestones & Goals</CardTitle>
                  </CardHeader>`;
const milestoneHeaderReplacement = `<CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-purple-100">Milestones & Goals</CardTitle>
                    <Button variant="ghost" size="sm" className="print:hidden h-8 hover:bg-purple-800/50" onClick={() => handlePrint("milestones")}>
                      <Printer className="w-4 h-4 text-purple-300" />
                    </Button>
                  </CardHeader>`;
content = content.replace(milestoneHeaderTarget, milestoneHeaderReplacement);

fs.writeFileSync(file, content);
console.log("Updated specific print modes.");
