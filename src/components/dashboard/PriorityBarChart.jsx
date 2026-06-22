import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = {
  Low: "#3b82f6",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#7f1d1d",
};

export default function PriorityBarChart({ data }) {
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
        By Priority
      </h6>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS[entry.priority] || "#9ca3af"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
