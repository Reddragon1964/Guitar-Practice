const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                  <CardContent>
                    <div className="mb-4 flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Select 
                          value={milestoneFilterSong} 
                          onChange={(e) => setMilestoneFilterSong(e.target.value)}
                        >
                          <option value="">All Songs</option>
                          {songs.map((s) => (
                            <option key={s.id} value={s.title}>{s.title}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-indigo-300">From</span>
                          <Input 
                            type="date" 
                            className="h-8 text-xs w-full sm:w-auto"
                            value={milestoneFilterStartDate} 
                            onChange={(e) => setMilestoneFilterStartDate(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-indigo-300">To</span>
                          <Input 
                            type="date" 
                            className="h-8 text-xs w-full sm:w-auto"
                            value={milestoneFilterEndDate} 
                            onChange={(e) => setMilestoneFilterEndDate(e.target.value)}
                          />
                        </div>
                        {(milestoneFilterSong || milestoneFilterStartDate || milestoneFilterEndDate) && (
                          <Button variant="ghost" size="sm" onClick={() => { setMilestoneFilterSong(''); setMilestoneFilterStartDate(''); setMilestoneFilterEndDate(''); }} className="h-8 px-2 text-xs">
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>`;

const replaceStr = `                  <CardContent>
                    <div className="mb-6 flex flex-col gap-3 bg-indigo-950/40 p-3 rounded-md border border-indigo-900/50">
                      <Select 
                        value={milestoneFilterSong} 
                        onChange={(e) => setMilestoneFilterSong(e.target.value)}
                      >
                        <option value="">All Songs</option>
                        {songs.map((s) => (
                          <option key={s.id} value={s.title}>{s.title}</option>
                        ))}
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300 pl-1">From</span>
                          <Input 
                            type="date" 
                            className="h-9 text-xs w-full"
                            value={milestoneFilterStartDate} 
                            onChange={(e) => setMilestoneFilterStartDate(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-300 pl-1">To</span>
                          <Input 
                            type="date" 
                            className="h-9 text-xs w-full"
                            value={milestoneFilterEndDate} 
                            onChange={(e) => setMilestoneFilterEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                      {(milestoneFilterSong || milestoneFilterStartDate || milestoneFilterEndDate) && (
                        <Button variant="secondary" size="sm" onClick={() => { setMilestoneFilterSong(''); setMilestoneFilterStartDate(''); setMilestoneFilterEndDate(''); }} className="h-8 text-xs w-full mt-1 bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-200">
                          Clear Filters
                        </Button>
                      )}
                    </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(file, content);
  console.log("Successfully replaced milestone filters layout.");
} else {
  console.log("Error: Target string not found.");
}
