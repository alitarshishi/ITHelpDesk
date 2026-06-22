import React, { useState, useEffect, useRef } from "react";
import { authFetch } from "../services/authService";
import { startConnection, stopConnection } from "../services/notificationHub";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://localhost:7270/api";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef();

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
      const data = await res.json();
      setNotifications(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // ── Initial load + live SignalR connection ──
  useEffect(() => {
    fetchUnreadCount();

    startConnection((notification) => {
      // 👇 fires INSTANTLY when the backend pushes a new notification
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    return () => stopConnection();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    await authFetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PUT",
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (n) => {
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
  };

  const timeAgo = (dateStr) => {
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={handleToggle}
        style={{
          background: "none",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "7px 12px",
          cursor: "pointer",
          position: "relative",
          fontSize: "1rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "#fff",
              borderRadius: "999px",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "1px 5px",
              minWidth: "16px",
              lineHeight: "14px",
              textAlign: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "340px",
            maxHeight: "420px",
            overflowY: "auto",
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 1100,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 16px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1d4ed8",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {loading && (
            <p
              style={{
                padding: "20px",
                color: "#9ca3af",
                fontSize: "0.85rem",
                margin: 0,
              }}
            >
              Loading...
            </p>
          )}
          {!loading && notifications.length === 0 && (
            <p
              style={{
                padding: "24px",
                color: "#9ca3af",
                fontSize: "0.85rem",
                margin: 0,
                textAlign: "center",
              }}
            >
              No notifications yet.
            </p>
          )}

          {!loading &&
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f9fafb",
                  background: n.isRead ? "#fff" : "#eff6ff",
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = n.isRead
                    ? "#fafafa"
                    : "#dbeafe")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = n.isRead
                    ? "#fff"
                    : "#eff6ff")
                }
              >
                {!n.isRead && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#3b82f6",
                      marginTop: "5px",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  <div
                    style={{
                      fontSize: "0.83rem",
                      color: "#374151",
                      lineHeight: 1.4,
                    }}
                  >
                    {n.message}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "#9ca3af",
                      marginTop: "2px",
                    }}
                  >
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
