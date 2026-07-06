import React from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
  created: {
    label: "Created",
    color: "hsl(217 91% 60%)",
  },
  resolved: {
    label: "Resolved",
    color: "hsl(142 71% 45%)",
  },
};

export default function TicketsOverTimeChart({ data }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold">Tickets Over Time</h3>
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            fontSize={12}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="created"
            stroke="var(--color-created)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            stroke="var(--color-resolved)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  );
}
