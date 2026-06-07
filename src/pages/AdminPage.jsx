// AdminPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, logout, getUser } from "../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

// ── Role badge colors ──────────────────────────────────────
const roleBadge = (role) => {
  const map = {
    Admin: { bg: "#fee2e2", color: "#b91c1c" },
    Employee: { bg: "#dbeafe", color: "#1d4ed8" },
    "IT Agent": { bg: "#d1fae5", color: "#065f46" },
    Manager: { bg: "#fef9c3", color: "#854d0e" },
  };
  const s = map[role] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: "999px",
        padding: "2px 12px",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {role || "—"}
    </span>
  );
};

// ── Priority badge ─────────────────────────────────────────
const priorityBadge = (p) => {
  const map = {
    critical: { bg: "#7f1d1d", color: "#fff" },
    high: { bg: "#f97316", color: "#fff" },
    medium: { bg: "#f59e0b", color: "#fff" },
    low: { bg: "#6b7280", color: "#fff" },
    Normal: { bg: "#6b7280", color: "#fff" },
  };
  const key = (p || "").toLowerCase();
  const s = map[key] || { bg: "#e5e7eb", color: "#374151" };
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: "999px",
        padding: "2px 12px",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {p || "—"}
    </span>
  );
};

// ── Status badge ───────────────────────────────────────────
const statusBadge = (s) => {
  const map = {
    open: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    "in progress": { bg: "#fefce8", color: "#854d0e", border: "#fde68a" },
    resolved: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
    closed: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
  };
  const key = (s || "").toLowerCase();
  const st = map[key] || { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb" };
  return (
    <span
      style={{
        background: st.bg,
        color: st.color,
        border: `1px solid ${st.border}`,
        borderRadius: "999px",
        padding: "2px 12px",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {s || "—"}
    </span>
  );
};

// ── Create User Modal ──────────────────────────────────────
const ROLES = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Employee" },
  { id: 3, name: "IT Agent" },
  { id: 4, name: "Manager" },
];

function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    userName: "",
    email: "",
    password: "",
    roleId: 2,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.userName || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/users`, {
        method: "POST",
        body: JSON.stringify({ ...form, roleId: parseInt(form.roleId) }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || "Failed to create user.");
        return;
      }
      onCreated();
      onClose();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: "#f3f4f6",
    border: "none",
    borderRadius: "10px",
    padding: "11px 14px",
    width: "100%",
    fontSize: "0.9rem",
    outline: "none",
  };

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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0 fw-bold" style={{ fontSize: "1.25rem" }}>
            Create New User
          </h5>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              cursor: "pointer",
              color: "#9ca3af",
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            className="alert alert-danger py-2 mb-3"
            style={{ fontSize: "0.85rem" }}
          >
            {error}
          </div>
        )}

        {[
          {
            label: "Username",
            name: "userName",
            type: "text",
            placeholder: "Enter username",
          },
          {
            label: "Email",
            name: "email",
            type: "email",
            placeholder: "Enter email address",
          },
          {
            label: "Password",
            name: "password",
            type: "password",
            placeholder: "Enter password",
          },
        ].map((f) => (
          <div className="mb-3" key={f.name}>
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              {f.label}
            </label>
            <input
              type={f.type}
              name={f.name}
              placeholder={f.placeholder}
              value={form[f.name]}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
        ))}

        <div className="mb-4">
          <label
            className="form-label fw-semibold"
            style={{ fontSize: "0.85rem" }}
          >
            Role
          </label>
          <select
            name="roleId"
            value={form.roleId}
            onChange={handleChange}
            style={inputStyle}
          >
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "8px 22px",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 22px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [activeTab, setActiveTab] = useState("tickets"); // "tickets" | "users"
  const [showModal, setShowModal] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [ticketLoad, setTicketLoad] = useState(false);
  const [userLoad, setUserLoad] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [userError, setUserError] = useState("");

  // ── Fetch tickets ────────────────────────────────────────
  const fetchTickets = async () => {
    setTicketLoad(true);
    setTicketError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/tickets`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data);
    } catch {
      setTicketError("Failed to load tickets.");
    } finally {
      setTicketLoad(false);
    }
  };

  // ── Fetch users ──────────────────────────────────────────
  const fetchUsers = async () => {
    setUserLoad(true);
    setUserError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/users`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      setUserError("Failed to load users.");
    } finally {
      setUserLoad(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);
  useEffect(() => {
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ── Styles ───────────────────────────────────────────────
  const sidebarLink = (tab) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: activeTab === tab ? 600 : 400,
    background: activeTab === tab ? "#111" : "transparent",
    color: activeTab === tab ? "#fff" : "#374151",
    fontSize: "0.9rem",
    border: "none",
    width: "100%",
    textAlign: "left",
    transition: "all 0.15s",
  });

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
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* ── Top navbar ── */}
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
        <span
          style={{
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: "-0.5px",
          }}
        >
          🖥️ IT Help Desk
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            {currentUser?.userName || "Admin"}
          </span>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "7px 16px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Create User
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "7px 16px",
              fontSize: "0.85rem",
              fontWeight: 500,
              cursor: "pointer",
              color: "#374151",
            }}
          >
            Log Out
          </button>
        </div>
      </nav>

      <div style={{ display: "flex", flex: 1 }}>
        {/* ── Sidebar ── */}
        <aside
          style={{
            width: "220px",
            minHeight: "calc(100vh - 60px)",
            background: "#fff",
            borderRight: "1px solid #e5e7eb",
            padding: "24px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            position: "sticky",
            top: "60px",
            alignSelf: "flex-start",
          }}
        >
          <p
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#9ca3af",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              padding: "0 16px",
              marginBottom: "8px",
            }}
          >
            Navigation
          </p>

          <button
            style={sidebarLink("tickets")}
            onClick={() => setActiveTab("tickets")}
          >
            🎫 All Tickets
          </button>

          <button
            style={sidebarLink("users")}
            onClick={() => setActiveTab("users")}
          >
            👥 All Users
          </button>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, padding: "32px", overflow: "auto" }}>
          {/* ════ TICKETS VIEW ════ */}
          {activeTab === "tickets" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <h4
                    style={{ margin: 0, fontWeight: 700, fontSize: "1.3rem" }}
                  >
                    All Tickets
                  </h4>
                  <p
                    style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}
                  >
                    {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}{" "}
                    total
                  </p>
                </div>
                <button
                  onClick={fetchTickets}
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
                  ↻ Refresh
                </button>
              </div>

              {ticketLoad && (
                <p style={{ color: "#6b7280" }}>Loading tickets...</p>
              )}
              {ticketError && (
                <div className="alert alert-danger">{ticketError}</div>
              )}

              {!ticketLoad && !ticketError && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          {[
                            "Ticket ID",
                            "Title",
                            "Status",
                            "Priority",
                            "Category",
                            "Assigned To",
                            "Submitted By",
                            "Created",
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
                              colSpan={8}
                              style={{
                                ...tdStyle,
                                textAlign: "center",
                                color: "#9ca3af",
                                padding: "40px",
                              }}
                            >
                              No tickets found
                            </td>
                          </tr>
                        ) : (
                          tickets.map((t) => (
                            <tr
                              key={t.id}
                              style={{ transition: "background 0.1s" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#fafafa")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
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
                              <td style={tdStyle}>
                                {statusBadge(t.status?.name || t.statusName)}
                              </td>
                              <td style={tdStyle}>
                                {priorityBadge(
                                  t.priority?.name || t.priorityName,
                                )}
                              </td>
                              <td style={tdStyle}>
                                {t.category?.name || t.categoryName || "—"}
                              </td>
                              <td style={tdStyle}>
                                {t.assignedTo?.userName || t.assignedToName || (
                                  <span style={{ color: "#9ca3af" }}>
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td style={tdStyle}>
                                {t.submittedBy?.userName ||
                                  t.submittedByName ||
                                  "—"}
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
                </div>
              )}
            </>
          )}

          {/* ════ USERS VIEW ════ */}
          {activeTab === "users" && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <h4
                    style={{ margin: 0, fontWeight: 700, fontSize: "1.3rem" }}
                  >
                    All Users
                  </h4>
                  <p
                    style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}
                  >
                    {users.length} user{users.length !== 1 ? "s" : ""} total
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
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
                  ↻ Refresh
                </button>
              </div>

              {userLoad && <p style={{ color: "#6b7280" }}>Loading users...</p>}
              {userError && (
                <div className="alert alert-danger">{userError}</div>
              )}

              {!userLoad && !userError && (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          {[
                            "ID",
                            "Username",
                            "Email",
                            "Role",
                            "Created By",
                            "Created Date",
                            "Updated By",
                            "Updated Date",
                          ].map((h) => (
                            <th key={h} style={thStyle}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              style={{
                                ...tdStyle,
                                textAlign: "center",
                                color: "#9ca3af",
                                padding: "40px",
                              }}
                            >
                              No users found
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => (
                            <tr
                              key={u.id}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#fafafa")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <td
                                style={{
                                  ...tdStyle,
                                  fontWeight: 600,
                                  color: "#111",
                                }}
                              >
                                {u.id}
                              </td>
                              <td style={{ ...tdStyle, fontWeight: 500 }}>
                                {u.userName}
                              </td>
                              <td style={tdStyle}>{u.email}</td>
                              <td style={tdStyle}>{roleBadge(u.role)}</td>
                              <td style={{ ...tdStyle, color: "#6b7280" }}>
                                {u.createdBy || (
                                  <span style={{ color: "#d1d5db" }}>—</span>
                                )}
                              </td>
                              <td style={{ ...tdStyle, color: "#6b7280" }}>
                                {u.createdDate ? (
                                  new Date(u.createdDate).toLocaleDateString()
                                ) : (
                                  <span style={{ color: "#d1d5db" }}>—</span>
                                )}
                              </td>
                              <td style={{ ...tdStyle, color: "#6b7280" }}>
                                {u.updatedBy || (
                                  <span style={{ color: "#d1d5db" }}>—</span>
                                )}
                              </td>
                              <td style={{ ...tdStyle, color: "#6b7280" }}>
                                {u.updatedDate ? (
                                  new Date(u.updatedDate).toLocaleDateString()
                                ) : (
                                  <span style={{ color: "#d1d5db" }}>—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Create User Modal ── */}
      {showModal && (
        <CreateUserModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            if (activeTab === "users") fetchUsers();
          }}
        />
      )}
    </div>
  );
}
