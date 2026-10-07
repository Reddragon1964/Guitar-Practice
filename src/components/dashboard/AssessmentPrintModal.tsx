import React, { useState } from "react";
import {
  Printer,
  Download,
  FileText,
  FileCode,
  Copy,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Calendar,
  Clock,
  Layers,
} from "lucide-react";
import { Button } from "../ui/button";
import {
  AssessmentData,
  printAssessmentDirectly,
  downloadAssessmentHtml,
  downloadAssessmentText,
  copyAssessmentToClipboard,
} from "../../utils/printAssessment";

interface AssessmentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentData | null;
}

export const AssessmentPrintModal: React.FC<AssessmentPrintModalProps> = ({
  isOpen,
  onClose,
  assessment,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [sandboxBlocked, setSandboxBlocked] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen || !assessment) return null;

  const handlePrint = async () => {
    setIsPrinting(true);
    setSandboxBlocked(false);
    setFeedbackMessage(null);

    const result = await printAssessmentDirectly(assessment);
    setIsPrinting(false);

    if (result.blockedBySandbox) {
      setSandboxBlocked(true);
      setFeedbackMessage("Native print dialog was blocked by browser iframe security.");
    } else if (result.success) {
      setFeedbackMessage("Print dialog triggered! Use your printer or Save as PDF.");
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleCopy = async () => {
    const success = await copyAssessmentToClipboard(assessment);
    if (success) {
      setCopied(true);
      setFeedbackMessage("Report copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        setFeedbackMessage(null);
      }, 2500);
    }
  };

  const handleDownloadHtml = () => {
    downloadAssessmentHtml(assessment);
    setFeedbackMessage("Downloaded standalone HTML report file!");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleDownloadText = () => {
    downloadAssessmentText(assessment);
    setFeedbackMessage("Downloaded formatted text (.txt) report!");
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-indigo-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/80 border-b border-indigo-800/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40">
              <Printer className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Print Practice Assessment Report
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 border border-indigo-700/60">
                  {assessment.date}
                </span>
              </h2>
              <p className="text-xs text-indigo-300/80">
                Print directly to your printer or export as standalone HTML / Text
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800/70 h-8 w-8 p-0 rounded-full"
            aria-label="Close print dialog"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Action Controls Ribbon */}
        <div className="px-5 py-3 bg-slate-900/90 border-b border-indigo-900/60 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Primary Print Button */}
            <Button
              onClick={handlePrint}
              disabled={isPrinting}
              className="gap-1.5 h-9 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 shadow-md shadow-indigo-950/80 transition-all hover:scale-102"
              title="Send to physical printer or save as PDF via system dialog"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? "Opening Print..." : "Print Now (Ctrl+P / Cmd+P)"}</span>
            </Button>

            {/* Standalone HTML Report Download */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadHtml}
              className="gap-1.5 h-9 text-xs border-indigo-700/80 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200"
              title="Download standalone HTML report with embedded print styles"
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>Download HTML</span>
            </Button>

            {/* Formatted Text Report Download */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadText}
              className="gap-1.5 h-9 text-xs border-indigo-700/80 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200"
              title="Download clean plain text report (.txt)"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Text (.txt)</span>
            </Button>

            {/* Copy Report */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 h-9 text-xs border-indigo-700/80 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200"
              title="Copy formatted assessment text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </Button>
          </div>

          {feedbackMessage && (
            <div className="text-xs text-indigo-200 bg-indigo-950/80 border border-indigo-700/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-fadeIn">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{feedbackMessage}</span>
            </div>
          )}
        </div>

        {/* Sandbox Warning Banner (if browser blocked iframe print) */}
        {sandboxBlocked && (
          <div className="mx-5 mt-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-3 text-xs text-amber-200 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-amber-100 font-semibold block">
                Browser Preview Security Blocked Direct Printing
              </strong>
              <p className="text-amber-200/90 leading-relaxed">
                Your browser or embedded preview iframe restricts the system print dialog.
                Click <strong>"Download HTML"</strong> above to save a self-contained report file that opens and prints in any browser, or click <strong>"Download Text"</strong> or <strong>"Copy Text"</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Printable Document Preview Area */}
        <div className="flex-1 overflow-y-auto dialog-scrollbar p-5 bg-slate-900/60">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400/80 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Document Print Preview</span>
          </div>

          {/* Authentic Clean Paper Sheet */}
          <div className="bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-8 max-w-3xl mx-auto border border-slate-300 font-sans print:p-0 print:border-none print:shadow-none">
            {/* Header */}
            <div className="border-b-[2.5px] border-indigo-700 pb-3.5 mb-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-indigo-950 tracking-tight m-0">
                  Guitar Practice Tracker
                </h1>
                <p className="text-xs text-slate-600 font-medium m-0 mt-0.5">
                  AI Practice Coach Progress Assessment Report
                </p>
              </div>
              <div className="self-start sm:self-auto text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 px-2.5 py-1 rounded-full border border-indigo-200">
                Official Report
              </div>
            </div>

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-3.5 mb-5 text-left">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-600" />
                  Assessment Date
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5">{assessment.date}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  Recorded Time
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5">{assessment.time}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-600" />
                  Data Evaluated
                </span>
                <span className="text-sm font-bold text-slate-900 mt-0.5">
                  {assessment.sessionCount !== undefined ? `${assessment.sessionCount} Sessions` : "Full History"}
                </span>
              </div>
            </div>

            {/* Analysis Text Box */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 text-xs sm:text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
              {assessment.analysis}
            </div>

            {/* Official Report Footer */}
            <div className="mt-7 pt-3.5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-1.5">
              <span>Generated by Guitar Practice Tracker AI Coach</span>
              <span>
                Document Printed on {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-950 border-t border-indigo-900/60 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-indigo-400/80">
            Tip: You can also press <kbd className="px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/60 text-white font-mono text-[10px]">Ctrl+P</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/60 text-white font-mono text-[10px]">Cmd+P</kbd>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs border-indigo-800 text-indigo-200 hover:bg-indigo-900/70"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
