// ManagerPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, logout, getUser } from "../services/authService";

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

const STATUS_OPTIONS = ["Open", "In Progress", "Resolved", "Closed"];

// ── Ticket Detail Modal ───────────────────────────────────
function TicketDetailModal({ ticket, itAgents, onClose, onUpdated }) {
  const [assignId, setAssignId] = useState(ticket.assignedToId ?? "");
  const [status, setStatus] = useState(ticket.statusName ?? "Open");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeAction, setActiveAction] = useState(null); // "status" | "reassign" | null

  const handleUpdate = async () => {
    setSaving(true);
    setError("");
    try {
      // find status ID
      const statRes = await authFetch(`${API_BASE_URL}/lookup/statuses`);
      const statuses = await statRes.json();
      const statusId = statuses.find(
        (s) => s.name.toLowerCase() === status.toLowerCase(),
      )?.id;

      if (!statusId) {
        setError("Could not resolve status.");
        setSaving(false);
        return;
      }

      const res = await authFetch(
        `${API_BASE_URL}/manager/${ticket.id}/update`,
        {
          method: "PATCH",
          body: JSON.stringify({
            statusId,
            assignedToId: assignId ? parseInt(assignId) : null,
            priorityId: null,
          }),
        },
      );

      if (!res.ok) {
        setError("Failed to update ticket.");
        return;
      }
      onUpdated();
      onClose();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  const infoRow = (icon, label, value) => (
    <div style={{ flex: "1 1 45%", minWidth: "180px" }}>
      <div
        style={{
          fontSize: "0.75rem",
          color: "#9ca3af",
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <span>{icon}</span>
        {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#111" }}>
        {value || "—"}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1050,
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ padding: "28px 28px 0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  fontWeight: 600,
                }}
              >
                #TKT-{String(ticket.id).padStart(4, "0")}
              </span>
              {priorityBadge(ticket.priorityName)}
              {statusBadge(ticket.statusName)}
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.4rem",
                cursor: "pointer",
                color: "#9ca3af",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <h5
            style={{
              margin: "0 0 20px",
              fontWeight: 700,
              fontSize: "1.2rem",
              lineHeight: 1.3,
            }}
          >
            {ticket.title}
          </h5>
          <hr style={{ margin: "0 0 20px", borderColor: "#f3f4f6" }} />
        </div>

        {/* ── Info grid ── */}
        <div style={{ padding: "0 28px 20px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
            {infoRow("👤", "Created by", ticket.submittedByName)}
            {infoRow(
              "👤",
              "Assigned to",
              ticket.assignedToName || "Unassigned",
            )}
            {infoRow("🏷️", "Category", ticket.categoryName)}
            {infoRow(
              "📅",
              "Created",
              ticket.dateCreated
                ? new Date(ticket.dateCreated).toLocaleString()
                : "—",
            )}
          </div>
        </div>

        <hr style={{ margin: "0 28px 20px", borderColor: "#f3f4f6" }} />

        {/* ── Activity (empty for now) ── */}
        <div style={{ padding: "0 28px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <span>💬</span>
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
              Activity
            </span>
          </div>
          <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: 0 }}>
            No activity yet.
          </p>
        </div>

        <hr style={{ margin: "0 28px 20px", borderColor: "#f3f4f6" }} />

        {/* ── Action panels ── */}
        <div style={{ padding: "0 28px 28px" }}>
          {error && (
            <div
              className="alert alert-danger py-2 mb-3"
              style={{ fontSize: "0.85rem" }}
            >
              {error}
            </div>
          )}

          {/* ── Update Status panel ── */}
          {activeAction === "status" && (
            <div
              style={{
                background: "#f9fafb",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Update Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.9rem",
                  background: "#fff",
                  outline: "none",
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Reassign panel ── */}
          {activeAction === "reassign" && (
            <div
              style={{
                background: "#f9fafb",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <label
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Assign to IT Agent
              </label>
              <select
                value={assignId}
                onChange={(e) => setAssignId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.9rem",
                  background: "#fff",
                  outline: "none",
                }}
              >
                <option value="">— Unassigned —</option>
                {itAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.userName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={() =>
                setActiveAction(activeAction === "status" ? null : "status")
              }
              style={{
                background: activeAction === "status" ? "#111" : "#fff",
                color: activeAction === "status" ? "#fff" : "#111",
                border: "1px solid #111",
                borderRadius: "8px",
                padding: "8px 18px",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Update Status
            </button>

            <button
              onClick={() =>
                setActiveAction(activeAction === "reassign" ? null : "reassign")
              }
              style={{
                background: activeAction === "reassign" ? "#111" : "#fff",
                color: activeAction === "reassign" ? "#fff" : "#111",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "8px 18px",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Reassign
            </button>

            {activeAction && (
              <button
                onClick={handleUpdate}
                disabled={saving}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ManagerPage ──────────────────────────────────────
export default function ManagerPage() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [tickets, setTickets] = useState([]);
  const [itAgents, setItAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // ticket for detail modal
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [filterPrio, setFilterPrio] = useState("All Priorities");
  const [filterCat, setFilterCat] = useState("All Categories");

  // ── Fetch assigned tickets ────────────────────────────
  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const myId = currentUser?.id;
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

  // ── Fetch IT Agents ───────────────────────────────────
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

  // ── Stats ─────────────────────────────────────────────
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

  // ── Filtered tickets ──────────────────────────────────
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

  // ── Styles ────────────────────────────────────────────
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
          {/* Section header */}
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

            {/* Status filter tabs */}
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

            {/* Search + filters row */}
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

          {/* Table */}
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
                    {[
                      "Ticket ID",
                      "Title",
                      "Status",
                      "Priority",
                      "Category",
                      "Assigned To",
                      "Created",
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
                        colSpan={7}
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
                        onClick={() => setSelected(t)}
                        style={{
                          cursor: "pointer",
                          transition: "background 0.1s",
                        }}
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Ticket detail modal ── */}
      {selected && (
        <TicketDetailModal
          ticket={selected}
          itAgents={itAgents}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            fetchTickets();
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
