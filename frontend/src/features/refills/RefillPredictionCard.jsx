import React from "react";
import StockProgressBar from "../../components/refills/StockProgressBar";
import { ShoppingCart, Calendar, AlertTriangle } from "lucide-react";

export default function RefillPredictionCard({ prediction, onRequestRefill, onStockAdjust }) {
  if (!prediction) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">{prediction.diseaseCategory}</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {prediction.medicationName} ({prediction.dosage})
          </h3>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            prediction.isLowStock
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          }`}
        >
          {prediction.status}
        </span>
      </div>

      <StockProgressBar
        medicineName=""
        currentStock={prediction.initialQuantity}
        totalStock={prediction.totalStock}
        refillDate={`Exhausts in ${prediction.effectiveStockDays} Days (${prediction.depletionDate})`}
      />

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onRequestRefill && onRequestRefill(prediction.medicationId)}
          className="flex-1 py-2 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" /> Request Refill Order
        </button>
      </div>
    </div>
  );
}
