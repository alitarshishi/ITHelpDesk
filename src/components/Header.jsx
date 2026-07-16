import { useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import { logout, getUser, getRole } from "@/services/authService";
import { useTheme } from "@/context/ThemeContext";
import { getRoleConfig } from "@/styling/badges";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";
import { useMyProfile } from "@/hooks/useProfile";
import { authFetch } from "@/services/authService";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/NotificationBell";

import React, { useState, useEffect } from "react";

export default function Header({ actions, onOpenTicket }) {
  const [showProfile, setShowProfile] = useState(false);
  const { data: profile } = useMyProfile();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const navigate = useNavigate();
  const currentUser = getUser();
  const role = getRole();
  const roleConfig = getRoleConfig(role);
  const { dark, toggle } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    if (!profile?.hasAvatar) return;
    let objectUrl;
    (async () => {
      const res = await authFetch(
        `${process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api"}/profile/avatar`,
      );
      if (!res.ok) return;
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
      setAvatarUrl(objectUrl);
    })();
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [profile?.hasAvatar]);

  return (
    <nav className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b bg-background px-8">
      {/* ── Logo + user info ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowProfile(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} alt={currentUser?.userName} />
            <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
              {(currentUser?.userName || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
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

      {/* ── Right side ── */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={toggle}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {onOpenTicket && <NotificationBell onOpenTicket={onOpenTicket} />}

        {actions}

        <Button size="sm" variant="outline" onClick={handleLogout}>
          <LogOut className="mr-1 h-4 w-4" />
          Log Out
        </Button>
      </div>
      {showProfile && (
        <ProfileSettingsModal onClose={() => setShowProfile(false)} />
      )}
    </nav>
  );
}
