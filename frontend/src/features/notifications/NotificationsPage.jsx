import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeftIcon, BellIcon, AlertCircleIcon, CheckIcon } from "../../components/icons";

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
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon /> Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="heading text-2xl font-bold text-gray-900">Notifications</h1>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-200">
            <BellIcon className="text-white w-6 h-6" />
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {!loading && notifications.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center mb-3">
              <BellIcon className="text-white w-7 h-7" />
            </div>
            <p className="text-gray-700 font-medium">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">Missed-dose alerts will show up here.</p>
          </div>
        )}

        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-3 ${
                n.read ? "border-gray-100 opacity-60" : "border-red-100"
              }`}
            >
              <div
                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
                  n.read ? "bg-gray-100" : "bg-gradient-to-br from-red-400 to-rose-600"
                }`}
              >
                <AlertCircleIcon className={n.read ? "text-gray-400 w-[18px] h-[18px]" : "text-white w-[18px] h-[18px]"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">{n.title}</p>
                {n.body && <p className="text-sm text-gray-500">{n.body}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.created_at).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="shrink-0 flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <CheckIcon className="w-3 h-3" /> Read
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
