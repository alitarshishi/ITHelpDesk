import ActivityLogModal from "../components/ActivityLogModal";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, logout, getUser } from "../services/authService";
import TicketDetailModal from "../components/TicketDetailModal";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

// ── Badges ────────────────────────────────────────────────
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
      <span>{st.icon}</span>
      {s || "—"}
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

// ── Main ManagerPage ──────────────────────────────────────
export default function ManagerPage() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [tickets, setTickets] = useState([]);
  const [itAgents, setItAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [activityModal, setActivityModal] = useState(null); // 👈 added
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [filterPrio, setFilterPrio] = useState("All Priorities");
  const [filterCat, setFilterCat] = useState("All Categories");

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/manager/team-tickets`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data);
    } catch {
      setError("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  const fetchItAgents = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/users/itagents`);
      if (!res.ok) return;
      const data = await res.json();
      setItAgents(data);
    } catch {}
  };

  useEffect(() => {
    fetchTickets();
    fetchItAgents();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const total = tickets.length;
  const openCount = tickets.filter(
    (t) => (t.statusName || "").toLowerCase() === "open",
  ).length;
  const inProgCount = tickets.filter(
    (t) => (t.statusName || "").toLowerCase() === "in progress",
  ).length;
  const resolvedCount = tickets.filter(
    (t) => (t.statusName || "").toLowerCase() === "resolved",
  ).length;

  const filtered = tickets.filter((t) => {
    const matchStatus =
      filterStatus === "All" ||
      (t.statusName || "").toLowerCase() === filterStatus.toLowerCase();
    const matchSearch =
      !search ||
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      `tkt-${String(t.id).padStart(4, "0")}`.includes(search.toLowerCase());
    const matchPrio =
      filterPrio === "All Priorities" ||
      (t.priorityName || "").toLowerCase() === filterPrio.toLowerCase();
    const matchCat =
      filterCat === "All Categories" || (t.categoryName || "") === filterCat;
    return matchStatus && matchSearch && matchPrio && matchCat;
  });

  const categories = [
    ...new Set(tickets.map((t) => t.categoryName).filter(Boolean)),
  ];

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

  const statCard = (label, value, sub, accent) => (
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Navbar ── */}
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
              Ticketing Management System
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            👤 {currentUser?.userName || "Manager"}
          </span>
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

      <div style={{ padding: "32px" }}>
        {/* ── Stat cards ── */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "32px",
          }}
        >
          {statCard("Total Tickets", total, "All time", "🎫")}
          {statCard("Open Tickets", openCount, "Awaiting assignment", "🟠")}
          {statCard("In Progress", inProgCount, "Being worked on", "🔵")}
          {statCard("Resolved", resolvedCount, "Completed", "🟢")}
        </div>

        {/* ── Tickets section ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "20px 24px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                Tickets
              </span>
              <span style={{ fontSize: "0.82rem", color: "#9ca3af" }}>
                {filtered.length} of {total} tickets
              </span>
            </div>

            {/* Status tabs */}
            <div
              style={{
                display: "flex",
                background: "#f3f4f6",
                borderRadius: "8px",
                padding: "3px",
                marginBottom: "16px",
                width: "fit-content",
              }}
            >
              {["All", "Open", "In Progress", "Resolved", "Closed"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  style={{
                    background: filterStatus === s ? "#fff" : "transparent",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 16px",
                    fontSize: "0.82rem",
                    fontWeight: filterStatus === s ? 600 : 400,
                    color: filterStatus === s ? "#111" : "#6b7280",
                    cursor: "pointer",
                    boxShadow:
                      filterStatus === s ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Search + filters */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                >
                  🔍
                </span>
                <input
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 14px 9px 36px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.85rem",
                    outline: "none",
                    background: "#f9fafb",
                  }}
                />
              </div>
              <select
                value={filterPrio}
                onChange={(e) => setFilterPrio(e.target.value)}
                style={{
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.85rem",
                  background: "#f9fafb",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option>All Priorities</option>
                {["Low", "Medium", "High", "Critical"].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{
                  padding: "9px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.85rem",
                  background: "#f9fafb",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option>All Categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <p style={{ padding: "24px", color: "#6b7280" }}>
              Loading tickets...
            </p>
          )}
          {error && <div className="alert alert-danger m-3">{error}</div>}

          {!loading && !error && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {/* 👇 added empty column for action buttons */}
                    {[
                      "Ticket ID",
                      "Title",
                      "Status",
                      "Priority",
                      "Category",
                      "Created By",
                      "Assigned To",
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
                  {filtered.length === 0 ? (
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
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
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
                            maxWidth: "260px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {t.title}
                        </td>
                        <td style={tdStyle}>{statusBadge(t.statusName)}</td>
                        <td style={tdStyle}>{priorityBadge(t.priorityName)}</td>
                        <td style={tdStyle}>{t.categoryName || "—"}</td>
                        <td style={tdStyle}>{t.submittedByName || "—"}</td>
                        <td style={tdStyle}>
                          {t.assignedToName || (
                            <span style={{ color: "#9ca3af" }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: "#9ca3af" }}>
                          {t.dateCreated
                            ? new Date(t.dateCreated).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* 👇 action buttons */}
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
          )}
        </div>
      </div>

      {/* ── Ticket Details Modal ── */}
      {selected && (
        <TicketDetailModal
          ticket={selected}
          itAgents={itAgents}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            fetchTickets();
            setSelected(null);
          }}
          canManage={true}
          canResolve={false}
          canComment={false}
          canAttach={false}
        />
      )}

      {/* ── Activity Log Modal ── */}
      {activityModal && (
        <ActivityLogModal
          ticket={activityModal}
          onClose={() => setActivityModal(null)}
        />
      )}
    </div>
  );
}
