import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  Open: "#1d4ed8",
  "In Progress": "#d97706",
  Resolved: "#16a34a",
  Closed: "#6b7280",
  Escalated: "#dc2626",
};

export default function StatusPieChart({ data }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        padding: "20px 24px",
      }}
    >
      <h6
        style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "16px" }}
      >
        Status Breakdown
      </h6>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS[entry.status] || "#9ca3af"} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
