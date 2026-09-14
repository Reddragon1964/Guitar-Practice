const fs = require('fs');
const glob = require('glob');

const files = [
  'src/components/Dashboard.tsx',
  'src/App.tsx',
  'src/components/ui/card.tsx',
  'src/components/ui/input.tsx',
  'src/components/ui/select.tsx',
  'src/components/ui/button.tsx'
];

const replacements = [
  // Gradients
  ['from-indigo-50 via-purple-50 to-indigo-100', 'from-slate-950 via-indigo-950 to-purple-950'],
  
  // Backgrounds
  ['bg-white/60', 'bg-indigo-900/40'],
  ['bg-white', 'bg-indigo-950/60'],
  ['bg-indigo-50/50', 'bg-indigo-900/20'],
  ['bg-indigo-50', 'bg-indigo-900/40'],
  ['bg-purple-50', 'bg-purple-900/20'],

  // Borders
  ['border-purple-200', 'border-indigo-800'],
  ['border-purple-100', 'border-indigo-800'],
  ['border-indigo-200', 'border-indigo-800'],
  ['border-indigo-100', 'border-indigo-800'],
  ['border-indigo-300', 'border-indigo-700'],

  // Text colors
  ['text-indigo-950', 'text-indigo-50'],
  ['text-purple-900', 'text-purple-100'],
  ['text-indigo-700', 'text-indigo-200'],
  ['text-indigo-600', 'text-indigo-300'],
  ['text-indigo-500', 'text-indigo-400'],
  ['text-indigo-400', 'text-indigo-500'],
  ['text-indigo-300', 'text-indigo-600'],
  
  // Chart colors (in Dashboard.tsx)
  ['stroke="#e2e8f0"', 'stroke="#3730a3"'],
  ['stroke="#94a3b8"', 'stroke="#818cf8"'],
  ['stroke="#7c3aed"', 'stroke="#a855f7"'],
  ['fill: \'#7c3aed\'', 'fill: \'#a855f7\''],
  
  // Input specific
  ['placeholder:text-indigo-400', 'placeholder:text-indigo-500']
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // We want to avoid partial replacements messing up later replacements.
    // However, going from light to dark generally doesn't overlap if we are careful,
    // wait, `text-indigo-400` becomes `text-indigo-500`, then later `text-indigo-500` becomes `text-indigo-400`.
    // This WILL cause a loop.
    // So we use placeholders.
    
    replacements.forEach((r, i) => {
      const tempPlaceholder = `__REPLACE_${i}__`;
      content = content.split(r[0]).join(tempPlaceholder);
    });
    
    replacements.forEach((r, i) => {
      const tempPlaceholder = `__REPLACE_${i}__`;
      content = content.split(tempPlaceholder).join(r[1]);
    });
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
