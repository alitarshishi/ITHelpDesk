import React from "react";
import { Pie, PieChart, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
  Open: { label: "Open", color: "hsl(217 91% 60%)" },
  "In Progress": { label: "In Progress", color: "hsl(38 92% 50%)" },
  Resolved: { label: "Resolved", color: "hsl(142 71% 45%)" },
  Closed: { label: "Closed", color: "hsl(220 9% 46%)" },
  Escalated: { label: "Escalated", color: "hsl(0 72% 51%)" },
};

export default function StatusPieChart({ data }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold">Status Breakdown</h3>
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            outerRadius={90}
            label
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={chartConfig[entry.status]?.color || "hsl(220 9% 70%)"}
              />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="status" />} />
        </PieChart>
      </ChartContainer>
    </Card>
  );
}
