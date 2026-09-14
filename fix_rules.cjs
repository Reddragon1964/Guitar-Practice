const fs = require('fs');

let rules = fs.readFileSync('firestore.rules', 'utf8');

// Fix practice validation
rules = rules.replace(
  /data.keys\(\).hasAll\(\['userId', 'songTitle', 'difficulty', 'correctNotes', 'totalNotes', 'accuracy', 'speed', 'date', 'createdAt'\]\) &&[\s\S]*?data.keys\(\).size\(\) == 9 &&/,
  `data.keys().hasAll(['userId', 'songTitle', 'difficulty', 'correctNotes', 'totalNotes', 'accuracy', 'speed', 'date', 'createdAt']) &&
             data.keys().hasOnly(['userId', 'songTitle', 'difficulty', 'correctNotes', 'totalNotes', 'accuracy', 'speed', 'date', 'createdAt', 'duration']) &&
             (!('duration' in data) || data.duration is number) &&`
);

// Fix goal validation
rules = rules.replace(
  /data.keys\(\).hasAll\(\['userId', 'title', 'targetDate', 'achieved', 'createdAt'\]\) &&[\s\S]*?data.keys\(\).size\(\) == 5 &&/,
  `data.keys().hasAll(['userId', 'title', 'targetDate', 'achieved', 'createdAt']) &&
             data.keys().hasOnly(['userId', 'title', 'targetDate', 'achieved', 'createdAt', 'songTitle']) &&
             (!('songTitle' in data) || data.songTitle is string) &&`
);

fs.writeFileSync('firestore.rules', rules);
console.log('Rules updated');
