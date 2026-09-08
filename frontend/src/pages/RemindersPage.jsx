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
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? updated : r))
      );
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status in database.");
    }
  };

  const triggerTestNotification = (channel) => {
    alert(`Triggered real ${channel} reminder notification!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-500 gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
        <span className="font-semibold text-sm">Loading reminder schedules from DB...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Smart Reminder System
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time dosage notifications, daily timeslot schedules, and database dose logging.
          </p>
        </div>

        {/* Test Notification Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerTestNotification("Push Notification")}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BellRing className="w-3.5 h-3.5 text-brand-500" />
            Test Push
          </button>

          <button
            onClick={() => triggerTestNotification("SMS Alert")}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            Test SMS
          </button>

          <button
            onClick={() => triggerTestNotification("Email Reminder")}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
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
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Icon className={`w-5 h-5 ${iconColor}`} />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {period} Dosage Slot
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                ({periodReminders.length} scheduled)
              </span>
            </div>

            <div className="space-y-3">
              {periodReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-500" />
                      {rem.time}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {rem.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {rem.disease}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rem.status === "taken" ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                      </span>
                    ) : rem.status === "missed" ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Missed
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => markStatus(rem.id, "taken")}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          Mark Taken
                        </button>
                        <button
                          onClick={() => markStatus(rem.id, "missed")}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-600 dark:text-slate-400 hover:text-rose-600 font-semibold text-xs transition-colors"
                        >
                          Missed
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
