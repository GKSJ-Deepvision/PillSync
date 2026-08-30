import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { timeOfDayGreeting } from "../utils/greeting";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { label } = timeOfDayGreeting();
  const firstName = (profile?.full_name || "there").split(" ")[0];

  const [counts, setCounts] = useState({ patient: 0, caregiver: 0, admin: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    async function loadStats() {
      const { data } = await supabase.from("profiles").select("id, full_name, role, created_at");
      if (!data) return;
      const next = { patient: 0, caregiver: 0, admin: 0 };
      data.forEach((p) => {
        next[p.role] = (next[p.role] || 0) + 1;
      });
      setCounts(next);
      setRecent(
        [...data]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
      );
    }
    loadStats();
  }, []);

  return (
    <DashboardLayout eyebrow="Admin" title={`${label}, ${firstName}`}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <span className="badge bg-rose-soft text-rose-deep">Patients</span>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">{counts.patient}</p>
        </div>
        <div className="card">
          <span className="badge bg-indigo-soft text-indigo-deep">Caregivers</span>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">{counts.caregiver}</p>
        </div>
        <div className="card">
          <span className="badge bg-mint-soft text-mint-deep">Admins</span>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">{counts.admin}</p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-display text-base font-semibold text-ink">Newest accounts</h2>
        {recent.length === 0 ? (
          <p className="mt-3 font-body text-sm text-ink-fog">No accounts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <span className="font-body text-sm font-medium text-ink">{p.full_name || "Unnamed"}</span>
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">{p.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 font-body text-[13px] text-ink-fog">
        Full activity auditing, caregiver↔patient assignment tools and platform-wide
        analytics are scoped for later milestones — this view proves role-gated admin
        access and read access across every profile via Row Level Security.
      </p>
    </DashboardLayout>
  );
}
