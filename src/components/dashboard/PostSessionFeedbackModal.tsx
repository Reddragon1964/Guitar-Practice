import React, { useState, useEffect } from "react";
import { Star, MessageSquare, X, Check, Music, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Practice } from "../../types";
import { formatDurationColon, formatDurationLabel } from "../../utils/durationFormat";

interface PostSessionFeedbackModalProps {
  isOpen: boolean;
  practice: Practice | null;
  onClose: () => void;
  onSaveFeedback: (practiceId: string, rating: number, note: string) => Promise<void> | void;
}

const DIFFICULTY_LEVELS = [
  { rating: 1, label: "Very Easy", desc: "Breezed through comfortably" },
  { rating: 2, label: "Easy", desc: "Smooth with minimal hesitation" },
  { rating: 3, label: "Moderate", desc: "Good challenge & solid focus" },
  { rating: 4, label: "Challenging", desc: "Pushed my limits & required effort" },
  { rating: 5, label: "Very Hard", desc: "Demanding / very tricky passages" },
];

const QUICK_TAGS = [
  "Tricky rhythm",
  "Smooth chord changes",
  "Work on speed",
  "Nailed the transition",
  "Focus on clean fretting",
  "Breakthrough session!",
];

export const PostSessionFeedbackModal: React.FC<PostSessionFeedbackModalProps> = ({
  isOpen,
  practice,
  onClose,
  onSaveFeedback,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [noteText, setNoteText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (practice) {
      setRating(practice.difficultyRating || 0);
      setNoteText(practice.note || "");
      setHoverRating(0);
      setIsSaved(false);
    }
  }, [practice, isOpen]);

  if (!isOpen || !practice) return null;

  const currentDisplayRating = hoverRating || rating;
  const activeLevelInfo = DIFFICULTY_LEVELS.find((l) => l.rating === currentDisplayRating);

  const handleSelectQuickTag = (tag: string) => {
    if (!noteText.trim()) {
      setNoteText(tag);
    } else if (!noteText.includes(tag)) {
      setNoteText((prev) => `${prev.trim()}; ${tag}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practice) return;

    setIsSubmitting(true);
    try {
      await onSaveFeedback(practice.id, rating, noteText.trim());
      setIsSaved(true);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error("Failed to save feedback", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <Card className="relative z-10 w-full max-w-lg max-h-[90vh] flex flex-col border-indigo-700/80 bg-slate-950/95 shadow-2xl shadow-indigo-950/70 overflow-hidden rounded-2xl">
        {/* Header */}
        <CardHeader className="border-b border-indigo-800/50 p-4 sm:p-5 bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-950/80 shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shrink-0">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl text-white">
                Post-Session Feedback
              </CardTitle>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                Reflect on your practice and rate session difficulty.
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
            {/* Session Context Banner */}
            <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-indigo-900/60 text-indigo-300 shrink-0">
                  <Music className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {practice.songTitle}
                  </div>
                  <div className="text-[11px] text-indigo-300/80 flex items-center gap-2">
                    <span>Level {practice.difficulty}</span>
                    {practice.duration !== undefined && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-300 font-mono font-medium">
                          {formatDurationColon(practice.duration)} ({formatDurationLabel(practice.duration)})
                        </span>
                      </>
                    )}
                    {practice.accuracy > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-200">{practice.accuracy}% accuracy</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-700/50 text-indigo-300">
                  {practice.date}
                </span>
              </div>
            </div>

            {/* 1-5 Star Difficulty Rating Section */}
            <div className="space-y-2.5 p-4 rounded-xl bg-gradient-to-b from-indigo-950/40 to-slate-900/60 border border-indigo-800/50">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Session Difficulty Rating (1-5 Stars)
                </label>
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-200 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Star Buttons */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= currentDisplayRating;
                  const isSelected = starVal <= rating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1.5 sm:p-2 rounded-xl transition-all transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                      aria-label={`Rate difficulty ${starVal} out of 5 stars`}
                      title={`${starVal} Star${starVal > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                          isFilled
                            ? "fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                            : "text-slate-600 hover:text-indigo-400"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Difficulty Description Box */}
              <div className="text-center min-h-[42px] flex flex-col items-center justify-center">
                {activeLevelInfo ? (
                  <div className="animate-in fade-in duration-150">
                    <span className="text-sm font-bold text-amber-300">
                      {activeLevelInfo.rating} Star{activeLevelInfo.rating > 1 ? "s" : ""} — {activeLevelInfo.label}
                    </span>
                    <p className="text-xs text-indigo-300/80 mt-0.5">
                      {activeLevelInfo.desc}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-indigo-400/70 italic">
                    Click a star to rate how challenging this session felt
                  </span>
                )}
              </div>
            </div>

            {/* Small Note Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Session Note
              </label>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add notes on what went well, difficult sections, metronome settings, or focus for next time..."
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-indigo-700/80 bg-indigo-950/70 text-indigo-100 placeholder:text-indigo-400/60 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all dialog-scrollbar resize-none"
              />

              <div className="flex items-center justify-between text-[11px] text-indigo-400/70">
                <span>Reflections help track your progress over time</span>
                <span>{noteText.length}/500</span>
              </div>

              {/* Quick Preset Tags */}
              <div className="pt-1">
                <div className="text-[11px] font-medium text-indigo-400 mb-1.5">
                  Quick tags (click to add):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectQuickTag(tag)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 hover:text-white border border-indigo-700/50 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="shrink-0 flex items-center justify-between p-4 bg-slate-950/95 border-t border-indigo-800/60">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-indigo-400 hover:text-white"
            >
              Skip for now
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 shadow-md shadow-indigo-600/30 gap-1.5"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Saved!
                </>
              ) : (
                "Save Feedback"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
