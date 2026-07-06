import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  count: {
    label: "Tickets",
    color: "hsl(217 91% 60%)",
  },
};

export default function CategoryBarChart({ data }) {
  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-semibold">By Category</h3>
      <ChartContainer config={chartConfig} className="h-[260px] w-full">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="category"
            tickLine={false}
            axisLine={false}
            width={80}
            fontSize={12}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
