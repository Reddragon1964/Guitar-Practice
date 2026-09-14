const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add printError state
const stateAnchor = `const [printMode, setPrintMode] = useState<"all" | "weekly" | "historical" | "recent" | "milestones" | null>(null);`;
content = content.replace(
  stateAnchor,
  `const [printMode, setPrintMode] = useState<"all" | "weekly" | "historical" | "recent" | "milestones" | null>(null);\n  const [printError, setPrintError] = useState(false);`
);

// 2. Update handlePrint to check for iframe
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

// 3. Update useEffect to prevent race condition
const useEffectTarget = `useEffect(() => {
    if (printMode) {
      const timer = setTimeout(() => {
        window.print();
        setPrintMode(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [printMode]);`;
const useEffectReplacement = `useEffect(() => {
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
content = content.replace(useEffectTarget, useEffectReplacement);

// 4. Add the Print Error banner to the UI
const headerTarget = `<header className="bg-indigo-950/60 backdrop-blur-md border-b border-indigo-800 sticky top-0 z-10 print:hidden">`;
const headerReplacement = `<header className="bg-indigo-950/60 backdrop-blur-md border-b border-indigo-800 sticky top-0 z-10 print:hidden">`;

// Actually let's place it inside the main container right after the header
const mainContainerTarget = `<main className="flex-1 overflow-auto bg-indigo-950 text-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">`;
const mainContainerReplacement = `<main className="flex-1 overflow-auto bg-indigo-950 text-indigo-50">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {printError && (
            <div className="bg-amber-900/50 border border-amber-500 text-amber-100 p-4 rounded-md flex justify-between items-center print:hidden">
              <div>
                <p className="font-bold">Printing is unavailable in preview mode</p>
                <p className="text-sm">Please click the "Open in new tab" icon at the top right of the screen to use the print function.</p>
              </div>
              <Button variant="ghost" onClick={() => setPrintError(false)} className="hover:bg-amber-800/50 text-amber-200">Dismiss</Button>
            </div>
          )}`;
content = content.replace(mainContainerTarget, mainContainerReplacement);

fs.writeFileSync(file, content);
console.log("Fixed print handling.");
