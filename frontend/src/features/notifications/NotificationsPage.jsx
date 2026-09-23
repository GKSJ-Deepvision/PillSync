import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeftIcon,
  BellIcon,
  AlertCircleIcon,
  CheckIcon,
} from "../../components/icons";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;

    setLoading(true);

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const markRead = async (id) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    load();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 mb-3 transition-colors"
            >
              <ArrowLeftIcon />
              Dashboard
            </Link>

            <h1 className="heading text-2xl md:text-3xl font-bold text-gray-900">
              Notifications
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Stay updated with medication reminders and alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* Unread Count */}
            {unreadCount > 0 && (
              <div
                className="px-3 py-2 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: "#EFF6FF",
                  color: "#2563EB",
                  border: "1px solid #BFDBFE",
                }}
              >
                {unreadCount} unread
              </div>
            )}

            {/* Notification Icon */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: "#CCFBF1",
                color: "#0F766E",
              }}
            >
              <BellIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Notification Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">

          {/* Total Notifications */}
          <div
            className="rounded-2xl p-5 shadow-sm transition-all hover:shadow-md"
            style={{
              backgroundColor: "#F0FDFA",
              border: "1px solid #99F6E4",
            }}
          >
            <div className="flex items-center gap-4">

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#CCFBF1",
                  color: "#0F766E",
                }}
              >
                <BellIcon className="w-5 h-5" />
              </div>

              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "#0F766E" }}
                >
                  Total notifications
                </p>

                <p
                  className="text-2xl font-bold mt-1"
                  style={{ color: "#115E59" }}
                >
                  {notifications.length}
                </p>
              </div>

            </div>
          </div>

          {/* Unread Notifications */}
          <div
            className="rounded-2xl p-5 shadow-sm transition-all hover:shadow-md"
            style={{
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
            }}
          >
            <div className="flex items-center gap-4">

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#DBEAFE",
                  color: "#2563EB",
                }}
              >
                <AlertCircleIcon className="w-5 h-5" />
              </div>

              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "#1D4ED8" }}
                >
                  Unread notifications
                </p>

                <p
                  className="text-2xl font-bold mt-1"
                  style={{ color: "#1E40AF" }}
                >
                  {unreadCount}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500">
              Loading notifications…
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              backgroundColor: "#F0FDFA",
              border: "1px dashed #99F6E4",
            }}
          >
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: "#CCFBF1",
                color: "#0F766E",
              }}
            >
              <BellIcon className="w-8 h-8" />
            </div>

            <p className="text-lg font-semibold text-gray-900">
              No notifications yet
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Medication alerts and reminders will appear here.
            </p>
          </div>
        )}

        {/* Notifications */}
        {!loading && notifications.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Section Header */}
            <div className="px-5 py-5 md:px-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent notifications
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Your latest medication alerts and updates.
              </p>
            </div>

            {/* Notification List */}
            <div className="divide-y divide-gray-100">

              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="px-5 py-5 md:px-6 transition-colors"
                  style={{
                    backgroundColor: n.read ? "#FFFFFF" : "#F8FAFC",
                  }}
                >
                  <div className="flex items-start gap-4">

                    {/* Notification Icon */}
                    <div
                      className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: n.read
                          ? "#F3F4F6"
                          : "#DBEAFE",
                        color: n.read
                          ? "#9CA3AF"
                          : "#2563EB",
                      }}
                    >
                      <AlertCircleIcon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">

                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">

                        <div className="min-w-0">

                          {/* Title */}
                          <div className="flex items-center gap-2">

                            {!n.read && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: "#2563EB",
                                }}
                              />
                            )}

                            <p className="font-semibold text-gray-900 text-sm">
                              {n.title}
                            </p>

                          </div>

                          {/* Body */}
                          {n.body && (
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                              {n.body}
                            </p>
                          )}

                          {/* Date */}
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(n.created_at).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>

                        {/* Mark as Read */}
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="self-start shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                            style={{
                              backgroundColor: "#EFF6FF",
                              color: "#2563EB",
                              border: "1px solid #BFDBFE",
                            }}
                          >
                            <CheckIcon className="w-3.5 h-3.5" />
                            Mark as read
                          </button>
                        )}

                        {/* Read */}
                        {n.read && (
                          <span
                            className="self-start shrink-0 text-xs font-medium px-3 py-2 rounded-xl"
                            style={{
                              backgroundColor: "#F3F4F6",
                              color: "#6B7280",
                            }}
                          >
                            Read
                          </span>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}