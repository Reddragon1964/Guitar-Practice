const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Add toggleSongRetired
const deleteSongAnchor = `  const deleteSong = (id: string) => {`;
const toggleFunc = `  const toggleSongRetired = async (song: Song) => {
    try {
      await updateDoc(doc(db, "songs", song.id), {
        retired: !song.retired
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "songs");
    }
  };

  const deleteSong = (id: string) => {`;
content = content.replace(deleteSongAnchor, toggleFunc);

// 2. Add activeSongs
const viewStateAnchor = `  const [view, setView] = useState<"dashboard" | "add-practice" | "add-goal" | "manage-songs" | "ai-analysis">("dashboard");`;
const activeSongsVar = `  const [view, setView] = useState<"dashboard" | "add-practice" | "add-goal" | "manage-songs" | "ai-analysis">("dashboard");
  const activeSongs = songs.filter(s => !s.retired);`;
content = content.replace(viewStateAnchor, activeSongsVar);

// 3. Update Manage Songs UI
const manageSongsTarget = `<span className="font-medium text-sm text-indigo-200">{song.title}</span>
                      <button onClick={() => deleteSong(song.id)} className="text-indigo-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>`;
const manageSongsReplacement = `<span className={\`font-medium text-sm \${song.retired ? 'text-indigo-400 line-through' : 'text-indigo-200'}\`}>{song.title}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <input 
                            type="checkbox" 
                            id={\`retired-\${song.id}\`}
                            className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5"
                            checked={song.retired || false}
                            onChange={() => toggleSongRetired(song)}
                          />
                          <label htmlFor={\`retired-\${song.id}\`} className="text-xs font-medium text-indigo-300 cursor-pointer">
                            Retired
                          </label>
                        </div>
                        <button onClick={() => deleteSong(song.id)} className="text-indigo-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>`;
content = content.replace(manageSongsTarget, manageSongsReplacement);

// 4. Update dropdowns to use activeSongs instead of songs
// Be careful to only replace the ones for dropdowns, not the one in manage-songs
content = content.replace(/\{songs\.map\(\(s\)/g, '{activeSongs.map((s)');
content = content.replace(/\{songs\.map\(s =>/g, '{activeSongs.map(s =>');
// Fix the songs.length checks in dropdown forms
content = content.replace(/\{songs\.length > 0 \?/g, '{activeSongs.length > 0 ?');
content = content.replace(/disabled=\{songs\.length === 0\}/g, 'disabled={activeSongs.length === 0}');

// Make sure Manage Songs still uses `songs` for mapping, let's verify if the regex accidentally hit it.
// Manage songs mapping uses `{songs.map(song =>` so it wasn't affected! Great.

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log("Updated Dashboard for retired songs.");
