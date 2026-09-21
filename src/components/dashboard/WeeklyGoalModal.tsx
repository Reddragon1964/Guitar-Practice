import React, { useState, useEffect } from "react";
import { Target, Music, Clock, Sparkles, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Song, WeeklyGoal } from "../../types";
import { formatTimeMinutes } from "../../utils/goalCalculator";

interface WeeklyGoalModalProps {
  activeSongs: Song[];
  initialGoal?: WeeklyGoal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: { title: string; songTitle?: string; targetMinutes: number }, existingId?: string) => void;
}

const PRESET_MINUTES = [
  { label: "1h / week", minutes: 60, desc: "~9m/day" },
  { label: "2h / week", minutes: 120, desc: "~17m/day" },
  { label: "3h / week", minutes: 180, desc: "~26m/day" },
  { label: "5h / week", minutes: 300, desc: "~43m/day" },
  { label: "7h / week", minutes: 420, desc: "1h/day" },
  { label: "10h / week", minutes: 600, desc: "~1.4h/day" },
  { label: "20h / week", minutes: 1200, desc: "~2.9h/day" },
  { label: "40h / week", minutes: 2400, desc: "~5.7h/day" },
];

export const WeeklyGoalModal: React.FC<WeeklyGoalModalProps> = ({
  activeSongs,
  initialGoal,
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedSong, setSelectedSong] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [hours, setHours] = useState<number>(3);
  const [minutes, setMinutes] = useState<number>(0);

  useEffect(() => {
    if (initialGoal) {
      setSelectedSong(initialGoal.songTitle || "");
      setCustomTitle(initialGoal.title);
      const totalMins = initialGoal.targetMinutes || 180;
      setHours(Math.floor(totalMins / 60));
      setMinutes(totalMins % 60);
    } else {
      setSelectedSong("");
      setCustomTitle("Overall Weekly Practice");
      setHours(3);
      setMinutes(0);
    }
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const totalTargetMinutes = Math.max(1, hours * 60 + minutes);
  const dailyAverageMinutes = Math.round(totalTargetMinutes / 7);

  const handlePresetSelect = (presetMins: number) => {
    setHours(Math.floor(presetMins / 60));
    setMinutes(presetMins % 60);
  };

  const adjustMinutes = (delta: number) => {
    const current = hours * 60 + minutes;
    const next = Math.max(15, current + delta);
    setHours(Math.floor(next / 60));
    setMinutes(next % 60);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let title = customTitle.trim();
    if (!title) {
      title = selectedSong ? `${selectedSong} Weekly Goal` : "Overall Weekly Practice";
    }

    onSave(
      {
        title,
        songTitle: selectedSong || undefined,
        targetMinutes: totalTargetMinutes,
      },
      initialGoal ? initialGoal.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <Card className="relative z-10 w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col border-indigo-700/80 bg-slate-950/95 shadow-2xl shadow-indigo-950/70 overflow-hidden rounded-2xl">
        {/* Header - Stays Pinned */}
        <CardHeader className="border-b border-indigo-800/50 p-4 sm:p-5 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl text-white">
                {initialGoal ? "Edit Weekly Practice Target" : "Define Weekly Practice Target"}
              </CardTitle>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                Set a target practice duration to track your weekly progress and momentum.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-indigo-400 hover:text-white p-1.5 rounded-lg hover:bg-indigo-900/50 transition-colors shrink-0"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 dialog-scrollbar overscroll-contain">
            {/* Target Scope: Overall vs Specific Song */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                Target Scope
              </label>
              <Select
                value={selectedSong}
                onChange={(e) => {
                  const song = e.target.value;
                  setSelectedSong(song);
                  if (song) {
                    setCustomTitle(`${song} Weekly Goal`);
                  } else {
                    setCustomTitle("Overall Weekly Practice");
                  }
                }}
                className="w-full bg-indigo-950/70 border-indigo-700 text-indigo-100 text-sm"
              >
                <option value="">Overall Weekly Practice (All Songs)</option>
                {activeSongs.map((s) => (
                  <option key={s.id} value={s.title}>
                    Song Target: {s.title}
                  </option>
                ))}
              </Select>
            </div>

            {/* Target Goal Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Goal Label / Name
              </label>
              <Input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Overall Weekly Practice"
                className="w-full bg-indigo-950/70 border-indigo-700 text-indigo-100 text-sm"
                required
              />
            </div>

            {/* Quick Preset Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                  Quick Target Presets
                </label>
                <span className="text-[11px] font-normal text-indigo-400">Click to apply</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_MINUTES.map((p) => {
                  const isSelected = totalTargetMinutes === p.minutes;
                  return (
                    <button
                      key={p.minutes}
                      type="button"
                      onClick={() => handlePresetSelect(p.minutes)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "bg-indigo-600/30 border-indigo-400 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400/50"
                          : "bg-indigo-950/40 border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/40 hover:border-indigo-700"
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{p.label}</div>
                      <div className="text-[10px] text-indigo-400/90">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Hours & Minutes Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Target Practice Time per Week
              </label>

              <div className="flex items-center gap-3 sm:gap-4 bg-indigo-950/40 p-3.5 sm:p-4 rounded-xl border border-indigo-800/60">
                <div className="flex-1 min-w-0">
                  <label className="text-[11px] text-indigo-400 mb-1 block">Hours</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-indigo-950/80 border-indigo-700 text-center text-lg font-mono font-bold text-white"
                  />
                </div>

                <span className="text-2xl font-bold text-indigo-400 pt-5">:</span>

                <div className="flex-1 min-w-0">
                  <label className="text-[11px] text-indigo-400 mb-1 block">Minutes</label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    value={minutes}
                    onChange={(e) =>
                      setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))
                    }
                    className="w-full bg-indigo-950/80 border-indigo-700 text-center text-lg font-mono font-bold text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5 pt-5 shrink-0">
                  <button
                    type="button"
                    onClick={() => adjustMinutes(15)}
                    className="px-2.5 py-1 text-xs font-medium rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition-colors"
                    title="Add 15 minutes"
                  >
                    +15m
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustMinutes(-15)}
                    className="px-2.5 py-1 text-xs font-medium rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition-colors"
                    title="Subtract 15 minutes"
                  >
                    -15m
                  </button>
                </div>
              </div>
            </div>

            {/* Target Summary Preview */}
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-700/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-xs text-indigo-300">Weekly Target</div>
                  <div className="text-sm font-bold text-white">
                    {formatTimeMinutes(totalTargetMinutes)} per week
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-indigo-400">Daily Pace</div>
                <div className="text-sm font-semibold text-emerald-400">
                  ~{formatTimeMinutes(dailyAverageMinutes)} / day
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer - Stays Pinned & Always Visible */}
          <div className="shrink-0 flex items-center justify-end gap-3 p-4 bg-slate-950/95 border-t border-indigo-800/60">
            <Button type="button" variant="ghost" onClick={onClose} className="text-indigo-300 hover:text-white">
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 shadow-md shadow-indigo-600/30"
            >
              {initialGoal ? "Save Changes" : "Create Target"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
