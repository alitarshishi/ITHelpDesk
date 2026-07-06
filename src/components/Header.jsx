import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logout, getUser, getRole } from "@/services/authService";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/NotificationBell";
import { getRoleConfig } from "@/styling/badges";

/**
 * Shared top navbar for all authenticated pages.
 *
 * Props:
 *   actions — optional ReactNode rendered between the bell and logout
 *             (e.g. "+ Create Ticket" on EmployeePage, "+ Create User" on AdminPage)
 */
export default function Header({ actions, onOpenTicket }) {
  const navigate = useNavigate();
  const currentUser = getUser();
  const role = getRole();
  const roleConfig = getRoleConfig(role);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 flex h-15 items-center justify-between border-b bg-background px-8 pb-1 pt-2">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          IT
        </div>
        <div>
          <div className="text-sm font-bold tracking-tight">IT Help Desk</div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {currentUser?.userName || "User"}
            <Badge
              variant="outline"
              className={`px-1.5 py-0 text-[10px] ${roleConfig.className}`}
            >
              {roleConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell onOpenTicket={onOpenTicket} />
        {actions}
        <Button size="sm" variant="outline" onClick={handleLogout}>
          <LogOut className="mr-1 h-4 w-4" />
          Log Out
        </Button>
      </div>
    </nav>
  );
}
