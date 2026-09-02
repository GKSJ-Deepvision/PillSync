import React, { useState } from "react";
import Modal from "../common/Modal";

export default function AddMedicineModal({ isOpen, onClose, onAddMedicine }) {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "1 Tablet",
    stock: 60,
    frequency: "2 times daily",
    diseaseCategory: "Diabetes",
    timesOfDay: ["Morning", "Night"],
    refillThreshold: 10,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const stockDays = Math.floor(
      formData.stock / (formData.timesOfDay.length || 1),
    );
    onAddMedicine({
      ...formData,
      id: `med-${Date.now()}`,
      stockDays,
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
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
            Medicine Name
          </label>
          <input
            type="text"
            placeholder="e.g. Metformin / Amoxicillin"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            required
          />
        </div>

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
            <option value="Heart Medications">Heart Medications</option>
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
            Save Medicine
          </button>
        </div>
      </form>
    </Modal>
  );
}
