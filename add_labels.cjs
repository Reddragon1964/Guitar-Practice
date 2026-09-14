const fs = require('fs');
const file = 'src/components/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldLine = `<Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={key}
                                stroke={COLORS[idx % COLORS.length]}
                                strokeWidth={3}
                                connectNulls={true}
                                dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                              />`;

const newLine = `<Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                name={key}
                                stroke={COLORS[idx % COLORS.length]}
                                strokeWidth={3}
                                connectNulls={true}
                                dot={{ r: 4, fill: COLORS[idx % COLORS.length], strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                                label={{ position: 'top', fill: COLORS[idx % COLORS.length], fontSize: 11, fontWeight: 500, formatter: (val: any) => val ? \`\${val}%\` : '' }}
                              />`;

if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync(file, content);
  console.log("Updated Line label successfully");
} else {
  console.log("Could not find the target string!");
}
