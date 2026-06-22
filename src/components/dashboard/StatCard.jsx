import React from "react";

export default function StatCard({ label, value, sub, accent }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        padding: "20px 24px",
        flex: "1 1 180px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ fontSize: "1.1rem" }}>{accent}</span>
      </div>
      <div
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          margin: "8px 0 4px",
          color: "#111",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{sub}</div>
    </div>
  );
}
