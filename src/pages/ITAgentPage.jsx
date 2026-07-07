import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { authFetch } from "@/services/authService";
import Header from "@/components/Header";
import EmptyState from "@/components/EmptyState";
import { Ticket, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TableSkeleton from "@/components/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";

import TicketDetailModal from "@/components/TicketDetailModal";
import ActivityLogModal from "@/components/ActivityLogModal";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export default function ITAgentPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [activityModal, setActivityModal] = useState(null);

  const handleOpenTicketFromNotification = (ticket, view) => {
    if (view === "activity") {
      setActivityModal(ticket);
    } else {
      setSelected(ticket);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`${API_BASE_URL}/itagent/assigned`);
      if (!res.ok) throw new Error();
      setTickets(await res.json());
    } catch {
      setError("Failed to load your assigned tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      {/* ── Navbar ── */}
      <Header onOpenTicket={handleOpenTicketFromNotification} />

      {/* ── Content ── */}
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            My Assigned Tickets
          </h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} assigned to
            you
          </p>
        </div>

        {loading && <TableSkeleton columns={9} rows={5} />}
        {error && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <EmptyState
                        icon={Ticket}
                        title="No tickets yet"
                        description="Create your first ticket and it will appear here."
                        actionLabel="+ Create Ticket"
                        onAction={() => setShowModal(true)}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((t) => (
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
                      <TableCell>{t.submittedByName || "—"}</TableCell>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* ── Ticket Details Modal ── */}
      {selected && (
        <TicketDetailModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdated={fetchTickets}
          canManage={false}
          canResolve={true}
          canComment={true}
          canAttach={false}
          canPreviewAttachments={true}
          canAddNote={true}
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
