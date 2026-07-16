import React from "react";
import { Ticket, Users, Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import HelpChatWidget from "@/components/HelpChatWidget";

import { toast } from "sonner";
import { Plus, Activity, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import TableSkeleton from "@/components/TableSkeleton";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

import TicketDetailModal from "@/components/TicketDetailModal";
import ActivityLogModal from "@/components/ActivityLogModal";
import CreateTicketForm from "@/components/forms/CreateTicketForm";

import { useMyTickets, useDeleteTicket } from "@/hooks/useMyTickets";
import { useState } from "react";

const STATUS_FILTERS = [
  "All",
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
  "Escalated",
];

export default function EmployeePage() {
  const {
    data: tickets = [],
    isLoading: loading,
    isError,
    refetch: fetchMyTickets,
  } = useMyTickets();
  const error = isError ? "Failed to load your tickets." : "";

  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [filterPrio, setFilterPrio] = useState("All Priorities");
  const [filterCat, setFilterCat] = useState("All Categories");

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

  const [confirmDelete, setConfirmDelete] = useState(null);

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
        `TKT-${String(ticket.id).padStart(4, "0")} cannot be deleted — only Open tickets can be deleted.`,
      );
      return;
    }
    setConfirmDelete(ticket); // open the dialog
  };

  const confirmDeleteTicket = () => {
    deleteTicket.mutate(confirmDelete.id, {
      onSuccess: () => toast.success("Ticket deleted."),
      onError: () => toast.error("Failed to delete ticket."),
    });
    setConfirmDelete(null);
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
      <div className="p-8">
        <Card className="overflow-hidden">
          <div className="space-y-4 p-6 pb-0">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">My Tickets</span>
              <span className="text-sm text-muted-foreground">
                {filtered.length} of {tickets.length} ticket
                {tickets.length !== 1 ? "s" : ""} submitted
              </span>
            </div>

            <Tabs value={filterStatus} onValueChange={setFilterStatus}>
              <TabsList>
                {STATUS_FILTERS.map((s) => (
                  <TabsTrigger key={s} value={s}>
                    {s}
                    {s !== "All" && (
                      <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px]">
                        {
                          tickets.filter(
                            (t) =>
                              (t.statusName || "").toLowerCase() ===
                              s.toLowerCase(),
                          ).length
                        }
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap gap-2.5">
              <div className="relative min-w-[200px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="!pl-10"
                />
              </div>
              <Select value={filterPrio} onValueChange={setFilterPrio}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Priorities">All Priorities</SelectItem>
                  {["Low", "Medium", "High", "Critical"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Categories">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading && <TableSkeleton columns={9} rows={5} />}
          {error && (
            <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {!loading && !error && (
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
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <EmptyState
                        icon={Ticket}
                        title={
                          tickets.length
                            ? "No tickets match your filters"
                            : "No tickets yet"
                        }
                        description={
                          tickets.length
                            ? "Try adjusting the status, priority, category, or search filter."
                            : "Create your first ticket and it will appear here."
                        }
                        actionLabel="+ Create Ticket"
                        onAction={() => setShowModal(true)}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => {
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
          )}
        </Card>
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
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete this ticket?"
        description={`TKT-${String(confirmDelete?.id ?? 0).padStart(4, "0")} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteTicket}
      />
      <HelpChatWidget />
    </div>
  );
}
