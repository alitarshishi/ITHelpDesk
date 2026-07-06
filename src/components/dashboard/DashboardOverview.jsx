import React, { useState, useRef } from "react";
import {
  Ticket,
  Circle,
  Clock,
  CheckCircle2,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

import PeriodSelector from "./PeriodSelector";
import StatCard from "./StatCard";
import TicketsOverTimeChart from "./TicketsOverTimeChart";
import StatusPieChart from "./StatusPieChart";
import PriorityBarChart from "./PriorityBarChart";
import CategoryBarChart from "./CategoryBarChart";
import ExportButtons from "./ExportButtons";

export default function DashboardOverview() {
  const [period, setPeriod] = useState("week");
  const { data, isLoading, isError } = useDashboardStats(period);
  const dashboardRef = useRef(null);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ticket statistics overview
          </p>
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ExportButtons dashboardRef={dashboardRef} period={period} />
        </div>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">Loading dashboard...</p>
      )}
      {isError && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load dashboard stats.
        </p>
      )}

      {data && (
        <div ref={dashboardRef}>
          <div className="mb-6 flex flex-wrap gap-4">
            <StatCard
              label="Total Tickets"
              value={data.totalTickets}
              sub="In selected period"
              icon={Ticket}
            />
            <StatCard
              label="Open"
              value={data.openTickets}
              sub="Awaiting action"
              icon={Circle}
            />
            <StatCard
              label="In Progress"
              value={data.inProgressTickets}
              sub="Being worked on"
              icon={Clock}
            />
            <StatCard
              label="Resolved"
              value={data.resolvedTickets}
              sub="Completed"
              icon={CheckCircle2}
            />
            <StatCard
              label="Closed"
              value={data.closedTickets}
              sub="Finalized"
              icon={Lock}
            />
            <StatCard
              label="Escalated"
              value={data.escalatedTickets}
              sub="Needs reassignment"
              icon={AlertTriangle}
            />
          </div>

          <div className="mb-5">
            <TicketsOverTimeChart data={data.ticketsOverTime} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <StatusPieChart data={data.statusBreakdown} />
            <PriorityBarChart data={data.priorityBreakdown} />
          </div>

          <div className="mt-5">
            <CategoryBarChart data={data.categoryBreakdown} />
          </div>
        </div>
      )}
    </div>
  );
}
