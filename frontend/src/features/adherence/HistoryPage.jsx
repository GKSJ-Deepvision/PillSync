import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { adherencePercentage } from "../../lib/scheduling";
import {
  ArrowLeftIcon,
  ChartIcon,
  CheckCircleIcon,
  CrossCircleIcon,
} from "../../components/icons";

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

  const pct = adherencePercentage(
    logs.map((l) => l.status)
  );

  const takenCount = logs.filter(
    (l) => l.status === "taken"
  ).length;

  const missedCount = logs.filter(
    (l) => l.status === "missed"
  ).length;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">

        {/* =====================================================
            PAGE HEADER
        ====================================================== */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">

          <div>
            {/* Back to Dashboard */}
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 mb-3 transition-colors"
            >
              <ArrowLeftIcon />
              Dashboard
            </Link>

            {/* Title */}
            <h1 className="heading text-2xl md:text-3xl font-bold text-gray-900">
              Medication history
            </h1>

            {/* Description */}
            <p className="text-sm text-gray-500 mt-1">
              Track your medication adherence over the last 30 days.
            </p>

            {/* Weekly Report Button */}
            <Link
              to="/adherence-report"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
            >
              <ChartIcon className="w-4 h-4" />
              View weekly report & trends
            </Link>
          </div>

          {/* Header Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: "#CCFBF1",
              color: "#0F766E",
            }}
          >
            <ChartIcon className="w-6 h-6" />
          </div>
        </div>

        {/* =====================================================
            SUMMARY CARDS
        ====================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          {/* -------------------------------------------------
              ADHERENCE CARD
          -------------------------------------------------- */}
          <div
            className="rounded-2xl p-5 shadow-sm transition-all hover:shadow-md"
            style={{
              backgroundColor: "#F0FDFA",
              border: "1px solid #99F6E4",
            }}
          >
            <div className="flex items-center justify-between">

              <div>
                <p
                  className="text-sm font-medium"
                  style={{
                    color: "#0F766E",
                  }}
                >
                  Adherence
                </p>

                <p
                  className="text-3xl font-bold mt-2"
                  style={{
                    color: "#115E59",
                  }}
                >
                  {pct === null ? "—" : `${pct}%`}
                </p>

                <p
                  className="text-xs mt-1"
                  style={{
                    color: "#5EEAD4",
                  }}
                >
                  Last 30 days
                </p>
              </div>

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#CCFBF1",
                  color: "#0F766E",
                }}
              >
                <ChartIcon className="w-5 h-5" />
              </div>

            </div>
          </div>

          {/* -------------------------------------------------
              TAKEN CARD
          -------------------------------------------------- */}
          <div
            className="rounded-2xl p-5 shadow-sm transition-all hover:shadow-md"
            style={{
              backgroundColor: "#F0FDF4",
              border: "1px solid #BBF7D0",
            }}
          >
            <div className="flex items-center justify-between">

              <div>
                <p
                  className="text-sm font-medium"
                  style={{
                    color: "#15803D",
                  }}
                >
                  Doses taken
                </p>

                <p
                  className="text-3xl font-bold mt-2"
                  style={{
                    color: "#166534",
                  }}
                >
                  {takenCount}
                </p>

                <p
                  className="text-xs mt-1"
                  style={{
                    color: "#4ADE80",
                  }}
                >
                  Completed doses
                </p>
              </div>

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#DCFCE7",
                  color: "#16A34A",
                }}
              >
                <CheckCircleIcon className="w-6 h-6" />
              </div>

            </div>
          </div>

          {/* -------------------------------------------------
              MISSED CARD
          -------------------------------------------------- */}
          <div
            className="rounded-2xl p-5 shadow-sm transition-all hover:shadow-md"
            style={{
              backgroundColor: "#FFF7F7",
              border: "1px solid #FECDD3",
            }}
          >
            <div className="flex items-center justify-between">

              <div>
                <p
                  className="text-sm font-medium"
                  style={{
                    color: "#BE123C",
                  }}
                >
                  Doses missed
                </p>

                <p
                  className="text-3xl font-bold mt-2"
                  style={{
                    color: "#9F1239",
                  }}
                >
                  {missedCount}
                </p>

                <p
                  className="text-xs mt-1"
                  style={{
                    color: "#FB7185",
                  }}
                >
                  Missed doses
                </p>
              </div>

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#FFE4E6",
                  color: "#E11D48",
                }}
              >
                <CrossCircleIcon className="w-6 h-6" />
              </div>

            </div>
          </div>

        </div>

        {/* =====================================================
            HISTORY SECTION
        ====================================================== */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Section Header */}
          <div className="px-5 py-5 md:px-6 border-b border-gray-100">

            <h2 className="text-lg font-semibold text-gray-900">
              Dose history
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Your medication activity from the last 30 days.
            </p>

          </div>

          {/* =================================================
              LOADING
          ================================================== */}
          {loading && (
            <div className="p-8 text-center">

              <p className="text-sm text-gray-500">
                Loading history…
              </p>

            </div>
          )}

          {/* =================================================
              EMPTY STATE
          ================================================== */}
          {!loading && logs.length === 0 && (
            <div className="p-12 text-center">

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  backgroundColor: "#CCFBF1",
                  color: "#0F766E",
                }}
              >
                <ChartIcon className="w-7 h-7" />
              </div>

              <p className="font-semibold text-gray-900">
                No medication history
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Your medication activity will appear here once
                you start responding to reminders.
              </p>

            </div>
          )}

          {/* =================================================
              HISTORY LIST
          ================================================== */}
          {!loading && logs.length > 0 && (
            <div className="divide-y divide-gray-100">

              {logs.map((log) => {
                const isTaken = log.status === "taken";
                const isMissed = log.status === "missed";

                return (
                  <div
                    key={log.id}
                    className="px-5 py-4 md:px-6 hover:bg-gray-50 transition-colors"
                  >

                    <div className="flex items-center justify-between gap-4">

                      {/* Medicine Information */}
                      <div className="flex items-center gap-4 min-w-0">

                        {/* Status Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isTaken
                              ? "#DCFCE7"
                              : isMissed
                              ? "#FFE4E6"
                              : "#F3F4F6",

                            color: isTaken
                              ? "#16A34A"
                              : isMissed
                              ? "#E11D48"
                              : "#6B7280",
                          }}
                        >
                          {isTaken ? (
                            <CheckCircleIcon className="w-5 h-5" />
                          ) : isMissed ? (
                            <CrossCircleIcon className="w-5 h-5" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                          )}
                        </div>

                        {/* Medicine Details */}
                        <div className="min-w-0">

                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {log.medications?.name || "Medicine"}
                          </p>

                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(
                              log.scheduled_for
                            ).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>

                        </div>
                      </div>

                      {/* Status */}
                      <span
                        className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: isTaken
                            ? "#DCFCE7"
                            : isMissed
                            ? "#FFE4E6"
                            : "#F3F4F6",

                          color: isTaken
                            ? "#15803D"
                            : isMissed
                            ? "#BE123C"
                            : "#4B5563",
                        }}
                      >
                        {log.status}
                      </span>

                    </div>
                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}