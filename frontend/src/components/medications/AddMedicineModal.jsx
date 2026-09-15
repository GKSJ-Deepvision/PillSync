import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { searchFdaDrugs } from "../../services/api";
import {
  Search,
  Sparkles,
  Check,
  Calendar,
  Clock,
  Utensils,
  Pill,
} from "lucide-react";

export default function AddMedicineModal({ isOpen, onClose, onAddMedicine }) {
  const [formData, setFormData] = useState({
    name: "",
    dosageValue: "500",
    dosageUnit: "mg",
    stock: 60,
    frequency: "2 times daily",
    diseaseCategory: "Diabetes",
    foodTiming: "after_food",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    isContinuous: true,
    timesOfDay: ["Morning", "Night"],
    timingDetails: {
      Morning: "08:00 AM",
      Afternoon: "01:00 PM",
      Night: "09:00 PM",
    },
    refillThreshold: 10,
    activeIngredient: "",
    manufacturer: "",
    fdaNdc: "",
  });

  const [fdaResults, setFdaResults] = useState([]);
  const [isSearchingFda, setIsSearchingFda] = useState(false);
  const [showFdaResults, setShowFdaResults] = useState(false);

  useEffect(() => {
    if (!formData.name || formData.name.length < 2) {
      setFdaResults([]);
      setShowFdaResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingFda(true);
      try {
        const results = await searchFdaDrugs(formData.name);
        setFdaResults(results);
        setShowFdaResults(results.length > 0);
      } catch (err) {
        console.error("FDA search failed", err);
      } finally {
        setIsSearchingFda(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.name]);

  const selectFdaDrug = (drug) => {
    setFormData((prev) => ({
      ...prev,
      name: drug.name,
      dosageValue:
        drug.dosage !== "Standard Dose"
          ? drug.dosage.replace(/[^0-9.]/g, "") || "500"
          : prev.dosageValue,
      activeIngredient: drug.genericName || prev.activeIngredient,
      manufacturer: drug.manufacturer || prev.manufacturer,
      fdaNdc: drug.ndc || prev.fdaNdc,
    }));
    setShowFdaResults(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const fullDosage = `${formData.dosageValue} ${formData.dosageUnit}`.trim();
    const totalStock = Number(formData.stock) || 60;
    const stockDays = Math.floor(
      totalStock / (formData.timesOfDay.length || 1),
    );

    onAddMedicine({
      name: formData.name,
      dosage: fullDosage,
      stock: totalStock,
      totalStock: totalStock,
      frequency: formData.frequency,
      diseaseCategory: formData.diseaseCategory,
      foodTiming: formData.foodTiming,
      startDate: formData.startDate,
      endDate: formData.isContinuous ? null : formData.endDate,
      timesOfDay: formData.timesOfDay,
      timingDetails: formData.timingDetails,
      refillThreshold: formData.refillThreshold,
      activeIngredient: formData.activeIngredient,
      manufacturer: formData.manufacturer,
      fdaNdc: formData.fdaNdc,
      stockDays,
    });

    // Reset Form
    setFormData({
      name: "",
      dosageValue: "500",
      dosageUnit: "mg",
      stock: 60,
      frequency: "2 times daily",
      diseaseCategory: "Diabetes",
      foodTiming: "after_food",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      isContinuous: true,
      timesOfDay: ["Morning", "Night"],
      timingDetails: {
        Morning: "08:00 AM",
        Afternoon: "01:00 PM",
        Night: "09:00 PM",
      },
      refillThreshold: 10,
      activeIngredient: "",
      manufacturer: "",
      fdaNdc: "",
    });
    onClose();
  };

  const handleCheckbox = (time) => {
    setFormData((prev) => ({
      ...prev,
      timesOfDay: prev.timesOfDay.includes(time)
        ? prev.timesOfDay.filter((t) => t !== time)
        : [...prev.timesOfDay, time],
    }));
  };

  const handleTimeChange = (slot, timeVal) => {
    setFormData((prev) => ({
      ...prev,
      timingDetails: {
        ...prev.timingDetails,
        [slot]: timeVal,
      },
    }));
  };

  const foodTimingOptions = [
    {
      id: "after_food",
      label: "After Food",
      icon: "🍲",
      desc: "Take within 30 mins after meals",
    },
    {
      id: "before_food",
      label: "Before Food",
      icon: "🥣",
      desc: "Take 30 mins prior to meals",
    },
    {
      id: "with_food",
      label: "With Food",
      icon: "🍱",
      desc: "Take together with meals",
    },
    {
      id: "empty_stomach",
      label: "Empty Stomach",
      icon: "☕",
      desc: "Take 1 hour before or 2 hrs after meal",
    },
    {
      id: "no_preference",
      label: "No Preference",
      icon: "🌐",
      desc: "Can be taken anytime",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Dosage Schedule">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-h-[78vh] overflow-y-auto pr-1"
      >
        {/* Medicine Name with Live OpenFDA Auto-complete */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Medicine Name
            </label>
            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> OpenFDA Connected
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Metformin, Lipitor, Amoxicillin"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            {isSearchingFda && (
              <span className="absolute right-3 top-2.5 text-xs text-brand-500 animate-pulse font-medium">
                Searching FDA...
              </span>
            )}
          </div>

          {/* Live FDA API Results Dropdown */}
          {showFdaResults && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                FDA National Drug Code Database Matches ({fdaResults.length})
              </div>
              {fdaResults.map((drug) => (
                <div
                  key={drug.id}
                  onClick={() => selectFdaDrug(drug)}
                  className="p-3 hover:bg-brand-50/70 dark:hover:bg-brand-950/50 cursor-pointer transition-colors flex items-start justify-between gap-2"
                >
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {drug.name}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {drug.genericName} • {drug.dosage} • {drug.dosageForm}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300">
                    Select
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dosage & Initial Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1 flex items-center gap-1">
              <Pill className="w-3.5 h-3.5 text-brand-500" /> Dosage Strength &
              Unit
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 500"
                value={formData.dosageValue}
                onChange={(e) =>
                  setFormData({ ...formData, dosageValue: e.target.value })
                }
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
              <select
                value={formData.dosageUnit}
                onChange={(e) =>
                  setFormData({ ...formData, dosageUnit: e.target.value })
                }
                className="w-28 px-2 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="mg">mg</option>
                <option value="ml">ml</option>
                <option value="tablet">tablet</option>
                <option value="capsule">capsule</option>
                <option value="puffs">puffs</option>
                <option value="drops">drops</option>
                <option value="mcg">mcg</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Stock Quantity
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stock: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              min="1"
              required
            />
          </div>
        </div>

        {/* Frequency & Disease Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="1 time daily">1 time daily</option>
              <option value="2 times daily">2 times daily</option>
              <option value="3 times daily">3 times daily</option>
              <option value="Every 8 hours">Every 8 hours</option>
              <option value="Alternate Days">Alternate Days</option>
              <option value="As needed (PRN)">As needed (PRN)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Disease / Condition Category
            </label>
            <input
              type="text"
              placeholder="e.g. Diabetes, Blood Pressure"
              value={formData.diseaseCategory}
              onChange={(e) =>
                setFormData({ ...formData, diseaseCategory: e.target.value })
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Before / After Food (Meal Relation) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-1">
            <Utensils className="w-3.5 h-3.5 text-amber-500" /> Meal Relation
            (Before / After Food)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {foodTimingOptions.map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setFormData({ ...formData, foodTiming: opt.id })}
                className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                  formData.foodTiming === opt.id
                    ? "bg-brand-50 dark:bg-brand-950/80 border-brand-500 dark:border-brand-500 text-brand-900 dark:text-brand-100 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Start / End Date */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Prescription
              Schedule Period
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-brand-600 dark:text-brand-400 font-semibold">
              <input
                type="checkbox"
                checked={formData.isContinuous}
                onChange={(e) =>
                  setFormData({ ...formData, isContinuous: e.target.checked })
                }
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Continuous / Ongoing
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Start Date
              </span>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>

            {!formData.isContinuous && (
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  End Date
                </span>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>
            )}
          </div>
        </div>

        {/* Schedule Timing & Exact Time Slots */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" /> Time Slots & Exact
            Timings
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {["Morning", "Afternoon", "Night"].map((slot) => (
              <label
                key={slot}
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  formData.timesOfDay.includes(slot)
                    ? "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border-brand-400 dark:border-brand-600"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.timesOfDay.includes(slot)}
                  onChange={() => handleCheckbox(slot)}
                  className="hidden"
                />
                {slot}
              </label>
            ))}
          </div>

          {/* Detailed Time Pickers for active slots */}
          {formData.timesOfDay.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                Custom Alarm Timestamps:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {formData.timesOfDay.map((slot) => (
                  <div
                    key={slot}
                    className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {slot}:
                    </span>
                    <input
                      type="text"
                      value={formData.timingDetails[slot] || "08:00 AM"}
                      onChange={(e) => handleTimeChange(slot, e.target.value)}
                      placeholder="08:00 AM"
                      className="w-full bg-transparent text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Dosage Schedule
          </button>
        </div>
      </form>
    </Modal>
  );
}
