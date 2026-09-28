import React, { useState, useEffect } from "react";
import {
  fetchNotificationsApi,
  markNotificationReadApi,
} from "../../services/api";
import { Bell, Check } from "lucide-react";

export default function NotificationDrawer() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchNotificationsApi();
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    }
    load();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Alerts & Reminders
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          {notifications.filter((n) => !n.is_read).length} Unread
        </span>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-xs text-slate-400 py-4 text-center">
            No alerts at this time.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                item.is_read
                  ? "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-70"
                  : "bg-brand-50/30 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800 font-medium"
              }`}
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {item.title}
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.message}
                </div>
              </div>
              {!item.is_read && (
                <button
                  onClick={() => handleMarkRead(item.id)}
                  className="p-1 hover:bg-brand-100 rounded-full text-brand-600 transition-colors"
                  title="Mark as Read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
