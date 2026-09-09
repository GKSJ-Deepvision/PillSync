import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import DoseRing from "../features/dashboard/DoseRing";
import { PillIcon, BellIcon, ChartIcon } from "../components/icons";

export default function PatientDashboard() {
  const { profile, user } = useAuth();
  const [counts, setCounts] = useState({ taken: 0, total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    supabase
      .from("dose_logs")
      .select("status")
      .eq("patient_id", user.id)
      .gte("scheduled_for", todayStart.toISOString())
      .lte("scheduled_for", todayEnd.toISOString())
      .then(({ data }) => {
        if (!data) return;
        setCounts({
          taken: data.filter((d) => d.status === "taken").length,
          total: data.length,
        });
      });

    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false)
      .then(({ count }) => setUnreadCount(count ?? 0));
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <h1 className="heading text-2xl font-bold text-gray-900">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-teal-100">
          <DoseRing taken={counts.taken} total={counts.total} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/reminders"
            className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-shadow"
          >
            <BellIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Reminders</span>
          </Link>
          <Link
            to="/medications"
            className="bg-white text-teal-700 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-teal-100 hover:border-teal-300 transition-colors"
          >
            <PillIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Medicines</span>
          </Link>
          <Link
            to="/history"
            className="bg-white text-teal-700 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-teal-100 hover:border-teal-300 transition-colors"
          >
            <ChartIcon className="w-6 h-6" />
            <span className="text-xs font-medium">History</span>
          </Link>
        </div>

        <Link
          to="/notifications"
          className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-teal-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <BellIcon className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">Notifications</span>
          </div>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
