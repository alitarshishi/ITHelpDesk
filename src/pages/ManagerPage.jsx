import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { LayoutDashboard, Ticket, Search, Activity } from "lucide-react";
import { authFetch, logout, getUser } from "@/services/authService";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [filterPrio, setFilterPrio] = useState("All Priorities");
  const [filterCat, setFilterCat] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState("All");

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
      filterPrio === "All Priorities" ||
      (t.priorityName || "").toLowerCase() === filterPrio.toLowerCase();
    const matchCat =
      filterCat === "All Categories" || (t.categoryName || "") === filterCat;
    return matchStatus && matchSearch && matchPrio && matchCat;
  });

  const categories = [
    ...new Set(tickets.map((t) => t.categoryName).filter(Boolean)),
  ];

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "tickets", label: "Tickets", icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-muted/30 font-sans">
      {/* ── Navbar ── */}
      <Header onOpenTicket={handleOpenTicketFromNotification} />

      <div className="flex">
        {/* ── Sidebar ── */}
        <aside className="sticky top-15 flex h-[calc(100vh-60px)] w-56 flex-col gap-1 self-start border-r bg-background p-3">
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

        {/* ── Main content ── */}
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

                <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList>
                    {STATUS_FILTERS.map((s) => (
                      <TabsTrigger key={s} value={s}>
                        {s}
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
                      <SelectItem value="All Priorities">
                        All Priorities
                      </SelectItem>
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
                      <SelectItem value="All Categories">
                        All Categories
                      </SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading && (
                <p className="p-6 text-muted-foreground">Loading tickets...</p>
              )}
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
                        <TableCell
                          colSpan={9}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No tickets found
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

      {/* ── Ticket Details Modal ── */}
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
