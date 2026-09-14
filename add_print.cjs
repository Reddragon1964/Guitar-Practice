const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Printer to lucide-react import
content = content.replace(
  'import { CheckCircle2, Circle, Trash2, Plus, LogOut, Guitar, Edit2, Sparkles, Loader2 } from "lucide-react";',
  'import { CheckCircle2, Circle, Trash2, Plus, LogOut, Guitar, Edit2, Sparkles, Loader2, Printer } from "lucide-react";'
);

// 2. Hide Top Header
content = content.replace(
  '<header className="bg-indigo-950/60 backdrop-blur-md border-b border-indigo-800 sticky top-0 z-10">',
  '<header className="bg-indigo-950/60 backdrop-blur-md border-b border-indigo-800 sticky top-0 z-10 print:hidden">'
);

// 3. Add Print Button and hide overview actions
content = content.replace(
  '<div className="flex gap-2">',
  `<div className="flex flex-wrap gap-2 print:hidden">
                <Button onClick={() => window.print()} variant="outline" className="gap-2 border-indigo-700 text-indigo-100 hover:bg-indigo-800">
                  <Printer className="w-4 h-4" /> Print
                </Button>`
);

// 4. Adjust grid layout for print
content = content.replace(
  '<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">',
  '<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:flex print:flex-col">'
);

content = content.replace(
  '<div className="lg:col-span-2 space-y-8">',
  '<div className="lg:col-span-2 space-y-8 print:w-full">'
);

content = content.replace(
  '              {/* Sidebar (Goals) */}\n              <div className="space-y-8">',
  '              {/* Sidebar (Goals) */}\n              <div className="space-y-8 print:hidden">'
);

// 5. Hide filter UI in Historical Accuracy by Song
content = content.replace(
  '<div className="flex flex-wrap items-center gap-2">',
  '<div className="flex flex-wrap items-center gap-2 print:hidden">'
);

// 6. Hide filter UI in Recent Sessions
content = content.replace(
  '<div className="mb-4 flex flex-wrap gap-3">',
  '<div className="mb-4 flex flex-wrap gap-3 print:hidden">'
);

// 7. Hide Add button in Recent Sessions
content = content.replace(
  '<Button variant="ghost" size="sm" onClick={() => { resetPracticeForm(); setView("add-practice"); }}>',
  '<Button variant="ghost" size="sm" className="print:hidden" onClick={() => { resetPracticeForm(); setView("add-practice"); }}>'
);

// 8. Hide Action column in Table
content = content.replace(
  '<th className="px-4 py-3"></th>',
  '<th className="px-4 py-3 print:hidden"></th>'
);

content = content.replace(
  '<td className="px-4 py-3 text-right whitespace-nowrap">',
  '<td className="px-4 py-3 text-right whitespace-nowrap print:hidden">'
);

fs.writeFileSync(file, content);
console.log("Updated for print layout.");
