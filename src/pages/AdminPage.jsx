// AdminPage.jsx
import ActivityLogModal from "../components/ActivityLogModal";
import React, { useState } from "react";
import {
  useAllTickets,
  useAllUsers,
  useDeactivateUser,
  useActivateUser,
  useDeleteUser,
  useChangeUserRole,
} from "../hooks/useAdminData";
import { useNavigate } from "react-router-dom";
import { authFetch, logout, getUser } from "../services/authService";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import CreateUserForm from "../components/forms/CreateUserForm";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

// ── Role badge ─────────────────────────────────────────────
const roleBadge = (role) => {
  const map = {
    Admin: { bg: "#fee2e2", color: "#b91c1c" },
    Employee: { bg: "#dbeafe", color: "#1d4ed8" },
    "IT Agent": { bg: "#d1fae5", color: "#065f46" },
    ITAgent: { bg: "#d1fae5", color: "#065f46" },
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

// ── Roles list ─────────────────────────────────────────────
const ROLES = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Employee" },
  { id: 3, name: "ITAgent" },
  { id: 4, name: "Manager" },
];

// ── Change Role Modal ──────────────────────────────────────
function ChangeRoleModal({ user, onClose, onChanged }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = async (roleId) => {
    setSaving(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/users/${user.id}/role`, {
        method: "PUT",
        body: JSON.stringify({ roleId }),
      });
      if (!res.ok) {
        setError("Failed to change role.");
        return;
      }
      onChanged();
      onClose();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
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
        zIndex: 1060,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 fw-bold">Change Role</h5>
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

        <p
          style={{
            color: "#6b7280",
            fontSize: "0.85rem",
            marginBottom: "16px",
          }}
        >
          Changing role for <strong>{user.userName}</strong>
        </p>

        {error && (
          <div
            className="alert alert-danger py-2 mb-3"
            style={{ fontSize: "0.85rem" }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {ROLES.map((r) => (
            <button
              key={r.id}
              onClick={() => handleRoleChange(r.id)}
              disabled={saving}
              style={{
                background: user.role === r.name ? "#111" : "#f3f4f6",
                color: user.role === r.name ? "#fff" : "#374151",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{r.name}</span>
              {user.role === r.name && (
                <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                  current
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [activeTab, setActiveTab] = useState("tickets");
  const [showModal, setShowModal] = useState(false);
  const [roleModal, setRoleModal] = useState(null); // user to change role
  const [activityModal, setActivityModal] = useState(null); // ticket to view log
  const [actionMsg, setActionMsg] = useState("");
  const {
    data: tickets = [],
    isLoading: ticketLoad,
    isError: ticketIsError,
    refetch: fetchTickets,
  } = useAllTickets();
  const ticketError = ticketIsError ? "Failed to load tickets." : "";

  const {
    data: users = [],
    isLoading: userLoad,
    isError: userIsError,
    refetch: fetchUsers,
  } = useAllUsers(activeTab === "users"); // only fetches once the Users tab is opened
  const userError = userIsError ? "Failed to load users." : "";

  const deactivateUser = useDeactivateUser();
  const activateUser = useActivateUser();
  const deleteUser = useDeleteUser();
  const changeUserRole = useChangeUserRole();

  // ── User actions ──────────────────────────────────────
  const showMsg = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 4000);
  };

  const handleDeactivate = (u) => {
    if (
      !window.confirm(
        `Deactivate ${u.userName}? They will not be able to log in.`,
      )
    )
      return;
    deactivateUser.mutate(u.id, {
      onSuccess: () => showMsg(`${u.userName} has been deactivated.`),
      onError: () => showMsg("Failed to deactivate user."),
    });
  };

  const handleActivate = (u) => {
    activateUser.mutate(u.id, {
      onSuccess: () => showMsg(`${u.userName} has been activated.`),
      onError: () => showMsg("Failed to activate user."),
    });
  };

  const handleDelete = (u) => {
    if (
      !window.confirm(
        `Permanently delete ${u.userName}? This cannot be undone.`,
      )
    )
      return;
    deleteUser.mutate(u.id, {
      onSuccess: () => showMsg(`${u.userName} has been deleted.`),
      onError: (err) => showMsg(err.message),
    });
  };

  const handleRoleChange = (userId, roleId) => {
    changeUserRole.mutate(
      { userId, roleId },
      {
        onSuccess: () => showMsg("Role updated."),
        onError: () => showMsg("Failed to change role."),
      },
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

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
  const actionBtn = (bg, color, label, onClick, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg,
        color,
        border: "none",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "0.75rem",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );

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
            style={sidebarLink("dashboard")}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
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
          {activeTab === "dashboard" && <DashboardOverview />}
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
                                {statusBadge(t.statusName)}
                              </td>
                              <td style={tdStyle}>
                                {priorityBadge(t.priorityName)}
                              </td>
                              <td style={tdStyle}>{t.categoryName || "—"}</td>
                              <td style={tdStyle}>
                                {t.assignedToName || (
                                  <span style={{ color: "#9ca3af" }}>
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td style={tdStyle}>
                                {t.submittedByName || "—"}
                              </td>
                              <td style={{ ...tdStyle, color: "#9ca3af" }}>
                                {t.dateCreated
                                  ? new Date(t.dateCreated).toLocaleDateString()
                                  : "—"}
                              </td>
                              {/* 👇 action buttons */}
                              <td style={tdStyle}>
                                <div style={{ display: "flex", gap: "6px" }}>
                                  {actionBtn(
                                    "#eff6ff",
                                    "#1d4ed8",
                                    "Activity",
                                    () => setActivityModal(t),
                                  )}
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

              {/* Action message toast */}
              {actionMsg && (
                <div
                  className="alert alert-success py-2 mb-3"
                  style={{ fontSize: "0.85rem", cursor: "pointer" }}
                  onClick={() => setActionMsg("")}
                >
                  {actionMsg} <span style={{ float: "right" }}>×</span>
                </div>
              )}

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
                            "Status",
                            "Created By",
                            "Created Date",
                            "Updated By",
                            "Updated Date",
                            "Actions",
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
                              colSpan={10}
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
                                {!u.isActive && (
                                  <span
                                    style={{
                                      marginLeft: "8px",
                                      fontSize: "0.7rem",
                                      background: "#fee2e2",
                                      color: "#b91c1c",
                                      borderRadius: "999px",
                                      padding: "1px 8px",
                                    }}
                                  >
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td style={tdStyle}>{u.email}</td>
                              <td style={tdStyle}>{roleBadge(u.role)}</td>
                              <td style={tdStyle}>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: u.isActive ? "#166534" : "#9ca3af",
                                  }}
                                >
                                  {u.isActive ? "● Active" : "○ Inactive"}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, color: "#6b7280" }}>
                                {u.createdBy || "—"}
                              </td>
                              <td style={{ ...tdStyle, color: "#6b7280" }}>
                                {u.createdDate
                                  ? new Date(u.createdDate).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td style={{ ...tdStyle, color: "#6b7280" }}>
                                {u.updatedBy || "—"}
                              </td>
                              <td style={{ ...tdStyle, color: "#6b7280" }}>
                                {u.updatedDate
                                  ? new Date(u.updatedDate).toLocaleDateString()
                                  : "—"}
                              </td>
                              {/* 👇 action buttons */}
                              <td style={tdStyle}>
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "6px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {actionBtn("#eff6ff", "#1d4ed8", "Role", () =>
                                    setRoleModal(u),
                                  )}
                                  {u.isActive
                                    ? actionBtn(
                                        "#fef9c3",
                                        "#854d0e",
                                        "Deactivate",
                                        () => handleDeactivate(u),
                                      )
                                    : actionBtn(
                                        "#d1fae5",
                                        "#065f46",
                                        "Activate",
                                        () => handleActivate(u),
                                      )}
                                  {actionBtn(
                                    "#fee2e2",
                                    "#b91c1c",
                                    "Delete",
                                    () => handleDelete(u),
                                  )}
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
            </>
          )}
        </main>
      </div>

      {/* ── Create User Modal ── */}
      {showModal && (
        <CreateUserForm
          onClose={() => setShowModal(false)}
          onCreated={() => {
            if (activeTab === "users") fetchUsers();
          }}
        />
      )}

      {/* ── Change Role Modal ── */}
      {roleModal && (
        <ChangeRoleModal
          user={roleModal}
          onClose={() => setRoleModal(null)}
          onChanged={() => {
            fetchUsers();
            showMsg(`Role updated for ${roleModal.userName}.`);
          }}
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
