import React from 'react';
import { AlertCircle, Calendar, ShieldCheck } from 'lucide-react';

export default function StockProgressBar({ currentStock, totalStock, refillDate, medicineName }) {
  const percentage = Math.min(100, Math.max(0, (currentStock / (totalStock || 60)) * 100));
  const isCritical = percentage < 25;
  const isWarning = percentage >= 25 && percentage < 50;

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">{medicineName}</h5>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentStock} of {totalStock} units remaining
          </p>
        </div>
        
        {isCritical ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Critical Stock
          </span>
        ) : isWarning ? (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Low Stock
          </span>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Stock Healthy
          </span>
        )}
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isCritical
              ? 'bg-rose-500 shadow-glow-rose'
              : isWarning
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Predicted Refill Date Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-brand-500" />
          AI Predicted Refill Date:
        </span>
        <strong className="text-slate-800 dark:text-slate-200 font-bold">{refillDate}</strong>
      </div>
    </div>
  );
}
