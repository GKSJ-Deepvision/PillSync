import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { useAuth } from "../../../context/AuthContext";
import { listRecentLogs, listTodayAssignments, upsertTodayLog } from "../api/fitnessApi";
import { getExerciseById } from "../data/exercisesLibrary";
import {
  buildHeatmap,
  currentFitnessStreak,
  longestFitnessStreak,
} from "../../../lib/fitnessStreak";

export default function ProgressStreakPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [dietFollowed, setDietFollowed] = useState(false);
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    if (!user) return;
    const [{ data: today }, { data: recent }] = await Promise.all([
      listTodayAssignments(user.id),
      listRecentLogs(user.id),
    ]);
    setAssignments(today ?? []);
    setLogs(recent ?? []);
    const todayKey = new Date().toLocaleDateString("en-CA");
    const todayLog = (recent ?? []).find((l) => l.log_date === todayKey);
    if (todayLog) {
      setCompleted(new Set(todayLog.completed_exercise_ids));
      setDietFollowed(!!todayLog.diet_followed);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const streak = useMemo(() => currentFitnessStreak(logs), [logs]);
  const longest = useMemo(() => longestFitnessStreak(logs), [logs]);
  const heatmap = useMemo(() => buildHeatmap(logs, 30), [logs]);

  function toggleExercise(id) {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await upsertTodayLog(user.id, {
      completedExerciseIds: [...completed],
      dietFollowed,
    });
    await refresh();
    setSaving(false);
  }

  return (
    <DashboardLayout eyebrow="Fitness" title="Progress & Streak">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <span className="badge bg-mint-soft text-mint-deep">Current streak</span>
          <p className="mt-3 font-display text-4xl font-semibold text-ink">
            {streak}{" "}
            <span className="text-lg font-normal text-ink-fog">day{streak === 1 ? "" : "s"}</span>
          </p>
        </div>
        <div className="card">
          <span className="badge bg-indigo-soft text-indigo-deep">Longest streak</span>
          <p className="mt-3 font-display text-4xl font-semibold text-ink">
            {longest}{" "}
            <span className="text-lg font-normal text-ink-fog">day{longest === 1 ? "" : "s"}</span>
          </p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-display text-base font-semibold text-ink">Last 30 days</h2>
        <div className="mt-3 grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(30,minmax(0,1fr))]">
          {heatmap.map((day) => (
            <div
              key={day.date}
              title={day.date}
              className="aspect-square rounded-[4px]"
              style={{ backgroundColor: day.active ? "var(--brand)" : "#EAEEF6" }}
            />
          ))}
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="font-display text-base font-semibold text-ink">Today's check-in</h2>
        {assignments.length === 0 ? (
          <p className="mt-3 font-body text-sm text-ink-fog">
            No exercises assigned yet — get a plan from the Diet Planner or add some from the
            Exercise Library.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {assignments.map((a) => {
              const ex = getExerciseById(a.exercise_id);
              if (!ex) return null;
              return (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-ink/5 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={completed.has(a.exercise_id)}
                    onChange={() => toggleExercise(a.exercise_id)}
                    className="h-4 w-4"
                  />
                  <span className="font-body text-sm text-ink">{ex.name}</span>
                </li>
              );
            })}
          </ul>
        )}

        <label className="mt-4 flex items-center gap-3 rounded-xl border border-ink/5 px-4 py-3">
          <input
            type="checkbox"
            checked={dietFollowed}
            onChange={(e) => setDietFollowed(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="font-body text-sm text-ink">I followed my diet plan today</span>
        </label>

        <button type="button" className="btn-brand mt-5" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save today's progress"}
        </button>
      </div>
    </DashboardLayout>
  );
}
