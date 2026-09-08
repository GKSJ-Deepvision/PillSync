import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { searchFdaDrugs } from "../../services/api";
import { Search, Sparkles, Check } from "lucide-react";

export default function AddMedicineModal({ isOpen, onClose, onAddMedicine }) {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "500 mg",
    stock: 60,
    frequency: "2 times daily",
    diseaseCategory: "Diabetes",
    timesOfDay: ["Morning", "Night"],
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
      dosage: drug.dosage !== "Standard Dose" ? drug.dosage : prev.dosage,
      activeIngredient: drug.genericName || prev.activeIngredient,
      manufacturer: drug.manufacturer || prev.manufacturer,
      fdaNdc: drug.ndc || prev.fdaNdc,
    }));
    setShowFdaResults(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const totalStock = Number(formData.stock) || 60;
    const stockDays = Math.floor(
      totalStock / (formData.timesOfDay.length || 1)
    );

    onAddMedicine({
      ...formData,
      stock: totalStock,
      totalStock: totalStock,
      stockDays,
    });

    // Reset
    setFormData({
      name: "",
      dosage: "500 mg",
      stock: 60,
      frequency: "2 times daily",
      diseaseCategory: "Diabetes",
      timesOfDay: ["Morning", "Night"],
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Medicine Schedule">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Medicine Name with Live OpenFDA Auto-complete */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Medicine Name
            </label>
            <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> OpenFDA Live API Connected
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Metformin, Lipitor, Amoxicillin"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            {isSearchingFda && (
              <span className="absolute right-3 top-3 text-xs text-brand-500 animate-pulse font-medium">
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
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Mfg: {drug.manufacturer || "FDA Registered"} | NDC: {drug.ndc}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300">
                    Select
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected FDA details pill */}
        {formData.manufacturer && (
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <strong>FDA Verified:</strong> {formData.manufacturer} ({formData.fdaNdc})
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Dosage Strength
            </label>
            <input
              type="text"
              placeholder="e.g. 500 mg"
              value={formData.dosage}
              onChange={(e) =>
                setFormData({ ...formData, dosage: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Initial Quantity (Stock)
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              min="1"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
            Disease / Condition Category
          </label>
          <select
            value={formData.diseaseCategory}
            onChange={(e) =>
              setFormData({ ...formData, diseaseCategory: e.target.value })
            }
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
          >
            <option value="Diabetes">Diabetes</option>
            <option value="Blood Pressure">Blood Pressure</option>
            <option value="Thyroid">Thyroid</option>
            <option value="Antibiotics">Antibiotics</option>
            <option value="Vitamins">Vitamins</option>
            <option value="Heart">Heart Medications</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
            Schedule Timing
          </label>
          <div className="flex items-center gap-3">
            {["Morning", "Afternoon", "Night"].map((time) => (
              <label
                key={time}
                className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  formData.timesOfDay.includes(time)
                    ? "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700"
                    : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.timesOfDay.includes(time)}
                  onChange={() => handleCheckbox(time)}
                  className="hidden"
                />
                {time}
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all active:scale-95"
          >
            Save Medicine to DB
          </button>
        </div>
      </form>
    </Modal>
  );
}
