import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeftIcon,
  PillIcon,
  PlusIcon,
  categoryStyle,
} from "../../components/icons";

export default function MedicationsPage() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;

    setLoading(true);

    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false });

    setMedications(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const deactivate = async (id) => {
    await supabase
      .from("medications")
      .update({ active: false })
      .eq("id", id);

    load();
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">

        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-teal-600 mb-3 transition-colors"
            >
              <ArrowLeftIcon />
              Dashboard
            </Link>

            <h1 className="heading text-2xl md:text-3xl font-bold text-gray-900">
              Your medicines
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Manage your medicines, dosages, and reminder schedules.
            </p>
          </div>

          <Link
            to="/medications/new"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-br from-teal-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-md shadow-teal-200 hover:shadow-lg hover:shadow-teal-200 transition-shadow"
          >
            <PlusIcon />
            Add medicine
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">

          {/* Scan a Label */}
          <Link
            to="/scan"
            className="group rounded-2xl p-5 transition-all duration-200 hover:shadow-md"
            style={{
              border: "2px solid #93C5FD",
              backgroundColor: "#EFF6FF",
            }}
          >
            <div className="flex items-center gap-4">

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#DBEAFE",
                  color: "#2563EB",
                }}
              >
                <span className="text-lg">⌕</span>
              </div>

              <div>
                <p
                  className="font-semibold"
                  style={{ color: "#1D4ED8" }}
                >
                  Scan a label
                </p>

                <p
                  className="text-sm mt-0.5"
                  style={{ color: "#64748B" }}
                >
                  Scan medicine information quickly
                </p>
              </div>

            </div>
          </Link>

          {/* Refill Check */}
          <Link
            to="/refills"
            className="group rounded-2xl p-5 transition-all duration-200 hover:shadow-md"
            style={{
              border: "2px solid #FDBA74",
              backgroundColor: "#FFF7ED",
            }}
          >
            <div className="flex items-center gap-4">

              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: "#FFEDD5",
                  color: "#EA580C",
                }}
              >
                <span className="text-lg">↻</span>
              </div>

              <div>
                <p
                  className="font-semibold"
                  style={{ color: "#C2410C" }}
                >
                  Refill check
                </p>

                <p
                  className="text-sm mt-0.5"
                  style={{ color: "#64748B" }}
                >
                  Check medicines that need refilling
                </p>
              </div>

            </div>
          </Link>

        </div>

        {/* Medicine Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Active medicines
            </h2>

            <p className="text-sm text-gray-500 mt-0.5">
              {medications.length}{" "}
              {medications.length === 1 ? "medicine" : "medicines"} added
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-500">
              Loading medicines…
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && medications.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-teal-200 p-12 text-center">

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center mx-auto mb-4">
              <PillIcon className="w-8 h-8" />
            </div>

            <p className="text-gray-900 font-semibold text-lg">
              No medicines yet
            </p>

            <p className="text-sm text-gray-500 mt-1 mb-5">
              Add your first medicine to start managing your medication
              schedule.
            </p>

            <Link
              to="/medications/new"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <PlusIcon />
              Add medicine
            </Link>

          </div>
        )}

        {/* Medicine Cards */}
        {!loading && medications.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">

            {medications.map((m) => {
              const style = categoryStyle(m.disease_category);

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all p-5"
                >

                  {/* Medicine Top Section */}
                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-4 min-w-0">

                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.dot}`}
                      >
                        <PillIcon className="w-6 h-6" />
                      </div>

                      <div className="min-w-0">

                        <p className="font-semibold text-gray-900 text-base truncate">
                          {m.name}
                        </p>

                        <p className="text-sm text-gray-500 mt-1">
                          {m.dosage}
                        </p>

                      </div>
                    </div>

                    {m.disease_category && (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${style.badge}`}
                      >
                        {m.disease_category}
                      </span>
                    )}

                  </div>

                  {/* Medicine Details */}
                  <div className="mt-5 pt-4 border-t border-gray-100">

                    <div className="grid grid-cols-2 gap-4">

                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          Frequency
                        </p>

                        <p className="text-sm font-medium text-gray-700 mt-1">
                          {m.frequency_per_day}x / day
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">
                          Reminders
                        </p>

                        <p className="text-sm font-medium text-gray-700 mt-1">
                          {m.reminder_times?.length > 0
                            ? m.reminder_times
                                .map((t) => t.slice(0, 5))
                                .join(", ")
                            : "Not set"}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">

                    <Link
                      to={`/medications/${m.id}/edit`}
                      className="flex-1 text-center bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium text-sm py-2.5 rounded-xl transition-colors"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => deactivate(m.id)}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-sm py-2.5 rounded-xl transition-colors"
                    >
                      Remove
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}