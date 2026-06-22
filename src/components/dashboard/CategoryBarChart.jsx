import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CategoryBarChart({ data }) {
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
        By Category
      </h6>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="category"
            tick={{ fontSize: 12 }}
            width={80}
          />
          <Tooltip />
          <Bar dataKey="count" fill="#1d4ed8" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
