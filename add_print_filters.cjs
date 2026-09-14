const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Filter text for Historical Accuracy
const historicalFilterAnchor = `<div className="flex flex-wrap items-center gap-2 print:hidden">
                      <Select value={chartFilterSongName}`;
const historicalFilterInjected = `
                    <div className="hidden print:block text-sm text-indigo-300 italic mb-4">
                      {(chartFilterSongName || chartFilterSpeed || chartFilterLevel || chartFilterStartDate || chartFilterEndDate) ? 
                        \`Active Filters: \${[chartFilterSongName, chartFilterSpeed ? "Speed " + chartFilterSpeed + "%" : "", chartFilterLevel ? "Level " + chartFilterLevel : "", chartFilterStartDate ? "From " + chartFilterStartDate : "", chartFilterEndDate ? "To " + chartFilterEndDate : ""].filter(Boolean).join(', ')}\` 
                        : 'Active Filters: None'}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 print:hidden">
                      <Select value={chartFilterSongName}`;
content = content.replace(historicalFilterAnchor, historicalFilterInjected);

// 2. Add Filter text for Recent Sessions
const sessionFilterAnchor = `<div className="mb-4 flex flex-wrap gap-3 print:hidden">
                      <Select 
                        value={sessionFilterName}`;
const sessionFilterInjected = `
                    <div className="hidden print:block text-sm text-indigo-300 italic mb-4">
                      {(sessionFilterName || sessionFilterDate || sessionFilterSpeed || sessionFilterLevel) ? 
                        \`Active Filters: \${[sessionFilterName, sessionFilterDate ? "Date: " + sessionFilterDate : "", sessionFilterSpeed ? "Speed: " + sessionFilterSpeed + "%" : "", sessionFilterLevel ? "Level: " + sessionFilterLevel : ""].filter(Boolean).join(', ')}\` 
                        : 'Active Filters: None'}
                    </div>
                    <div className="mb-4 flex flex-wrap gap-3 print:hidden">
                      <Select 
                        value={sessionFilterName}`;
content = content.replace(sessionFilterAnchor, sessionFilterInjected);

// 3. Add Filter text for Milestones & Goals
const milestoneFilterAnchor = `<div className="mb-6 flex flex-col gap-3 bg-indigo-950/40 p-3 rounded-md border border-indigo-900/50">`;
const milestoneFilterInjected = `
                    <div className="hidden print:block text-sm text-purple-300 italic mb-4">
                      {(milestoneFilterSong || milestoneFilterStartDate || milestoneFilterEndDate) ? 
                        \`Active Filters: \${[milestoneFilterSong, milestoneFilterStartDate ? "From " + milestoneFilterStartDate : "", milestoneFilterEndDate ? "To " + milestoneFilterEndDate : ""].filter(Boolean).join(', ')}\` 
                        : 'Active Filters: None'}
                    </div>
                    <div className="mb-6 flex flex-col gap-3 bg-indigo-950/40 p-3 rounded-md border border-indigo-900/50 print:hidden">`;
content = content.replace(milestoneFilterAnchor, milestoneFilterInjected);

fs.writeFileSync(file, content);
console.log("Updated print layouts to display active filters.");
