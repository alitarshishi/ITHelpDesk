import React, { useState, useEffect, useRef } from "react";
import {
  User,
  UserCog,
  Tag,
  Calendar,
  MessageSquare,
  Paperclip,
  NotebookPen,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { authFetch, getUser } from "@/services/authService";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

const MANAGER_ALLOWED_STATUSES = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
  "Escalated",
];

const fileIcon = (name) => {
  const ext = (name || "").split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "🖼️";
  if (ext === "pdf") return "📕";
  if (["doc", "docx"].includes(ext)) return "📄";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
  return "📎";
};

// ─────────────────────────────────────────────────────────
// Props:
//   ticket                — ticket object
//   onClose                — close modal
//   onUpdated               — refresh parent list after any change
//   itAgents                — [{id, userName}] for manager reassign dropdown
//   canManage               — Manager: status (only Open/Resolved/Escalated) + Reassign
//   canResolve              — IT Agent: Resolve + Escalate buttons
//   canComment              — show comment box (Employee + IT Agent)
//   canAttach               — show "Add Attachment" (Employee only)
//   canPreviewAttachments   — show attachment list (Employee + IT Agent)
//   canAddNote              — IT Agent only: internal work-log note
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

  // comments
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState("");

  // attachments
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState("");
  const fileInputRef = useRef(null);
  // manager actions
  const [activeAction, setActiveAction] = useState(null); // "status" | "reassign"
  const [status, setStatus] = useState(ticket.statusName ?? "Open");
  const [assignId, setAssignId] = useState(
    ticket.assignedToId ? String(ticket.assignedToId) : "",
  );
  const [saving, setSaving] = useState(false);
  const [manageError, setManageError] = useState("");

  // agent actions
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
      setComments(await res.json());
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
      setAttachments(await res.json());
    } catch {
    } finally {
      setLoadingAttachments(false);
    }
  };

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
    window.open(url, "_blank"); // browser renders images/PDFs natively
  };

  const handleSave = async () => {
    setSaving(true);
    setManageError("");
    try {
      const body = { priorityId: null, statusId: null, assignedToId: null };

      if (activeAction === "status") {
        if (!managerCanChangeStatus) {
          setManageError(
            "You can only change status when the ticket is Open, Resolved, or Escalated.",
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
      onUpdated?.();
    } catch {
      setNoteError("Could not reach the server.");
    } finally {
      setSubmittingNote(false);
    }
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex-1 min-w-[160px]">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm font-semibold">{value || "—"}</div>
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-muted-foreground">
              #TKT-{String(ticket.id).padStart(4, "0")}
            </span>
            <PriorityBadge priority={ticket.priorityName} />
            <StatusBadge status={ticket.statusName} />
          </div>
          <DialogTitle className="text-left text-lg">
            {ticket.title}
          </DialogTitle>
        </DialogHeader>

        <Separator />

        {/* ── Info grid ── */}
        <div className="flex flex-wrap gap-5">
          <InfoRow
            icon={User}
            label="Created by"
            value={ticket.submittedByName}
          />
          <InfoRow
            icon={UserCog}
            label="Assigned by"
            value={ticket.assignedByManagerName}
          />
          <InfoRow
            icon={User}
            label="Assigned to"
            value={ticket.assignedToName || "Unassigned"}
          />
          <InfoRow icon={Tag} label="Category" value={ticket.categoryName} />
          <InfoRow
            icon={Calendar}
            label="Created"
            value={
              ticket.dateCreated
                ? new Date(ticket.dateCreated).toLocaleString()
                : "—"
            }
          />
        </div>

        {/* ── Manager actions ── */}
        {canManage && (
          <>
            <Separator />
            <div className="space-y-3">
              {manageError && (
                <p className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
                  {manageError}
                </p>
              )}

              {activeAction === "status" && (
                <div className="rounded-md bg-muted p-4">
                  <Label className="mb-2 block">Update Status</Label>
                  {!managerCanChangeStatus ? (
                    <p className="text-sm text-muted-foreground">
                      Status can only be changed when the ticket is{" "}
                      <strong>Open</strong>, <strong>Resolved</strong>, or{" "}
                      <strong>Escalated</strong>. Current status is{" "}
                      <strong>{ticket.statusName}</strong>.
                    </p>
                  ) : (
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MANAGER_ALLOWED_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {activeAction === "reassign" && (
                <div className="rounded-md bg-muted p-4">
                  <Label className="mb-2 block">Assign to IT Agent</Label>
                  <Select value={assignId} onValueChange={setAssignId}>
                    <SelectTrigger>
                      <SelectValue placeholder="— Unassigned —" />
                    </SelectTrigger>
                    <SelectContent>
                      {itAgents.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          <div className="flex w-full items-center justify-between gap-3">
                            <span>{a.userName}</span>
                            <span className="text-xs text-muted-foreground">
                              {a.openTicketCount} active
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeAction === "status" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setActiveAction(activeAction === "status" ? null : "status")
                  }
                >
                  Update Status
                </Button>
                <Button
                  variant={activeAction === "reassign" ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setActiveAction(
                      activeAction === "reassign" ? null : "reassign",
                    )
                  }
                >
                  Reassign
                </Button>
                {activeAction && (
                  <Button
                    size="sm"
                    className="ml-auto bg-green-600 hover:bg-green-700"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── IT Agent: Resolve + Escalate ── */}
        {canShowResolveButton && (
          <>
            <Separator />
            <div className="space-y-2">
              {resolveError && (
                <p className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
                  {resolveError}
                </p>
              )}
              {escalateError && (
                <p className="rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
                  {escalateError}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleResolve}
                  disabled={resolving}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {resolving ? "Updating..." : "Mark as Resolved"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={handleEscalate}
                  disabled={escalating}
                >
                  <AlertTriangle className="mr-1.5 h-4 w-4" />
                  {escalating ? "Escalating..." : "Escalate"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── IT Agent: internal work-log note ── */}
        {canAddNote && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4" />
                <span className="text-sm font-semibold">Work Log</span>
                <span className="text-xs text-muted-foreground">
                  (only visible in Activity Log)
                </span>
              </div>
              {noteError && (
                <p className="text-sm text-destructive">{noteError}</p>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Investigated issue, waiting on vendor reply..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
                <Button
                  onClick={handleAddNote}
                  disabled={submittingNote || !newNote.trim()}
                >
                  {submittingNote ? "..." : "Log"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Attachments ── */}
        {canPreviewAttachments && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm font-semibold">Attachments</span>
              </div>

              {loadingAttachments && (
                <p className="text-sm text-muted-foreground">
                  Loading attachments...
                </p>
              )}
              {!loadingAttachments && attachments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No attachments yet.
                </p>
              )}

              {attachments.length > 0 && (
                <div className="space-y-1.5">
                  {attachments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => handleViewAttachment(a.id)}
                      className="flex w-full items-center justify-between rounded-md bg-muted px-3 py-2 text-left text-sm text-blue-700 hover:bg-muted/70"
                    >
                      <span>
                        {fileIcon(a.fileName)} {a.fileName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {a.uploadedByName}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {canAttach && (
                <>
                  {attachError && (
                    <p className="text-sm text-destructive">{attachError}</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    {uploading ? "Uploading..." : "Add Attachment"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelected}
                  />
                </>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* ── Comments ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-semibold">Comments</span>
          </div>

          {loadingComments && (
            <p className="text-sm text-muted-foreground">Loading comments...</p>
          )}
          {!loadingComments && comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}

          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {(c.authorName || "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm">
                    <span className="font-semibold">{c.authorName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-foreground">{c.text}</div>
                </div>
              </div>
            ))}
          </div>

          {commentError && (
            <p className="text-sm text-destructive">{commentError}</p>
          )}

          {canComment && (
            <div className="flex gap-2">
              <Textarea
                rows={2}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="resize-none bg-muted/50"
              />
              <Button
                onClick={handleAddComment}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? "..." : "Send"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
