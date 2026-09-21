import React from "react";
import { Printer } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { PrintMode } from "../../types";

interface WeeklyPracticeChartProps {
  data: { label: string; totalMinutes: number }[];
  printMode: PrintMode;
  onPrint: (mode: "weekly") => void;
}

export const WeeklyPracticeChart: React.FC<WeeklyPracticeChartProps> = ({
  data,
  printMode,
  onPrint,
}) => {
  const isHiddenForPrint = printMode && printMode !== "weekly" && printMode !== "all";

  const formatMinutes = (val: number) => {
    const h = Math.floor(val / 60);
    const m = val % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <Card className={isHiddenForPrint ? "print:hidden" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Weekly Practice Time</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="print:hidden h-8"
          onClick={() => onPrint("weekly")}
        >
          <Printer className="w-4 h-4 text-indigo-400" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3730a3" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#818cf8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Day",
                  position: "insideBottom",
                  offset: -15,
                  fill: "#a5b4fc",
                  fontSize: 12,
                }}
              />
              <YAxis
                stroke="#818cf8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatMinutes}
                label={{
                  value: "Time",
                  angle: -90,
                  position: "insideLeft",
                  offset: -5,
                  fill: "#a5b4fc",
                  fontSize: 12,
                }}
              />
              <Tooltip
                cursor={{ fill: "#312e81" }}
                contentStyle={{
                  backgroundColor: "#1e1b4b",
                  borderRadius: "8px",
                  border: "1px solid #3730a3",
                  color: "#e0e7ff",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.5)",
                }}
                itemStyle={{ color: "#e0e7ff" }}
                formatter={(val: number) => [formatMinutes(val), "Time"]}
              />
              <Bar
                dataKey="totalMinutes"
                name="Time"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
