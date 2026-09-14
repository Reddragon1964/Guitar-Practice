const fs = require('fs');
const file = 'src/types.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetDate: string; // ISO String
  achieved: boolean;
  createdAt: number;
}`;

const replacement = `export interface Goal {
  id: string;
  userId: string;
  title: string;
  songTitle?: string;
  targetDate: string; // ISO String
  achieved: boolean;
  createdAt: number;
}`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("Updated types.ts");
