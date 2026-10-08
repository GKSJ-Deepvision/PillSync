import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import AddMedicineModal from "../components/medications/AddMedicineModal";
import StockProgressBar from "../components/refills/StockProgressBar";
import CaregiverPage from "./CaregiverPage";
import AnalyticsPage from "./AnalyticsPage";
import {
  fetchMedications,
  addMedication,
  takeDoseApi,
  deleteMedicationApi,
  fetchAnalyticsOverview,
} from "../services/api";
import {
  Pill,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Clock,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { user, viewMode } = useAuth();

  const activeRole =
    user?.role === "admin"
      ? viewMode || "admin"
      : viewMode || user?.role || "patient";

  if (activeRole === "caregiver") {
    return <CaregiverPage />;
  }

  if (activeRole === "admin") {
    return <AnalyticsPage />;
  }

  return <PatientDashboardContent user={user} viewMode={viewMode} />;
}

function PatientDashboardContent({ user, viewMode }) {
  const [medicines, setMedicines] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [medsData, statsData] = await Promise.all([
        fetchMedications(),
        fetchAnalyticsOverview(),
      ]);
      setMedicines(medsData);
      setAnalytics(statsData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayKey = new Date().toISOString().split("T")[0];
  const [takenDoseState, setTakenDoseState] = useState(() => {
    try {
      const saved = localStorage.getItem(`pillsync_taken_doses_${todayKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [toastMsg, setToastMsg] = useState("");

  const handleTakeDose = async (doseId, medId, medName, dosage) => {
    const timeNow = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (medId) {
      try {
        await takeDoseApi(medId);
        setMedicines((prev) =>
          prev.map((m) =>
            m.id === medId ? { ...m, stock: Math.max(0, m.stock - 1) } : m,
          ),
        );
      } catch (e) {
        console.warn("Background stock reduction API error:", e);
      }
    }

    setTakenDoseState((prev) => {
      const updated = {
        ...prev,
        [doseId]: { status: "taken", time: timeNow },
      };
      try {
        localStorage.setItem(
          `pillsync_taken_doses_${todayKey}`,
          JSON.stringify(updated),
        );
      } catch (e) {
        console.error("Failed to persist dose state:", e);
      }
      return updated;
    });

    setToastMsg(`Medicine marked as taken.`);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleMissDose = (doseId, medName) => {
    setTakenDoseState((prev) => {
      const updated = {
        ...prev,
        [doseId]: { status: "missed", time: null },
      };
      try {
        localStorage.setItem(
          `pillsync_taken_doses_${todayKey}`,
          JSON.stringify(updated),
        );
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    setToastMsg(`Logged dose for ${medName} as missed.`);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleAddMedicine = async (newMed) => {
    try {
      const savedMed = await addMedication(newMed);
      setMedicines((prev) => [savedMed, ...prev]);
      const statsData = await fetchAnalyticsOverview();
      setAnalytics(statsData);
    } catch (err) {
      console.error("Add medicine failed:", err);
      alert("Failed to save medicine.");
    }
  };

  const handleDeleteMedication = async (medId) => {
    try {
      await deleteMedicationApi(medId);
      setMedicines((prev) => prev.filter((m) => m.id !== medId));
      const statsData = await fetchAnalyticsOverview();
      setAnalytics(statsData);
    } catch (err) {
      console.error("Delete medicine failed:", err);
      alert("Failed to delete medicine.");
    }
  };

  const lowStockMeds = medicines.filter((m) => m.stock <= m.refillThreshold);

  // 1. Condition Category Filter
  const categoryFilteredMeds =
    activeTab === "All"
      ? medicines
      : medicines.filter(
          (m) =>
            m.diseaseCategory &&
            m.diseaseCategory.toLowerCase() === activeTab.toLowerCase(),
        );

  // 2. Build Today's Assigned Dosages Schedule
  const todayDoses = [];
  categoryFilteredMeds.forEach((med) => {
    const times =
      med.timesOfDay && med.timesOfDay.length > 0
        ? med.timesOfDay
        : ["Morning"];
    times.forEach((timePeriod) => {
      let timeStr = med.timingDetails?.[timePeriod] || "08:00 AM";
      if (!med.timingDetails?.[timePeriod]) {
        if (timePeriod === "Afternoon") timeStr = "01:00 PM";
        if (timePeriod === "Night" || timePeriod === "Evening")
          timeStr = "09:00 PM";
      }

      const doseId = `${med.id}-${timePeriod}`;
      const savedState = takenDoseState[doseId];

      todayDoses.push({
        id: doseId,
        medId: med.id,
        name: med.name,
        dosage: med.dosage,
        time: timeStr,
        period: timePeriod,
        foodTiming: med.foodTiming || "after_food",
        diseaseCategory: med.diseaseCategory || "General",
        stock: med.stock,
        timesOfDay: med.timesOfDay,
        status: savedState?.status || "pending",
        takenTime: savedState?.time || null,
      });
    });
  });

  const takenCount = todayDoses.filter((d) => d.status === "taken").length;
  const todayAdherence =
    todayDoses.length > 0
      ? Math.round((takenCount / todayDoses.length) * 100)
      : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="font-semibold text-sm">
          Loading medication schedule...
        </span>
      </div>
    );
  }

  // Dynamic categories extracted from user's active database prescriptions
  const dynamicCategories = [
    "All",
    ...Array.from(
      new Set(
        medicines
          .map((m) => m.diseaseCategory)
          .filter((cat) => Boolean(cat) && cat.trim() !== ""),
      ),
    ),
  ];

  // Role checks based on active perspective
  const activeRole =
    user?.role === "admin"
      ? viewMode || "admin"
      : viewMode || user?.role || "patient";

  const isCaregiver = activeRole === "caregiver";
  const isAdmin = activeRole === "admin";
  const isPatient = activeRole === "patient";

  return (
    <div className="space-y-6">
      {/* Role-Based Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-100 border border-white/20 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {isCaregiver
              ? "Caregiver Portal • Real-time Patient Monitoring"
              : isAdmin
                ? "System Administration • Global Health Dashboard"
                : "Active Patient Schedule • Real-time Monitoring"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || (isCaregiver ? "Doctor" : "User")}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-brand-100/90 max-w-xl">
            {isCaregiver ? (
              <>
                Monitoring{" "}
                <strong className="text-white font-bold">
                  3 assigned family members & patients
                </strong>
                . 1 active missed-dose alert requires attention.
              </>
            ) : isAdmin ? (
              <>
                System operating normally with{" "}
                <strong className="text-white font-bold">
                  128 active patient schedules
                </strong>{" "}
                and 24 registered caregivers.
              </>
            ) : (
              <>
                You have{" "}
                <strong className="text-white font-bold">
                  {todayDoses.length} assigned doses scheduled for today
                </strong>{" "}
                across {categoryFilteredMeds.length} active prescription(s).
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {isCaregiver ? (
            <>
              <Link
                to="/caregiver"
                className="px-4 py-2.5 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Users className="w-4 h-4" />
                Caregiver Portal
              </Link>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-brand-500/40 hover:bg-brand-500/60 backdrop-blur-md text-white font-bold text-xs border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </>
          ) : isAdmin ? (
            <>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
              <Link
                to="/caregiver"
                className="px-4 py-2.5 rounded-2xl bg-brand-500/40 hover:bg-brand-500/60 backdrop-blur-md text-white font-bold text-xs border border-white/20 flex items-center gap-2 transition-all"
              >
                <Users className="w-4 h-4" />
                Manage Caregivers
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/reminders"
                className="px-4 py-2.5 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Clock className="w-4 h-4" />
                Smart Reminders
              </Link>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>Failed to load schedule. Please try again.</span>
          <button onClick={loadData} className="underline font-bold">
            Retry
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Today's Scheduled Doses
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {todayDoses.length}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> {takenCount} of {todayDoses.length} Taken
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Today's Adherence Rate
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {todayAdherence}%
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Live Tracking
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Low Stock Alerts
            </p>
            <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {lowStockMeds.length}
            </h3>
            <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5 mt-1">
              <AlertTriangle className="w-3 h-3" /> Stock Alert
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Assigned Caregiver
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Active
            </h3>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1 block">
              Dr. Sarah Jenkins
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Dynamic Condition Category Filter Pills */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Filter Schedule by Condition Category:
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab.toLowerCase() === cat.toLowerCase()
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                  : "glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Today's Assigned Dosage Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduled Today Doses Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-brand-600" />
              Today's Medication Schedule ({todayDoses.length})
            </h3>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold">
              Today:{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {toastMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{toastMsg}</span>
              </div>
              <button
                onClick={() => setToastMsg("")}
                className="text-xs opacity-70 hover:opacity-100 font-extrabold"
              >
                ✕
              </button>
            </div>
          )}

          {todayDoses.length === 0 ? (
            <div className="p-8 rounded-3xl glass-card text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
                <Pill className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                No medicines assigned yet
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are no active medicines scheduled for category "{activeTab}". Select another category or view your full prescription list.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 glass-card">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-3.5">Medicine</th>
                    <th className="p-3.5">Schedule</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {todayDoses.map((dose) => {
                    const isTaken = dose.status === "taken";
                    const isMissed = dose.status === "missed";

                    return (
                      <tr
                        key={dose.id}
                        className={`transition-colors ${
                          isTaken
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20"
                            : isMissed
                              ? "bg-rose-50/30 dark:bg-rose-950/10"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {dose.name} ({dose.dosage})
                          </div>
                          <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                            {dose.diseaseCategory}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {dose.time}
                          </div>
                          <div className="text-[11px] text-slate-500 capitalize">
                            {dose.period} &bull; {dose.foodTiming.replace("_", " ")}
                          </div>
                        </td>

                        <td className="p-3.5">
                          {isTaken ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1 rounded-full text-[11px] border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ✓ Taken {dose.takenTime ? `at ${dose.takenTime}` : ""}
                            </span>
                          ) : isMissed ? (
                            <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2.5 py-1 rounded-full text-[11px] border border-rose-300 dark:border-rose-800">
                              Missed ✗
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded-full text-[11px] border border-amber-300 dark:border-amber-800">
                              <Clock className="w-3.5 h-3.5" />
                              Take Now
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right">
                          {isTaken ? (
                            <button
                              disabled
                              className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-not-allowed opacity-90 inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              ✓ Taken
                            </button>
                          ) : (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  handleTakeDose(
                                    dose.id,
                                    dose.medId,
                                    dose.name,
                                    dose.dosage,
                                  )
                                }
                                className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Take Medicine
                              </button>
                              <button
                                onClick={() =>
                                  handleMissDose(dose.id, dose.name)
                                }
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 text-slate-600 dark:text-slate-400 font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                Missed
                              </button>
                              {!isPatient && (
                                <button
                                  onClick={() =>
                                    handleDeleteMedication(dose.medId)
                                  }
                                  title="Remove Medicine"
                                  className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 dark:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
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

        {/* Right Column: Refill & Stock Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Stock & Refills
            </h3>
          </div>

          {/* Simple Human-Friendly Low Stock Alerts (Point 5) */}
          {lowStockMeds.length > 0 && (
            <div className="space-y-2">
              {lowStockMeds.map((med) => (
                <div
                  key={med.id}
                  className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>🔔 Low Stock</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">
                    <strong>{med.name}</strong> — approximately {med.stock} doses remaining.
                  </p>
                  <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block">
                    Refill recommended.
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {categoryFilteredMeds.map((med) => (
              <StockProgressBar
                key={med.id}
                medicineName={med.name}
                currentStock={med.stock}
                totalStock={med.totalStock}
                refillDate={`In ${med.stockDays} Days`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Add Medicine Modal (Caregiver/Admin only) */}
      {!isPatient && (
        <AddMedicineModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddMedicine={handleAddMedicine}
        />
      )}
    </div>
  );
}
}
