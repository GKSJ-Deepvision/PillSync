import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import DoseRing from "../features/dashboard/DoseRing";
import { PillIcon, BellIcon, ChartIcon } from "../components/icons";

export default function PatientDashboard() {
  const { profile, user } = useAuth();

  const [counts, setCounts] = useState({
    taken: 0,
    total: 0,
  });

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      try {
        /* =====================================================
           1. GET ACTIVE MEDICATIONS
        ====================================================== */

        const {
          data: medicines,
          error: medicinesError,
        } = await supabase
          .from("medications")
          .select(
            "id, patient_id, name, dosage, frequency_per_day, reminder_times, active"
          )
          .eq("patient_id", user.id)
          .eq("active", true);

        if (medicinesError) {
          console.error(
            "Error fetching medications:",
            medicinesError
          );
        }

        /* =====================================================
           2. TODAY'S DATE RANGE
        ====================================================== */

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        /* =====================================================
           3. GET TODAY'S DOSE LOGS
        ====================================================== */

        const {
          data: doseLogs,
          error: doseLogsError,
        } = await supabase
          .from("dose_logs")
          .select("*")
          .eq("patient_id", user.id)
          .gte("scheduled_for", todayStart.toISOString())
          .lte("scheduled_for", todayEnd.toISOString());

        if (doseLogsError) {
          console.error(
            "Error fetching dose logs:",
            doseLogsError
          );
        }

        /* =====================================================
           4. CALCULATE TODAY'S SCHEDULED DOSES
        ====================================================== */

        let scheduledDoseCount = 0;

        if (medicines && medicines.length > 0) {
          medicines.forEach((medicine) => {
            let dosesToday =
              Number(medicine.frequency_per_day) || 1;

            if (dosesToday < 1) {
              dosesToday = 1;
            }

            scheduledDoseCount += dosesToday;
          });
        }

        /* =====================================================
           5. COUNT TAKEN DOSES
        ====================================================== */

        const takenCount = (doseLogs || []).filter(
          (dose) => dose.status === "taken"
        ).length;

        /* =====================================================
           6. TOTAL DOSES
        ====================================================== */

        const loggedDoseCount = (doseLogs || []).length;

        const totalCount = Math.max(
          scheduledDoseCount,
          loggedDoseCount
        );

        setCounts({
          taken: takenCount,
          total: totalCount,
        });
      } catch (error) {
        console.error(
          "Error loading patient dashboard:",
          error
        );
      }
    };

    /* =======================================================
       7. UNREAD NOTIFICATIONS
    ======================================================== */

    const loadNotifications = async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("recipient_id", user.id)
        .eq("read", false);

      if (error) {
        console.error(
          "Error fetching notifications:",
          error
        );
        return;
      }

      setUnreadCount(count ?? 0);
    };

    loadDashboard();
    loadNotifications();
  }, [user]);

  /* =========================================================
     USER NAME
  ========================================================== */

  const firstName = profile?.full_name
    ? profile.full_name.split(" ")[0]
    : "there";

  /* =========================================================
     TODAY
  ========================================================== */

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  /* =========================================================
     ADHERENCE
  ========================================================== */

  const adherence =
    counts.total > 0
      ? Math.round((counts.taken / counts.total) * 100)
      : 0;

  /* =========================================================
     PENDING
  ========================================================== */

  const pending = Math.max(
    counts.total - counts.taken,
    0
  );

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10 space-y-6">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-500">
              {today}
            </p>

            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-gray-900">
              Welcome, {firstName}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Here's your medication overview for today.
            </p>
          </div>

          {/* Notifications */}

          <Link
            to="/notifications"
            className="relative flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition"
            style={{
              backgroundColor: "#F0FDFA",
              border: "1px solid #99F6E4",
              color: "#0F766E",
            }}
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5" />

            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                style={{
                  backgroundColor: "#2563EB",
                }}
              >
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </Link>

        </div>

        {/* =====================================================
            TOP DASHBOARD
        ====================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ===================================================
              TODAY'S MEDICATION
          ==================================================== */}

          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Today's Medication
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Track your medication progress for today.
                </p>
              </div>

            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">

              {/* Dose Ring */}

              <div className="flex-shrink-0">
                <DoseRing
                  taken={counts.taken}
                  total={counts.total}
                />
              </div>

              {/* Statistics */}

              <div className="flex-1 w-full grid grid-cols-2 gap-4">

                {/* Taken */}

                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "#F0FDF4",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#15803D" }}
                  >
                    Taken
                  </p>

                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: "#166534" }}
                  >
                    {counts.taken}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    doses completed
                  </p>
                </div>

                {/* Total */}

                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <p className="text-sm font-medium text-gray-600">
                    Total
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {counts.total}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    doses scheduled
                  </p>
                </div>

                {/* Adherence */}

                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "#F0FDFA",
                    border: "1px solid #99F6E4",
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#0F766E" }}
                  >
                    Adherence
                  </p>

                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: "#115E59" }}
                  >
                    {adherence}%
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    today's progress
                  </p>
                </div>

                {/* Pending */}

                <div
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: "#FFFBEB",
                    border: "1px solid #FDE68A",
                  }}
                >
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#B45309" }}
                  >
                    Pending
                  </p>

                  <p
                    className="mt-1 text-2xl font-bold"
                    style={{ color: "#92400E" }}
                  >
                    {pending}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    doses remaining
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ===================================================
              QUICK ACTIONS
          ==================================================== */}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>

            <p className="text-sm text-gray-500 mt-1 mb-5">
              Quickly access your medication tools.
            </p>

            <div className="space-y-3">

              {/* Reminders */}

              <Link
                to="/reminders"
                className="flex items-center gap-4 p-4 rounded-xl transition"
                style={{
                  backgroundColor: "#FFFBEB",
                  color: "#92400E",
                  border: "1px solid #FDE68A",
                }}
              >

                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: "#FEF3C7",
                    color: "#D97706",
                  }}
                >
                  <BellIcon className="w-5 h-5" />
                </div>

                <div>

                  <p className="font-semibold text-sm">
                    Reminders
                  </p>

                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "#B45309" }}
                  >
                    View your medication reminders
                  </p>

                </div>

              </Link>

              {/* Medicines */}

              <Link
                to="/medications"
                className="flex items-center gap-4 p-4 rounded-xl transition"
                style={{
                  backgroundColor: "#F0FDFA",
                  color: "#115E59",
                  border: "1px solid #99F6E4",
                }}
              >

                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: "#CCFBF1",
                    color: "#0F766E",
                  }}
                >
                  <PillIcon className="w-5 h-5" />
                </div>

                <div>

                  <p className="font-semibold text-sm">
                    Medicines
                  </p>

                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "#0F766E" }}
                  >
                    Manage your medicines
                  </p>

                </div>

              </Link>

              {/* History */}

              <Link
                to="/history"
                className="flex items-center gap-4 p-4 rounded-xl transition"
                style={{
                  backgroundColor: "#EFF6FF",
                  color: "#1E40AF",
                  border: "1px solid #BFDBFE",
                }}
              >

                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: "#DBEAFE",
                    color: "#2563EB",
                  }}
                >
                  <ChartIcon className="w-5 h-5" />
                </div>

                <div>

                  <p className="font-semibold text-sm">
                    History
                  </p>

                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "#2563EB" }}
                  >
                    View medication history
                  </p>

                </div>

              </Link>

            </div>
          </div>

        </div>

        {/* =====================================================
            MEDICATION PROGRESS
        ====================================================== */}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

          <div className="p-6 border-b border-gray-100">

            <h2 className="text-lg font-semibold text-gray-900">
              Medication Progress
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Your medication completion status for today.
            </p>

          </div>

          <div className="p-6">

            {counts.total === 0 ? (

              <div className="py-8 text-center">

                <div
                  className="mx-auto w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "#CCFBF1",
                    color: "#0F766E",
                  }}
                >
                  <PillIcon className="w-6 h-6" />
                </div>

                <h3 className="mt-4 font-semibold text-gray-900">
                  No medicines scheduled
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Add a medicine to start tracking your medication.
                </p>

                <Link
                  to="/medications"
                  className="inline-flex mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium transition"
                  style={{
                    backgroundColor: "#0D9488",
                  }}
                >
                  Add Medicine
                </Link>

              </div>

            ) : (

              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="font-medium text-gray-900">
                      Today's progress
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {counts.taken} of {counts.total} doses completed
                    </p>

                  </div>

                  <span
                    className="text-lg font-bold"
                    style={{ color: "#0F766E" }}
                  >
                    {adherence}%
                  </span>

                </div>

                {/* Progress bar */}

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">

                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${adherence}%`,
                      backgroundColor: "#14B8A6",
                    }}
                  />

                </div>

                <div className="flex justify-between text-xs text-gray-500">

                  <span>
                    {counts.taken} taken
                  </span>

                  <span>
                    {pending} remaining
                  </span>

                </div>

              </div>

            )}

          </div>
        </div>

      </div>
    </div>
  );
}