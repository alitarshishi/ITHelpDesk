import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, logout, getUser } from "../services/authService";
import TicketDetailModal from "../components/TicketDetailModal";
import ActivityLogModal from "../components/ActivityLogModal";
import NotificationBell from "../components/NotificationBell";
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

//  Badges
const statusBadge = (s) => {
  const map = {
    open: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "○" },
    "in progress": {
      bg: "#fefce8",
      color: "#854d0e",
      border: "#fde68a",
      icon: "◷",
    },
    resolved: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", icon: "✓" },
    closed: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb", icon: "✓" },
  };
  const key = (s || "").toLowerCase();
  const st = map[key] || {
    bg: "#f3f4f6",
    color: "#374151",
    border: "#e5e7eb",
    icon: "",
  };
  return (
    <span
      style={{
        background: st.bg,
        color: st.color,
        border: `1px solid ${st.border}`,
        borderRadius: "999px",
        padding: "3px 12px",
        fontSize: "0.75rem",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {st.icon} {s || "—"}
    </span>
  );
};

const priorityBadge = (p) => {
  const map = {
    critical: { bg: "#7f1d1d", color: "#fff" },
    high: { bg: "#f97316", color: "#fff" },
    medium: { bg: "#f59e0b", color: "#fff" },
    low: { bg: "#3b82f6", color: "#fff" },
  };
  const st = map[(p || "").toLowerCase()] || {
    bg: "#e5e7eb",
    color: "#374151",
  };
  return (
    <span
      style={{
        background: st.bg,
        color: st.color,
        borderRadius: "999px",
        padding: "3px 12px",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {p || "—"}
    </span>
  );
};

//  Main ITAgentPage
export default function ITAgentPage() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // for details modal
  const [activityModal, setActivityModal] = useState(null); // for activity log modal

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/itagent/assigned`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data);
    } catch {
      setError("Failed to load your assigned tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const thStyle = {
    padding: "12px 16px",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  };
  const tdStyle = {
    padding: "13px 16px",
    fontSize: "0.85rem",
    color: "#374151",
    borderBottom: "1px solid #f3f4f6",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/*  Navbar  */}
      <nav
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0 32px",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "#111",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.8rem",
            }}
          >
            IT
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              IT Help Desk
            </div>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
              {currentUser?.userName || "IT Agent"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <NotificationBell />
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "7px 16px",
              fontSize: "0.85rem",
              cursor: "pointer",
              color: "#374151",
            }}
          >
            Log Out
          </button>
        </div>
      </nav>

      {/*  Content  */}
      <div style={{ padding: "32px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.3rem" }}>
            My Assigned Tickets
          </h4>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} assigned to
            you
          </p>
        </div>

        {loading && <p style={{ color: "#6b7280" }}>Loading tickets...</p>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "Ticket ID",
                      "Title",
                      "Status",
                      "Priority",
                      "Category",
                      "Assigned By",
                      "Submitted By",
                      "Created",
                      "",
                    ].map((h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          color: "#9ca3af",
                          padding: "48px",
                        }}
                      >
                        No tickets assigned to you yet
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr
                        key={t.id}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#f9fafb")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 600,
                            color: "#111",
                            fontFamily: "monospace",
                          }}
                        >
                          TKT-{String(t.id).padStart(4, "0")}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            maxWidth: "220px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.title}
                        </td>
                        <td style={tdStyle}>{statusBadge(t.statusName)}</td>
                        <td style={tdStyle}>{priorityBadge(t.priorityName)}</td>
                        <td style={tdStyle}>{t.categoryName || "—"}</td>
                        <td style={tdStyle}>
                          {t.assignedByManagerName || "—"}
                        </td>

                        <td style={tdStyle}>{t.submittedByName || "—"}</td>
                        <td style={{ ...tdStyle, color: "#9ca3af" }}>
                          {t.dateCreated
                            ? new Date(t.dateCreated).toLocaleDateString()
                            : "—"}
                        </td>

                        <td style={tdStyle}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => setSelected(t)}
                              style={{
                                background: "#f3f4f6",
                                border: "none",
                                borderRadius: "6px",
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Details
                            </button>
                            <button
                              onClick={() => setActivityModal(t)}
                              style={{
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                border: "none",
                                borderRadius: "6px",
                                padding: "4px 10px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Activity
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/*  Details Modal  */}
      {selected && (
        <TicketDetailModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdated={fetchTickets}
          canManage={false}
          canResolve={true}
          canComment={true}
          canAttach={false}
          canPreviewAttachments={true}
          canAddNote={true}
        />
      )}

      {/*  Activity Log Modal  */}
      {activityModal && (
        <ActivityLogModal
          ticket={activityModal}
          onClose={() => setActivityModal(null)}
        />
      )}
    </div>
  );
}
