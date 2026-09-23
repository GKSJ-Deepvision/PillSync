import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { adherencePercentage } from "../lib/scheduling";

export default function CaregiverDashboard() {
  const { user, profile } = useAuth();

  const [linkedPatients, setLinkedPatients] = useState([]);
  const [doseLogs, setDoseLogs] = useState([]);
  const [medications, setMedications] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        // ------------------------------------------------------------
        // 1. Get accepted linked patients
        // ------------------------------------------------------------
        const { data: links, error: linksError } = await supabase
          .from("caregiver_links")
          .select("patient_id, status, profiles:patient_id(full_name)")
          .eq("caregiver_id", user.id)
          .eq("status", "accepted");

        if (linksError) {
          throw linksError;
        }

        const patients = links ?? [];
        setLinkedPatients(patients);

        const patientIds = patients.map((patient) => patient.patient_id);

        // If there are no patients, there is nothing else to query.
        if (patientIds.length === 0) {
          setDoseLogs([]);
          setMedications([]);
          setAlerts([]);
          setLoading(false);
          return;
        }

        // ------------------------------------------------------------
        // 2. Get dose logs for linked patients
        // ------------------------------------------------------------
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: logs, error: logsError } = await supabase
          .from("dose_logs")
          .select(
            "id, medication_id, patient_id, scheduled_for, status, responded_at"
          )
          .in("patient_id", patientIds)
          .gte("scheduled_for", thirtyDaysAgo.toISOString())
          .order("scheduled_for", { ascending: false });

        if (logsError) {
          throw logsError;
        }

        setDoseLogs(logs ?? []);

        // ------------------------------------------------------------
        // 3. Get active medications for linked patients
        // ------------------------------------------------------------
        const { data: meds, error: medsError } = await supabase
          .from("medications")
          .select(
            "id, patient_id, name, dosage, frequency_per_day, reminder_times, active"
          )
          .in("patient_id", patientIds)
          .eq("active", true);

        if (medsError) {
          throw medsError;
        }

        setMedications(meds ?? []);

        // ------------------------------------------------------------
        // 4. Get caregiver notifications
        // ------------------------------------------------------------
        const { data: notifications, error: notificationsError } =
          await supabase
            .from("notifications")
            .select(
              "id, kind, title, body, related_medication_id, read, created_at"
            )
            .eq("recipient_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (notificationsError) {
          throw notificationsError;
        }

        setAlerts(notifications ?? []);
      } catch (err) {
        console.error("Caregiver dashboard error:", err);
        setError(
          err?.message ||
            "Something went wrong while loading the caregiver dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  // ------------------------------------------------------------
  // Caregiver name
  // ------------------------------------------------------------
  const caregiverName =
    profile?.full_name?.split(" ")[0] || "Caregiver";

  // ------------------------------------------------------------
  // Calculate adherence for each patient
  // ------------------------------------------------------------
  const patientStats = useMemo(() => {
    return linkedPatients.map((patient) => {
      const patientLogs = doseLogs.filter(
        (log) => log.patient_id === patient.patient_id
      );

      const adherence = adherencePercentage(
        patientLogs.map((log) => log.status)
      );

      let status = "Good";

      if (adherence !== null && adherence < 80) {
        status = "Attention";
      }

      return {
        ...patient,
        adherence,
        status,
        doseCount: patientLogs.length,
      };
    });
  }, [linkedPatients, doseLogs]);

  // ------------------------------------------------------------
  // Patients needing attention
  // ------------------------------------------------------------
  const needsAttention = patientStats.filter(
    (patient) =>
      patient.adherence !== null && patient.adherence < 80
  ).length;

  // ------------------------------------------------------------
  // Find patient name for notification
  // ------------------------------------------------------------
  const getPatientNameForAlert = (notification) => {
    const medication = medications.find(
      (med) => med.id === notification.related_medication_id
    );

    if (!medication) {
      return "Linked patient";
    }

    const patient = linkedPatients.find(
      (item) => item.patient_id === medication.patient_id
    );

    return patient?.profiles?.full_name || "Linked patient";
  };

  // ------------------------------------------------------------
  // Find medication name for notification
  // ------------------------------------------------------------
  const getMedicationNameForAlert = (notification) => {
    const medication = medications.find(
      (med) => med.id === notification.related_medication_id
    );

    return medication?.name || "Medicine";
  };

  // ------------------------------------------------------------
  // Format date/time
  // ------------------------------------------------------------
  const formatDateTime = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleString([], {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">

        {/* ----------------------------------------------------------
            Header
        ---------------------------------------------------------- */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-500 p-6 md:p-8 mb-8 shadow-lg">

          <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-white/10" />
          <div className="absolute right-20 -bottom-24 w-48 h-48 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              PillSync AI Caregiver
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Good Morning, {caregiverName}
            </h1>

            <p className="text-sm md:text-base text-indigo-100 mt-2 max-w-2xl">
              Here's an overview of your linked patients and their
              medication adherence.
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------------
            Error
        ---------------------------------------------------------- */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                ⚠️
              </div>

              <div>
                <p className="font-semibold text-red-800">
                  Unable to load dashboard
                </p>

                <p className="text-sm text-red-600 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------
            Summary Cards
        ---------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">

          {/* Patients */}
          <div className="relative overflow-hidden bg-white rounded-2xl border border-indigo-100 shadow-sm p-5">
            <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-indigo-50 -mr-8 -mt-8" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Patients
                </p>

                <p className="text-3xl font-bold text-indigo-600 mt-2">
                  {loading ? "—" : linkedPatients.length}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Linked patients
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-md">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          {/* Active */}
          <div className="relative overflow-hidden bg-white rounded-2xl border border-emerald-100 shadow-sm p-5">
            <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-emerald-50 -mr-8 -mt-8" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active
                </p>

                <p className="text-3xl font-bold text-emerald-600 mt-2">
                  {loading ? "—" : linkedPatients.length}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Accepted links
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-md">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>

          {/* Needs Attention */}
          <div className="relative overflow-hidden bg-white rounded-2xl border border-orange-100 shadow-sm p-5">
            <div className="absolute right-0 top-0 w-24 h-24 rounded-full bg-orange-50 -mr-8 -mt-8" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Needs Attention
                </p>

                <p className="text-3xl font-bold text-orange-500 mt-2">
                  {loading ? "—" : needsAttention}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Below 80% adherence
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-md">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>

        </div>

        {/* ----------------------------------------------------------
            My Patients
        ---------------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">

          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                My Patients
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Monitor medication adherence for your linked patients.
              </p>
            </div>

            <div className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold">
              Last 30 days
            </div>

          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin mx-auto" />

              <p className="text-sm text-slate-500 mt-4">
                Loading patient information...
              </p>
            </div>
          ) : linkedPatients.length === 0 ? (
            <div className="p-12 text-center">

              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">👥</span>
              </div>

              <h3 className="font-semibold text-slate-900 mt-4">
                No linked patients
              </h3>

              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                An admin needs to create and accept a caregiver-patient
                link before patients appear here.
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
                      Adherence
                    </th>

                    <th className="text-left px-6 py-4 font-semibold text-slate-600">
                      Status
                    </th>

                    <th className="text-right px-6 py-4 font-semibold text-slate-600">
                      Doses
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {patientStats.map((patient) => {
                    const patientName =
                      patient.profiles?.full_name ||
                      "Unnamed patient";

                    const initials = patientName
                      .split(" ")
                      .map((name) => name.charAt(0))
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    const isAttention =
                      patient.status === "Attention";

                    return (
                      <tr
                        key={patient.patient_id}
                        className="hover:bg-slate-50 transition-colors"
                      >

                        {/* Patient */}
                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold shadow-sm">
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

                        {/* Adherence */}
                        <td className="px-6 py-5">

                          {patient.adherence === null ? (
                            <span className="text-slate-400">
                              No data
                            </span>
                          ) : (
                            <div className="min-w-[140px]">

                              <div className="flex items-center justify-between mb-1.5">

                                <span
                                  className={`font-bold ${
                                    patient.adherence >= 80
                                      ? "text-emerald-600"
                                      : "text-orange-500"
                                  }`}
                                >
                                  {patient.adherence}%
                                </span>

                              </div>

                              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">

                                <div
                                  className={`h-full rounded-full ${
                                    patient.adherence >= 80
                                      ? "bg-emerald-500"
                                      : "bg-orange-400"
                                  }`}
                                  style={{
                                    width: `${patient.adherence}%`,
                                  }}
                                />

                              </div>

                            </div>
                          )}

                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">

                          {isAttention ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 font-semibold text-xs">
                              <span className="w-2 h-2 rounded-full bg-orange-500" />
                              Attention
                            </span>
                          ) : patient.adherence === null ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-xs">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              No data
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Good
                            </span>
                          )}

                        </td>

                        {/* Doses */}
                        <td className="px-6 py-5 text-right">

                          <span className="font-semibold text-slate-700">
                            {patient.doseCount}
                          </span>

                          <span className="text-xs text-slate-400 ml-1">
                            logged
                          </span>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* ----------------------------------------------------------
            Recent Alerts
        ---------------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="p-6 border-b border-slate-100 flex items-center justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Recent Alerts
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Medication-related alerts from your linked patients.
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-sm">
              <span className="text-lg">🔔</span>
            </div>

          </div>

          <div className="p-6">

            {loading ? (
              <div className="text-center py-6 text-sm text-slate-500">
                Loading alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">

                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 text-lg">
                    ✓
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    No recent alerts
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Your patients currently have no medication
                    alerts.
                  </p>
                </div>

              </div>
            ) : (
              <div className="space-y-3">

                {alerts.map((alert) => {
                  const patientName =
                    getPatientNameForAlert(alert);

                  const medicationName =
                    getMedicationNameForAlert(alert);

                  return (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-4 p-4 rounded-2xl border ${
                        alert.kind === "missed_dose"
                          ? "bg-orange-50 border-orange-100"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >

                      <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600">
                          ⚠️
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">

                          <p className="text-sm font-semibold text-slate-900">
                            {patientName} missed{" "}
                            {medicationName}
                          </p>

                          {!alert.read && (
                            <span className="w-fit px-2 py-1 rounded-full bg-orange-100 text-orange-600 text-[10px] font-bold uppercase">
                              New
                            </span>
                          )}

                        </div>

                        <p className="text-xs text-slate-500 mt-1">
                          {alert.body ||
                            "Medication dose was missed."}
                        </p>

                        <p className="text-xs text-slate-400 mt-2">
                          {formatDateTime(alert.created_at)}
                        </p>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}