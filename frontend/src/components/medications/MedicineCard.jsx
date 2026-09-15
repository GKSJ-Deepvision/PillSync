import React from "react";
import {
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Tag,
  Trash2,
  Calendar,
} from "lucide-react";

export default function MedicineCard({ medicine, onTake, onMiss, onDelete }) {
  const isLowStock = medicine.stock <= medicine.refillThreshold;

  const diseaseColors = {
    Diabetes:
      "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    "Blood Pressure":
      "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    Thyroid:
      "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    Antibiotics:
      "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    Vitamins:
      "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  };

  const foodTimingLabels = {
    after_food: {
      label: "After Food",
      icon: "🍲",
      color:
        "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200",
    },
    before_food: {
      label: "Before Food",
      icon: "🥣",
      color:
        "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200",
    },
    with_food: {
      label: "With Food",
      icon: "🍱",
      color:
        "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200",
    },
    empty_stomach: {
      label: "Empty Stomach",
      icon: "☕",
      color:
        "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200",
    },
    no_preference: {
      label: "No Preference",
      icon: "🌐",
      color:
        "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200",
    },
  };

  const tagStyle =
    diseaseColors[medicine.diseaseCategory] ||
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

  const foodTag =
    foodTimingLabels[medicine.foodTiming] || foodTimingLabels.after_food;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove ${medicine.name}?`)) {
      onDelete?.(medicine.id);
    }
  };

  return (
    <div className="group p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {medicine.name}
              </h4>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300">
                {medicine.dosage}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {medicine.frequency}
            </p>
          </div>
        </div>

        {/* Disease Tag */}
        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${tagStyle} flex items-center gap-1 shrink-0`}
          >
            <Tag className="w-3 h-3" />
            {medicine.diseaseCategory || "General"}
          </span>

          {onDelete && (
            <button
              onClick={handleDelete}
              title="Remove Medicine"
              className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Meal & Prescription Period Row */}
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap text-xs">
        <span
          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${foodTag.color}`}
        >
          <span>{foodTag.icon}</span>
          <span>{foodTag.label}</span>
        </span>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {medicine.startDate ? `From ${medicine.startDate}` : "Active"}
          {medicine.endDate ? ` to ${medicine.endDate}` : " (Continuous)"}
        </span>
      </div>

      {/* Details Row */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <Clock className="w-4 h-4 text-brand-500" />
          <span>
            Slots:{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {Array.isArray(medicine.timesOfDay)
                ? medicine.timesOfDay.join(", ")
                : "Morning"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <span className="text-slate-500">Stock:</span>
          <strong
            className={`font-bold ${isLowStock ? "text-rose-600 dark:text-rose-400 animate-pulse" : "text-slate-800 dark:text-slate-200"}`}
          >
            {medicine.stock} pills ({medicine.stockDays} days)
          </strong>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {isLowStock && (
        <div className="mt-3 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5 font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
          Refill Warning: Low stock! Arrange refill soon.
        </div>
      )}

      {/* Actions Row */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => onTake?.(medicine.id)}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <CheckCircle2 className="w-4 h-4" />
          Taken
        </button>

        <button
          onClick={() => onMiss?.(medicine.id)}
          className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
        >
          <XCircle className="w-4 h-4" />
          Missed
        </button>

        {onDelete && (
          <button
            onClick={handleDelete}
            title="Remove Medicine"
            className="py-2 px-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1 transition-all border border-rose-200 dark:border-rose-900"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
