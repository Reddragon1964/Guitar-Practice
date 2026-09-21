import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Song } from "../../types";

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
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Set New Milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-indigo-200">
                Target Song (Optional)
              </label>
              <Select
                value={goalSongTitle}
                onChange={(e) => onGoalSongTitleChange(e.target.value)}
              >
                <option value="">No specific song</option>
                {activeSongs.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-indigo-200">Goal Description</label>
              <Input
                required
                value={goalTitle}
                onChange={(e) => onGoalTitleChange(e.target.value)}
                placeholder="e.g. Master the solo"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-indigo-200">Target Date</label>
              <Input
                type="date"
                required
                value={goalDate}
                onChange={(e) => onGoalDateChange(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-indigo-800">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Add Goal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
