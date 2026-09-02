import React, { useState } from "react";
import StockProgressBar from "../components/refills/StockProgressBar";
import { Sparkles, ShoppingCart } from "lucide-react";

const REFILL_MEDICINES = [
  {
    id: "1",
    name: "Metformin 500mg",
    currentStock: 8,
    totalStock: 60,
    daysLeft: 4,
    refillDate: "Sept 4, 2026",
    status: "critical",
  },
  {
    id: "2",
    name: "Amoxicillin 250mg",
    currentStock: 12,
    totalStock: 30,
    daysLeft: 4,
    refillDate: "Sept 4, 2026",
    status: "warning",
  },
  {
    id: "3",
    name: "Amlodipine 5mg",
    currentStock: 45,
    totalStock: 60,
    daysLeft: 45,
    refillDate: "Oct 15, 2026",
    status: "healthy",
  },
  {
    id: "4",
    name: "Levothyroxine 50mcg",
    currentStock: 28,
    totalStock: 30,
    daysLeft: 28,
    refillDate: "Sept 28, 2026",
    status: "healthy",
  },
];

export default function RefillsPage() {
  const [refills] = useState(REFILL_MEDICINES);

  const handleOrderRefill = (name) => {
    alert(`Refill order placed for ${name}! Caregiver & Pharmacy notified.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950 text-xs font-bold text-brand-700 dark:text-brand-300 mb-2 border border-brand-200 dark:border-brand-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          AI Refill Prediction Engine
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Automated Stock Depletion & Refill Predictions
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Our AI algorithm continuously calculates daily dosage consumption rate
          and predicts exact exhaustion dates before medicine runs out.
        </p>
      </div>

      {/* Grid of Stock Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {refills.map((item) => (
          <div key={item.id} className="space-y-2">
            <StockProgressBar
              medicineName={item.name}
              currentStock={item.currentStock}
              totalStock={item.totalStock}
              refillDate={item.refillDate}
            />
            <button
              onClick={() => handleOrderRefill(item.name)}
              className="w-full py-2 px-4 rounded-xl bg-slate-900 dark:bg-white hover:bg-brand-600 dark:hover:bg-brand-400 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Request Refill Order
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
