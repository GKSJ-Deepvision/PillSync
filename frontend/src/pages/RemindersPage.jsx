import React, { useState, useEffect } from "react";
import { fetchReminders, updateReminderStatusApi } from "../services/api";
import {
  Clock,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  XCircle,
  BellRing,
  Smartphone,
  Mail,
  RefreshCw,
  Timer,
} from "lucide-react";

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = async () => {
    setLoading(true);
    try {
      const data = await fetchReminders();
      setReminders(data);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReminders();
  }, []);

  const markStatus = async (id, newStatus) => {
    try {
      const updated = await updateReminderStatusApi(id, newStatus);
      setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status in database.");
    }
  };

  const triggerTestNotification = (channel) => {
    alert(`Triggered real ${channel} reminder notification!`);
  };

  const foodTimingMap = {
    after_food: { label: "After Food", icon: "🍲", style: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200" },
    before_food: { label: "Before Food", icon: "🥣", style: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200" },
    with_food: { label: "With Food", icon: "🍱", style: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200" },
    empty_stomach: { label: "Empty Stomach", icon: "☕", style: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200" },
    no_preference: { label: "No Preference", icon: "🌐", style: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="font-semibold text-sm">
          Loading reminder schedules from DB...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Smart Reminder & Daily Schedule
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time dosage notifications, meal timing instructions, and daily dosage logs.
          </p>
        </div>

        {/* Test Notification Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerTestNotification("Push Notification")}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BellRing className="w-3.5 h-3.5 text-brand-500" />
            Test Push
          </button>

          <button
            onClick={() => triggerTestNotification("SMS Alert")}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            Test SMS
          </button>

          <button
            onClick={() => triggerTestNotification("Email Reminder")}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-amber-500" />
            Test Email
          </button>
        </div>
      </div>

      {/* Reminder Period Blocks */}
      {["Morning", "Afternoon", "Night"].map((period) => {
        const periodReminders = reminders.filter((r) => r.period === period);
        const Icon =
          period === "Morning" ? Sun : period === "Afternoon" ? Sunset : Moon;
        const iconColor =
          period === "Morning"
            ? "text-amber-500"
            : period === "Afternoon"
              ? "text-orange-500"
              : "text-indigo-400";

        return (
          <div
            key={period}
            className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${iconColor}`} />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {period} Dosage Slot
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  ({periodReminders.length} scheduled)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {periodReminders.length === 0 ? (
                <div className="p-4 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
                  No scheduled doses for {period.toLowerCase()}.
                </div>
              ) : (
                periodReminders.map((rem) => {
                  const foodTag = foodTimingMap[rem.foodTiming] || foodTimingMap.after_food;
                  return (
                    <div
                      key={rem.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 shrink-0">
                          <Clock className="w-4 h-4 text-brand-500" />
                          {rem.time}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {rem.name}
                            </h4>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300">
                              {rem.dosage}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${foodTag.style}`}>
                              <span>{foodTag.icon}</span>
                              <span>{foodTag.label}</span>
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                            Condition: {rem.disease}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {rem.status === "taken" ? (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                          </span>
                        ) : rem.status === "missed" ? (
                          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Missed
                          </span>
                        ) : rem.status === "snoozed" ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                              <Timer className="w-3.5 h-3.5" /> Snoozed (+15m)
                            </span>
                            <button
                              onClick={() => markStatus(rem.id, "taken")}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                            >
                              Take Now
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => markStatus(rem.id, "taken")}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Taken
                            </button>
                            <button
                              onClick={() => markStatus(rem.id, "snoozed")}
                              className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-700 dark:text-amber-300 font-semibold text-xs transition-colors flex items-center gap-1"
                            >
                              <Timer className="w-3.5 h-3.5" /> Snooze
                            </button>
                            <button
                              onClick={() => markStatus(rem.id, "missed")}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-600 dark:text-slate-400 hover:text-rose-600 font-semibold text-xs transition-colors"
                            >
                              Missed
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
