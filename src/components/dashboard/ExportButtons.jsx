import React, { useState } from "react";
import { exportElementAsPdf } from "../../utils/exportDashboardPdf";
import { getToken } from "../../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export default function ExportButtons({ dashboardRef, period }) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [error, setError] = useState("");

  const handleExportPdf = async () => {
    if (!dashboardRef.current) return;
    setExportingPdf(true);
    setError("");
    try {
      await exportElementAsPdf(
        dashboardRef.current,
        `dashboard-report-${period}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
    } catch {
      setError("Failed to export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    setError("");
    try {
      const token = getToken();
      const res = await fetch(
        `${API_BASE_URL}/export/tickets.xlsx?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-export-${period}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export Excel file.");
    } finally {
      setExportingExcel(false);
    }
  };

  const btnStyle = (loading) => ({
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "7px 14px",
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#374151",
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    opacity: loading ? 0.6 : 1,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "6px",
      }}
    >
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleExportPdf}
          disabled={exportingPdf}
          style={btnStyle(exportingPdf)}
        >
          📄 {exportingPdf ? "Exporting..." : "Export PDF"}
        </button>
        <button
          onClick={handleExportExcel}
          disabled={exportingExcel}
          style={btnStyle(exportingExcel)}
        >
          📊 {exportingExcel ? "Exporting..." : "Export Excel"}
        </button>
      </div>
      {error && (
        <span style={{ fontSize: "0.75rem", color: "#dc2626" }}>{error}</span>
      )}
    </div>
  );
}
