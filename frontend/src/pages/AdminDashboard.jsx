import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { timeOfDayGreeting } from "../utils/greeting";
import {
  DUMMY_ADHERENCE_LEADERBOARD,
  DUMMY_RECENT_ACTIVITY,
} from "../features/admin/mockAdminData";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { label } = timeOfDayGreeting();
  const firstName = (profile?.full_name || "there").split(" ")[0];

  const [counts, setCounts] = useState({ patient: 0, caregiver: 0, admin: 0 });
  const [recent, setRecent] = useState([]);
  const [fitnessCounts, setFitnessCounts] = useState({ dietPlans: 0, assignments: 0, logs: 0 });
  const [caregivers, setCaregivers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedCaregiver, setSelectedCaregiver] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [assignmentBusy, setAssignmentBusy] = useState(false);

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
        [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)
      );
      setCaregivers(data.filter((p) => p.role === "caregiver"));
      setPatients(data.filter((p) => p.role === "patient"));

      const { data: linkData } = await supabase
        .from("caregiver_links")
        .select(
          "id, status, caregiver:caregiver_id(id, full_name), patient:patient_id(id, full_name)"
        )
        .order("created_at", { ascending: false });
      setLinks(linkData || []);
    }
    async function loadFitnessStats() {
      // Real counts against the fitness tables (docs/database/schema_fitness.sql).
      // Row Level Security lets admins read every row here (is_admin() policy),
      // so these numbers are live, not mocked — only the leaderboard names
      // below are placeholder/demo data.
      const [dietPlans, assignments, logs] = await Promise.all([
        supabase.from("diet_plans").select("id", { count: "exact", head: true }),
        supabase.from("exercise_assignments").select("id", { count: "exact", head: true }),
        supabase.from("fitness_logs").select("id", { count: "exact", head: true }),
      ]);
      setFitnessCounts({
        dietPlans: dietPlans.count ?? 0,
        assignments: assignments.count ?? 0,
        logs: logs.count ?? 0,
      });
    }
    loadStats();
    loadFitnessStats();
  }, []);

  const assignPatient = async (event) => {
    event.preventDefault();
    setAssignmentMessage("");
    if (!selectedCaregiver || !selectedPatient) return;

    setAssignmentBusy(true);
    const { error } = await supabase.from("caregiver_links").upsert(
      {
        caregiver_id: selectedCaregiver,
        patient_id: selectedPatient,
        status: "accepted",
      },
      { onConflict: "caregiver_id,patient_id" }
    );
    setAssignmentBusy(false);

    if (error) {
      setAssignmentMessage(error.message);
      return;
    }

    setAssignmentMessage("Patient assigned successfully.");
    const { data } = await supabase
      .from("caregiver_links")
      .select(
        "id, status, caregiver:caregiver_id(id, full_name), patient:patient_id(id, full_name)"
      )
      .order("created_at", { ascending: false });
    setLinks(data || []);
  };

  const removeAssignment = async (linkId) => {
    const { error } = await supabase.from("caregiver_links").delete().eq("id", linkId);
    if (error) {
      setAssignmentMessage(error.message);
      return;
    }
    setLinks((current) => current.filter((link) => link.id !== linkId));
    setAssignmentMessage("Assignment removed.");
  };

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
                <span className="font-body text-sm font-medium text-ink">
                  {p.full_name || "Unnamed"}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                  {p.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-6">
        <h2 className="font-display text-base font-semibold text-ink">Assign patients</h2>
        <p className="mt-1 font-body text-[13px] text-ink-fog">
          Assigned caregivers can view only their accepted patients.
        </p>
        <form
          onSubmit={assignPatient}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <label className="font-body text-sm font-medium text-ink">
            Caregiver
            <select
              className="field-input mt-1"
              value={selectedCaregiver}
              onChange={(event) => setSelectedCaregiver(event.target.value)}
              required
            >
              <option value="">Choose caregiver</option>
              {caregivers.map((caregiver) => (
                <option key={caregiver.id} value={caregiver.id}>
                  {caregiver.full_name || "Unnamed caregiver"}
                </option>
              ))}
            </select>
          </label>
          <label className="font-body text-sm font-medium text-ink">
            Patient
            <select
              className="field-input mt-1"
              value={selectedPatient}
              onChange={(event) => setSelectedPatient(event.target.value)}
              required
            >
              <option value="">Choose patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.full_name || "Unnamed patient"}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={assignmentBusy} className="btn-primary">
            {assignmentBusy ? "Assigning..." : "Assign patient"}
          </button>
        </form>
        {assignmentMessage && (
          <p className="mt-3 font-body text-sm text-ink-fog">{assignmentMessage}</p>
        )}

        {links.length > 0 && (
          <ul className="mt-5 divide-y divide-ink/5">
            {links.map((link) => (
              <li key={link.id} className="flex items-center justify-between gap-4 py-3">
                <span className="font-body text-sm text-ink">
                  {link.caregiver?.full_name || "Unnamed caregiver"} →{" "}
                  {link.patient?.full_name || "Unnamed patient"}
                </span>
                <button
                  type="button"
                  onClick={() => removeAssignment(link.id)}
                  className="font-body text-[13px] font-medium text-rose hover:text-rose-deep"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mt-6">
        <div className="card">
          <span className="badge bg-mint-soft text-mint-deep">Diet plans generated</span>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">
            {fitnessCounts.dietPlans}
          </p>
        </div>
        <div className="card">
          <span className="badge bg-indigo-soft text-indigo-deep">Exercises assigned</span>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">
            {fitnessCounts.assignments}
          </p>
        </div>
        <div className="card">
          <span className="badge bg-rose-soft text-rose-deep">Daily check-ins logged</span>
          <p className="mt-3 font-display text-3xl font-semibold text-ink">{fitnessCounts.logs}</p>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Top adherence streaks</h2>
          <span className="badge bg-porcelain-dim text-ink-fog">Demo data</span>
        </div>
        <p className="mt-1 font-body text-[12px] text-ink-fog">
          Placeholder leaderboard for demoing the admin UI — swap for a real query against
          fitness_logs once you have live patient data.
        </p>
        <ul className="mt-4 divide-y divide-ink/5">
          {DUMMY_ADHERENCE_LEADERBOARD.map((row) => (
            <li key={row.name} className="flex items-center justify-between py-3">
              <span className="font-body text-sm font-medium text-ink">{row.name}</span>
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                {row.streak}-day streak · {row.adherence}% med adherence
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">
            Recent platform activity
          </h2>
          <span className="badge bg-porcelain-dim text-ink-fog">Demo data</span>
        </div>
        <ul className="mt-4 divide-y divide-ink/5">
          {DUMMY_RECENT_ACTIVITY.map((row, i) => (
            <li key={i} className="flex items-center justify-between py-3">
              <span className="font-body text-sm text-ink">{row.text}</span>
              <span className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                {row.when}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 font-body text-[13px] text-ink-fog">
        Full activity auditing, caregiver↔patient assignment tools and platform-wide analytics are
        scoped for later milestones — this view proves role-gated admin access and read access
        across every profile via Row Level Security.
      </p>
    </DashboardLayout>
  );
}
