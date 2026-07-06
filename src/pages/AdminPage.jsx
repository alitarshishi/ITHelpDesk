import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";

import {
  LayoutDashboard,
  Ticket,
  Users,
  Plus,
  RotateCw,
  LogOut,
  Activity,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import RoleBadge from "@/components/RoleBadge";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import ActivityLogModal from "@/components/ActivityLogModal";
import CreateUserForm from "@/components/forms/CreateUserForm";

import { logout, getUser } from "@/services/authService";
import {
  useAllTickets,
  useAllUsers,
  useDeactivateUser,
  useActivateUser,
  useDeleteUser,
  useChangeUserRole,
} from "@/hooks/useAdminData";

const ROLES = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Employee" },
  { id: 3, name: "ITAgent" },
  { id: 4, name: "Manager" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [activityModal, setActivityModal] = useState(null);

  const {
    data: tickets = [],
    isLoading: ticketLoad,
    isError: ticketIsError,
    refetch: fetchTickets,
  } = useAllTickets();
  const ticketError = ticketIsError ? "Failed to load tickets." : "";

  const {
    data: users = [],
    isLoading: userLoad,
    isError: userIsError,
    refetch: fetchUsers,
  } = useAllUsers(activeTab === "users");
  const userError = userIsError ? "Failed to load users." : "";

  const deactivateUser = useDeactivateUser();
  const activateUser = useActivateUser();
  const deleteUser = useDeleteUser();
  const changeUserRole = useChangeUserRole();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleDeactivate = (u) => {
    if (
      !window.confirm(
        `Deactivate ${u.userName}? They will not be able to log in.`,
      )
    )
      return;
    deactivateUser.mutate(u.id, {
      onSuccess: () => toast.success(`${u.userName} has been deactivated.`),
      onError: () => toast.error("Failed to deactivate user."),
    });
  };

  const handleActivate = (u) => {
    activateUser.mutate(u.id, {
      onSuccess: () => toast.success(`${u.userName} has been activated.`),
      onError: () => toast.error("Failed to activate user."),
    });
  };

  const handleDelete = (u) => {
    if (
      !window.confirm(
        `Permanently delete ${u.userName}? This cannot be undone.`,
      )
    )
      return;
    deleteUser.mutate(u.id, {
      onSuccess: () => toast.success(`${u.userName} has been deleted.`),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleRoleChange = (userId, roleId, userName) => {
    changeUserRole.mutate(
      { userId, roleId },
      {
        onSuccess: () => toast.success(`Role updated for ${userName}.`),
        onError: () => toast.error("Failed to change role."),
      },
    );
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "tickets", label: "All Tickets", icon: Ticket },
    { key: "users", label: "All Users", icon: Users },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/30 font-sans">
      {/* ── Navbar ── */}
      <Header
        actions={
          <Button size="sm" onClick={() => setShowCreateUser(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Create User
          </Button>
        }
      />

      <div className="flex flex-1">
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

          {/* ════ TICKETS ════ */}
          {activeTab === "tickets" && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    All Tickets
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}{" "}
                    total
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchTickets()}
                >
                  <RotateCw className="mr-1 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {ticketLoad && (
                <p className="text-muted-foreground">Loading tickets...</p>
              )}
              {ticketError && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {ticketError}
                </p>
              )}

              {!ticketLoad && !ticketError && (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Submitted By</TableHead>
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
                            No tickets found
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
                            <TableCell>
                              {t.assignedToName || (
                                <span className="text-muted-foreground">
                                  Unassigned
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{t.submittedByName || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {t.dateCreated
                                ? new Date(t.dateCreated).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActivityModal(t)}
                              >
                                <Activity className="mr-1 h-3.5 w-3.5" />
                                Activity
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </>
          )}

          {/* ════ USERS ════ */}
          {activeTab === "users" && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    All Users
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {users.length} user{users.length !== 1 ? "s" : ""} total
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers()}
                >
                  <RotateCw className="mr-1 h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {userLoad && (
                <p className="text-muted-foreground">Loading users...</p>
              )}
              {userError && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {userError}
                </p>
              )}

              {!userLoad && !userError && (
                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Created Date</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="py-12 text-center text-muted-foreground"
                          >
                            No users found
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-semibold">
                              {u.id}
                            </TableCell>
                            <TableCell className="font-medium">
                              {u.userName}
                              {!u.isActive && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 bg-red-50 text-red-700"
                                >
                                  Inactive
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              <RoleBadge role={u.role} />
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  u.isActive
                                    ? "text-green-700"
                                    : "text-muted-foreground"
                                }
                              >
                                {u.isActive ? "● Active" : "○ Inactive"}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {u.createdBy || "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {u.createdDate
                                ? new Date(u.createdDate).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1.5">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      Role
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {ROLES.map((r) => (
                                      <DropdownMenuItem
                                        key={r.id}
                                        onClick={() =>
                                          handleRoleChange(
                                            u.id,
                                            r.id,
                                            u.userName,
                                          )
                                        }
                                      >
                                        {r.name} {u.role === r.name && "✓"}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                {u.isActive ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-24"
                                    onClick={() => handleDeactivate(u)}
                                  >
                                    Deactivate
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-24"
                                    onClick={() => handleActivate(u)}
                                  >
                                    Activate
                                  </Button>
                                )}

                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(u)}
                                >
                                  Delete
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
            </>
          )}
        </main>
      </div>

      {/* ── Create User Modal ── */}
      {showCreateUser && (
        <CreateUserForm
          onClose={() => setShowCreateUser(false)}
          onCreated={() => {
            if (activeTab === "users") fetchUsers();
          }}
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
