const fs = require('fs');

// 1. Update Types
let typesContent = fs.readFileSync('src/types.ts', 'utf8');
typesContent = typesContent.replace(
  'title: string;\n  createdAt: number;',
  'title: string;\n  retired?: boolean;\n  createdAt: number;'
);
fs.writeFileSync('src/types.ts', typesContent);

// 2. Update Firestore Rules
let rulesContent = fs.readFileSync('firestore.rules', 'utf8');
rulesContent = rulesContent.replace(
  /function isValidSong\(data\) \{\n\s*return data\.keys\(\)\.hasAll\(\['userId', 'title', 'createdAt'\]\) &&\n\s*data\.keys\(\)\.size\(\) == 3/g,
  `function isValidSong(data) {
      return data.keys().hasAll(['userId', 'title', 'createdAt']) &&
             data.keys().hasOnly(['userId', 'title', 'createdAt', 'retired']) &&
             (!('retired' in data) || data.retired is bool)`
);
rulesContent = rulesContent.replace(
  /match \/songs\/\{songId\} \{\n\s*allow get: if isSignedIn\(\) && isValidId\(songId\) && existing\(\)\.userId == request\.auth\.uid;\n\s*allow list: if isSignedIn\(\) && resource\.data\.userId == request\.auth\.uid;\n\s*allow create: if isSignedIn\(\) && \n\s*isValidId\(songId\) && \n\s*isValidSong\(incoming\(\)\);\n\s*allow delete: if isSignedIn\(\) && isValidId\(songId\) && existing\(\)\.userId == request\.auth\.uid;/g,
  `match /songs/{songId} {
      allow get: if isSignedIn() && isValidId(songId) && existing().userId == request.auth.uid;
      allow list: if isSignedIn() && resource.data.userId == request.auth.uid;
      
      allow create: if isSignedIn() && 
                    isValidId(songId) && 
                    isValidSong(incoming());
                    
      allow update: if isSignedIn() && 
                    isValidId(songId) &&
                    existing().userId == request.auth.uid &&
                    isValidSong(incoming()) &&
                    incoming().userId == existing().userId &&
                    incoming().createdAt == existing().createdAt;
                    
      allow delete: if isSignedIn() && isValidId(songId) && existing().userId == request.auth.uid;`
);
fs.writeFileSync('firestore.rules', rulesContent);

console.log("Updated rules and types for retired songs.");
