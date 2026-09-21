import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Song } from "../../types";
import { cn } from "../../lib/utils";

interface PracticeSessionModalProps {
  editingPracticeId: string | null;
  activeSongs: Song[];
  songTitle: string;
  onSongTitleChange: (newTitle: string) => void;
  difficulty: number;
  onDifficultyChange: (val: number) => void;
  practiceDate: string;
  onPracticeDateChange: (val: string) => void;
  correctNotes: string;
  onCorrectNotesChange: (val: string) => void;
  totalNotes: string;
  onTotalNotesChange: (val: string) => void;
  duration: string;
  onDurationChange: (val: string) => void;
  isPartial: boolean;
  onIsPartialChange: (val: boolean) => void;
  isTestSession: boolean;
  onIsTestSessionChange: (checked: boolean) => void;
  score: string;
  onScoreChange: (val: string) => void;
  speed: string;
  onSpeedChange: (val: string) => void;
  note: string;
  onNoteChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const PracticeSessionModal: React.FC<PracticeSessionModalProps> = ({
  editingPracticeId,
  activeSongs,
  songTitle,
  onSongTitleChange,
  difficulty,
  onDifficultyChange,
  practiceDate,
  onPracticeDateChange,
  correctNotes,
  onCorrectNotesChange,
  totalNotes,
  onTotalNotesChange,
  duration,
  onDurationChange,
  isPartial,
  onIsPartialChange,
  isTestSession,
  onIsTestSessionChange,
  score,
  onScoreChange,
  speed,
  onSpeedChange,
  note,
  onNoteChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingPracticeId ? "Edit Practice Session" : "Log Practice Session"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-indigo-200">
                  Song / Exercise Title
                </label>
                {activeSongs.length > 0 ? (
                  <Select
                    required
                    value={songTitle}
                    onChange={(e) => onSongTitleChange(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a song...
                    </option>
                    {activeSongs.map((s) => (
                      <option key={s.id} value={s.title}>
                        {s.title}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="text-sm text-amber-300 bg-amber-900/20 p-3 rounded border border-amber-800">
                    Please add some songs to your library first using the "Songs" button on the
                    dashboard.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-200">Difficulty (1-12)</label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={difficulty}
                  onChange={(e) => onDifficultyChange(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-indigo-200">Date</label>
                <Input
                  type="date"
                  required
                  value={practiceDate}
                  onChange={(e) => onPracticeDateChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isTestSession ? "text-indigo-400/40 cursor-not-allowed" : "text-indigo-200"
                  )}
                >
                  Correct Notes
                </label>
                <Input
                  type="number"
                  min="0"
                  required={!isTestSession}
                  disabled={isTestSession}
                  value={isTestSession ? "" : correctNotes}
                  onChange={(e) => onCorrectNotesChange(e.target.value)}
                  placeholder={isTestSession ? "N/A for test session" : "e.g. 142"}
                  className={cn(
                    "transition-all",
                    isTestSession &&
                      "opacity-40 bg-indigo-950/20 border-indigo-900/40 cursor-not-allowed placeholder:text-indigo-500/40"
                  )}
                />
              </div>

              <div className="space-y-2">
                <label
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isTestSession ? "text-indigo-400/40 cursor-not-allowed" : "text-indigo-200"
                  )}
                >
                  Total Notes to Play
                </label>
                <Input
                  type="number"
                  min="1"
                  required={!isTestSession}
                  disabled={isTestSession}
                  value={totalNotes}
                  onChange={(e) => onTotalNotesChange(e.target.value)}
                  placeholder={isTestSession ? "Carried from song" : "e.g. 150"}
                  className={cn(
                    "transition-all",
                    isTestSession &&
                      "opacity-40 bg-indigo-950/20 border-indigo-900/40 cursor-not-allowed placeholder:text-indigo-500/40"
                  )}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="flex flex-wrap items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPartial"
                      className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      checked={isPartial}
                      onChange={(e) => onIsPartialChange(e.target.checked)}
                    />
                    <label
                      htmlFor="isPartial"
                      className="text-sm font-medium text-indigo-200 cursor-pointer"
                    >
                      Partial Song Practice
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isTestSession"
                      className="rounded border-indigo-700 bg-indigo-900/50 text-indigo-500 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      checked={isTestSession}
                      onChange={(e) => onIsTestSessionChange(e.target.checked)}
                    />
                    <label
                      htmlFor="isTestSession"
                      className="text-sm font-medium text-indigo-200 cursor-pointer"
                    >
                      Test Session
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="score"
                      className={cn(
                        "text-sm font-medium whitespace-nowrap transition-colors",
                        isTestSession
                          ? "text-indigo-200 cursor-pointer"
                          : "text-indigo-400/40 cursor-not-allowed"
                      )}
                    >
                      Score
                    </label>
                    <Input
                      type="number"
                      id="score"
                      disabled={!isTestSession}
                      min="0"
                      max="999999999999999"
                      maxLength={15}
                      className={cn(
                        "h-9 w-48 text-sm font-mono transition-all",
                        !isTestSession &&
                          "opacity-40 bg-indigo-950/20 border-indigo-900/40 cursor-not-allowed"
                      )}
                      value={score}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.length <= 15) {
                          onScoreChange(val);
                        }
                      }}
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <label className="text-sm font-medium text-indigo-200">Speed (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={speed}
                  onChange={(e) => onSpeedChange(e.target.value)}
                  placeholder="e.g. 100"
                />

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-indigo-200">
                      Duration (Minutes)
                    </label>
                    <div className="flex gap-1">
                      {["15", "30", "45", "60"].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => onDurationChange(mins)}
                          className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 hover:bg-indigo-800 border border-indigo-700/60"
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    type="number"
                    min="1"
                    max="600"
                    value={duration}
                    onChange={(e) => onDurationChange(e.target.value)}
                    placeholder="e.g. 30 (optional)"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <label className="text-sm font-medium text-indigo-200">Session Notes</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-indigo-700 bg-indigo-950/60 text-indigo-50 px-3 py-2 text-sm placeholder:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="e.g. Focused on the bridge section"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-indigo-800">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={activeSongs.length === 0}>
                {editingPracticeId ? "Update Session" : "Save Session"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
