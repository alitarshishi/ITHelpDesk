import React from "react";

const PERIODS = [
  { value: "week", label: "Last Week" },
  { value: "2weeks", label: "Last 2 Weeks" },
  { value: "month", label: "Last Month" },
];

export default function PeriodSelector({ value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        background: "#f3f4f6",
        borderRadius: "8px",
        padding: "3px",
        width: "fit-content",
      }}
    >
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          style={{
            background: value === p.value ? "#fff" : "transparent",
            border: "none",
            borderRadius: "6px",
            padding: "6px 16px",
            fontSize: "0.82rem",
            fontWeight: value === p.value ? 600 : 400,
            color: value === p.value ? "#111" : "#6b7280",
            cursor: "pointer",
            boxShadow: value === p.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
