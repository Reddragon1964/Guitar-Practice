import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  Trash2,
  Copy,
  Check,
  Printer,
  ChevronRight,
  TrendingUp,
  History,
  FileText,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { AiAssessment } from "../../types";
import { cn } from "../../lib/utils";
import { printAssessmentDirectly, AssessmentData } from "../../utils/printAssessment";
import { AssessmentPrintModal } from "./AssessmentPrintModal";

interface AiAnalysisModalProps {
  assessments: AiAssessment[];
  isAnalyzing: boolean;
  onGenerateAssessment: () => Promise<void> | void;
  onDeleteAssessment: (id: string) => void;
  onBack: () => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  assessments,
  isAnalyzing,
  onGenerateAssessment,
  onDeleteAssessment,
  onBack,
}) => {
  // Sort assessments by timestamp descending (newest first)
  const sortedAssessments = useMemo(() => {
    return [...assessments].sort((a, b) => b.createdAt - a.createdAt);
  }, [assessments]);

  // Selected assessment ID (defaults to newest assessment)
  const [selectedId, setSelectedId] = useState<string>(() => {
    return sortedAssessments[0]?.id || "";
  });

  // Keep selected assessment up to date when new one is generated
  const activeAssessment = useMemo(() => {
    if (selectedId) {
      const found = sortedAssessments.find((a) => a.id === selectedId);
      if (found) return found;
    }
    return sortedAssessments[0] || null;
  }, [sortedAssessments, selectedId]);

  const [copied, setCopied] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCopy = () => {
    if (!activeAssessment) return;
    navigator.clipboard.writeText(
      `AI Practice Assessment (${activeAssessment.date} at ${activeAssessment.time})\n\n${activeAssessment.analysis}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = async () => {
    if (!activeAssessment) return;
    setIsPrintModalOpen(true);
    // Simultaneously trigger direct print so browser print opens immediately if permitted
    try {
      await printAssessmentDirectly({
        date: activeAssessment.date,
        time: activeAssessment.time,
        analysis: activeAssessment.analysis,
        sessionCount: activeAssessment.sessionCount,
      });
    } catch (err) {
      console.warn("Direct assessment print caught:", err);
    }
  };

  // Group assessments by date for clean visual organization
  const filteredAssessments = useMemo(() => {
    if (!searchTerm.trim()) return sortedAssessments;
    const q = searchTerm.toLowerCase();
    return sortedAssessments.filter(
      (a) =>
        a.date.includes(q) ||
        a.time.toLowerCase().includes(q) ||
        a.analysis.toLowerCase().includes(q)
    );
  }, [sortedAssessments, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Top Banner & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              AI Practice Assessment Archive
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 border border-indigo-700/80">
                {assessments.length} {assessments.length === 1 ? "Assessment" : "Assessments"} Saved
              </span>
            </h2>
            <p className="text-xs text-indigo-300/80">
              Every coaching assessment is preserved chronologically by date and time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onGenerateAssessment}
            disabled={isAnalyzing}
            className="h-9 gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md shadow-amber-950/50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing Performance...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate New Assessment</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-9 text-xs border-indigo-700/80 bg-indigo-950/70 hover:bg-indigo-800 text-indigo-200"
          >
            Dashboard
          </Button>
        </div>
      </div>

      {/* Main 2-Column Assessment Layout */}
      {sortedAssessments.length === 0 && !isAnalyzing ? (
        <Card className="border-indigo-800/70 bg-slate-950/90 shadow-xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-900/50 border border-indigo-700/60 flex items-center justify-center text-amber-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold text-white">No Practice Assessments Saved Yet</h3>
            <p className="text-xs text-indigo-300/80">
              Run your first AI assessment to analyze recent session accuracy, speed trends, and milestone progress. Every assessment is permanently kept by date and time.
            </p>
          </div>
          <div>
            <Button
              onClick={onGenerateAssessment}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-10 px-6 shadow-lg shadow-indigo-950/80"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generate My First Assessment
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Assessment Chronological Timeline Selector */}
          <div className="lg:col-span-4 space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-800/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  Assessment History
                </span>
                <span className="text-[10px] font-mono text-indigo-300">
                  By Date & Time
                </span>
              </div>

              {/* Quick Search in History */}
              {sortedAssessments.length > 4 && (
                <input
                  type="text"
                  placeholder="Filter by date or text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-white placeholder:text-indigo-400/60 focus:outline-hidden focus:border-indigo-400"
                />
              )}
            </div>

            {/* Assessment Cards List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto dialog-scrollbar pr-1">
              {filteredAssessments.map((item, idx) => {
                const isSelected = activeAssessment?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1.5 group relative",
                      isSelected
                        ? "bg-indigo-900/60 border-indigo-500 text-white shadow-md shadow-indigo-950/60 ring-1 ring-indigo-400/60"
                        : "bg-slate-950/80 border-indigo-800/60 text-indigo-300 hover:bg-indigo-950/50 hover:border-indigo-700/80"
                    )}
                  >
                    {/* Date & Time Row */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{item.date}</span>
                        {idx === 0 && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-600/60 text-emerald-300">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-300/90">
                        <Clock className="w-3 h-3 text-indigo-400" />
                        <span>{item.time}</span>
                      </div>
                    </div>

                    {/* Quick Preview Snippet */}
                    <p className="text-[11px] text-indigo-300/80 line-clamp-2 leading-relaxed">
                      {item.analysis.slice(0, 140)}...
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between pt-1 border-t border-indigo-800/40 text-[10px] text-indigo-400">
                      <span>
                        {item.sessionCount ? `${item.sessionCount} sessions reviewed` : "Practice Analysis"}
                      </span>
                      <ChevronRight
                        className={cn(
                          "w-3.5 h-3.5 transition-transform",
                          isSelected ? "text-white translate-x-0.5" : "text-indigo-500 opacity-60"
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Assessment Full View */}
          <div className="lg:col-span-8">
            <Card className="border-indigo-800/70 bg-slate-950/90 shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/70 border-b border-indigo-800/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <CardTitle className="text-base text-white">
                      Practice Assessment Details
                    </CardTitle>
                    {activeAssessment && (
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-900/80 text-indigo-200 border border-indigo-700/60">
                        {activeAssessment.date} • {activeAssessment.time}
                      </span>
                    )}
                  </div>
                  {activeAssessment?.sessionCount && (
                    <p className="text-[11px] text-indigo-300/80">
                      Evaluated based on {activeAssessment.sessionCount} practice sessions in your history
                    </p>
                  )}
                </div>

                {/* Report Actions: Copy, Print, Delete */}
                {activeAssessment && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8 text-xs gap-1 border-indigo-700/80 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200"
                      title="Copy assessment report to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="h-8 text-xs gap-1 border-indigo-700/80 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200"
                      title="Print this assessment"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteAssessment(activeAssessment.id)}
                      className="h-8 text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 border border-transparent hover:border-rose-800/60 px-2"
                      title="Delete this assessment record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center py-16 text-indigo-300 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <p className="text-sm font-medium">Generating new AI practice assessment...</p>
                    <p className="text-xs text-indigo-400/80">
                      Evaluating note accuracy, target speeds, and milestone progress
                    </p>
                  </div>
                ) : activeAssessment ? (
                  <div className="space-y-4">
                    {/* Timestamp Banner */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-xs">
                      <div className="flex items-center gap-2 text-indigo-200 font-medium">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span>Assessment Recorded: <strong>{activeAssessment.date}</strong> at <strong>{activeAssessment.time}</strong></span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-2 py-0.5 rounded-md">
                        Saved in Archive
                      </span>
                    </div>

                    {/* Structured Assessment Content */}
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-indigo-900/60 text-sm leading-relaxed text-indigo-100 whitespace-pre-wrap font-sans">
                      {activeAssessment.analysis}
                    </div>
                  </div>
                ) : (
                  <p className="text-indigo-400 text-center py-10 text-xs">
                    No assessment selected. Select one from the history list on the left.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dedicated Print & Export Preview Modal */}
      <AssessmentPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        assessment={activeAssessment}
      />
    </div>
  );
};
