import React, { useState, useEffect } from "react";
import StockProgressBar from "../components/refills/StockProgressBar";
import {
  fetchRefillPredictionsApi,
  requestRefillApi,
  updateStockApi,
} from "../services/api";
import {
  Sparkles,
  ShoppingCart,
  RefreshCw,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function RefillsPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchRefillPredictionsApi();
      setPredictions(data);
    } catch (err) {
      console.error("Failed to fetch refill predictions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderRefill = async (medId) => {
    try {
      await requestRefillApi(medId, 60, "Refill requested via AI Dashboard");
      setOrderStatus((prev) => ({ ...prev, [medId]: "Refill Order Placed!" }));
      setTimeout(() => {
        setOrderStatus((prev) => ({ ...prev, [medId]: null }));
      }, 3000);
    } catch (err) {
      alert(`Failed to place refill order: ${err.message}`);
    }
  };

  const handleStockAdjust = async (medId, currentStock) => {
    const newStockStr = prompt("Enter new stock level:", currentStock);
    if (newStockStr !== null) {
      const newStock = parseInt(newStockStr, 10);
      if (!isNaN(newStock) && newStock >= 0) {
        await updateStockApi(medId, newStock);
        await loadData();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="font-semibold text-sm">
          Calculating real stock depletion...
        </span>
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
          Calculates real-time daily dosage consumption rate, accounts for
          missed doses, and predicts exact exhaustion dates from database stock
          levels.
        </p>
      </div>

      {/* Grid of Refill Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map((item) => (
          <div
            key={item.medicationId}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  {item.diseaseCategory}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.medicationName} ({item.dosage})
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  item.status === "CRITICAL" || item.status === "LOW_STOCK"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    : item.status === "WARNING"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {item.status}
              </span>
            </div>

            <StockProgressBar
              medicineName=""
              currentStock={item.initialQuantity}
              totalStock={item.totalStock}
              refillDate={`Exhausts in ${item.effectiveStockDays} Days (${item.depletionDate})`}
            />

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl space-y-1">
                <div className="text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-500" /> Depletion
                  Date
                </div>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {item.depletionDate}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl space-y-1">
                <div className="text-slate-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Reorder By
                </div>
                <div className="font-bold text-brand-600 dark:text-brand-400">
                  {item.recommendedRefillDate}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() =>
                  handleOrderRefill(item.medicationId, item.medicationName)
                }
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white hover:bg-brand-600 dark:hover:bg-brand-400 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {orderStatus[item.medicationId] ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                    {orderStatus[item.medicationId]}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Request Refill Order
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  handleStockAdjust(item.medicationId, item.initialQuantity)
                }
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-all"
                title="Update manual stock"
              >
                Update Stock
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
