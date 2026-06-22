import React, { useState, useEffect } from "react";
import { authFetch, getUser } from "../services/authService";

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
    escalated: {
      bg: "#fef2f2",
      color: "#b91c1c",
      border: "#fecaca",
      icon: "⚠",
    },
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

const fileIcon = (name) => {
  const ext = (name || "").split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "🖼️";
  if (ext === "pdf") return "📕";
  if (["doc", "docx"].includes(ext)) return "📄";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
  return "📎";
};

const MANAGER_ALLOWED_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

// ─────────────────────────────────────────────────────────
// Props:
//   ticket      — ticket object
//   onClose     — close modal
//   onUpdated   — refresh parent list after any change
//   itAgents    — [{id, userName}] for manager reassign dropdown
//   canManage   — Manager: status (only if Open/Resolved) + Reassign
//   canResolve  — IT Agent: button to set status -> Resolved
//   canComment  — show comment box (Employee + IT Agent)
//   canAttach   — show "Add Attachment" button (Employee only)
//   canPreviewAttachments — show attachment list (Employee + IT Agent)
//   canAddNote  — IT Agent only: internal work-log note (not a comment)
// ─────────────────────────────────────────────────────────
export default function TicketDetailModal({
  ticket,
  onClose,
  onUpdated,
  itAgents = [],
  canManage = false,
  canResolve = false,
  canComment = true,
  canAttach = false,
  canPreviewAttachments = true,
  canAddNote = false,
}) {
  const currentUser = getUser();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState("");

  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState("");
  const fileInputRef = React.useRef();
  // manager-only state
  const [activeAction, setActiveAction] = useState(null); // "status" | "reassign"
  const [status, setStatus] = useState(ticket.statusName ?? "Open");
  const [assignId, setAssignId] = useState(ticket.assignedToId ?? "");
  const [saving, setSaving] = useState(false);
  const [manageError, setManageError] = useState("");

  // agent-only state
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [escalating, setEscalating] = useState(false);
  const [escalateError, setEscalateError] = useState("");
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState("");

  const currentStatusLower = (ticket.statusName || "").toLowerCase();
  const managerCanChangeStatus =
    currentStatusLower === "open" ||
    currentStatusLower === "resolved" ||
    currentStatusLower === "escalated";
  const canShowResolveButton =
    canResolve &&
    currentStatusLower !== "resolved" &&
    currentStatusLower !== "closed";

  useEffect(() => {
    fetchComments();
    fetchAttachments();
  }, [ticket.id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/tickets/${ticket.id}/comments`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setComments(data);
    } catch {
    } finally {
      setLoadingComments(false);
    }
  };

  const fetchAttachments = async () => {
    setLoadingAttachments(true);
    try {
      const res = await authFetch(
        `${API_BASE_URL}/tickets/${ticket.id}/attachments`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setAttachments(data);
    } catch {
    } finally {
      setLoadingAttachments(false);
    }
  };
  // ── Real file upload ──
  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setAttachError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/tickets/${ticket.id}/attachments`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }, // no Content-Type — browser sets multipart boundary
          body: formData,
        },
      );

      if (!res.ok) {
        setAttachError("Failed to upload file.");
        return;
      }
      await fetchAttachments();
      onUpdated?.();
    } catch {
      setAttachError("Could not reach the server.");
    } finally {
      setUploading(false);
    }
  };
  // ── Open/preview a file ──
  const handleViewAttachment = async (attachmentId) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/tickets/attachments/${attachmentId}/view`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank"); // opens image/PDF in a new tab, browser renders it natively
  };
  // ── Add comment (employee ↔ agent conversation) ─────
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    setCommentError("");
    try {
      const res = await authFetch(
        `${API_BASE_URL}/tickets/${ticket.id}/comment`,
        {
          method: "POST",
          body: JSON.stringify({ text: newComment }),
        },
      );
      if (!res.ok) {
        setCommentError("Failed to add comment.");
        return;
      }
      setNewComment("");
      await fetchComments();
      onUpdated?.();
    } catch {
      setCommentError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Add attachment (filename only) ──────────────────
  const handleAddAttachment = async () => {
    if (!newFileName.trim()) return;
    setAttaching(true);
    setAttachError("");
    try {
      const res = await authFetch(
        `${API_BASE_URL}/tickets/${ticket.id}/attachments`,
        {
          method: "POST",
          body: JSON.stringify({ fileName: newFileName.trim() }),
        },
      );
      if (!res.ok) {
        setAttachError("Failed to add attachment.");
        return;
      }
      setNewFileName("");
      setShowAttachInput(false);
      await fetchAttachments();
      onUpdated?.();
    } catch {
      setAttachError("Could not reach the server.");
    } finally {
      setAttaching(false);
    }
  };

  // ── Manager save (status restricted, + reassign) ────
  const handleSave = async () => {
    setSaving(true);
    setManageError("");
    try {
      const body = { priorityId: null, statusId: null, assignedToId: null };

      if (activeAction === "status") {
        if (!managerCanChangeStatus) {
          setManageError(
            "You can only change status when the ticket is Open or Resolved.",
          );
          setSaving(false);
          return;
        }
        const statRes = await authFetch(`${API_BASE_URL}/lookup/statuses`);
        const statuses = await statRes.json();
        const statusId = statuses.find(
          (s) => s.name.toLowerCase() === status.toLowerCase(),
        )?.id;
        if (!statusId) {
          setManageError("Could not resolve status.");
          setSaving(false);
          return;
        }
        body.statusId = statusId;
      }

      if (activeAction === "reassign") {
        body.assignedToId = assignId ? parseInt(assignId) : null;
      }

      const res = await authFetch(
        `${API_BASE_URL}/manager/${ticket.id}/update`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setManageError(d?.message || "Failed to update ticket.");
        return;
      }
      onUpdated?.();
      onClose();
    } catch {
      setManageError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  // ── IT Agent — resolve ticket ────────────────────────
  const handleResolve = async () => {
    setResolving(true);
    setResolveError("");
    try {
      const statRes = await authFetch(`${API_BASE_URL}/lookup/statuses`);
      const statuses = await statRes.json();
      const statusId = statuses.find(
        (s) => s.name.toLowerCase() === "resolved",
      )?.id;
      if (!statusId) {
        setResolveError("Could not resolve status.");
        setResolving(false);
        return;
      }

      const res = await authFetch(
        `${API_BASE_URL}/itagent/${ticket.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ statusId }),
        },
      );

      if (!res.ok) {
        setResolveError("Failed to update status.");
        return;
      }
      onUpdated?.();
      onClose();
    } catch {
      setResolveError("Could not reach the server.");
    } finally {
      setResolving(false);
    }
  };
  const handleEscalate = async () => {
    if (!window.confirm("Escalate this ticket to your manager?")) return;
    setEscalating(true);
    setEscalateError("");
    try {
      const statRes = await authFetch(`${API_BASE_URL}/lookup/statuses`);
      const statuses = await statRes.json();
      const statusId = statuses.find(
        (s) => s.name.toLowerCase() === "escalated",
      )?.id;
      if (!statusId) {
        setEscalateError("Could not resolve status.");
        setEscalating(false);
        return;
      }

      const res = await authFetch(
        `${API_BASE_URL}/itagent/${ticket.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ statusId }),
        },
      );

      if (!res.ok) {
        setEscalateError("Failed to escalate.");
        return;
      }
      onUpdated?.();
      onClose();
    } catch {
      setEscalateError("Could not reach the server.");
    } finally {
      setEscalating(false);
    }
  };

  // ── IT Agent — internal work-log note ───────────────
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    setNoteError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/itagent/${ticket.id}/note`, {
        method: "POST",
        body: JSON.stringify({ text: newNote }),
      });
      if (!res.ok) {
        setNoteError("Failed to add note.");
        return;
      }
      setNewNote("");
      onUpdated?.(); // activity log will pick it up next time it's opened
    } catch {
      setNoteError("Could not reach the server.");
    } finally {
      setSubmittingNote(false);
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
            {infoRow("🧑‍💼", "Assigned by", ticket.assignedByManagerName || "—")}
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

        {/* ── Manager actions ── */}
        {canManage && (
          <>
            <div style={{ padding: "0 28px 20px" }}>
              {manageError && (
                <div
                  className="alert alert-danger py-2 mb-3"
                  style={{ fontSize: "0.85rem" }}
                >
                  {manageError}
                </div>
              )}

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
                  {!managerCanChangeStatus ? (
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "#9ca3af",
                        margin: 0,
                      }}
                    >
                      Status can only be changed when the ticket is{" "}
                      <strong>Open</strong> or <strong>Resolved</strong>.
                      Current status is <strong>{ticket.statusName}</strong>.
                    </p>
                  ) : (
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
                      {MANAGER_ALLOWED_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

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
                    setActiveAction(
                      activeAction === "reassign" ? null : "reassign",
                    )
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
                {activeAction &&
                  (activeAction !== "status" || managerCanChangeStatus) && (
                    <button
                      onClick={handleSave}
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
            <hr style={{ margin: "0 28px 20px", borderColor: "#f3f4f6" }} />
          </>
        )}

        {/* ── IT Agent — Resolve action ── */}
        {canShowResolveButton && (
          <>
            <div style={{ padding: "0 28px 20px" }}>
              {resolveError && (
                <div
                  className="alert alert-danger py-2 mb-3"
                  style={{ fontSize: "0.85rem" }}
                >
                  {resolveError}
                </div>
              )}
              {escalateError && (
                <div
                  className="alert alert-danger py-2 mb-3"
                  style={{ fontSize: "0.85rem" }}
                >
                  {escalateError}
                </div>
              )}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  style={{
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 18px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {resolving ? "Updating..." : "✓ Mark as Resolved"}
                </button>
                <button
                  onClick={handleEscalate}
                  disabled={escalating}
                  style={{
                    background: "#fff",
                    color: "#b91c1c",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    padding: "8px 18px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  {escalating ? "Escalating..." : "⚠ Escalate"}
                </button>
              </div>
            </div>
            <hr style={{ margin: "0 28px 20px", borderColor: "#f3f4f6" }} />
          </>
        )}

        {/* ── IT Agent — internal work-log note ── */}
        {canAddNote && (
          <>
            <div style={{ padding: "0 28px 20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <span>📝</span>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Work Log
                </span>
                <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                  (only visible in Activity Log)
                </span>
              </div>
              {noteError && (
                <div
                  className="alert alert-danger py-2 mb-2"
                  style={{ fontSize: "0.82rem" }}
                >
                  {noteError}
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="e.g. Investigated issue, waiting on vendor reply..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "0.85rem",
                    outline: "none",
                    background: "#f9fafb",
                  }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={submittingNote || !newNote.trim()}
                  style={{
                    background: "#111",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0 16px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: !newNote.trim() ? "not-allowed" : "pointer",
                    opacity: !newNote.trim() ? 0.5 : 1,
                  }}
                >
                  {submittingNote ? "..." : "Log"}
                </button>
              </div>
            </div>
            <hr style={{ margin: "0 28px 20px", borderColor: "#f3f4f6" }} />
          </>
        )}

        {/* ── Attachments ── */}
        {canPreviewAttachments && (
          <div style={{ padding: "0 28px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <span>📎</span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                Attachments
              </span>
            </div>

            {loadingAttachments && (
              <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                Loading attachments...
              </p>
            )}
            {!loadingAttachments && attachments.length === 0 && (
              <p
                style={{
                  color: "#9ca3af",
                  fontSize: "0.85rem",
                  marginBottom: "12px",
                }}
              >
                No attachments yet.
              </p>
            )}

            {attachments.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  marginBottom: "14px",
                }}
              >
                {attachments.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleViewAttachment(a.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#f9fafb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "0.83rem",
                      color: "#1d4ed8",
                      border: "none",
                      width: "100%",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span>
                      {fileIcon(a.fileName)} {a.fileName}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                      {a.uploadedByName}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {canAttach && (
              <>
                {attachError && (
                  <div
                    className="alert alert-danger py-2 mb-2"
                    style={{ fontSize: "0.82rem" }}
                  >
                    {attachError}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  style={{
                    background: "#f3f4f6",
                    border: "1px dashed #d1d5db",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "0.83rem",
                    fontWeight: 600,
                    color: "#374151",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  📎 {uploading ? "Uploading..." : "Add Attachment"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  style={{ display: "none" }}
                  onChange={handleFileSelected}
                />
              </>
            )}
          </div>
        )}

        <hr style={{ margin: "0 28px 20px", borderColor: "#f3f4f6" }} />

        {/* ── Comments ── */}
        <div style={{ padding: "0 28px 28px" }}>
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
              Comments
            </span>
          </div>

          {loadingComments && (
            <p style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
              Loading comments...
            </p>
          )}
          {!loadingComments && comments.length === 0 && (
            <p
              style={{
                color: "#9ca3af",
                fontSize: "0.85rem",
                marginBottom: "16px",
              }}
            >
              No comments yet.
            </p>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {comments.map((c) => (
              <div key={c.id} style={{ display: "flex", gap: "10px" }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#111",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    flexShrink: 0,
                  }}
                >
                  {(c.authorName || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "0.82rem", marginBottom: "3px" }}>
                    <span style={{ fontWeight: 600 }}>{c.authorName}</span>
                    <span style={{ color: "#9ca3af", marginLeft: "8px" }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#374151" }}>
                    {c.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {commentError && (
            <div
              className="alert alert-danger py-2 mb-2"
              style={{ fontSize: "0.82rem" }}
            >
              {commentError}
            </div>
          )}
          {canComment && (
            <div style={{ display: "flex", gap: "8px" }}>
              <textarea
                rows={2}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.85rem",
                  resize: "none",
                  outline: "none",
                  background: "#f9fafb",
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
                style={{
                  background: "#111",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0 16px",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor:
                    submitting || !newComment.trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity: !newComment.trim() ? 0.5 : 1,
                }}
              >
                {submitting ? "..." : "Send"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
