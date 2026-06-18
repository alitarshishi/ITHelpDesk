// src/components/TicketDetailModal.jsx
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
  if (["pdf"].includes(ext)) return "📕";
  if (["doc", "docx"].includes(ext)) return "📄";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
  return "📎";
};

const MANAGER_ALLOWED_STATUSES = ["Open", "Resolved", "In Progress", "Closed"]; // shown only when current is Open/Resolved
const AGENT_STATUS_OPTIONS = ["Resolved"]; // agent can only move ticket to Resolved

// ─────────────────────────────────────────────────────────
// Props:
//   ticket        — ticket object to display
//   onClose       — called when modal closes
//   onUpdated     — called after a save (status/reassign/comment/attachment)
//   itAgents      — [{id, userName}] for manager reassign dropdown
//   canManage     — true = Manager (status only if Open/Resolved, + Reassign)
//   canResolve    — true = IT Agent (status -> Resolved only)
//   canComment    — true = show comment box
//   canAttach     — true = show "Add Attachment" (Employee only)
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
}) {
  const currentUser = getUser();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState("");

  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState("");

  // manager-only state
  const [activeAction, setActiveAction] = useState(null); // "status" | "reassign"
  const [status, setStatus] = useState(ticket.statusName ?? "Open");
  const [assignId, setAssignId] = useState(ticket.assignedToId ?? "");
  const [saving, setSaving] = useState(false);
  const [manageError, setManageError] = useState("");

  // agent-only state
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const currentStatusLower = (ticket.statusName || "").toLowerCase();
  const managerCanChangeStatus =
    currentStatusLower === "open" || currentStatusLower === "resolved";

  // ── Fetch comments + attachments ─────────────────────
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

  // ── Add comment ─────────────────────────────────────
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
      const statRes = await authFetch(`${API_BASE_URL}/lookup/statuses`);
      const statuses = await statRes.json();

      const body = { priorityId: null, statusId: null, assignedToId: null };

      if (activeAction === "status") {
        if (!managerCanChangeStatus) {
          setManageError(
            "You can only change status when the ticket is Open or Resolved.",
          );
          setSaving(false);
          return;
        }
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

  // ── Info row helper ─────────────────────────────────
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

  const canShowResolveButton =
    canResolve &&
    currentStatusLower !== "resolved" &&
    currentStatusLower !== "closed";

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
            {infoRow("🧑‍💼", "Assigned by", ticket.assignedByManagerName || "—")}
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
            </div>
            <hr style={{ margin: "0 28px 20px", borderColor: "#f3f4f6" }} />
          </>
        )}

        {/* ── Attachments ── */}
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
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "0.83rem",
                    color: "#374151",
                  }}
                >
                  <span>
                    {fileIcon(a.fileName)} {a.fileName}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                    {a.uploadedByName}
                  </span>
                </div>
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
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Enter file name (e.g. screenshot.png)"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
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
                  onClick={handleAddAttachment}
                  disabled={attaching || !newFileName.trim()}
                  style={{
                    background: "#111",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0 16px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: !newFileName.trim() ? "not-allowed" : "pointer",
                    opacity: !newFileName.trim() ? 0.5 : 1,
                  }}
                >
                  {attaching ? "..." : "Add"}
                </button>
              </div>
            </>
          )}
        </div>

        <hr style={{ margin: "0 28px 20px", borderColor: "#f3f4f6" }} />

        {/* ── Activity / Comments ── */}
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
