const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update lucide-react import
content = content.replace(
  'import { CheckCircle2, Circle, Trash2, Plus, LogOut, Guitar, Edit2 } from "lucide-react";',
  'import { CheckCircle2, Circle, Trash2, Plus, LogOut, Guitar, Edit2, Sparkles, Loader2 } from "lucide-react";'
);

// 2. Update view state type
content = content.replace(
  'useState<"dashboard" | "add-practice" | "add-goal" | "manage-songs">("dashboard");',
  'useState<"dashboard" | "add-practice" | "add-goal" | "manage-songs" | "ai-analysis">("dashboard");'
);

// 3. Add AI states
const statesTarget = `const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);`;
const aiStates = `const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);`;
content = content.replace(statesTarget, aiStates);

// 4. Add handleAnalyze function
const funcTarget = `const handleAddGoal = async (e: React.FormEvent) => {`;
const aiFunc = `const handleAnalyze = async () => {
    setView("ai-analysis");
    if (aiAnalysis) return; // Already analyzed
    
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practices, goals, songs })
      });
      const data = await response.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis("Failed to analyze data.");
      }
    } catch (err) {
      console.error(err);
      setAiAnalysis("Error connecting to AI Coach.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {`;
content = content.replace(funcTarget, aiFunc);

// 5. Add button to header
const buttonTarget = `<Button onClick={() => setView("manage-songs")} variant="outline" className="gap-2">`;
const aiButton = `<Button onClick={handleAnalyze} variant="outline" className="gap-2 bg-indigo-900/50 hover:bg-indigo-800 border-indigo-700 text-indigo-100">
                  <Sparkles className="w-4 h-4 text-amber-400" /> AI Coach
                </Button>
                <Button onClick={() => setView("manage-songs")} variant="outline" className="gap-2">`;
content = content.replace(buttonTarget, aiButton);

// 6. Add AI view
const aiViewTarget = `{view === "manage-songs" && (`;
const aiView = `{view === "ai-analysis" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-indigo-800 bg-indigo-950/40 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-indigo-100">
                  <Sparkles className="w-6 h-6 text-amber-400" /> AI Practice Analysis
                </CardTitle>
                <Button variant="ghost" onClick={() => setView("dashboard")}>Back to Dashboard</Button>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-12 text-indigo-300">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                    <p>Analyzing your performance...</p>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-indigo max-w-none">
                    {aiAnalysis ? (
                      <div className="space-y-4 whitespace-pre-wrap text-indigo-200">
                        {aiAnalysis}
                      </div>
                    ) : (
                      <p className="text-indigo-400 text-center py-8">No analysis available.</p>
                    )}
                  </div>
                )}
                {!isAnalyzing && (
                  <div className="flex justify-center mt-8">
                     <Button variant="outline" onClick={() => { setAiAnalysis(""); handleAnalyze(); }} className="gap-2">
                       <Sparkles className="w-4 h-4" /> Re-analyze Performance
                     </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {view === "manage-songs" && (`;
content = content.replace(aiViewTarget, aiView);

fs.writeFileSync(file, content);
console.log("Added AI feature to Dashboard");
