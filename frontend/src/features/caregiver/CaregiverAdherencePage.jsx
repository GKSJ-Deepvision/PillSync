import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { currentStreak } from "../../lib/adherence";
import {
  SLOTS,
  adherenceStatus,
  changeInPoints,
  dailyAdherence,
  filterByRange,
  lastMissed,
  missedBySlot,
  periodRanges,
  summarizeLogs,
} from "../../lib/caregiverAdherence";

const FETCH_DAYS = 60;
const ROW_LIMIT = 1000;
const PERIODS = [7, 14, 30];

const STATUS_STYLE = {
  good: { label: "Good", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500", text: "text-emerald-600", column: "bg-sky-500" },
  attention: { label: "Needs attention", badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500", bar: "bg-orange-400", text: "text-orange-500", column: "bg-orange-400" },
  critical: { label: "Critical", badge: "bg-red-100 text-red-700", dot: "bg-red-500", bar: "bg-red-500", text: "text-red-600", column: "bg-red-400" },
  none: { label: "No data", badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400", bar: "bg-slate-300", text: "text-slate-400", column: "bg-slate-100" },
};

function getInitials(name) {
  if (!name) return "P";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function ChangeBadge({ change }) {
  if (change === null) return <span className="text-xs text-slate-400">–</span>;
  if (change === 0) return <span className="text-xs font-semibold text-slate-500">No change</span>;
  const up = change > 0;
  return (
    <span className={`text-xs font-bold ${up ? "text-emerald-600" : "text-orange-500"}`}>
      {up ? "▲" : "▼"} {Math.abs(change)} pts
    </span>
  );
}

function StatCard({ title, value, hint, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`absolute right-0 top-0 h-20 w-20 rounded-bl-full ${accent}`} />
      <div className="relative">
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
        <div className="mt-2 text-xs text-slate-500">{hint}</div>
      </div>
    </div>
  );
}

export default function CaregiverAdherencePage() {
  const { user } = useAuth();

  const [now] = useState(() => new Date());
  const [patients, setPatients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(30);
  const [selectedId, setSelectedId] = useState("all");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadAdherence() {
      try {
        const { data: links, error: linksError } = await supabase
          .from("caregiver_links")
          .select("patient_id")
          .eq("caregiver_id", user.id)
          .eq("status", "accepted");
        if (linksError) throw linksError;

        const patientIds = (links || []).map((link) => link.patient_id);
        if (patientIds.length === 0) {
          if (!cancelled) {
            setPatients([]);
            setLogs([]);
          }
          return;
        }

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", patientIds);
        if (profilesError) throw profilesError;

        const since = new Date();
        since.setHours(0, 0, 0, 0);
        since.setDate(since.getDate() - (FETCH_DAYS - 1));

        const { data: doseLogs, error: logsError } = await supabase
          .from("dose_logs")
          .select("id, patient_id, scheduled_for, status, medications(name)")
          .in("patient_id", patientIds)
          .gte("scheduled_for", since.toISOString())
          .order("scheduled_for", { ascending: false })
          .limit(ROW_LIMIT);
        if (logsError) throw logsError;

        if (!cancelled) {
          setPatients(profiles || []);
          setLogs(doseLogs || []);
        }
      } catch (err) {
        console.error("Caregiver adherence error:", err);
        if (!cancelled) setError(err?.message || "Unable to load caregiver adherence data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAdherence();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const ranges = useMemo(() => periodRanges(period, now), [period, now]);

  const scopedLogs = useMemo(
    () => (selectedId === "all" ? logs : logs.filter((log) => log.patient_id === selectedId)),
    [logs, selectedId]
  );

  const view = useMemo(() => {
    const current = filterByRange(scopedLogs, ranges.currentPeriod.from, ranges.currentPeriod.to);
    const previous = filterByRange(scopedLogs, ranges.previousPeriod.from, ranges.previousPeriod.to);
    const overall = summarizeLogs(current);
    const before = summarizeLogs(previous);
    const daily = dailyAdherence(current, period, now);
    const streak = currentStreak(daily.map((d) => ({ pct: d.adherence })));
    const slots = missedBySlot(current);
    const worstSlot = SLOTS.reduce((a, b) => (slots[b] > slots[a] ? b : a), SLOTS[0]);
    return {
      periodLogs: current,
      overall,
      change: changeInPoints(overall.adherence, before.adherence),
      daily,
      streak,
      slots,
      worstSlot,
      maxSlot: Math.max(1, ...SLOTS.map((s) => slots[s])),
    };
  }, [scopedLogs, ranges, period, now]);

  const patientRows = useMemo(
    () =>
      patients
        .map((patient) => {
          const mine = logs.filter((log) => log.patient_id === patient.id);
          const current = filterByRange(mine, ranges.currentPeriod.from, ranges.currentPeriod.to);
          const previous = filterByRange(mine, ranges.previousPeriod.from, ranges.previousPeriod.to);
          const summary = summarizeLogs(current);
          return {
            ...patient,
            ...summary,
            change: changeInPoints(summary.adherence, summarizeLogs(previous).adherence),
            lastMissed: lastMissed(current),
          };
        })
        .sort((a, b) => (a.adherence ?? 101) - (b.adherence ?? 101)),
    [patients, logs, ranges]
  );

  const attentionCount = patientRows.filter((p) =>
    ["attention", "critical"].includes(adherenceStatus(p.adherence))
  ).length;

  const patientName = (id) => patients.find((p) => p.id === id)?.full_name || "Unnamed patient";

  const recentMissed = useMemo(
    () =>
      view.periodLogs
        .filter((log) => log.status === "missed")
        .sort((a, b) => new Date(b.scheduled_for) - new Date(a.scheduled_for))
        .slice(0, 8),
    [view]
  );

  const insights = useMemo(() => {
    const lines = [];
    const { overall, change, streak, slots, worstSlot } = view;
    if (overall.adherence === null) return ["No completed doses in this period yet."];

    if (overall.missed === 0) lines.push("No missed doses in this period. Well done.");
    else if (slots[worstSlot] > 0)
      lines.push(`Most missed doses happen in the ${worstSlot.toLowerCase()} (${slots[worstSlot]} of ${overall.missed}).`);

    if (change !== null) {
      if (change === 0) lines.push(`Adherence is unchanged compared with the previous ${period} days.`);
      else
        lines.push(
          `Adherence ${change > 0 ? "improved" : "dropped"} by ${Math.abs(change)} points compared with the previous ${period} days.`
        );
    }

    if (streak > 0) lines.push(`${streak} perfect day${streak === 1 ? "" : "s"} in a row.`);

    const rated = patientRows.filter((p) => p.adherence !== null);
    if (selectedId === "all" && rated.length > 1) {
      const lowest = rated[0];
      lines.push(`${lowest.full_name || "A patient"} has the lowest adherence at ${lowest.adherence}%.`);
    }
    return lines;
  }, [view, period, patientRows, selectedId]);

  const overallStatus = STATUS_STYLE[adherenceStatus(view.overall.adherence)];
  const selectedName = selectedId === "all" ? "All linked patients" : patientName(selectedId);

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700 print:hidden"
          >
            <span aria-hidden="true">&lt;-</span>
            Back to Dashboard
          </Link>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-700">
                Caregiver
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Adherence Report
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                {selectedName} · last {period} days, compared with the {period} days before.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 print:hidden">
              <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {PERIODS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setPeriod(days)}
                    className={`px-4 py-2 text-sm font-semibold transition ${
                      period === days ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>

              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                aria-label="Choose a patient"
              >
                <option value="all">All patients</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || "Unnamed patient"}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
              >
                Print / save as PDF
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
              !
            </div>
            <div>
              <p className="font-semibold text-red-800">Unable to load adherence data</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {logs.length >= ROW_LIMIT && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Showing the most recent {ROW_LIMIT} doses. Older doses in a long period may not be included.
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
            <p className="text-sm font-medium text-slate-500">Loading adherence data...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <h3 className="font-semibold text-slate-900">No linked patients</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              You currently do not have any accepted patient links.
            </p>
            <Link
              to="/caregiver/patients"
              className="mt-4 inline-block rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Go to My Patients
            </Link>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Adherence"
                accent="bg-emerald-50"
                value={
                  <span className={overallStatus.text}>
                    {view.overall.adherence === null ? "No data" : `${view.overall.adherence}%`}
                  </span>
                }
                hint={
                  <span className="flex items-center gap-2">
                    <ChangeBadge change={view.change} />
                    <span>vs previous {period} days</span>
                  </span>
                }
              />
              <StatCard
                title="Doses taken"
                accent="bg-sky-50"
                value={view.overall.taken}
                hint={`${view.streak} perfect-day streak`}
              />
              <StatCard
                title="Doses missed"
                accent="bg-orange-50"
                value={view.overall.missed}
                hint={
                  view.overall.missed > 0
                    ? `Mostly in the ${view.worstSlot.toLowerCase()}`
                    : "None in this period"
                }
              />
              <StatCard
                title="Needs attention"
                accent="bg-amber-50"
                value={attentionCount}
                hint="Patients below 80% adherence"
              />
            </div>

            {/* Trend + time of day */}
            <div className="mb-8 grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">Daily adherence</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Share of completed doses that were taken each day, by your local date.
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex h-52 items-stretch gap-1 sm:gap-2">
                    {view.daily.map((day) => {
                      const status = adherenceStatus(day.adherence);
                      const value = day.adherence ?? 0;
                      return (
                        <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col">
                          <span className="text-center text-[10px] font-semibold text-slate-600">
                            {period <= 14 ? (day.adherence === null ? "–" : `${day.adherence}%`) : ""}
                          </span>
                          <div className="flex flex-1 items-end">
                            <div
                              className={`w-full rounded-t-md ${STATUS_STYLE[status].column}`}
                              style={{ height: day.adherence === null ? "6px" : `${Math.max(value, 6)}%` }}
                              title={`${day.key}: ${
                                day.adherence === null
                                  ? "no completed doses"
                                  : `${day.adherence}% (${day.taken} taken, ${day.missed} missed)`
                              }`}
                            />
                          </div>
                          <span className="mt-1 truncate text-center text-[10px] text-slate-500">
                            {period === 7
                              ? day.date.toLocaleDateString(undefined, { weekday: "short" })
                              : day.date.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> 80% or above
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-400" /> 50 to 79%
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Below 50%
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-200" /> No data
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">Missed doses by time of day</h2>
                  <p className="mt-1 text-sm text-slate-500">When doses are most often missed.</p>
                </div>
                <ul className="space-y-4 p-6">
                  {SLOTS.map((slot) => (
                    <li key={slot}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-slate-700">{slot}</span>
                        <span className="font-semibold text-slate-900">{view.slots[slot]}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100">
                        <div
                          className="h-2.5 rounded-full bg-orange-400"
                          style={{ width: `${(view.slots[slot] / view.maxSlot) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Insights */}
            <div className="mb-8 rounded-2xl border border-sky-100 bg-sky-50/70 px-6 py-5">
              <h2 className="text-base font-bold text-slate-900">Key insights</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                {insights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            {/* Patient table */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">Patient adherence</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Lowest adherence first. Choose View to focus the report on one patient.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50/80">
                    <tr>
                      {["Patient", "Adherence", "Change", "Taken", "Missed", "Pending", "Last missed", "Status", ""].map(
                        (head) => (
                          <th
                            key={head || "action"}
                            className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                          >
                            {head}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientRows.map((patient) => {
                      const status = adherenceStatus(patient.adherence);
                      const style = STATUS_STYLE[status];
                      const focused = selectedId === patient.id;
                      return (
                        <tr key={patient.id} className={focused ? "bg-sky-50/60" : "hover:bg-sky-50/40"}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-bold text-sky-700">
                                {getInitials(patient.full_name)}
                              </div>
                              <p className="font-semibold text-slate-900">
                                {patient.full_name || "Unnamed patient"}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {patient.adherence === null ? (
                              <span className="text-sm font-medium text-slate-400">No data</span>
                            ) : (
                              <div className="w-40">
                                <span className={`text-sm font-bold ${style.text}`}>{patient.adherence}%</span>
                                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className={`h-full rounded-full ${style.bar}`}
                                    style={{ width: `${patient.adherence}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <ChangeBadge change={patient.change} />
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-emerald-700">{patient.taken}</td>
                          <td className="px-5 py-4 text-sm font-bold text-orange-700">{patient.missed}</td>
                          <td className="px-5 py-4 text-sm font-bold text-slate-600">{patient.pending}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">
                            {patient.lastMissed
                              ? new Date(patient.lastMissed.scheduled_for).toLocaleDateString(undefined, {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "–"}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${style.badge}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                              {style.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 print:hidden">
                            <button
                              type="button"
                              onClick={() => setSelectedId(focused ? "all" : patient.id)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              {focused ? "Show all" : "View"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent missed doses */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">Recent missed doses</h2>
                <p className="mt-1 text-sm text-slate-500">The latest missed doses in this period.</p>
              </div>
              {recentMissed.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">No missed doses in this period.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentMissed.map((log) => (
                    <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {log.medications?.name || "Medicine"}
                        </p>
                        <p className="text-xs text-slate-500">{patientName(log.patient_id)}</p>
                      </div>
                      <p className="text-xs font-medium text-slate-600">
                        {new Date(log.scheduled_for).toLocaleString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Calculation note */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-5 py-4">
              <p className="text-xs leading-5 text-sky-800">
                Adherence is taken doses divided by taken plus missed doses. Pending and snoozed doses are not
                counted. Days follow your local date, and each period is compared with the same number of days
                just before it.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}