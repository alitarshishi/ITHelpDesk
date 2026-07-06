import React, { useState, useEffect } from "react";
import { Bell, Trash2 } from "lucide-react";
import { authFetch } from "@/services/authService";
import { startConnection, stopConnection } from "@/services/notificationHub";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

// Triggers that should open the Activity Log instead of ticket Details
const ACTIVITY_LOG_TRIGGERS = ["Reassigned"];

export default function NotificationBell({ onOpenTicket }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/notifications/unread-count`);
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count);
    } catch {}
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/notifications`);
      if (!res.ok) return;
      setNotifications(await res.json());
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleReconnect = () => {
      // Re-fetch from REST in case we missed pushes during disconnect
      fetchUnreadCount();
      if (open) fetchNotifications();
    };

    window.addEventListener("signalr-reconnected", handleReconnect);
    return () =>
      window.removeEventListener("signalr-reconnected", handleReconnect);
  }, [open]);

  useEffect(() => {
    fetchUnreadCount();

    const channel = new BroadcastChannel("notification-sync");
    channel.onmessage = (e) => {
      if (e.data.type === "unread-count") {
        setUnreadCount(e.data.count);
      }
      if (e.data.type === "new-notification") {
        setNotifications((prev) => {
          // avoid duplicates if this tab also received it via SignalR
          if (prev.some((n) => n.id === e.data.notification.id)) return prev;
          return [e.data.notification, ...prev];
        });
        setUnreadCount((c) => c + 1);
      }
    };
    startConnection((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => {
        const next = c + 1;
        //  broadcast to other tabs
        channel.postMessage({ type: "unread-count", count: next });
        return next;
      });
      // also broadcast the full notification object
      channel.postMessage({ type: "new-notification", notification });
    });
    return () => {
      stopConnection();
      channel.close();
    };
  }, []);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await authFetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PUT",
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    const channel = new BroadcastChannel("notification-sync");
    channel.postMessage({ type: "unread-count", count: 0 });
    channel.close();
  };

  const handleClearAll = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Clear all notifications? This cannot be undone."))
      return;
    await authFetch(`${API_BASE_URL}/notifications/clear-all`, {
      method: "DELETE",
    });
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleNotificationClick = async (n) => {
    // mark read
    if (!n.isRead) {
      await authFetch(`${API_BASE_URL}/notifications/${n.id}/read`, {
        method: "PUT",
      });
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);

    // navigate to the right view
    if (!n.ticketId) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/tickets/${n.ticketId}`);
      if (!res.ok) return;
      const ticket = await res.json();

      const view = ACTIVITY_LOG_TRIGGERS.includes(n.trigger)
        ? "activity"
        : "details";
      onOpenTicket?.(ticket, view);
    } catch {}
  };

  const timeAgo = (dateStr) => {
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
              >
                <Trash2 className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading && (
            <p className="p-5 text-sm text-muted-foreground">Loading...</p>
          )}
          {!loading && notifications.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          )}

          {!loading &&
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`flex cursor-pointer gap-2.5 border-b px-4 py-3 last:border-b-0 hover:bg-muted ${
                  n.isRead ? "" : "bg-blue-50"
                }`}
              >
                {!n.isRead && (
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                )}
                <div>
                  <div className="text-sm leading-snug">{n.message}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              </div>
            ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
