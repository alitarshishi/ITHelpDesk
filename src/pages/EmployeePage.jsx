// EmployeePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch, logout, getUser } from "../services/authService";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Email",
  "Access",
  "Other",
];

// ── Badges ────────────────────────────────────────────────
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

const priorityBadge = (p) => {
  const map = {
    critical: { bg: "#7f1d1d", color: "#fff" },
    high: { bg: "#f97316", color: "#fff" },
    medium: { bg: "#f59e0b", color: "#fff" },
    low: { bg: "#6b7280", color: "#fff" },
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
        padding: "2px 12px",
        fontSize: "0.75rem",
        fontWeight: 600,
      }}
    >
      {p || "—"}
    </span>
  );
};

// ── Create Ticket Modal ───────────────────────────────────
function CreateTicketModal({ onClose, onCreated, managers }) {
  const currentUser = getUser();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Hardware",
    priority: "Medium",
    managerId: "",
  });
  const [attachments, setAttachments] = useState([]); // list of file names
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const names = files.map((f) => f.name);
    setAttachments((prev) => [...prev, ...names]);
    e.target.value = ""; // reset so same file can be added again
  };

  const removeAttachment = (index) =>
    setAttachments((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. look up category, priority, and status IDs from backend
      const [catRes, priRes, statRes, managerRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/lookup/categories`),
        authFetch(`${API_BASE_URL}/lookup/priorities`),
        authFetch(`${API_BASE_URL}/lookup/statuses`),
        Promise.resolve(null), // managers already fetched
      ]);

      const categories = await catRes.json();
      const priorities = await priRes.json();
      const statuses = await statRes.json();

      const categoryId = categories.find(
        (c) => c.name.toLowerCase() === form.category.toLowerCase(),
      )?.id;
      const priorityId = priorities.find(
        (p) => p.name.toLowerCase() === form.priority.toLowerCase(),
      )?.id;
      const statusId = statuses.find(
        (s) => s.name.toLowerCase() === "open",
      )?.id;

      if (!categoryId || !priorityId || !statusId) {
        setError(
          "Could not resolve category, priority, or status. Check your database seed.",
        );
        setLoading(false);
        return;
      }

      const body = {
        title: form.title,
        description: form.description,
        categoryId,
        priorityId,
        statusId,
        submittedById: currentUser?.id,
        assignedToId: form.managerId ? parseInt(form.managerId) : null,
        attachmentNames: attachments,
      };

      const res = await authFetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.message || "Failed to create ticket.");
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
        overflowY: "auto",
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "32px",
          width: "100%",
          maxWidth: "560px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0 fw-bold" style={{ fontSize: "1.25rem" }}>
            Create New Ticket
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

        {/* Title */}
        <div className="mb-3">
          <label
            className="form-label fw-semibold"
            style={{ fontSize: "0.85rem" }}
          >
            Title
          </label>
          <input
            type="text"
            name="title"
            placeholder="Brief description of the issue"
            value={form.title}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label
            className="form-label fw-semibold"
            style={{ fontSize: "0.85rem" }}
          >
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Provide detailed information about the issue"
            value={form.description}
            onChange={handleChange}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        {/* Category + Priority */}
        <div className="d-flex gap-3 mb-3">
          <div style={{ flex: 1 }}>
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={inputStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label
              className="form-label fw-semibold"
              style={{ fontSize: "0.85rem" }}
            >
              Priority
            </label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              style={inputStyle}
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assign to Manager */}
        <div className="mb-3">
          <label
            className="form-label fw-semibold"
            style={{ fontSize: "0.85rem" }}
          >
            Ticket Manager{" "}
            <span style={{ color: "#9ca3af", fontWeight: 400 }}>
              (optional)
            </span>
          </label>
          <select
            name="managerId"
            value={form.managerId}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">— Select a manager —</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.userName}
              </option>
            ))}
          </select>
        </div>

        {/* Attachments */}
        <div className="mb-4">
          <label
            className="form-label fw-semibold"
            style={{ fontSize: "0.85rem" }}
          >
            Attachments
          </label>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{
                background: "#f3f4f6",
                border: "1px dashed #d1d5db",
                borderRadius: "10px",
                padding: "9px 18px",
                cursor: "pointer",
                fontSize: "0.85rem",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              📎 Add Attachment
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {/* File list */}
          {attachments.length > 0 && (
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {attachments.map((name, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "0.82rem",
                    color: "#374151",
                  }}
                >
                  <span>📄 {name}</span>
                  <button
                    onClick={() => removeAttachment(i)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      fontSize: "1rem",
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
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
              fontSize: "0.9rem",
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
              fontSize: "0.9rem",
            }}
          >
            {loading ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main EmployeePage ─────────────────────────────────────
export default function EmployeePage() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [tickets, setTickets] = useState([]);
  const [managers, setManagers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // ── Fetch my tickets ──────────────────────────────────
  const fetchMyTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/tickets/my`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTickets(data);
    } catch {
      setError("Failed to load your tickets.");
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch managers (role = Manager) ──────────────────
  const fetchManagers = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/users/managers`);
      if (!res.ok) return;
      const data = await res.json();
      setManagers(data);
    } catch {
      // non-critical — manager dropdown just stays empty
    }
  };

  useEffect(() => {
    fetchMyTickets();
    fetchManagers();
  }, []);

  // ── Delete ticket (only if Open) ──────────────────────
  const handleDelete = async (ticket) => {
    if ((ticket.statusName || "").toLowerCase() !== "open") {
      setDeleteError(
        `Ticket TKT-${String(ticket.id).padStart(4, "0")} cannot be deleted — status is "${ticket.statusName}".`,
      );
      setTimeout(() => setDeleteError(""), 4000);
      return;
    }
    if (
      !window.confirm(
        `Delete TKT-${String(ticket.id).padStart(4, "0")}? This cannot be undone.`,
      )
    )
      return;

    try {
      const res = await authFetch(`${API_BASE_URL}/tickets/${ticket.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
    } catch {
      setDeleteError("Failed to delete ticket.");
      setTimeout(() => setDeleteError(""), 4000);
    }
  };

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
            <div
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "-0.5px",
              }}
            >
              IT Help Desk
            </div>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
              {currentUser?.userName || "Employee"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
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
            + Create Ticket
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

      {/* ── Content ── */}
      <div style={{ padding: "32px" }}>
        {/* Page title */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ margin: 0, fontWeight: 700, fontSize: "1.3rem" }}>
            My Tickets
          </h4>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} submitted
          </p>
        </div>

        {/* Delete error toast */}
        {deleteError && (
          <div
            className="alert alert-warning py-2 mb-3"
            style={{ fontSize: "0.85rem" }}
          >
            {deleteError}
          </div>
        )}

        {loading && <p style={{ color: "#6b7280" }}>Loading your tickets...</p>}
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
                  {tickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          ...tdStyle,
                          textAlign: "center",
                          color: "#9ca3af",
                          padding: "48px",
                        }}
                      >
                        No tickets yet — click <strong>+ Create Ticket</strong>{" "}
                        to get started
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
                          {t.assignedToName || (
                            <span style={{ color: "#9ca3af" }}>Unassigned</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, color: "#9ca3af" }}>
                          {t.dateCreated
                            ? new Date(t.dateCreated).toLocaleDateString()
                            : "—"}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleDelete(t)}
                            title={
                              (t.statusName || "").toLowerCase() !== "open"
                                ? "Can only delete Open tickets"
                                : "Delete ticket"
                            }
                            style={{
                              background: "none",
                              border: "1px solid",
                              borderColor:
                                (t.statusName || "").toLowerCase() === "open"
                                  ? "#fca5a5"
                                  : "#e5e7eb",
                              color:
                                (t.statusName || "").toLowerCase() === "open"
                                  ? "#ef4444"
                                  : "#d1d5db",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              fontSize: "0.78rem",
                              cursor:
                                (t.statusName || "").toLowerCase() === "open"
                                  ? "pointer"
                                  : "not-allowed",
                            }}
                          >
                            Delete
                          </button>
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

      {/* ── Modal ── */}
      {showModal && (
        <CreateTicketModal
          managers={managers}
          onClose={() => setShowModal(false)}
          onCreated={fetchMyTickets}
        />
      )}
    </div>
  );
}
