const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove the window.parent !== window check
const handlePrintTarget = `const handlePrint = (mode: "all" | "weekly" | "historical" | "recent" | "milestones") => {
    if (window.parent !== window) {
      setPrintError(true);
      return;
    }
    setPrintMode(mode);
  };`;
const handlePrintReplacement = `const handlePrint = (mode: "all" | "weekly" | "historical" | "recent" | "milestones") => {
    setPrintMode(mode);
  };`;
content = content.replace(handlePrintTarget, handlePrintReplacement);

// 2. Simplify the useEffect and remove the 5-second auto-reset
const useEffectTarget = `useEffect(() => {
    if (printMode) {
      let isPrinted = false;
      const handleAfterPrint = () => {
        isPrinted = true;
        setPrintMode(null);
      };
      
      window.addEventListener('afterprint', handleAfterPrint);
      
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error("Print failed", err);
          setPrintError(true);
        }
        
        // Fallback for browsers where print dialog doesn't block and afterprint isn't fired
        setTimeout(() => {
          if (!isPrinted) {
            setPrintMode(null);
          }
        }, 5000);
        
      }, 500);

      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
        clearTimeout(timer);
      };
    }
  }, [printMode]);`;
const useEffectReplacement = `useEffect(() => {
    if (printMode) {
      const handleAfterPrint = () => {
        setPrintMode(null);
      };
      
      window.addEventListener('afterprint', handleAfterPrint);
      
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error("Print failed", err);
          setPrintError(true);
        }
      }, 500); // Give the DOM time to apply the print:hidden classes

      return () => {
        window.removeEventListener('afterprint', handleAfterPrint);
        clearTimeout(timer);
      };
    }
  }, [printMode]);`;
content = content.replace(useEffectTarget, useEffectReplacement);

// 3. Add a "Done Printing" button to the UI to allow manual exit if stuck
// We'll place it right next to the printError banner location
const mainContainerTarget = `{printError && (
            <div className="bg-amber-900/50 border border-amber-500 text-amber-100 p-4 rounded-md flex justify-between items-center print:hidden">
              <div>
                <p className="font-bold">Printing is unavailable in preview mode</p>
                <p className="text-sm">Please click the "Open in new tab" icon at the top right of the screen to use the print function.</p>
              </div>
              <Button variant="ghost" onClick={() => setPrintError(false)} className="hover:bg-amber-800/50 text-amber-200">Dismiss</Button>
            </div>
          )}`;
const mainContainerReplacement = `{printError && (
            <div className="bg-amber-900/50 border border-amber-500 text-amber-100 p-4 rounded-md flex justify-between items-center print:hidden">
              <div>
                <p className="font-bold">Print command failed</p>
                <p className="text-sm">Your browser blocked the print command. Try opening the app in a new tab.</p>
              </div>
              <Button variant="ghost" onClick={() => setPrintError(false)} className="hover:bg-amber-800/50 text-amber-200">Dismiss</Button>
            </div>
          )}
          {printMode && (
            <div className="bg-indigo-900/80 border border-indigo-500 text-indigo-100 p-4 rounded-md flex justify-between items-center print:hidden sticky top-4 z-50 shadow-lg">
              <div>
                <p className="font-bold">Print Mode Active</p>
                <p className="text-sm">If the print dialog didn't open or you closed it, click here to return.</p>
              </div>
              <Button onClick={() => setPrintMode(null)} className="bg-indigo-600 hover:bg-indigo-500 text-white">Return to Dashboard</Button>
            </div>
          )}`;
content = content.replace(mainContainerTarget, mainContainerReplacement);

fs.writeFileSync(file, content);
console.log("Applied new print fixes.");
