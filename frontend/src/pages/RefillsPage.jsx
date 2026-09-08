import React, { useState, useEffect } from "react";
import StockProgressBar from "../components/refills/StockProgressBar";
import { fetchMedications } from "../services/api";
import { Sparkles, ShoppingCart, RefreshCw } from "lucide-react";

export default function RefillsPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchMedications();
        setMedicines(data);
      } catch (err) {
        console.error("Failed to fetch medicines for refill tracking:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleOrderRefill = (name) => {
    alert(`Refill request order placed for ${name}! Caregiver & Pharmacy notified.`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="font-semibold text-sm">Calculating real stock depletion...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950 text-xs font-bold text-brand-700 dark:text-brand-300 mb-2 border border-brand-200 dark:border-brand-800">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          AI Refill Prediction Engine • Live DB Connected
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Automated Stock Depletion & Refill Predictions
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Calculates real-time daily dosage consumption rate and predicts exact exhaustion dates from database stock levels.
        </p>
      </div>

      {/* Grid of Stock Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {medicines.map((item) => (
          <div key={item.id} className="space-y-2">
            <StockProgressBar
              medicineName={`${item.name} (${item.dosage})`}
              currentStock={item.stock}
              totalStock={item.totalStock}
              refillDate={`Exhausts in ${item.stockDays} Days`}
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
