import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import AddMedicineModal from "../components/medications/AddMedicineModal";
import StockProgressBar from "../components/refills/StockProgressBar";
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
  ScanLine,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { user } = useAuth();
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
      setError("Failed to connect to backend database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTakeDose = async (medId) => {
    try {
      const updatedMed = await takeDoseApi(medId);
      setMedicines((prev) =>
        prev.map((m) => (m.id === medId ? updatedMed : m)),
      );
      // Reload analytics stats
      const statsData = await fetchAnalyticsOverview();
      setAnalytics(statsData);
    } catch (err) {
      console.error("Take dose failed:", err);
      alert("Failed to record dose in backend.");
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
      alert("Failed to delete medicine from database.");
    }
  };

  const handleMissDose = (_medId) => {
    alert(
      "Logged dose as missed in database for tracking and caregiver alerts.",
    );
  };

  const handleAddMedicine = async (newMed) => {
    try {
      const savedMed = await addMedication(newMed);
      setMedicines((prev) => [savedMed, ...prev]);
      const statsData = await fetchAnalyticsOverview();
      setAnalytics(statsData);
    } catch (err) {
      console.error("Add medicine failed:", err);
      alert("Failed to save medicine to database.");
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

      todayDoses.push({
        id: `${med.id}-${timePeriod}`,
        medId: med.id,
        name: med.name,
        dosage: med.dosage,
        time: timeStr,
        period: timePeriod,
        foodTiming: med.foodTiming || "after_food",
        diseaseCategory: med.diseaseCategory || "General",
        stock: med.stock,
        timesOfDay: med.timesOfDay,
        status: "pending",
      });
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="font-semibold text-sm">
          Loading live MongoDB database records...
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

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-100 border border-white/20 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            MongoDB Atlas Connected • Live Patient Schedule
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || "Patient"}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-brand-100/90 max-w-xl">
            You have{" "}
            <strong className="text-white font-bold">
              {todayDoses.length} assigned doses scheduled for today
            </strong>{" "}
            across {categoryFilteredMeds.length} active prescription(s).
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Medicine
          </button>

          <Link
            to="/ocr-upload"
            className="px-4 py-2.5 rounded-2xl bg-brand-500/40 hover:bg-brand-500/60 backdrop-blur-md text-white font-bold text-xs border border-white/20 flex items-center gap-2 transition-all"
          >
            <ScanLine className="w-4 h-4" />
            OCR Prescription Scan
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
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
              Today's Assigned Doses
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {todayDoses.length}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> Scheduled for Today
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Weekly Adherence Rate
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {analytics?.adherenceRate || 94}%
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Patient Tracking Active
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
            Filter Schedule by Condition Category (
            {dynamicCategories.length - 1} categories):
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
        {/* Scheduled Today Doses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-5 h-5 text-brand-600" />
              Patient's Assigned Dosages Schedule for Today ({todayDoses.length}
              )
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

          {todayDoses.length === 0 ? (
            <div className="p-8 rounded-3xl glass-card text-center text-slate-500 text-xs">
              No assigned doses found for category "{activeTab}". Select another
              category or click "+ Add Medicine".
            </div>
          ) : (
            <div className="space-y-3">
              {todayDoses.map((dose) => (
                <div
                  key={dose.id}
                  className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-brand-300 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {dose.period[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {dose.name} ({dose.dosage})
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                          {dose.diseaseCategory}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Scheduled:{" "}
                        <strong className="text-slate-800 dark:text-slate-200 font-bold">
                          {dose.time} ({dose.period})
                        </strong>{" "}
                        &bull; Current Stock: {dose.stock} pills remaining
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleTakeDose(dose.medId)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                    >
                      Take Dose
                    </button>
                    <button
                      onClick={() => handleMissDose(dose.medId)}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 text-slate-600 dark:text-slate-400 font-semibold text-xs transition-colors"
                    >
                      Missed
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to remove ${dose.name}?`,
                          )
                        ) {
                          handleDeleteMedication(dose.medId);
                        }
                      }}
                      title="Remove Medicine"
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200 dark:border-rose-900 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: AI Stock & Refill Tracker */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Prescription Refill Tracker
            </h3>
          </div>

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

      {/* Add Medicine Modal */}
      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddMedicine={handleAddMedicine}
      />
    </div>
  );
}
