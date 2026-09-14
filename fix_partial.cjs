const fs = require('fs');

// 1. Update Types
let typesContent = fs.readFileSync('src/types.ts', 'utf8');
typesContent = typesContent.replace('duration?: number; // duration in minutes', 'duration?: number; // duration in minutes\n  isPartial?: boolean;');
fs.writeFileSync('src/types.ts', typesContent);

// 2. Update Firestore Rules
let rulesContent = fs.readFileSync('firestore.rules', 'utf8');
rulesContent = rulesContent.replace(
  /data\.keys\(\)\.hasOnly\(\['userId', 'songTitle', 'difficulty', 'correctNotes', 'totalNotes', 'accuracy', 'speed', 'date', 'createdAt', 'duration'\]\)/g,
  `data.keys().hasOnly(['userId', 'songTitle', 'difficulty', 'correctNotes', 'totalNotes', 'accuracy', 'speed', 'date', 'createdAt', 'duration', 'isPartial'])`
);
rulesContent = rulesContent.replace(
  /\(!\('duration' in data\) \|\| data\.duration is number\) &&/g,
  `(!('duration' in data) || data.duration is number) &&
             (!('isPartial' in data) || data.isPartial is bool) &&`
);
fs.writeFileSync('firestore.rules', rulesContent);

// 3. Update Dashboard.tsx
let dbContent = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Add State
dbContent = dbContent.replace(
  /const \[duration, setDuration\] = useState\(""\);/g,
  `const [duration, setDuration] = useState("");\n  const [isPartial, setIsPartial] = useState(false);`
);

// Reset form
dbContent = dbContent.replace(
  /setDuration\(""\);\n\s*setPracticeDate/g,
  `setDuration("");\n    setIsPartial(false);\n    setPracticeDate`
);

// Edit practice
dbContent = dbContent.replace(
  /setDuration\(p\.duration \? p\.duration\.toString\(\) : ""\);\n\s*setPracticeDate/g,
  `setDuration(p.duration ? p.duration.toString() : "");\n    setIsPartial(p.isPartial || false);\n    setPracticeDate`
);

// Update payload
dbContent = dbContent.replace(
  /date: practiceDate,\n\s*createdAt: existingPractice\.createdAt/g,
  `date: practiceDate,\n            isPartial,\n            createdAt: existingPractice.createdAt`
);
dbContent = dbContent.replace(
  /date: practiceDate,\n\s*createdAt: Date\.now\(\)\n\s*};\n\s*await addDoc/g,
  `date: practiceDate,\n          isPartial,\n          createdAt: Date.now()\n        };\n        await addDoc`
);

// UI Form Checkbox
dbContent = dbContent.replace(
  /<div className="space-y-2 sm:col-span-2">\n\s*<label className="text-sm font-medium text-indigo-200">Speed \(%\)<\/label>/g,
  `<div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <input 
                          type="checkbox" 
                          id="isPartial"
                          className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-4 h-4"
                          checked={isPartial}
                          onChange={(e) => setIsPartial(e.target.checked)}
                        />
                        <label htmlFor="isPartial" className="text-sm font-medium text-indigo-200 cursor-pointer">
                          Partial Song Practice
                        </label>
                      </div>
                      <label className="text-sm font-medium text-indigo-200">Speed (%)</label>`
);

// UI Table Label
dbContent = dbContent.replace(
  /<div className="font-medium text-indigo-50">\{p\.songTitle\}<\/div>/g,
  `<div className="font-medium text-indigo-50 flex items-center gap-2">
                                  {p.songTitle}
                                  {p.isPartial && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-indigo-900/60 text-indigo-300 border border-indigo-700">Partial</span>}
                                </div>`
);

fs.writeFileSync('src/components/Dashboard.tsx', dbContent);
console.log("Updated files for partial practice.");
