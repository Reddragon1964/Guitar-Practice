import React from "react";
import { Printer } from "lucide-react";
import { Button } from "../ui/button";
import { PrintMode } from "../../types";

interface PrintOverlaysProps {
  printError: boolean;
  onDismissError: () => void;
  printMode: PrintMode;
  onCancelPrint: () => void;
}

export const PrintOverlays: React.FC<PrintOverlaysProps> = ({
  printError,
  onDismissError,
  printMode,
  onCancelPrint,
}) => {
  return (
    <>
      {printError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden p-4">
          <div className="bg-slate-900 border border-indigo-700 shadow-2xl rounded-xl p-8 max-w-md w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-amber-900/30 p-3 rounded-full shrink-0">
                <Printer className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">
                  Preview Printing Blocked
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  Your browser's security settings prevent printing directly from inside an embedded
                  preview window.
                </p>
                <div className="bg-slate-800 rounded p-4 border border-slate-700 mb-2">
                  <p className="text-sm font-medium text-slate-200 mb-2">To print this page:</p>
                  <ol className="list-decimal pl-5 text-sm text-slate-400 space-y-1">
                    <li>Look at the top right of this preview panel</li>
                    <li>
                      Click the <strong>"Open in new tab"</strong> icon
                    </li>
                    <li>Try printing again from the new tab</li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={onDismissError}
                className="bg-indigo-600 hover:bg-indigo-500 text-white w-full"
              >
                Got it, thanks
              </Button>
            </div>
          </div>
        </div>
      )}

      {printMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center print:hidden">
          <div className="bg-indigo-900 shadow-2xl rounded-full p-2 pr-6 border border-indigo-500 flex items-center gap-4">
            <div className="bg-indigo-800 p-2 rounded-full animate-pulse">
              <Printer className="w-5 h-5 text-indigo-300" />
            </div>
            <p className="text-sm font-medium text-indigo-100">Preparing print layout...</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelPrint}
              className="ml-4 hover:bg-indigo-800 text-indigo-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
