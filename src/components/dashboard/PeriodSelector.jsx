import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PERIODS = [
  { value: "week", label: "Last Week" },
  { value: "2weeks", label: "Last 2 Weeks" },
  { value: "month", label: "Last Month" },
];

export default function PeriodSelector({ value, onChange }) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList>
        {PERIODS.map((p) => (
          <TabsTrigger key={p.value} value={p.value}>
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
