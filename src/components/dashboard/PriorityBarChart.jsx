import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  Low: { label: "Low", color: "hsl(217 91% 60%)" },
  Medium: { label: "Medium", color: "hsl(38 92% 50%)" },
  High: { label: "High", color: "hsl(25 95% 53%)" },
  Critical: { label: "Critical", color: "hsl(0 74% 35%)" },
};

export default function PriorityBarChart({ data }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold">By Priority</h3>
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="priority"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            fontSize={12}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={chartConfig[entry.priority]?.color || "hsl(220 9% 70%)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
