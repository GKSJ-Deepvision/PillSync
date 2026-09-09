import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { adherencePercentage } from "../../lib/scheduling";
import { ArrowLeftIcon, ChartIcon, CheckCircleIcon, CrossCircleIcon } from "../../components/icons";

export default function HistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    supabase
      .from("dose_logs")
      .select("id, scheduled_for, status, medications(name)")
      .eq("patient_id", user.id)
      .gte("scheduled_for", since.toISOString())
      .order("scheduled_for", { ascending: false })
      .then(({ data }) => {
        setLogs(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const pct = adherencePercentage(logs.map((l) => l.status));
  const takenCount = logs.filter((l) => l.status === "taken").length;
  const missedCount = logs.filter((l) => l.status === "missed").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="max-w-2xl mx-auto p-6 space-y-5">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon /> Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading text-2xl font-bold text-gray-900">History</h1>
            <p className="text-sm text-gray-500">Last 30 days</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <ChartIcon className="text-white w-6 h-6" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{pct === null ? "—" : `${pct}%`}</p>
            <p className="text-xs text-gray-500 mt-1">Adherence</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{takenCount}</p>
            <p className="text-xs text-gray-500 mt-1">Taken</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{missedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Missed</p>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        <ul className="space-y-2">
          {logs.map((log) => (
            <li
              key={log.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                {log.status === "taken" ? (
                  <CheckCircleIcon className="text-emerald-500 w-[18px] h-[18px]" />
                ) : log.status === "missed" ? (
                  <CrossCircleIcon className="text-red-500 w-[18px] h-[18px]" />
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full bg-gray-200" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">{log.medications?.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.scheduled_for).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  log.status === "taken"
                    ? "bg-emerald-100 text-emerald-700"
                    : log.status === "missed"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {log.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
