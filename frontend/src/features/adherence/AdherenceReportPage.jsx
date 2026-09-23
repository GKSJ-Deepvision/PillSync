import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  compareWeeks,
  currentStreak,
  insights,
  pctColor,
  summarize,
  toISODate,
  weekLabel,
  weekRange,
} from "../../lib/adherence";
import {
  ArrowLeftIcon,
  ChartIcon,
  CheckCircleIcon,
  CrossCircleIcon,
} from "../../components/icons";

const SETUP_HINT =
  "The report needs the Milestone 3 database update. Run docs/database/schema-milestone3.sql in the Supabase SQL editor.";

const tz =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

function Bars({ items, height = 140 }) {
  const w = 100 / Math.max(items.length, 1);

  return (
    <svg
      viewBox={`0 0 100 ${height / 2}`}
      className="w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Adherence bars"
    >
      {items.map((it, i) => {
        const h =
          it.pct === null
            ? 1
            : Math.max(1, (it.pct / 100) * (height / 2 - 6));

        return (
          <rect
            key={it.label}
            x={i * w + w * 0.15}
            y={height / 2 - h}
            width={w * 0.7}
            height={h}
            rx="1.5"
            fill={pctColor(it.pct)}
          />
        );
      })}
    </svg>
  );
}

function Labels({ items }) {
  return (
    <div className="flex text-[11px] text-gray-500 mt-1">
      {items.map((it) => (
        <div key={it.label} className="flex-1 text-center">
          <div>{it.label}</div>
          <div className="font-medium text-gray-700">
            {it.pct === null ? "—" : `${it.pct}%`}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdherenceReportPage() {
  const { user } = useAuth();

  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const week = weekRange(offset);
    const prev = weekRange(offset - 1);

    const today = new Date();

    const back30 = new Date();
    back30.setDate(today.getDate() - 29);

    const args = {
      p_patient: user.id,
      p_tz: tz,
    };

    Promise.all([
      supabase.rpc("adherence_daily", {
        ...args,
        p_from: week.from,
        p_to: week.to,
      }),

      supabase.rpc("adherence_daily", {
        ...args,
        p_from: prev.from,
        p_to: prev.to,
      }),

      supabase.rpc("adherence_daily", {
        ...args,
        p_from: toISODate(back30),
        p_to: toISODate(today),
      }),

      supabase.rpc("adherence_weekly", {
        ...args,
        p_weeks: 8,
      }),

      supabase.rpc("adherence_by_medication", {
        ...args,
        p_days: 30,
      }),

      supabase.rpc("adherence_by_slot", {
        ...args,
        p_days: 30,
      }),
    ]).then(([wk, pv, d30, trend, byMed, bySlot]) => {
      if (cancelled) return;

      const failed = [wk, pv, d30, trend, byMed, bySlot].find(
        (r) => r.error
      );

      if (failed) {
        setError(
          /function|PGRST202/i.test(
            failed.error.message + failed.error.code
          )
            ? SETUP_HINT
            : failed.error.message
        );

        return;
      }

      setError(null);

      setData({
        week: wk.data,
        prev: pv.data,
        d30: d30.data,
        trend: trend.data,
        byMed: byMed.data,
        bySlot: bySlot.data,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [user, offset]);

  const week = weekRange(offset);

  const s = data ? summarize(data.week) : null;
  const p = data ? summarize(data.prev) : null;

  const cmp =
    data && s && p
      ? compareWeeks(s.pct, p.pct)
      : null;

  const m = data ? summarize(data.d30) : null;

  const streak = data ? currentStreak(data.d30) : 0;

  const days = data
    ? data.week.map((r) => ({
        label: new Date(`${r.day}T00:00:00`).toLocaleDateString(
          undefined,
          { weekday: "short" }
        ),
        pct: r.pct,
      }))
    : [];

  const weeks = data
    ? data.trend.map((r) => ({
        label: new Date(
          `${r.week_start}T00:00:00`
        ).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
        }),
        pct: r.pct,
      }))
    : [];

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Link
              to="/history"
              className="print:hidden inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 mb-3 transition-colors"
            >
              <ArrowLeftIcon />
              History
            </Link>

            <h1 className="heading text-2xl md:text-3xl font-bold text-gray-900">
              Weekly adherence report
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {weekLabel(week)}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Review your weekly medication adherence and trends.
            </p>
          </div>

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#CCFBF1",
              color: "#0F766E",
            }}
          >
            <ChartIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Week Controls */}
        <div className="print:hidden flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-white border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-700 transition-colors"
          >
            ← Previous week
          </button>

          <button
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset === 0}
            className="px-4 py-2 text-sm font-medium rounded-xl bg-white border border-gray-200 text-gray-700 hover:border-teal-300 hover:text-teal-700 disabled:opacity-40 transition-colors"
          >
            Next week →
          </button>

          <button
            onClick={() => window.print()}
            className="md:ml-auto px-4 py-2 text-sm font-medium rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition-colors"
          >
            Print / save as PDF
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Loading */}
        {!data && !error && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <p className="text-sm text-gray-500">
              Loading adherence report…
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

              {/* This Week */}
              <div
                className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor: "#F0FDFA",
                  border: "1px solid #99F6E4",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#0F766E" }}
                    >
                      This week
                    </p>

                    <p
                      className="text-3xl font-bold mt-2"
                      style={{ color: "#115E59" }}
                    >
                      {s.pct === null ? "—" : `${s.pct}%`}
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{ color: "#0F766E" }}
                    >
                      Weekly adherence
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

              {/* Comparison */}
              <div
                className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor:
                    cmp.direction === "up"
                      ? "#F0FDF4"
                      : cmp.direction === "down"
                      ? "#FFF7F7"
                      : "#F9FAFB",
                  border:
                    cmp.direction === "up"
                      ? "1px solid #BBF7D0"
                      : cmp.direction === "down"
                      ? "1px solid #FECDD3"
                      : "1px solid #E5E7EB",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color:
                          cmp.direction === "up"
                            ? "#15803D"
                            : cmp.direction === "down"
                            ? "#BE123C"
                            : "#6B7280",
                      }}
                    >
                      vs previous week
                    </p>

                    <p
                      className="text-3xl font-bold mt-2"
                      style={{
                        color:
                          cmp.direction === "up"
                            ? "#166534"
                            : cmp.direction === "down"
                            ? "#9F1239"
                            : "#374151",
                      }}
                    >
                      {cmp.delta === null
                        ? "—"
                        : `${cmp.delta > 0 ? "+" : ""}${cmp.delta} pts`}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Week-to-week change
                    </p>
                  </div>

                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor:
                        cmp.direction === "up"
                          ? "#DCFCE7"
                          : cmp.direction === "down"
                          ? "#FFE4E6"
                          : "#F3F4F6",
                      color:
                        cmp.direction === "up"
                          ? "#16A34A"
                          : cmp.direction === "down"
                          ? "#E11D48"
                          : "#6B7280",
                    }}
                  >
                    {cmp.direction === "up" ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : cmp.direction === "down" ? (
                      <CrossCircleIcon className="w-6 h-6" />
                    ) : (
                      <ChartIcon className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div
                className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#2563EB" }}
                    >
                      Perfect-day streak
                    </p>

                    <p
                      className="text-3xl font-bold mt-2"
                      style={{ color: "#1D4ED8" }}
                    >
                      {streak}
                    </p>

                    <p
                      className="text-xs mt-1"
                      style={{ color: "#60A5FA" }}
                    >
                      Consecutive perfect days
                    </p>
                  </div>

                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: "#DBEAFE",
                      color: "#2563EB",
                    }}
                  >
                    <CheckCircleIcon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Daily + 8 Week Trend */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

              {/* Each Day */}
              <Section
                title="Each day"
                subtitle="Your adherence for each day of the selected week."
              >
                <div className="pt-3">
                  <Bars items={days} />

                  <Labels items={days} />

                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                    <span>
                      <strong className="text-gray-700">
                        {s.taken}
                      </strong>{" "}
                      taken
                    </span>

                    <span>
                      <strong className="text-gray-700">
                        {s.missed}
                      </strong>{" "}
                      missed
                    </span>
                  </div>
                </div>
              </Section>

              {/* 8 Week Trend */}
              <Section
                title="8-week trend"
                subtitle="See how your adherence has changed over the past eight weeks."
              >
                <div className="pt-3">
                  <Bars items={weeks} />
                  <Labels items={weeks} />
                </div>
              </Section>
            </div>

            {/* Last 30 Days */}
            <div className="mb-8">
              <Section
                title="Last 30 days overview"
                subtitle="Overall adherence based on completed and missed doses."
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">

                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-xs text-gray-500">
                      Overall adherence
                    </p>

                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {m.pct === null ? "—" : `${m.pct}%`}
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                    <p className="text-xs text-green-700">
                      Doses taken
                    </p>

                    <p className="text-2xl font-bold text-green-800 mt-1">
                      {m.taken}
                    </p>
                  </div>

                  <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
                    <p className="text-xs text-rose-700">
                      Doses missed
                    </p>

                    <p className="text-2xl font-bold text-rose-800 mt-1">
                      {m.missed}
                    </p>
                  </div>
                </div>
              </Section>
            </div>

            {/* Medicine + Time of Day */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

              {/* By Medicine */}
              <Section
                title="By medicine"
                subtitle="Medication adherence over the last 30 days."
              >
                {data.byMed.length === 0 ? (
                  <p className="text-sm text-gray-500 py-3">
                    No completed doses yet.
                  </p>
                ) : (
                  <div className="space-y-4 pt-2">
                    {data.byMed.map((r) => (
                      <div
                        key={r.medication_id}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {r.name}
                          </span>

                          <span className="text-xs text-gray-600 shrink-0">
                            {r.pct === null
                              ? "—"
                              : `${r.pct}%`}
                            {" · "}
                            {r.missed} missed
                          </span>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${r.pct ?? 0}%`,
                              background: pctColor(r.pct),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* By Time */}
              <Section
                title="By time of day"
                subtitle="Adherence grouped by medication reminder time."
              >
                {data.bySlot.length === 0 ? (
                  <p className="text-sm text-gray-500 py-3">
                    No completed doses yet.
                  </p>
                ) : (
                  <div className="space-y-4 pt-2">
                    {data.bySlot.map((r) => (
                      <div
                        key={r.slot}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {r.slot}
                          </span>

                          <span className="text-xs text-gray-600 shrink-0">
                            {r.pct === null
                              ? "—"
                              : `${r.pct}%`}
                            {" · "}
                            {r.missed} missed
                          </span>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${r.pct ?? 0}%`,
                              background: pctColor(r.pct),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* Insights */}
            <Section
              title="What this means"
              subtitle="A simple summary based on your recent medication activity."
            >
              <div className="pt-2">
                <ul className="space-y-3">
                  {insights({
                    weekPct: s.pct,
                    bySlot: data.bySlot,
                    byMed: data.byMed,
                  }).map((t) => (
                    <li
                      key={t}
                      className="flex gap-3 text-sm text-gray-700"
                    >
                      <span
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{
                          backgroundColor: "#14B8A6",
                        }}
                      />

                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    Last 30 days overall:{" "}
                    {m.pct === null ? "—" : `${m.pct}%`}.
                    {" "}
                    Adherence = doses taken ÷ (taken + missed).
                    This report is informational and not medical advice.
                  </p>
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 break-inside-avoid">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}