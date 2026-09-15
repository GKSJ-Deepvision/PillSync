import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { useAuth } from "../../../context/AuthContext";
import CharacterControls from "../components/CharacterControls";
import ExerciseCard from "../components/ExerciseCard";
import { CATEGORIES, EXERCISES } from "../data/exercisesLibrary";
import { listRecentLogs, toggleTodayExerciseCompletion } from "../api/fitnessApi";

export default function ExerciseLibraryPage() {
  const { profile, user } = useAuth();
  const [ageGroup, setAgeGroup] = useState("young");
  const [gender, setGender] = useState("male");
  const [completed, setCompleted] = useState(new Set());
  const [pendingId, setPendingId] = useState(null);

  const isPatient = profile?.role === "patient";

  useEffect(() => {
    if (!isPatient || !user) return;
    const todayKey = new Date().toLocaleDateString("en-CA");
    listRecentLogs(user.id, 1).then(({ data }) => {
      const todayLog = (data ?? []).find((l) => l.log_date === todayKey);
      setCompleted(new Set(todayLog?.completed_exercise_ids ?? []));
    });
  }, [isPatient, user]);

  async function handleToggleComplete(exerciseId) {
    if (!user) return;
    setPendingId(exerciseId);
    const { data, error } = await toggleTodayExerciseCompletion(user.id, exerciseId);
    if (!error && data) {
      setCompleted(new Set(data.completed_exercise_ids));
    }
    setPendingId(null);
  }

  const byCategory = useMemo(() => {
    const filtered = EXERCISES.filter((e) => e.ageGroups.includes(ageGroup));
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: filtered.filter((e) => e.category === cat.key),
    })).filter((cat) => cat.items.length > 0);
  }, [ageGroup]);

  return (
    <DashboardLayout eyebrow="Fitness" title="Exercise Library">
      <div className="card">
        <CharacterControls
          ageGroup={ageGroup}
          gender={gender}
          onAgeGroupChange={setAgeGroup}
          onGenderChange={setGender}
        />
        <p className="mt-4 font-body text-[13px] text-ink-fog">
          Every animation demonstrates full range of motion at a pace matched to the selected age
          group — slower and gentler for older adults, brisker for younger adults. Tap "How to do
          it" on any card for step-by-step instructions and the benefits of that move.
        </p>
      </div>

      {byCategory.map((cat) => (
        <section key={cat.key} className="mt-8">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">{cat.label}</h2>
            <span className="font-body text-[13px] text-ink-fog">{cat.blurb}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.items.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                ageGroup={ageGroup}
                gender={gender}
                completed={isPatient ? completed.has(ex.id) : undefined}
                onToggleComplete={isPatient ? handleToggleComplete : undefined}
                completing={pendingId === ex.id}
              />
            ))}
          </div>
        </section>
      ))}

      {profile?.role === "patient" && (
        <p className="mt-8 font-body text-[13px] text-ink-fog">
          Want a plan built for you automatically? Head to the{" "}
          <a href="/diet-planner" className="font-semibold text-ink underline">
            Diet Planner
          </a>{" "}
          to get an AI-generated diet plan with matching exercises for your age group.
        </p>
      )}
    </DashboardLayout>
  );
}
