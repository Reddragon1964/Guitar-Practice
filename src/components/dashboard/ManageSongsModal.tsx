import React, { useState, useMemo } from "react";
import {
  Trash2,
  Plus,
  Clock,
  Gauge,
  Music,
  Search,
  X,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { NumericKeypadInput } from "../ui/numeric-keypad-input";
import { Song } from "../../types";
import { cn } from "../../lib/utils";
import {
  formatDurationColon,
  parseDurationInputToSeconds,
} from "../../utils/durationFormat";
import {
  useResizableColumns,
  AdjustableTableToolbar,
  ColumnResizeHandle,
} from "../ui/AdjustableTable";

interface ManageSongsModalProps {
  songs: Song[];
  newSongInput: string;
  onNewSongInputChange: (val: string) => void;
  onAddSong: (title: string, duration?: number, difficulty?: number) => void;
  onUpdateSong?: (songId: string, updates: Partial<Song>) => void;
  onToggleSongRetired: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onDone: () => void;
}

const DURATION_PRESETS = ["1:00", "2:00", "3:00", "3:30", "4:00", "5:00"];

export const ManageSongsModal: React.FC<ManageSongsModalProps> = ({
  songs,
  newSongInput,
  onNewSongInputChange,
  onAddSong,
  onUpdateSong,
  onToggleSongRetired,
  onDeleteSong,
  onDone,
}) => {
  // New song fields: Time (Duration) and Difficulty Level
  const [newDuration, setNewDuration] = useState("3:00");
  const [newDifficulty, setNewDifficulty] = useState<number>(3);
  const [searchQuery, setSearchQuery] = useState("");

  // Inline editing state for existing songs
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<number>(1);

  // Column resizing and row density setup
  const defaultColWidths = useMemo(
    () => ({
      title: 240,
      duration: 140,
      difficulty: 140,
      status: 110,
      actions: 100,
    }),
    []
  );

  const {
    widths,
    density,
    densityStyle,
    activeResizingColumn,
    setDensity,
    resetWidths,
    resetColumn,
    resetAll,
    startResize,
  } = useResizableColumns({
    tableId: "manage_songs_library_table_v1",
    defaultWidths: defaultColWidths,
    minWidth: 80,
    maxWidth: 600,
    defaultDensity: "default",
  });

  const handleStartEdit = (song: Song) => {
    setEditingSongId(song.id);
    setEditTitle(song.title);
    setEditDuration(
      song.duration !== undefined && song.duration > 0
        ? formatDurationColon(song.duration)
        : ""
    );
    setEditDifficulty(song.difficulty ?? 1);
  };

  const handleCancelEdit = () => {
    setEditingSongId(null);
    setEditTitle("");
    setEditDuration("");
    setEditDifficulty(1);
  };

  const handleSaveEdit = (songId: string) => {
    if (!onUpdateSong || !editTitle.trim()) return;
    const parsedSec = editDuration.trim()
      ? parseDurationInputToSeconds(editDuration)
      : undefined;
    onUpdateSong(songId, {
      title: editTitle.trim(),
      duration: parsedSec,
      difficulty: Math.min(12, Math.max(1, editDifficulty)),
    });
    setEditingSongId(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongInput.trim()) return;
    const parsedSec = newDuration.trim()
      ? parseDurationInputToSeconds(newDuration)
      : undefined;
    onAddSong(newSongInput.trim(), parsedSec, newDifficulty);
  };

  // Filter songs
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter((s) => s.title.toLowerCase().includes(q));
  }, [songs, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Add New Song Section */}
      <Card className="bg-slate-900/90 border-indigo-900/60 shadow-lg">
        <CardHeader className="py-3 px-4 border-b border-indigo-950/80">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-indigo-100">
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Song to Library (with Default Time & Difficulty)
            </span>
            <span className="text-xs text-indigo-400 font-normal">
              Defaults automatically fill Record Practice Session
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* 1. Song Title (Span 5) */}
              <div className="md:col-span-5 space-y-1">
                <label className="text-xs font-medium text-indigo-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  Song or Exercise Title <span className="text-rose-400">*</span>
                </label>
                <Input
                  placeholder="e.g. Master of Puppets, Spider Walk..."
                  value={newSongInput}
                  onChange={(e) => onNewSongInputChange(e.target.value)}
                  required
                  maxLength={200}
                  className="h-9 text-sm bg-white border-blue-400 text-blue-700 placeholder:text-blue-400 focus:border-blue-600"
                />
              </div>

              {/* 2. Default Time / Duration (Span 3) */}
              <div className="md:col-span-3 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-indigo-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Default Time (mm:ss)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Optional</span>
                </div>
                <Input
                  type="text"
                  placeholder="3:00"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  className="h-9 text-sm font-mono text-center bg-white border-blue-400 text-blue-700 focus:border-blue-600"
                />
              </div>

              {/* 3. Default Difficulty (Span 2) */}
              <div className="md:col-span-2 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-indigo-200 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    Difficulty
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">1-12</span>
                </div>
                <NumericKeypadInput
                  compact
                  label="Difficulty Level"
                  min={1}
                  max={12}
                  value={newDifficulty}
                  onChange={(val) =>
                    setNewDifficulty(
                      val === "" ? 1 : Math.min(12, Math.max(1, parseInt(val, 10) || 1))
                    )
                  }
                  quickPresets={[
                    { label: "1", value: "1" },
                    { label: "3", value: "3" },
                    { label: "5", value: "5" },
                    { label: "8", value: "8" },
                    { label: "10", value: "10" },
                  ]}
                  inputClassName="h-9 text-sm font-mono text-center font-bold text-blue-700 bg-white border-blue-400 focus:border-blue-600"
                  placeholder="3"
                />
              </div>

              {/* 4. Add Button (Span 2) */}
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={!newSongInput.trim()}
                  className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950/40"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Song
                </Button>
              </div>
            </div>

            {/* Quick Duration Preset Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-indigo-300">Quick Time Presets:</span>
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewDuration(preset)}
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer",
                    newDuration === preset
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold"
                      : "bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Library Table Controls & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <Input
            placeholder="Search songs in library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-7 h-8 text-xs bg-white border-blue-400 text-blue-700 placeholder:text-blue-400 focus:border-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 z-10"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Adjustable Table Toolbar (Density & Reset) */}
        <AdjustableTableToolbar
          density={density}
          onDensityChange={setDensity}
          onResetColumns={resetWidths}
          onResetAll={resetAll}
          rowCount={filteredSongs.length}
          columnCount={5}
        />
      </div>

      {/* Adjustable Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/90 shadow-inner">
        <table className={cn("w-full text-left border-collapse", densityStyle.fontSize)}>
          <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/90 border-b border-slate-800 select-none">
            <tr>
              {/* 1. Song Title */}
              <th
                style={{ width: widths.title, minWidth: widths.title }}
                className={cn(
                  "relative group/resize font-semibold text-slate-300",
                  densityStyle.headerPaddingY,
                  densityStyle.paddingX
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Song Title</span>
                </div>
                <ColumnResizeHandle
                  onResizeStart={(e) =>
                    startResize(
                      "title",
                      "touches" in e ? e.touches[0].clientX : e.clientX
                    )
                  }
                  onDoubleClick={() => resetColumn("title")}
                  isResizing={activeResizingColumn === "title"}
                />
              </th>

              {/* 2. Default Time / Duration */}
              <th
                style={{ width: widths.duration, minWidth: widths.duration }}
                className={cn(
                  "relative group/resize font-semibold text-slate-300 text-center",
                  densityStyle.headerPaddingY,
                  densityStyle.paddingX
                )}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Default Time</span>
                </div>
                <ColumnResizeHandle
                  onResizeStart={(e) =>
                    startResize(
                      "duration",
                      "touches" in e ? e.touches[0].clientX : e.clientX
                    )
                  }
                  onDoubleClick={() => resetColumn("duration")}
                  isResizing={activeResizingColumn === "duration"}
                />
              </th>

              {/* 3. Default Difficulty Level */}
              <th
                style={{ width: widths.difficulty, minWidth: widths.difficulty }}
                className={cn(
                  "relative group/resize font-semibold text-slate-300 text-center",
                  densityStyle.headerPaddingY,
                  densityStyle.paddingX
                )}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Difficulty</span>
                </div>
                <ColumnResizeHandle
                  onResizeStart={(e) =>
                    startResize(
                      "difficulty",
                      "touches" in e ? e.touches[0].clientX : e.clientX
                    )
                  }
                  onDoubleClick={() => resetColumn("difficulty")}
                  isResizing={activeResizingColumn === "difficulty"}
                />
              </th>

              {/* 4. Status (Retired) */}
              <th
                style={{ width: widths.status, minWidth: widths.status }}
                className={cn(
                  "relative group/resize font-semibold text-slate-300 text-center",
                  densityStyle.headerPaddingY,
                  densityStyle.paddingX
                )}
              >
                <span>Status</span>
                <ColumnResizeHandle
                  onResizeStart={(e) =>
                    startResize(
                      "status",
                      "touches" in e ? e.touches[0].clientX : e.clientX
                    )
                  }
                  onDoubleClick={() => resetColumn("status")}
                  isResizing={activeResizingColumn === "status"}
                />
              </th>

              {/* 5. Actions */}
              <th
                style={{ width: widths.actions, minWidth: widths.actions }}
                className={cn(
                  "font-semibold text-slate-300 text-right sticky right-0 bg-slate-900/95 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.3)]",
                  densityStyle.headerPaddingY,
                  densityStyle.paddingX
                )}
              >
                <span>Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/80">
            {filteredSongs.map((song) => {
              const isEditing = editingSongId === song.id;

              return (
                <tr
                  key={song.id}
                  className={cn(
                    "hover:bg-slate-900/60 transition-colors",
                    song.retired ? "bg-slate-950/40 opacity-70" : "bg-slate-950/20"
                  )}
                >
                  {/* 1. Title */}
                  <td
                    style={{ width: widths.title, minWidth: widths.title }}
                    className={cn(
                      densityStyle.paddingY,
                      densityStyle.paddingX,
                      "font-medium"
                    )}
                  >
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-8 text-xs bg-slate-900 border-cyan-500 text-white font-medium"
                        placeholder="Song Title"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium truncate",
                            song.retired
                              ? "text-slate-500 line-through"
                              : "text-indigo-100"
                          )}
                          title={song.title}
                        >
                          {song.title}
                        </span>
                        {song.retired && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            Retired
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* 2. Default Time / Duration */}
                  <td
                    style={{ width: widths.duration, minWidth: widths.duration }}
                    className={cn(
                      densityStyle.paddingY,
                      densityStyle.paddingX,
                      "text-center font-mono whitespace-nowrap"
                    )}
                  >
                    {isEditing ? (
                      <Input
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                        placeholder="mm:ss"
                        className="h-8 text-xs font-mono text-center bg-slate-900 border-emerald-500 text-emerald-300"
                      />
                    ) : song.duration !== undefined && song.duration > 0 ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-semibold text-xs"
                        title={`${song.duration} seconds default session duration`}
                      >
                        <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                        {formatDurationColon(song.duration)}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs italic font-sans">—</span>
                    )}
                  </td>

                  {/* 3. Default Difficulty */}
                  <td
                    style={{ width: widths.difficulty, minWidth: widths.difficulty }}
                    className={cn(
                      densityStyle.paddingY,
                      densityStyle.paddingX,
                      "text-center font-mono whitespace-nowrap"
                    )}
                  >
                    {isEditing ? (
                      <div className="flex justify-center">
                        <NumericKeypadInput
                          compact
                          label="Difficulty"
                          min={1}
                          max={12}
                          value={editDifficulty}
                          onChange={(val) =>
                            setEditDifficulty(
                              val === "" ? 1 : Math.min(12, Math.max(1, parseInt(val, 10) || 1))
                            )
                          }
                          inputClassName="h-8 w-16 text-xs text-center font-bold text-amber-300 bg-slate-900 border-amber-500"
                        />
                      </div>
                    ) : song.difficulty !== undefined && song.difficulty >= 1 ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-semibold text-xs"
                        title={`Default Difficulty: Level ${song.difficulty}`}
                      >
                        <Gauge className="w-3 h-3 text-amber-400 shrink-0" />
                        Level {song.difficulty}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs italic font-sans">—</span>
                    )}
                  </td>

                  {/* 4. Status (Retired Toggle) */}
                  <td
                    style={{ width: widths.status, minWidth: widths.status }}
                    className={cn(
                      densityStyle.paddingY,
                      densityStyle.paddingX,
                      "text-center"
                    )}
                  >
                    <label
                      htmlFor={`retired-${song.id}`}
                      className="inline-flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        id={`retired-${song.id}`}
                        className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                        checked={song.retired || false}
                        onChange={() => onToggleSongRetired(song)}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          song.retired ? "text-slate-400" : "text-emerald-400"
                        )}
                      >
                        {song.retired ? "Retired" : "Active"}
                      </span>
                    </label>
                  </td>

                  {/* 5. Actions */}
                  <td
                    style={{ width: widths.actions, minWidth: widths.actions }}
                    className={cn(
                      densityStyle.paddingY,
                      densityStyle.paddingX,
                      "text-right whitespace-nowrap sticky right-0 bg-slate-950/95 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.3)]"
                    )}
                  >
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(song.id)}
                          className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 transition-colors"
                          title="Save Changes"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {onUpdateSong && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(song)}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                            title="Edit song defaults (title, time, difficulty)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteSong(song.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          title="Delete song"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {filteredSongs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="text-center text-xs text-slate-400 py-8 italic"
                >
                  {searchQuery
                    ? `No songs found matching "${searchQuery}"`
                    : "No songs in your library yet. Add your first song above!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Done Button Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="text-xs text-indigo-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {songs.filter((s) => !s.retired).length} active songs in repertoire (
            {songs.filter((s) => s.retired).length} retired)
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white text-xs h-8 px-4"
        >
          Done
        </Button>
      </div>
    </div>
  );
};
