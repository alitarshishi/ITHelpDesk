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
  Lock,
} from "lucide-react";
import { authFetch } from "@/services/authService";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import ConfirmDialog from "@/components/ConfirmDialog";

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
  const currentStatusLower = (ticket.statusName || "").toLowerCase();
  const isEscalated = currentStatusLower === "escalated";
  const isResolved = currentStatusLower === "resolved";
  const isClosed = currentStatusLower === "closed";

  // Agent can only interact if ticket isn't escalated/resolved/closed
  const agentCanAct = canResolve && !isEscalated && !isResolved && !isClosed;

  // Manager: only allow status change when Open, Resolved, or Escalated
  const managerCanChangeStatus =
    currentStatusLower === "open" ||
    currentStatusLower === "resolved" ||
    currentStatusLower === "escalated";

  // ── Comments ──────────────────────────────────────────
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState("");
  const canCommentInput = canComment && !isEscalated && !isClosed;

  // ── Attachments ────────────────────────────────────────
  const [attachments, setAttachments] = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachError, setAttachError] = useState("");
  const fileInputRef = useRef(null);

  // ── Manager actions — BOTH fields shown at once ────────
  const [status, setStatus] = useState(ticket.statusName ?? "Open");
  const [assignId, setAssignId] = useState(
    ticket.assignedToId ? String(ticket.assignedToId) : "",
  );
  const [saving, setSaving] = useState(false);
  const [manageError, setManageError] = useState("");
  const [manageOpen, setManageOpen] = useState(false); // expand/collapse panel

  // ── Agent actions ──────────────────────────────────────
  const [resolving, setResolving] = useState(false);
  const [confirmEscalate, setConfirmEscalate] = useState(false);
  const [escalating, setEscalating] = useState(false);

  // ── Agent work-log note ────────────────────────────────
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    fetchComments();
    if (canPreviewAttachments) fetchAttachments();
  }, [ticket.id]);

  // ── Fetch helpers ──────────────────────────────────────
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

  // ── Comment ────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!newComment.trim() || isEscalated || isClosed) return;
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

  // ── Attachment upload ──────────────────────────────────
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
          headers: { Authorization: `Bearer ${token}` },
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
    window.open(URL.createObjectURL(blob), "_blank");
  };

  // ── Manager save — sends BOTH status + assignee in one request ──
  const handleSave = async () => {
    setSaving(true);
    setManageError("");
    try {
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

      const res = await authFetch(
        `${API_BASE_URL}/manager/${ticket.id}/update`,
        {
          method: "PATCH",
          body: JSON.stringify({
            priorityId: null,
            statusId,
            assignedToId: assignId ? parseInt(assignId) : null,
          }),
        },
      );

      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setManageError(d?.message || "Failed to update ticket.");
        return;
      }

      toast.success("Ticket updated successfully.");
      onUpdated?.();
      onClose();
    } catch {
      setManageError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  };

  // ── Agent resolve ──────────────────────────────────────
  const handleResolve = async () => {
    setResolving(true);
    try {
      const statRes = await authFetch(`${API_BASE_URL}/lookup/statuses`);
      const statuses = await statRes.json();
      const statusId = statuses.find(
        (s) => s.name.toLowerCase() === "resolved",
      )?.id;
      if (!statusId) {
        toast.error("Could not resolve status.");
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
        toast.error("Failed to update status.");
        return;
      }
      toast.success("Ticket marked as resolved.");
      onUpdated?.();
      onClose();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setResolving(false);
    }
  };

  // ── Agent escalate ─────────────────────────────────────
  const doEscalate = async () => {
    setConfirmEscalate(false);
    setEscalating(true);
    try {
      const statRes = await authFetch(`${API_BASE_URL}/lookup/statuses`);
      const statuses = await statRes.json();
      const statusId = statuses.find(
        (s) => s.name.toLowerCase() === "escalated",
      )?.id;
      if (!statusId) {
        toast.error("Could not resolve status.");
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
        toast.error("Failed to escalate.");
        return;
      }
      toast.success("Ticket escalated to manager.");
      onUpdated?.();
      onClose();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setEscalating(false);
    }
  };

  // ── Agent work-log note ────────────────────────────────
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/itagent/${ticket.id}/note`, {
        method: "POST",
        body: JSON.stringify({ text: newNote }),
      });
      if (!res.ok) {
        toast.error("Failed to add note.");
        return;
      }
      setNewNote("");
      toast.success("Work log added.");
      onUpdated?.();
    } catch {
      toast.error("Could not reach the server.");
    } finally {
      setSubmittingNote(false);
    }
  };

  // ── Info row helper ────────────────────────────────────
  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="min-w-[160px] flex-1">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm font-semibold">{value || "—"}</div>
    </div>
  );

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {/* ── Header ── */}
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-muted-foreground">
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

          {/* ── Escalated notice for IT Agent ── */}
          {isEscalated && canResolve && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This ticket has been escalated to the manager. You can no longer
                take actions on it.
              </AlertDescription>
            </Alert>
          )}

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

          {/* ── Manager actions — status + assign in ONE panel ── */}
          {canManage && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Update Ticket</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManageOpen((o) => !o)}
                  >
                    {manageOpen ? "Cancel" : "Edit"}
                  </Button>
                </div>

                {manageOpen && (
                  <div className="space-y-4 rounded-md border bg-muted/30 p-4">
                    {manageError && (
                      <Alert variant="destructive">
                        <AlertDescription>{manageError}</AlertDescription>
                      </Alert>
                    )}

                    {/* Status dropdown */}
                    <div className="space-y-1.5">
                      <Label>Status</Label>
                      {!managerCanChangeStatus ? (
                        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Status can only be changed when ticket is{" "}
                            <strong>Open</strong>, <strong>Resolved</strong>, or{" "}
                            <strong>Escalated</strong>. Current:{" "}
                            <strong>{ticket.statusName}</strong>
                          </span>
                        </div>
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

                    {/* Agent assignment dropdown */}
                    <div className="space-y-1.5">
                      <Label>Assign to IT Agent</Label>
                      <Select
                        value={assignId || "unassigned"}
                        onValueChange={(v) =>
                          setAssignId(v === "unassigned" ? "" : v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="— Unassigned —" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            — Unassigned —
                          </SelectItem>
                          {itAgents.map((a) => (
                            <SelectItem key={a.id} value={String(a.id)}>
                              <div className="flex items-center justify-between gap-6">
                                <span>{a.userName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {a.openTicketCount} active
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Single save button covers both fields */}
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── IT Agent: Resolve + Escalate (locked if escalated) ── */}
          {canResolve && (
            <>
              <Separator />
              {isEscalated || isClosed ? (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {isEscalated
                      ? "This ticket is escalated — no further actions available."
                      : "This ticket is closed."}
                  </span>
                </div>
              ) : !isResolved ? (
                <div className="flex gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                    onClick={handleResolve}
                    disabled={resolving}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {resolving ? "Updating..." : "Mark as Resolved"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmEscalate(true)}
                    disabled={escalating}
                  >
                    <AlertTriangle className="mr-1.5 h-4 w-4" />
                    Escalate
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    This ticket has been resolved.
                  </span>
                </div>
              )}
            </>
          )}

          {/* ── IT Agent: work-log note (locked if escalated) ── */}
          {canAddNote && !isEscalated && !isClosed && (
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
                  <p className="text-sm text-muted-foreground">Loading...</p>
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
                      <Alert variant="destructive">
                        <AlertDescription>{attachError}</AlertDescription>
                      </Alert>
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
              <p className="text-sm text-muted-foreground">Loading...</p>
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
              <Alert variant="destructive">
                <AlertDescription>{commentError}</AlertDescription>
              </Alert>
            )}

            {canCommentInput ? (
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
            ) : isEscalated || isClosed ? (
              <Alert className="border-muted/20 bg-muted/20">
                <AlertDescription>
                  Comments are locked because this ticket is {isEscalated ? "escalated" : "closed"}.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Escalate confirmation ── */}
      <ConfirmDialog
        open={confirmEscalate}
        onOpenChange={setConfirmEscalate}
        title="Escalate this ticket?"
        description="The ticket will be marked as Escalated and your manager will be notified to reassign it. You will no longer be able to take actions on this ticket."
        confirmLabel="Escalate"
        variant="destructive"
        onConfirm={doEscalate}
      />
    </>
  );
}
