import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

function getInitials(name) {
  if (!name) return "P";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function CaregiverAdherencePage() {
  const { user } = useAuth();

  const [patients, setPatients] = useState([]);
  const [doseLogs, setDoseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadAdherence = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: links, error: linksError } = await supabase
          .from("caregiver_links")
          .select("patient_id")
          .eq("caregiver_id", user.id)
          .eq("status", "accepted");

        if (linksError) throw linksError;

        const patientIds = (links || []).map((link) => link.patient_id);

        if (patientIds.length === 0) {
          setPatients([]);
          setDoseLogs([]);
          return;
        }

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", patientIds);

        if (profilesError) throw profilesError;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

        const { data: logs, error: logsError } = await supabase
          .from("dose_logs")
          .select("id, patient_id, scheduled_for, status")
          .in("patient_id", patientIds)
          .gte("scheduled_for", thirtyDaysAgo.toISOString())
          .order("scheduled_for", { ascending: true });

        if (logsError) throw logsError;

        setPatients(profiles || []);
        setDoseLogs(logs || []);
      } catch (err) {
        console.error("Caregiver adherence error:", err);
        setError(
          err?.message || "Unable to load caregiver adherence data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAdherence();
  }, [user]);

  const patientStats = useMemo(() => {
    return patients.map((patient) => {
      const logs = doseLogs.filter(
        (log) => log.patient_id === patient.id
      );

      const taken = logs.filter(
        (log) => log.status === "taken"
      ).length;

      const missed = logs.filter(
        (log) => log.status === "missed"
      ).length;

      const pending = logs.filter(
        (log) => log.status === "pending"
      ).length;

      const completed = taken + missed;

      const adherence =
        completed > 0
          ? Math.round((taken / completed) * 100)
          : null;

      return {
        ...patient,
        total: logs.length,
        taken,
        missed,
        pending,
        adherence,
      };
    });
  }, [patients, doseLogs]);

  const overallStats = useMemo(() => {
    const taken = doseLogs.filter(
      (log) => log.status === "taken"
    ).length;

    const missed = doseLogs.filter(
      (log) => log.status === "missed"
    ).length;

    const pending = doseLogs.filter(
      (log) => log.status === "pending"
    ).length;

    const completed = taken + missed;

    const adherence =
      completed > 0
        ? Math.round((taken / completed) * 100)
        : null;

    return {
      taken,
      missed,
      pending,
      adherence,
    };
  }, [doseLogs]);

  const dailyTrend = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);

      const dateKey = date.toISOString().slice(0, 10);

      const logs = doseLogs.filter(
        (log) =>
          new Date(log.scheduled_for)
            .toISOString()
            .slice(0, 10) === dateKey
      );

      const taken = logs.filter(
        (log) => log.status === "taken"
      ).length;

      const missed = logs.filter(
        (log) => log.status === "missed"
      ).length;

      const completed = taken + missed;

      const adherence =
        completed > 0
          ? Math.round((taken / completed) * 100)
          : null;

      days.push({
        label: date.toLocaleDateString(undefined, {
          weekday: "short",
        }),
        date: dateKey,
        adherence,
      });
    }

    return days;
  }, [doseLogs]);

  const attentionCount = patientStats.filter(
    (patient) =>
      patient.adherence !== null && patient.adherence < 80
  ).length;

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">

        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
          >
            <span aria-hidden="true">&lt;-</span>
            Back to Dashboard
          </Link>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-700">
                Caregiver
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                Adherence Overview
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                Monitor medication adherence and identify patients who
                may need additional attention.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Monitoring period
              </p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                Last 30 days
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600">
              !
            </div>

            <div>
              <p className="font-semibold text-red-800">
                Unable to load adherence data
              </p>
              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {/* Overall */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-emerald-50" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Overall Adherence
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  %
                </div>
              </div>

              <p className="text-3xl font-bold text-emerald-600">
                {loading
                  ? "--"
                  : overallStats.adherence !== null
                    ? `${overallStats.adherence}%`
                    : "No data"}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Taken doses compared with completed doses
              </p>
            </div>
          </div>

          {/* Taken */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-sky-50" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Taken
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  &#10003;</div>
              </div>

              <p className="text-3xl font-bold text-sky-600">
                {loading ? "—" : overallStats.taken}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Successfully recorded doses
              </p>
            </div>
          </div>

          {/* Missed */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-orange-50" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Missed
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  !
                </div>
              </div>

              <p className="text-3xl font-bold text-orange-500">
                {loading ? "\u2014" : overallStats.missed}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Recorded missed doses
              </p>
            </div>
          </div>

          {/* Attention */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-amber-50" />

            <div className="relative">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">
                  Needs Attention
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  !
                </div>
              </div>

              <p className="text-3xl font-bold text-amber-500">
                {loading ? "\u2014" : attentionCount}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Patients below 80% adherence
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5 md:px-7">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Weekly Adherence Trend
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Daily adherence across all linked patients.
                </p>
              </div>

              <div className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
                Last 7 days
              </div>
            </div>
          </div>

          <div className="p-6 md:p-7">
            <div className="flex gap-3">

              {/* Y axis */}
              <div className="flex h-56 flex-col justify-between pb-7 text-[11px] font-medium text-slate-400">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              <div className="relative flex h-56 flex-1 items-end gap-2 sm:gap-4">

                {/* Grid lines */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-48">
                  <div className="absolute left-0 right-0 top-0 border-t border-dashed border-slate-200" />
                  <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-slate-200" />
                  <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-200" />
                  <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-slate-200" />
                  <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200" />
                </div>

                {dailyTrend.map((day) => {
                  const value =
                    day.adherence === null ? 0 : day.adherence;

                  return (
                    <div
                      key={day.date}
                      className="relative z-10 flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <div className="mb-2 h-48 w-full max-w-12">
                        <div className="flex h-full items-end justify-center">
                          <div
                            className={`w-full rounded-t-xl transition-all ${
                              day.adherence === null
                                ? "bg-slate-100"
                                : value < 80
                                  ? "bg-orange-400"
                                  : "bg-sky-500"
                            }`}
                            style={{
                              height:
                                day.adherence === null
                                  ? "8px"
                                  : `${Math.max(value, 8)}%`,
                            }}
                            title={
                              day.adherence === null
                                ? "No data"
                                : `${day.adherence}% adherence`
                            }
                          />
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-slate-500">
                        {day.label}
                      </span>

                      <span className="mt-1 text-xs font-bold text-slate-800">
                        {day.adherence === null
                          ? "\u2014"
                          : `${day.adherence}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                80% or above
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                Below 80%
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                No data
              </div>
            </div>
          </div>
        </div>

        {/* Patient Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5 md:px-7">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Patient Adherence
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Individual adherence summary for your linked patients.
                </p>
              </div>

              <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                {patientStats.length}{" "}
                {patientStats.length === 1 ? "patient" : "patients"}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-500" />
              <p className="text-sm font-medium text-slate-500">
                Loading adherence data...
              </p>
            </div>
          ) : patientStats.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                &#128101;</div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No linked patients
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                You currently do not have any accepted patient links.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Patient
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Adherence
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Taken
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Missed
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pending
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {patientStats.map((patient) => {
                    const needsAttention =
                      patient.adherence !== null &&
                      patient.adherence < 80;

                    return (
                      <tr
                        key={patient.id}
                        className="group transition hover:bg-sky-50/40"
                      >
                        {/* Patient */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sm font-bold text-sky-700">
                              {getInitials(patient.full_name)}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {patient.full_name ||
                                  "Unnamed patient"}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-400">
                                Linked patient
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Adherence */}
                        <td className="px-6 py-5">
                          {patient.adherence === null ? (
                            <span className="text-sm font-medium text-slate-400">
                              No data
                            </span>
                          ) : (
                            <div className="w-44">
                              <div className="mb-2 flex items-center justify-between">
                                <span
                                  className={`text-sm font-bold ${
                                    needsAttention
                                      ? "text-orange-500"
                                      : "text-emerald-600"
                                  }`}
                                >
                                  {patient.adherence}%
                                </span>

                                <span className="text-[11px] font-medium text-slate-400">
                                  {patient.adherence >= 80
                                    ? "On track"
                                    : "Below 80%"}
                                </span>
                              </div>

                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    needsAttention
                                      ? "bg-orange-400"
                                      : "bg-emerald-500"
                                  }`}
                                  style={{
                                    width: `${patient.adherence}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Taken */}
                        <td className="px-6 py-5">
                          <span className="inline-flex min-w-10 justify-center rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                            {patient.taken}
                          </span>
                        </td>

                        {/* Missed */}
                        <td className="px-6 py-5">
                          <span className="inline-flex min-w-10 justify-center rounded-lg bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">
                            {patient.missed}
                          </span>
                        </td>

                        {/* Pending */}
                        <td className="px-6 py-5">
                          <span className="inline-flex min-w-10 justify-center rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
                            {patient.pending}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          {patient.adherence === null ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              No data
                            </span>
                          ) : needsAttention ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Needs attention
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Good
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Calculation note */}
        <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/70 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-sky-600 shadow-sm">
              i
            </div>

            <p className="text-xs leading-5 text-sky-800">
              Adherence is calculated as taken doses divided by
              taken plus missed doses. Pending doses are not included
              in the adherence percentage.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
