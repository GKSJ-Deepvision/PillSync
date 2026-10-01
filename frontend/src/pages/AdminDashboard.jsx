import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    patients: 0,
    caregivers: 0,
    admins: 0,
    medications: 0,
    activeMedications: 0,
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentMedications, setRecentMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, role, created_at")
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        const profileRows = profiles ?? [];

        const patients = profileRows.filter(
          (profile) => profile.role === "patient"
        ).length;

        const caregivers = profileRows.filter(
          (profile) => profile.role === "caregiver"
        ).length;

        const admins = profileRows.filter(
          (profile) => profile.role === "admin"
        ).length;

        const { data: medications, error: medicationsError } =
          await supabase
            .from("medications")
            .select(
              "id, patient_id, name, dosage, frequency_per_day, active, created_at"
            )
            .order("created_at", { ascending: false });

        if (medicationsError) throw medicationsError;

        const medicationRows = medications ?? [];

        setStats({
          users: profileRows.length,
          patients,
          caregivers,
          admins,
          medications: medicationRows.length,
          activeMedications: medicationRows.filter(
            (medication) => medication.active
          ).length,
        });

        setRecentUsers(profileRows.slice(0, 5));
        setRecentMedications(medicationRows.slice(0, 5));
      } catch (err) {
        console.error("Admin dashboard error:", err);
        setError(
          err?.message || "Unable to load admin dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statCards = [
    {
      label: "Total Users",
      value: stats.users,
      description: "All registered profiles",
      icon: "👥",
    },
    {
      label: "Patients",
      value: stats.patients,
      description: "Registered patients",
      icon: "🧑‍⚕️",
    },
    {
      label: "Caregivers",
      value: stats.caregivers,
      description: "Registered caregivers",
      icon: "🤝",
    },
    {
      label: "Admins",
      value: stats.admins,
      description: "Administrator accounts",
      icon: "🛡️",
    },
    {
      label: "Medications",
      value: stats.medications,
      description: "Total medication records",
      icon: "💊",
    },
    {
      label: "Active Medications",
      value: stats.activeMedications,
      description: "Currently active",
      icon: "✓",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-sky-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor users and medication activity across PillSync.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {loading ? "—" : card.value}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {card.description}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-lg">
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Recent Accounts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                The latest registered profiles.
              </p>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">
                Loading accounts...
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No accounts found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {user.full_name || "Unnamed user"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {user.created_at
                          ? new Date(
                              user.created_at
                            ).toLocaleDateString()
                          : "Date unavailable"}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                      {user.role || "unknown"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Recent Medications
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Recently created medication records.
              </p>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500">
                Loading medications...
              </div>
            ) : recentMedications.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No medications found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentMedications.map((medication) => (
                  <div
                    key={medication.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {medication.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {medication.dosage} ·{" "}
                        {medication.frequency_per_day} time(s)/day
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        medication.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {medication.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Admin dashboard data is read from the PillSync profiles and
          medications tables. No patient or caregiver records are
          modified from this dashboard.
        </div>
      </div>
    </div>
  );
}
