import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import MedicineCard from "../components/medications/MedicineCard";
import AddMedicineModal from "../components/medications/AddMedicineModal";
import StockProgressBar from "../components/refills/StockProgressBar";
import {
  Pill,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ScanLine,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

const INITIAL_MEDICINES = [
  {
    id: "med-1",
    name: "Metformin",
    dosage: "500 mg",
    stock: 8,
    totalStock: 60,
    frequency: "2 times daily",
    diseaseCategory: "Diabetes",
    timesOfDay: ["Morning", "Night"],
    stockDays: 4,
    refillThreshold: 10,
  },
  {
    id: "med-2",
    name: "Amlodipine",
    dosage: "5 mg",
    stock: 45,
    totalStock: 60,
    frequency: "1 time daily",
    diseaseCategory: "Blood Pressure",
    timesOfDay: ["Morning"],
    stockDays: 45,
    refillThreshold: 10,
  },
  {
    id: "med-3",
    name: "Levothyroxine",
    dosage: "50 mcg",
    stock: 28,
    totalStock: 30,
    frequency: "1 time daily",
    diseaseCategory: "Thyroid",
    timesOfDay: ["Morning"],
    stockDays: 28,
    refillThreshold: 7,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");

  const handleTakeDose = (medId) => {
    setMedicines((prev) =>
      prev.map((m) =>
        m.id === medId ? { ...m, stock: Math.max(0, m.stock - 1) } : m,
      ),
    );
  };

  const handleMissDose = (_medId) => {
    // Log missed dose
    alert("Logged dose as missed for tracking and caregiver alerts.");
  };

  const handleAddMedicine = (newMed) => {
    setMedicines((prev) => [newMed, ...prev]);
  };

  const lowStockMeds = medicines.filter((m) => m.stock <= m.refillThreshold);
  const filteredMeds =
    activeTab === "All"
      ? medicines
      : medicines.filter((m) => m.diseaseCategory === activeTab);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-100 border border-white/20 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            AI-Powered Healthcare Assistant
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-brand-100/90 max-w-xl">
            You have{" "}
            <strong className="text-white font-bold">
              {medicines.length} active medicine schedules
            </strong>{" "}
            today. Your adherence rate is{" "}
            <strong className="text-emerald-300">92% this week</strong>.
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
            Scan Prescription
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Active Medicines
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {medicines.length}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1">
              <TrendingUp className="w-3 h-3" /> All active & scheduled
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Pill className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Weekly Adherence
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              92%
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-1">
              <CheckCircle2 className="w-3 h-3" /> +4% vs last week
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Refill Alerts
            </p>
            <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {lowStockMeds.length}
            </h3>
            <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-0.5 mt-1">
              <AlertTriangle className="w-3 h-3" /> Requires refill attention
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Caregiver Sync
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Active
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 block">
              Synced with Dr. Sarah
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Disease Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          "All",
          "Diabetes",
          "Blood Pressure",
          "Thyroid",
          "Antibiotics",
          "Vitamins",
        ].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === cat
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                : "glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content: Medicine Cards Grid & Refill Prediction Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scheduled Medicines */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Today's Dosage Schedule ({filteredMeds.length})
            </h3>
            <span className="text-xs text-brand-600 dark:text-brand-400 font-semibold cursor-pointer">
              View All Schedules &rarr;
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMeds.map((med) => (
              <MedicineCard
                key={med.id}
                medicine={med}
                onTake={handleTakeDose}
                onMiss={handleMissDose}
              />
            ))}
          </div>
        </div>

        {/* Right Column: AI Refill Predictions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              AI Refill Tracker
            </h3>
          </div>

          <div className="space-y-3">
            {medicines.map((med) => (
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
