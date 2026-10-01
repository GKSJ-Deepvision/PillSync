import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminMedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMedications = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("medications")
        .select(
          "id, patient_id, name, dosage, frequency_per_day, active, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load medications:", error);
        setError(error.message);
      } else {
        setMedications(data ?? []);
      }

      setLoading(false);
    };

    loadMedications();
  }, []);

  const filteredMedications = useMemo(() => {
    if (filter === "all") return medications;

    if (filter === "active") {
      return medications.filter((medication) => medication.active);
    }

    return medications.filter((medication) => !medication.active);
  }, [medications, filter]);

  const activeCount = medications.filter(
    (medication) => medication.active
  ).length;

  const inactiveCount = medications.length - activeCount;

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-sky-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
            Medications
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor medication records across PillSync.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ["all", "Total Medications", medications.length],
            ["active", "Active", activeCount],
            ["inactive", "Inactive", inactiveCount],
          ].map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-2xl border p-5 text-left shadow-sm transition ${
                filter === value
                  ? "border-sky-300 bg-sky-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p className="text-sm font-medium text-slate-500">
                {label}
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {loading ? "—" : count}
              </p>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Medication Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filter === "all"
                ? "All medication records"
                : `Showing ${filter} medications`}
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">
              Loading medications...
            </div>
          ) : filteredMedications.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No medications found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Medication
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dosage
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Frequency
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient ID
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredMedications.map((medication) => (
                    <tr
                      key={medication.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {medication.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {medication.id}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {medication.dosage || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {medication.frequency_per_day} time(s)/day
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-slate-500">
                          {medication.patient_id}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            medication.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {medication.active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {medication.created_at
                          ? new Date(
                              medication.created_at
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
          This page is read-only. Medication records are not modified.
        </div>
      </div>
    </div>
  );
}
