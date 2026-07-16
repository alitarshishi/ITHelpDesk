import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { LayoutDashboard, Ticket, Search, Activity } from "lucide-react";
import { authFetch } from "@/services/authService";
import { useCategories, usePriorities } from "@/hooks/useLookups"; // 👈

import EmptyState from "@/components/EmptyState";
import TableSkeleton from "@/components/TableSkeleton";

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
import DashboardOverview from "@/components/dashboard/DashboardOverview";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

const STATUS_FILTERS = [
  "All",
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
  "Escalated",
];

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tickets, setTickets] = useState([]);
  const [itAgents, setItAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [activityModal, setActivityModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPrio, setFilterPrio] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("All");

  // ── Fetch ALL categories/priorities from API — not derived from tickets ──
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
      const res = await authFetch(`${API_BASE_URL}/manager/team-tickets`);
      if (!res.ok) throw new Error();
      setTickets(await res.json());
    } catch {
      setError("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  const fetchItAgents = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/users/itagents`);
      if (!res.ok) return;
      setItAgents(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchTickets();
    fetchItAgents();
  }, []);

  const filtered = tickets.filter((t) => {
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

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "tickets", label: "Tickets", icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      <Header onOpenTicket={handleOpenTicketFromNotification} />

      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="sticky top-[60px] flex h-[calc(100vh-60px)] w-56 flex-col gap-1 self-start border-r bg-background p-3">
          <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Navigation
          </p>
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant={activeTab === item.key ? "default" : "ghost"}
              className="justify-start gap-2"
              onClick={() => setActiveTab(item.key)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-auto p-8">
          {activeTab === "dashboard" && <DashboardOverview />}

          {activeTab === "tickets" && (
            <Card className="overflow-hidden">
              <div className="space-y-4 p-6 pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">Tickets</span>
                  <span className="text-sm text-muted-foreground">
                    {filtered.length} of {tickets.length} tickets
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

              {loading && <TableSkeleton columns={9} rows={5} />}
              {error && (
                <p className="m-6 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
                      <TableHead>Created By</TableHead>
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
                            title="No tickets found"
                            description={
                              filterStatus !== "All"
                                ? `No ${filterStatus.toLowerCase()} tickets match your filters.`
                                : "No tickets have been assigned to you yet."
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
                          <TableCell className="max-w-[260px] truncate">
                            {t.title}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={t.statusName} />
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={t.priorityName} />
                          </TableCell>
                          <TableCell>{t.categoryName || "—"}</TableCell>
                          <TableCell>{t.submittedByName || "—"}</TableCell>
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          )}
        </main>
      </div>

      {selected && (
        <TicketDetailModal
          ticket={selected}
          itAgents={itAgents}
          onClose={() => setSelected(null)}
          onUpdated={() => {
            fetchTickets();
            setSelected(null);
          }}
          canManage={true}
          canResolve={false}
          canComment={false}
          canAttach={false}
          canPreviewAttachments={false}
          canAddNote={false}
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
