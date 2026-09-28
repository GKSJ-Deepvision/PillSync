import React from "react";

export default function AdherenceTrendChart({ metrics }) {
  const trend = metrics?.weeklyTrend || [
    { day: "Mon", rate: 95 },
    { day: "Tue", rate: 98 },
    { day: "Wed", rate: 92 },
    { day: "Thu", rate: 100 },
    { day: "Fri", rate: 96 },
    { day: "Sat", rate: 94 },
    { day: "Sun", rate: 97 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Weekly Adherence Trend
          </h3>
          <p className="text-xs text-slate-400">
            Dose intake consistency percentage
          </p>
        </div>
        <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
          {metrics?.overallAdherence || 95}% Overall
        </span>
      </div>

      <div className="flex items-end justify-between h-32 pt-4 px-2 gap-2">
        {trend.map((item, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
          >
            <div
              style={{ height: `${item.rate}%` }}
              className="w-full bg-brand-500 rounded-t-lg transition-all hover:bg-brand-600 relative group"
            >
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow transition-opacity">
                {item.rate}%
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
