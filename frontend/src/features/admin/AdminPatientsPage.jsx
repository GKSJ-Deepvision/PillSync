import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, date_of_birth, created_at")
        .eq("role", "patient")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load patients:", error);
        setError(error.message);
      } else {
        setPatients(data ?? []);
      }

      setLoading(false);
    };

    loadPatients();
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-sky-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
            Patients
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View registered patient profiles.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Patients
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {loading ? "—" : patients.length}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Registered Patients
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Patient accounts registered in PillSync.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No patients found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date of Birth
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Joined
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
                        <p className="font-semibold text-slate-900">
                          {patient.full_name || "Unnamed patient"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {patient.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {patient.phone || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {patient.date_of_birth || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {patient.created_at
                          ? new Date(
                              patient.created_at
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          This page is read-only. Patient profiles are not modified.
        </div>
      </div>
    </div>
  );
}
