import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface AiAnalysisModalProps {
  isAnalyzing: boolean;
  aiAnalysis: string;
  onReanalyze: () => void;
  onBack: () => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isAnalyzing,
  aiAnalysis,
  onReanalyze,
  onBack,
}) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="border-indigo-800 bg-indigo-950/40 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-indigo-100">
            <Sparkles className="w-6 h-6 text-amber-400" /> AI Practice Analysis
          </CardTitle>
          <Button variant="ghost" onClick={onBack}>
            Back to Dashboard
          </Button>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 text-indigo-300">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
              <p>Analyzing your performance...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-indigo max-w-none">
              {aiAnalysis ? (
                <div className="space-y-4 whitespace-pre-wrap text-indigo-200">
                  {aiAnalysis}
                </div>
              ) : (
                <p className="text-indigo-400 text-center py-8">No analysis available.</p>
              )}
            </div>
          )}
          {!isAnalyzing && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={onReanalyze} className="gap-2">
                <Sparkles className="w-4 h-4" /> Re-analyze Performance
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
