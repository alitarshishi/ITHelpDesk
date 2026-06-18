
import React, { useState, useEffect } from "react";
import { authFetch } from "../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export default function ActivityLogModal({ ticket, onClose }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res  = await authFetch(`${API_BASE_URL}/tickets/${ticket.id}/activity`);
        if (!res.ok) return;
        const data = await res.json();
        setLogs(data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [ticket.id]);

  const eventIcon = (type) => ({
    Created:       "🎫",
    Comment:       "💬",
    Reassigned:    "👤",
    StatusChanged: "🔄",
    Closed:        "✅",
  }[type] || "📋");

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1050, padding: "24px",
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: "16px",
        width: "100%", maxWidth: "560px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        maxHeight: "80vh", overflowY: "auto",
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <div>
              <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#9ca3af" }}>
                TKT-{String(ticket.id).padStart(4, "0")}
              </span>
              <h5 style={{ margin: "4px 0 0", fontWeight: 700, fontSize: "1.1rem" }}>
                Activity Log
              </h5>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none",
              fontSize: "1.4rem", cursor: "pointer", color: "#9ca3af",
            }}>×</button>
          </div>
          <hr style={{ borderColor: "#f3f4f6", margin: "0 0 20px" }} />
        </div>

        <div style={{ padding: "0 28px 28px" }}>
          {loading && <p style={{ color: "#9ca3af" }}>Loading activity...</p>}
          {!loading && logs.length === 0 && (
            <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>No activity recorded yet.</p>
          )}
          <div style={{ position: "relative" }}>
            {logs.length > 0 && (
              <div style={{
                position: "absolute", left: "15px", top: "8px",
                bottom: "8px", width: "2px", background: "#e5e7eb",
              }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {logs.map((log) => (
                <div key={log.id} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#f3f4f6", border: "2px solid #e5e7eb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.85rem", flexShrink: 0, zIndex: 1,
                  }}>
                    {eventIcon(log.eventType)}
                  </div>
                  <div style={{ paddingTop: "4px" }}>
                    <div style={{ fontSize: "0.85rem", color: "#374151", fontWeight: 500 }}>
                      {log.action}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "2px" }}>
                      {log.userName && <span style={{ marginRight: "8px" }}>👤 {log.userName}</span>}
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}