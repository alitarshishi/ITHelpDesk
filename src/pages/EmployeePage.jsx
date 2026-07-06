import React from "react";

import { toast } from "sonner";
import { Plus, LogOut, Activity, Trash2 } from "lucide-react";
import Header from "@/components/Header";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

import TicketDetailModal from "@/components/TicketDetailModal";
import ActivityLogModal from "@/components/ActivityLogModal";
import CreateTicketForm from "@/components/forms/CreateTicketForm";

import { useMyTickets, useDeleteTicket } from "@/hooks/useMyTickets";
import { useState } from "react";

export default function EmployeePage() {
  const {
    data: tickets = [],
    isLoading: loading,
    isError,
    refetch: fetchMyTickets,
  } = useMyTickets();
  const error = isError ? "Failed to load your tickets." : "";

  const deleteTicket = useDeleteTicket();

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activityModal, setActivityModal] = useState(null);

  const handleOpenTicketFromNotification = (ticket, view) => {
    if (view === "activity") {
      setActivityModal(ticket);
    } else {
      setSelected(ticket);
    }
  };

  const handleDelete = (ticket) => {
    if ((ticket.statusName || "").toLowerCase() !== "open") {
      toast.error(
        `TKT-${String(ticket.id).padStart(4, "0")} cannot be deleted — status is "${ticket.statusName}".`,
      );
      return;
    }
    if (
      !window.confirm(
        `Delete TKT-${String(ticket.id).padStart(4, "0")}? This cannot be undone.`,
      )
    )
      return;

    deleteTicket.mutate(ticket.id, {
      onSuccess: () => toast.success("Ticket deleted."),
      onError: () => toast.error("Failed to delete ticket."),
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      {/* ── Navbar ── */}
      <Header
        onOpenTicket={handleOpenTicketFromNotification}
        actions={
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create Ticket
          </Button>
        }
      />
      {/* ── Content ── */}
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} submitted
          </p>
        </div>

        {loading && (
          <p className="text-muted-foreground">Loading your tickets...</p>
        )}
        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {!loading && !error && (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned By</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No tickets yet — click <strong>Create Ticket</strong> to
                      get started
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((t) => {
                    const isOpen =
                      (t.statusName || "").toLowerCase() === "open";
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono font-semibold">
                          TKT-{String(t.id).padStart(4, "0")}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {t.title}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={t.statusName} />
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={t.priorityName} />
                        </TableCell>
                        <TableCell>{t.categoryName || "—"}</TableCell>
                        <TableCell>{t.assignedByManagerName || "—"}</TableCell>
                        <TableCell>
                          {t.assignedToName || (
                            <span className="text-muted-foreground">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t.dateCreated
                            ? new Date(t.dateCreated).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelected(t)}
                            >
                              Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-700"
                              onClick={() => setActivityModal(t)}
                            >
                              <Activity className="mr-1 h-3.5 w-3.5" />
                              Activity
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!isOpen}
                                    className={
                                      isOpen
                                        ? "border-red-200 text-red-600 hover:bg-red-50"
                                        : ""
                                    }
                                    onClick={() => handleDelete(t)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isOpen
                                  ? "Delete ticket"
                                  : "Can only delete Open tickets"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* ── Create Ticket Modal ── */}
      {showModal && (
        <CreateTicketForm
          onClose={() => setShowModal(false)}
          onCreated={fetchMyTickets}
        />
      )}

      {/* ── Ticket Details Modal ── */}
      {selected && (
        <TicketDetailModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdated={fetchMyTickets}
          canManage={false}
          canResolve={false}
          canComment={true}
          canAttach={true}
          canPreviewAttachments={true}
          canAddNote={false}
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
