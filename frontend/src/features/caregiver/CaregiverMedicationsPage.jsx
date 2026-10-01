import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

export default function CaregiverMedicationsPage() {
  const { user } = useAuth();

  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadMedications = async () => {
      setLoading(true);
      setError("");

      try {
        // ------------------------------------------------------------
        // 1. Get accepted linked patients
        // ------------------------------------------------------------
        const { data: links, error: linksError } = await supabase
          .from("caregiver_links")
          .select("patient_id")
          .eq("caregiver_id", user.id)
          .eq("status", "accepted");

        if (linksError) {
          throw linksError;
        }

        const patientIds = (links ?? []).map(
          (link) => link.patient_id
        );

        if (patientIds.length === 0) {
          setMedications([]);
          setLoading(false);
          return;
        }

        // ------------------------------------------------------------
        // 2. Get patient names
        // ------------------------------------------------------------
        const { data: patients, error: patientsError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", patientIds);

        if (patientsError) {
          throw patientsError;
        }

        const patientMap = new Map(
          (patients ?? []).map((patient) => [
            patient.id,
            patient.full_name || "Unnamed patient",
          ])
        );

        // ------------------------------------------------------------
        // 3. Get medications for linked patients
        // ------------------------------------------------------------
        const { data: meds, error: medsError } = await supabase
          .from("medications")
          .select(
            "id, patient_id, name, dosage, frequency_per_day, reminder_times, disease_category, quantity_on_hand, notes, active, created_at"
          )
          .in("patient_id", patientIds)
          .order("created_at", { ascending: false });

        if (medsError) {
          throw medsError;
        }

        const medicationData = (meds ?? []).map((medication) => ({
          ...medication,
          patientName:
            patientMap.get(medication.patient_id) ||
            "Unnamed patient",
        }));

        setMedications(medicationData);
      } catch (err) {
        console.error("Caregiver medications error:", err);

        setError(
          err?.message ||
            "Something went wrong while loading medications."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMedications();
  }, [user]);

  const activeCount = useMemo(
    () => medications.filter((medication) => medication.active).length,
    [medications]
  );

  const inactiveCount = medications.length - activeCount;

  const formatFrequency = (frequency) => {
    if (!frequency) return "Not specified";

    return `${frequency} ${
      frequency === 1 ? "time" : "times"
    } per day`;
  };

  const formatReminderTimes = (times) => {
    if (!times || times.length === 0) {
      return "No reminder times";
    }

    return times
      .map((time) => String(time).slice(0, 5))
      .join(" • ");
  };

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 p-6 md:p-8 mb-8 shadow-lg">
          <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/10" />
          <div className="absolute right-20 -bottom-24 w-48 h-48 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              Caregiver Medication View
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Patient Medications
            </h1>

            <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-2xl">
              View the medications currently tracked by your linked
              patients.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold">
                !
              </div>

              <div>
                <p className="font-semibold text-red-800">
                  Unable to load medications
                </p>

                <p className="text-sm text-red-600 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

          <div className="relative overflow-hidden bg-white rounded-2xl border border-indigo-100 shadow-sm p-5">
            <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-indigo-50 -mr-8 -mt-8" />

            <div className="relative">
              <p className="text-sm font-medium text-slate-500">
                Total Medicines
              </p>

              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {loading ? "—" : medications.length}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Across linked patients
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
            <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-emerald-50 -mr-8 -mt-8" />

            <div className="relative">
              <p className="text-sm font-medium text-slate-500">
                Active
              </p>

              <p className="text-3xl font-bold text-emerald-600 mt-2">
                {loading ? "—" : activeCount}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Currently tracked
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-slate-100 -mr-8 -mt-8" />

            <div className="relative">
              <p className="text-sm font-medium text-slate-500">
                Inactive
              </p>

              <p className="text-3xl font-bold text-slate-600 mt-2">
                {loading ? "—" : inactiveCount}
              </p>

              <p className="text-xs text-slate-400 mt-1">
                No longer active
              </p>
            </div>
          </div>

        </div>

        {/* Medication list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">
              Medications
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Medication details for your accepted linked patients.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mx-auto" />

              <p className="text-sm text-slate-500 mt-4">
                Loading medications...
              </p>
            </div>
          ) : medications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">+</span>
              </div>

              <h3 className="font-semibold text-slate-900 mt-4">
                No medications found
              </h3>

              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Your linked patients have no medications currently
                available to view.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Patient
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Medicine
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Dosage
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Schedule
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Category
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {medications.map((medication) => {
                    const patientName = medication.patientName;

                    const initials = patientName
                      .split(" ")
                      .map((name) => name.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={medication.id}
                        className="hover:bg-slate-50 transition-colors"
                      >

                        {/* Patient */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">

                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold">
                              {initials}
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {patientName}
                              </p>

                              <p className="text-xs text-slate-400 mt-0.5">
                                Linked patient
                              </p>
                            </div>

                          </div>
                        </td>

                        {/* Medicine */}
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {medication.name}
                          </p>

                          {medication.notes && (
                            <p className="text-xs text-slate-400 mt-1 max-w-xs">
                              {medication.notes}
                            </p>
                          )}
                        </td>

                        {/* Dosage */}
                        <td className="px-6 py-5">
                          <p className="font-medium text-slate-700">
                            {medication.dosage}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {formatFrequency(
                              medication.frequency_per_day
                            )}
                          </p>
                        </td>

                        {/* Schedule */}
                        <td className="px-6 py-5">
                          <p className="text-sm text-slate-700">
                            {formatReminderTimes(
                              medication.reminder_times
                            )}
                          </p>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-xs">
                            {medication.disease_category ||
                              "General"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          {medication.active ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-xs">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              Inactive
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

      </div>
    </div>
  );
}