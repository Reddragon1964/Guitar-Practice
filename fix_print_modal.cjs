const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Restore handlePrint check
const handlePrintTarget = `const handlePrint = (mode: "all" | "weekly" | "historical" | "recent" | "milestones") => {
    setPrintMode(mode);
  };`;
const handlePrintReplacement = `const handlePrint = (mode: "all" | "weekly" | "historical" | "recent" | "milestones") => {
    if (window.parent !== window) {
      setPrintError(true);
      return;
    }
    setPrintMode(mode);
  };`;
content = content.replace(handlePrintTarget, handlePrintReplacement);

// 2. Add the modal rendering right before the </main> tag (or inside the main container)
// Let's just find </main> and put it right before
const mainEndTarget = `</main>`;
const mainEndReplacement = `
      {printError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden p-4">
          <div className="bg-slate-900 border border-indigo-700 shadow-2xl rounded-xl p-8 max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-amber-900/30 p-3 rounded-full shrink-0">
                <Printer className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Preview Printing Blocked</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  Your browser's security settings prevent printing directly from inside an embedded preview window.
                </p>
                <div className="bg-slate-800 rounded p-4 border border-slate-700 mb-2">
                  <p className="text-sm font-medium text-slate-200 mb-2">To print this page:</p>
                  <ol className="list-decimal pl-5 text-sm text-slate-400 space-y-1">
                    <li>Look at the top right of this preview panel</li>
                    <li>Click the <strong>"Open in new tab"</strong> icon</li>
                    <li>Try printing again from the new tab</li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setPrintError(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white w-full">
                Got it, thanks
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {printMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center print:hidden">
           <div className="bg-indigo-900 shadow-2xl rounded-full p-2 pr-6 border border-indigo-500 flex items-center gap-4">
              <div className="bg-indigo-800 p-2 rounded-full animate-pulse">
                <Printer className="w-5 h-5 text-indigo-300" />
              </div>
              <p className="text-sm font-medium text-indigo-100">Preparing print layout...</p>
              <Button size="sm" variant="ghost" onClick={() => setPrintMode(null)} className="ml-4 hover:bg-indigo-800 text-indigo-300">
                Cancel
              </Button>
           </div>
        </div>
      )}
      </main>`;
content = content.replace(mainEndTarget, mainEndReplacement);

fs.writeFileSync(file, content);
console.log("Injected Print Sandbox Modal.");
