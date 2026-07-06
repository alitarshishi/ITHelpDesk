import React, { useState } from "react";
import { FileText, FileSpreadsheet } from "lucide-react";
import { exportElementAsPdf } from "@/utils/exportDashboardPdf";
import { getToken } from "@/services/authService";

import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={exportingPdf}
        >
          <FileText className="mr-1.5 h-4 w-4" />
          {exportingPdf ? "Exporting..." : "Export PDF"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={exportingExcel}
        >
          <FileSpreadsheet className="mr-1.5 h-4 w-4" />
          {exportingExcel ? "Exporting..." : "Export Excel"}
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
