import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminCaregiversPage() {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCaregivers = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, date_of_birth, created_at")
        .eq("role", "caregiver")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load caregivers:", error);
        setError(error.message);
      } else {
        setCaregivers(data ?? []);
      }

      setLoading(false);
    };

    loadCaregivers();
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-sky-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
            Caregivers
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View registered caregiver profiles.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Caregivers
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-900">
            {loading ? "—" : caregivers.length}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Registered Caregivers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Caregiver accounts registered in PillSync.
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">
              Loading caregivers...
            </div>
          ) : caregivers.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No caregivers found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Caregiver
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
                  {caregivers.map((caregiver) => (
                    <tr
                      key={caregiver.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {caregiver.full_name || "Unnamed caregiver"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {caregiver.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {caregiver.phone || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {caregiver.date_of_birth || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {caregiver.created_at
                          ? new Date(
                              caregiver.created_at
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
          This page is read-only. Caregiver profiles are not modified.
        </div>
      </div>
    </div>
  );
}
