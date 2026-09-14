const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

const resetAnchor = `  const resetPracticeForm = () => {
    setSongTitle("");
    setDifficulty(1);
    setCorrectNotes("");
    setTotalNotes("");
    setSpeed("");
    setDuration("");
    setIsPartial(false);
    setPracticeDate(new Date().toISOString().split('T')[0]);
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);
    setEditingPracticeId(null);
  };`;

const resetNew = `  const resetPracticeForm = (resetTimer = false) => {
    setSongTitle("");
    setDifficulty(1);
    setCorrectNotes("");
    setTotalNotes("");
    setSpeed("");
    if (resetTimer) {
      setDuration("");
      setIsStopwatchRunning(false);
      setStopwatchSeconds(0);
    }
    setIsPartial(false);
    setPracticeDate(new Date().toISOString().split('T')[0]);
    setEditingPracticeId(null);
  };`;

content = content.replace(resetAnchor, resetNew);

// Change `resetPracticeForm()` in handleAddPractice to `resetPracticeForm(true)`
const handleAddAnchor = `      setView("dashboard");
      resetPracticeForm();
    } catch (error) {`;
const handleAddNew = `      setView("dashboard");
      resetPracticeForm(true);
    } catch (error) {`;
content = content.replace(handleAddAnchor, handleAddNew);

// Update handleEditPractice
const editAnchor = `    setDuration(p.duration ? p.duration.toString() : "");
    setIsPartial(p.isPartial || false);
    setPracticeDate(p.date);
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);
    setEditingPracticeId(p.id);`;
const editNew = `    setDuration(p.duration ? p.duration.toString() : "");
    setIsPartial(p.isPartial || false);
    setPracticeDate(p.date);
    setEditingPracticeId(p.id);`;
content = content.replace(editAnchor, editNew);

// In handleStopwatchToggle, when pause, also ensure that we just setDuration without doing anything else.
// If user clicks "Log Session" button inside the timer, that would be convenient! Let's add a "Log Session" button to the global timer.

const timerUIAnchor = `                      <div className="flex items-center gap-2">
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
                      </div>`;
                      
const timerUINew = `                      <div className="flex items-center gap-2">
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
                        {!isStopwatchRunning && stopwatchSeconds > 0 && (
                          <Button 
                            className="ml-2 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => {
                              resetPracticeForm(false);
                              const mins = Math.max(1, Math.ceil(stopwatchSeconds / 60));
                              setDuration(mins.toString());
                              setView("add-practice");
                            }}
                          >
                            <Plus className="w-4 h-4" /> Log Session
                          </Button>
                        )}
                      </div>`;
content = content.replace(timerUIAnchor, timerUINew);


fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log('Fixed resets');
