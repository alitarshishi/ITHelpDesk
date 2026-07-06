import React from "react";
import { Card } from "@/components/ui/card";

export default function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <Card className="flex-1 min-w-[180px] p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </Card>
  );
}
