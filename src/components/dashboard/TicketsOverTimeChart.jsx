import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function TicketsOverTimeChart({ data }) {
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
        Tickets Over Time
      </h6>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="created"
            name="Created"
            stroke="#1d4ed8"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name="Resolved"
            stroke="#16a34a"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
