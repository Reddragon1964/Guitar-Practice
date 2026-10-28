import React from "react";
import { Target, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Song } from "../../types";
import { MoveableResizableFrame } from "../ui/MoveableResizableFrame";

interface GoalModalProps {
  activeSongs: Song[];
  goalSongTitle: string;
  onGoalSongTitleChange: (val: string) => void;
  goalTitle: string;
  onGoalTitleChange: (val: string) => void;
  goalDate: string;
  onGoalDateChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  activeSongs,
  goalSongTitle,
  onGoalSongTitleChange,
  goalTitle,
  onGoalTitleChange,
  goalDate,
  onGoalDateChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <MoveableResizableFrame
      isOpen={true}
      onClose={onCancel}
      title="Set New Milestone"
      subtitle="Define a target practice milestone for your guitar repertoire"
      icon={<Target className="w-5 h-5 text-indigo-400" />}
      initialWidth={520}
      initialHeight={460}
      minWidth={340}
      minHeight={320}
      ariaLabel="Set New Milestone"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-7 space-y-1.5">
            <div className="h-6 flex items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                Target Song (Optional)
              </label>
            </div>
            <Select
              value={goalSongTitle}
              onChange={(e) => onGoalSongTitleChange(e.target.value)}
              className="w-full h-10 text-sm"
            >
              <option value="">No specific song</option>
              {activeSongs.map((s) => (
                <option key={s.id} value={s.title}>
                  {s.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="sm:col-span-5 space-y-1.5">
            <div className="h-6 flex items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Target Date
              </label>
            </div>
            <Input
              type="date"
              required
              value={goalDate}
              onChange={(e) => onGoalDateChange(e.target.value)}
              className="w-full h-10 text-sm font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-6 flex items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              Goal Description
            </label>
          </div>
          <Input
            required
            value={goalTitle}
            onChange={(e) => onGoalTitleChange(e.target.value)}
            placeholder="e.g. Master the solo at 100% speed"
            className="w-full h-10 text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-indigo-800">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Add Goal</Button>
        </div>
      </form>
    </MoveableResizableFrame>
  );
};

