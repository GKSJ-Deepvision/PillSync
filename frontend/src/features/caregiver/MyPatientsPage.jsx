import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function MyPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadPatients = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: links, error: linksError } = await supabase
          .from("caregiver_links")
          .select("patient_id")
          .eq("caregiver_id", user.id)
          .eq("status", "accepted");

        if (linksError) throw linksError;

        const patientIds = (links ?? []).map((link) => link.patient_id);

        if (patientIds.length === 0) {
          setPatients([]);
          return;
        }

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, date_of_birth")
          .in("id", patientIds);

        if (profilesError) throw profilesError;

        const patientData = await Promise.all(
          (profiles ?? []).map(async (patient) => {
            const thirtyDaysAgo = new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            ).toISOString();

            const { data: doses, error: dosesError } = await supabase
              .from("dose_logs")
              .select("status")
              .eq("patient_id", patient.id)
              .gte("scheduled_for", thirtyDaysAgo);

            if (dosesError) {
              console.error(
                "Dose logs error for patient:",
                patient.id,
                dosesError
              );
            }

            const logs = doses ?? [];

            const taken = logs.filter(
              (dose) => dose.status === "taken"
            ).length;

            const missed = logs.filter(
              (dose) => dose.status === "missed"
            ).length;

            const total = taken + missed;

            const adherence =
              total > 0 ? Math.round((taken / total) * 100) : null;

            let status = "No data";

            if (adherence !== null) {
              status = adherence >= 80 ? "Good" : "Needs attention";
            }

            return {
              ...patient,
              adherence,
              taken,
              missed,
              total,
              status,
            };
          })
        );

        setPatients(patientData);
      } catch (err) {
        console.error("Caregiver patients error:", err);
        setError(
          err?.message || "Unable to load your linked patients."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [user]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-slate-50">
        <div className="w-full px-5 py-6 md:px-8 lg:px-10">
          <p className="text-sm text-slate-500">Caregiver</p>
          <h1 className="text-2xl font-bold text-slate-900">
            My Patients
          </h1>
          <p className="mt-1 text-slate-500">
            Loading your linked patients...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="mb-3 inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            ← Back to Dashboard
          </Link>

          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-sky-600">
                Caregiver
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                My Patients
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                View your linked patients and their recent adherence.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Linked patients
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {patients.length}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {patients.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              No linked patients
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              You currently do not have any accepted patient links.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date of Birth
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Adherence
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Taken
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Missed
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {patients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {patient.full_name || "Unnamed patient"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {patient.phone || "Not provided"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {patient.date_of_birth || "Not provided"}
                      </td>

                      <td className="px-5 py-4">
                        {patient.adherence !== null ? (
                          <span className="font-semibold text-slate-900">
                            {patient.adherence}%
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">
                            No data
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {patient.taken}
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {patient.missed}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            patient.status === "Good"
                              ? "bg-emerald-100 text-emerald-700"
                              : patient.status === "Needs attention"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {patient.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          Adherence is calculated from taken and missed doses recorded
          during the last 30 days.
        </div>
      </div>
    </div>
  );
}
