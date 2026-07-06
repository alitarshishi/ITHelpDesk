import React, { useState, useEffect } from "react";
import {
  Ticket,
  MessageSquare,
  UserPlus,
  Repeat,
  RefreshCw,
  CheckCircle2,
  Lock,
  Paperclip,
  NotebookPen,
  AlertTriangle,
} from "lucide-react";
import { authFetch } from "@/services/authService";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

const eventIcons = {
  Created: Ticket,
  Comment: MessageSquare,
  Assigned: UserPlus,
  Reassigned: Repeat,
  StatusChanged: RefreshCw,
  Resolved: CheckCircle2,
  Closed: Lock,
  Escalated: AlertTriangle,
  Attachment: Paperclip,
  AgentNote: NotebookPen,
};

export default function ActivityLogModal({ ticket, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await authFetch(
          `${API_BASE_URL}/tickets/${ticket.id}/activity`,
        );
        if (!res.ok) return;
        setLogs(await res.json());
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ticket.id]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <span className="font-mono text-xs text-muted-foreground">
            TKT-{String(ticket.id).padStart(4, "0")}
          </span>
          <DialogTitle>Activity Log</DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        )}
        {!loading && logs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No activity recorded yet.
          </p>
        )}

        <div className="relative">
          {logs.length > 0 && (
            <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
          )}
          <div className="flex flex-col gap-4">
            {logs.map((log) => {
              const Icon = eventIcons[log.eventType] || Ticket;
              return (
                <div key={log.id} className="flex gap-4">
                  <div className="z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border bg-muted">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="pt-1">
                    <div className="text-sm font-medium">{log.action}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {log.userName && (
                        <span className="mr-2">👤 {log.userName}</span>
                      )}
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
