import React, { useState, useRef } from "react";
import { useDashboardStats } from "../../hooks/useDashboardStats";
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.3rem" }}>
            Dashboard
          </h4>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
            Ticket statistics overview
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
        <ExportButtons dashboardRef={dashboardRef} period={period} />
      </div>

      {isLoading && <p style={{ color: "#6b7280" }}>Loading dashboard...</p>}
      {isError && (
        <div className="alert alert-danger">
          Failed to load dashboard stats.
        </div>
      )}

      {data && (
        <div ref={dashboardRef}>
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <StatCard
              label="Total Tickets"
              value={data.totalTickets}
              sub="In selected period"
              accent="🎫"
            />
            <StatCard
              label="Open"
              value={data.openTickets}
              sub="Awaiting action"
              accent="🟠"
            />
            <StatCard
              label="In Progress"
              value={data.inProgressTickets}
              sub="Being worked on"
              accent="🔵"
            />
            <StatCard
              label="Resolved"
              value={data.resolvedTickets}
              sub="Completed"
              accent="🟢"
            />
            <StatCard
              label="Closed"
              value={data.closedTickets}
              sub="Finalized"
              accent="⚪"
            />
            <StatCard
              label="Escalated"
              value={data.escalatedTickets}
              sub="Needs reassignment"
              accent="🔴"
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <TicketsOverTimeChart data={data.ticketsOverTime} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            <StatusPieChart data={data.statusBreakdown} />
            <PriorityBarChart data={data.priorityBreakdown} />
          </div>

          <div style={{ marginTop: "20px" }}>
            <CategoryBarChart data={data.categoryBreakdown} />
          </div>
        </div>
      )}
    </div>
  );
}
