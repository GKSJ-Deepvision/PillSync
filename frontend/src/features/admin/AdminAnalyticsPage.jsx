import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { pctColor } from "../../lib/adherence";
import {
  adherencePct,
  countBy,
  sortedEntries,
  weeklySignups,
} from "../../lib/adminAnalytics";

const ROLE_LABELS = { patient: "Patients", caregiver: "Caregivers", admin: "Admins" };
const LINK_LABELS = { accepted: "Accepted", pending: "Waiting for approval", revoked: "Declined or removed" };

function Panel({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm break-inside-avoid">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function BarList({ items, color = "#0ea5e9", empty = "No data yet." }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  const max = Math.max(1, ...items.map(([, value]) => value));
  return (
    <ul className="space-y-3">
      {items.map(([label, value]) => (
        <li key={label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-slate-700">{label}</span>
            <span className="font-semibold text-slate-900">{value}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100">
            <div
              className="h-2.5 rounded-full"
              style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Columns({ items, color = "#0ea5e9", suffix = "" }) {
  const max = Math.max(1, ...items.map((i) => i.value ?? 0));
  return (
    <div className="flex h-44 items-stretch gap-2">
      {items.map((item) => {
        const hasValue = item.value !== null && item.value !== undefined;
        return (
          <div key={item.label} className="flex h-full flex-1 flex-col">
            <span className="text-center text-xs font-medium text-slate-600">
              {hasValue ? `${item.value}${suffix}` : "–"}
            </span>
            <div className="flex flex-1 items-end">
              <div
                className="w-full rounded-t-md"
                style={{
                  height: hasValue ? `${Math.max((item.value / max) * 100, 3)}%` : "0%",
                  backgroundColor: item.color ?? color,
                }}
                title={`${item.label}: ${hasValue ? item.value + suffix : "no data"}`}
              />
            </div>
            <span className="mt-1 text-center text-[10px] text-slate-500">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [generatedOn] = useState(() => new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [profiles, medications, links, summary] = await Promise.all([
        supabase.from("profiles").select("role, created_at"),
        supabase.from("medications").select("disease_category, active, patient_id"),
        supabase.from("caregiver_links").select("status"),
        supabase.rpc("admin_platform_summary", { p_days: 30 }),
      ]);
      if (cancelled) return;

      const failure = profiles.error || medications.error || links.error;
      if (failure) {
        console.error("Analytics load failed:", failure);
        setError(failure.message || "Could not load analytics.");
      }
      setData({
        profiles: profiles.data ?? [],
        medications: medications.data ?? [],
        links: links.data ?? [],
        summary: summary.error ? null : summary.data,
      });
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;

    const roleCounts = countBy(data.profiles, (p) => p.role, "unknown");
    const activeMeds = data.medications.filter((m) => m.active);
    const categories = sortedEntries(countBy(activeMeds, (m) => m.disease_category));
    const linkCounts = countBy(data.links, (l) => l.status, "unknown");
    const taken = data.summary?.taken ?? 0;
    const missed = data.summary?.missed ?? 0;
    const pct = adherencePct(taken, missed);

    const daily = (data.summary?.daily ?? []).slice(-14).map((d) => {
      const dayPct = adherencePct(d.taken, d.missed);
      return { label: String(d.day).slice(5), value: dayPct, color: pctColor(dayPct) };
    });

    const insights = [];
    if (categories.length > 0) {
      insights.push(
        `The most common medicine category is ${categories[0][0]} (${categories[0][1]} active medicine${categories[0][1] === 1 ? "" : "s"}).`
      );
    }
    if (pct !== null) {
      insights.push(
        `Platform adherence over the last 30 days is ${pct}% (${taken} doses taken, ${missed} missed).`
      );
    }
    insights.push(
      `${linkCounts.accepted ?? 0} caregiver link${(linkCounts.accepted ?? 0) === 1 ? " is" : "s are"} active and ${linkCounts.pending ?? 0} waiting for approval.`
    );

    return {
      totalUsers: data.profiles.length,
      patients: roleCounts.patient ?? 0,
      caregivers: roleCounts.caregiver ?? 0,
      activeMeds: activeMeds.length,
      patientsOnMeds: new Set(activeMeds.map((m) => m.patient_id)).size,
      acceptedLinks: linkCounts.accepted ?? 0,
      roles: sortedEntries(roleCounts).map(([k, v]) => [ROLE_LABELS[k] ?? k, v]),
      links: sortedEntries(linkCounts).map(([k, v]) => [LINK_LABELS[k] ?? k, v]),
      categories,
      signups: weeklySignups(data.profiles, 8, generatedOn).map((b) => ({
        label: b.label,
        value: b.count,
      })),
      daily,
      pct,
      taken,
      missed,
      insights,
    };
  }, [data, generatedOn]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50 p-8 text-sm text-slate-500">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-sky-600">Administration</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              Analytics report
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Platform overview generated on {generatedOn.toLocaleDateString()}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 print:hidden"
          >
            Print / save as PDF
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {stats && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
              <Stat label="Total users" value={stats.totalUsers} />
              <Stat label="Patients" value={stats.patients} />
              <Stat label="Caregivers" value={stats.caregivers} />
              <Stat
                label="Active medicines"
                value={stats.activeMeds}
                hint={`${stats.patientsOnMeds} patient${stats.patientsOnMeds === 1 ? "" : "s"} with medicines`}
              />
              <Stat label="Caregiver links" value={stats.acceptedLinks} hint="accepted" />
              <Stat
                label="Adherence, 30 days"
                value={stats.pct === null ? "–" : `${stats.pct}%`}
                hint={data.summary ? `${stats.taken} taken, ${stats.missed} missed` : "not available"}
              />
            </div>

            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              <Panel title="Users by role" subtitle="All registered accounts.">
                <BarList items={stats.roles} />
              </Panel>
              <Panel title="Sign-ups per week" subtitle="New accounts in the last 8 weeks (week starting).">
                <Columns items={stats.signups} />
              </Panel>
              <Panel title="Medicines by category" subtitle="Active medicines across all patients.">
                <BarList items={stats.categories} color="#10b981" empty="No active medicines yet." />
              </Panel>
              <Panel title="Caregiver links" subtitle="Patient and caregiver connections.">
                <BarList items={stats.links} color="#8b5cf6" empty="No caregiver links yet." />
              </Panel>
            </div>

            <div className="mb-6">
              <Panel
                title="Daily adherence, last 14 days"
                subtitle="Share of resolved doses that were taken, across all patients."
              >
                {data.summary ? (
                  stats.daily.length > 0 ? (
                    <Columns items={stats.daily} suffix="%" />
                  ) : (
                    <p className="text-sm text-slate-500">No dose records in this period yet.</p>
                  )
                ) : (
                  <p className="text-sm text-amber-700">
                    Adherence data is not available. Run schema-admin-analytics.sql in Supabase to enable it.
                  </p>
                )}
              </Panel>
            </div>

            <Panel title="Key insights">
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                {stats.insights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}