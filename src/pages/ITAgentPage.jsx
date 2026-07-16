import React, { useState, useEffect } from "react";
import { Activity, Search } from "lucide-react";
import { authFetch } from "@/services/authService";
import { useCategories, usePriorities } from "@/hooks/useLookups"; // 👈
import Header from "@/components/Header";
import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";

import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

const STATUS_FILTERS = ["All", "In Progress", "Resolved", "Escalated"];

export default function ITAgentPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [activityModal, setActivityModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [filterPrio, setFilterPrio] = useState("all");
  const [filterCat, setFilterCat] = useState("all");

  const { data: categories = [] } = useCategories();
  const { data: priorities = [] } = usePriorities();

  const handleOpenTicketFromNotification = (ticket, view) => {
    if (view === "activity") setActivityModal(ticket);
    else setSelected(ticket);
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

  const visibleTickets = tickets.filter(
    (t) => (t.statusName || "").toLowerCase() !== "closed",
  );

  const filtered = visibleTickets.filter((t) => {
    const matchStatus =
      filterStatus === "All" ||
      (t.statusName || "").toLowerCase() === filterStatus.toLowerCase();
    const matchSearch =
      !search ||
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      `tkt-${String(t.id).padStart(4, "0")}`.includes(search.toLowerCase());
    const matchPrio =
      filterPrio === "all" ||
      (t.priorityName || "").toLowerCase() === filterPrio.toLowerCase();
    const matchCat =
      filterCat === "all" ||
      (t.categoryName || "").toLowerCase() === filterCat.toLowerCase();
    return matchStatus && matchSearch && matchPrio && matchCat;
  });

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      <Header onOpenTicket={handleOpenTicketFromNotification} />

      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            My Assigned Tickets
          </h1>
          <p className="text-sm text-muted-foreground">
            {visibleTickets.length} ticket
            {visibleTickets.length !== 1 ? "s" : ""} assigned to you
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
            <div className="space-y-4 p-6 pb-0">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Tickets</span>
                <span className="text-sm text-muted-foreground">
                  {filtered.length} of {visibleTickets.length} tickets
                </span>
              </div>

              {/* Status tabs */}
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

              {/* Search + filters */}
              <div className="flex flex-wrap gap-2.5">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="!pl-9"
                  />
                </div>
                <Select value={filterPrio} onValueChange={setFilterPrio}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {priorities.map((p) => (
                      <SelectItem key={p.id} value={p.name.toLowerCase()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterCat} onValueChange={setFilterCat}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name.toLowerCase()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="p-0">
                      <EmptyState
                        icon={Ticket}
                        title={
                          tickets.length
                            ? "No tickets match your filters"
                            : "No tickets assigned"
                        }
                        description={
                          tickets.length
                            ? "Try adjusting the filters."
                            : "Tickets assigned to you will appear here."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
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
      {activityModal && (
        <ActivityLogModal
          ticket={activityModal}
          onClose={() => setActivityModal(null)}
        />
      )}
    </div>
  );
}
