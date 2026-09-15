import { useCallback, useEffect, useRef, useState } from "react";
import {
  ensureTodayDoseLogs,
  autoMarkMissed,
  listTodayDoses,
  markDoseTaken,
  markDoseMissed,
  snoozeDose,
} from "./api";
import { scheduleDoseNotification } from "./notifications";

const POLL_MS = 60_000;

/** Owns the full "today's reminders" lifecycle: generate today's doses from
 * schedules, auto-miss overdue ones, load the list, keep it fresh, and
 * schedule browser notifications for anything still upcoming. */
export function useTodayDoses(patientId) {
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const timeoutIds = useRef([]);

  const clearScheduled = () => {
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];
  };

  const load = useCallback(async () => {
    if (!patientId) return;
    await ensureTodayDoseLogs(patientId);
    await autoMarkMissed(patientId);
    const { data } = await listTodayDoses(patientId);
    setDoses(data);
    setLoading(false);

    clearScheduled();
    data
      .filter((d) => d.status === "pending" || d.status === "snoozed")
      .forEach((d) => {
        const id = scheduleDoseNotification(d, d.medications?.name ?? "your medicine");
        if (id) timeoutIds.current.push(id);
      });
  }, [patientId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      clearInterval(interval);
      clearScheduled();
    };
  }, [load]);

  const takeAction = async (id, action) => {
    // Optimistic update so the tap feels instant.
    setDoses((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: action === "snooze" ? "snoozed" : action } : d
      )
    );
    if (action === "taken") await markDoseTaken(id);
    else if (action === "missed") await markDoseMissed(id);
    else if (action === "snooze") await snoozeDose(id);
    load();
  };

  return { doses, loading, refresh: load, takeAction };
}
