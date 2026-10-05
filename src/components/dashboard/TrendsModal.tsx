import React from "react";
import { Printer, ArrowLeft } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Practice, Song, PrintMode } from "../../types";
import { PracticeTrendsSection } from "./PracticeTrendsSection";

interface TrendsModalProps {
  data: { label: string; accuracy: number | null; speed: number | null }[];
  practices: Practice[];
  activeSongs: Song[];
  usageLogs?: { date: string; minutes: number }[];
  printMode: PrintMode;
  onPrint: (mode: "trends") => void;
  onBack: () => void;
}

export const TrendsModal: React.FC<TrendsModalProps> = ({
  data,
  practices,
  activeSongs,
  usageLogs = [],
  printMode,
  onPrint,
  onBack,
}) => {
  const isPrintHidden = printMode && printMode !== "trends" && printMode !== "all";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-indigo-50">
            Practice Trends & Analytics
          </h2>
          <p className="text-xs text-indigo-300/80 mt-0.5">
            Weekly accuracy improvements, total practice hours over time, and 30-day session trends
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            className="border-indigo-700 text-indigo-100 hover:bg-indigo-800"
            onClick={() => onPrint("trends")}
          >
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-indigo-300 hover:text-indigo-100 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Weekly Accuracy Improvements & Total Practice Hours Over Time */}
      <PracticeTrendsSection
        practices={practices}
        activeSongs={activeSongs}
        usageLogs={usageLogs}
        printMode={printMode}
        onPrint={onPrint}
      />

      {/* 30-Day Daily Accuracy & Speed Improvements */}
      <Card
        className={`border-indigo-500/30 bg-indigo-900/10 shadow-[0_0_15px_rgba(99,102,241,0.1)] ${
          isPrintHidden ? "print:hidden" : ""
        }`}
      >
        <CardHeader>
          <CardTitle className="text-indigo-100">
            30-Day Daily Accuracy & Speed Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3730a3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#818cf8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Date",
                    position: "insideBottom",
                    offset: -15,
                    fill: "#a5b4fc",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#10b981"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  unit="%"
                  label={{
                    value: "Accuracy (%)",
                    angle: -90,
                    position: "insideLeft",
                    offset: -10,
                    fill: "#10b981",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f59e0b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, "dataMax + 20"]}
                  unit="%"
                  label={{
                    value: "Speed (%)",
                    angle: 90,
                    position: "insideRight",
                    offset: -20,
                    fill: "#f59e0b",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  cursor={{ stroke: "#312e81", strokeWidth: 2 }}
                  contentStyle={{
                    backgroundColor: "#1e1b4b",
                    borderRadius: "8px",
                    border: "1px solid #3730a3",
                    color: "#e0e7ff",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.5)",
                  }}
                  itemStyle={{ color: "#e0e7ff" }}
                />
                <Legend
                  verticalAlign="top"
                  height={28}
                  wrapperStyle={{ fontSize: "12px", color: "#c7d2fe" }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  name="Avg Accuracy (%)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10b981" }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="speed"
                  name="Avg Speed (%)"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#f59e0b" }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
