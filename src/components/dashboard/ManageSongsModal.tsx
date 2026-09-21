import React from "react";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Song } from "../../types";

interface ManageSongsModalProps {
  songs: Song[];
  newSongInput: string;
  onNewSongInputChange: (val: string) => void;
  onAddSong: (e: React.FormEvent) => void;
  onToggleSongRetired: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onDone: () => void;
}

export const ManageSongsModal: React.FC<ManageSongsModalProps> = ({
  songs,
  newSongInput,
  onNewSongInputChange,
  onAddSong,
  onToggleSongRetired,
  onDeleteSong,
  onDone,
}) => {
  return (
    <div className="max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Song Library</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAddSong} className="flex gap-2 mb-6">
            <Input
              placeholder="New song title..."
              value={newSongInput}
              onChange={(e) => onNewSongInputChange(e.target.value)}
              required
            />
            <Button type="submit">Add</Button>
          </form>

          <div className="space-y-2">
            {songs.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-3 bg-indigo-900/40 rounded-lg border border-indigo-800"
              >
                <span
                  className={`font-medium text-sm ${
                    song.retired ? "text-indigo-400 line-through" : "text-indigo-200"
                  }`}
                >
                  {song.title}
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id={`retired-${song.id}`}
                      className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5"
                      checked={song.retired || false}
                      onChange={() => onToggleSongRetired(song)}
                    />
                    <label
                      htmlFor={`retired-${song.id}`}
                      className="text-xs font-medium text-indigo-300 cursor-pointer"
                    >
                      Retired
                    </label>
                  </div>
                  <button
                    onClick={() => onDeleteSong(song.id)}
                    className="text-indigo-500 hover:text-red-400 transition-colors"
                    title="Delete song"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {songs.length === 0 && (
              <div className="text-center text-sm text-indigo-400 py-4">
                No songs in your library. Add one above!
              </div>
            )}
          </div>

          <div className="flex justify-end pt-6 mt-6 border-t border-indigo-800">
            <Button type="button" variant="ghost" onClick={onDone}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
