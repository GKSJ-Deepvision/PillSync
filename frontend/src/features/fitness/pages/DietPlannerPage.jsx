import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { useAuth } from "../../../context/AuthContext";
import CharacterControls from "../components/CharacterControls";
import ExerciseCard from "../components/ExerciseCard";
import ExerciseFigure from "../components/ExerciseFigure3D";
import { generateDietPlan } from "../api/dietAi";
import { assignExercises, listDietPlans, saveDietPlan } from "../api/fitnessApi";
import { CATEGORIES, EXERCISES, getExerciseById } from "../data/exercisesLibrary";

const GOALS = ["General health", "Weight loss", "Muscle gain", "Diabetic-friendly", "Heart-healthy"];
const DIETS = ["No preference", "Vegetarian", "Vegan", "Eggetarian", "Non-vegetarian"];
const ACTIVITY = ["Sedentary", "Lightly active", "Active", "Very active"];

export default function DietPlannerPage() {
  const { user, profile } = useAuth();
  const [ageGroup, setAgeGroup] = useState("young");
  const [gender, setGender] = useState("male");
  const [goal, setGoal] = useState(GOALS[0]);
  const [diet, setDiet] = useState(DIETS[0]);
  const [activity, setActivity] = useState(ACTIVITY[1]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [showExercises, setShowExercises] = useState(false);

  useEffect(() => {
    if (!user) return;
    listDietPlans(user.id).then(({ data, error: historyError }) => {
      if (!historyError) setHistory(data ?? []);
    });
  }, [user]);

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const data = await generateDietPlan({
        ageGroup,
        gender,
        goal,
        dietaryPreference: diet,
        activityLevel: activity,
        conditions: profile?.conditions ?? [],
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Couldn't generate a plan right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result || !user) return;
    setError(null);
    const { error: saveError } = await saveDietPlan({
        patientId: user.id,
        ageGroup,
        gender,
        goal,
        dietaryPreference: diet,
        plan: result.plan,
        exerciseIds: result.exerciseIds,
      });
    if (saveError) {
      setError(saveError.message || "Couldn't save this plan.");
      return;
    }

    const { error: exerciseError } = await assignExercises(user.id, result.exerciseIds, { ageGroup });
    if (exerciseError) {
      setError(exerciseError.message || "The diet plan was saved, but exercises could not be assigned.");
      return;
    }

    setSaved(true);
    const { data } = await listDietPlans(user.id);
    setHistory(data ?? []);
  }

  function openSavedPlan(plan) {
    setResult({
      plan: plan.plan_json ?? {},
      exerciseIds: plan.exercise_ids ?? [],
    });
    setAgeGroup(plan.age_group ?? "young");
    setGender(plan.gender ?? "male");
    setGoal(plan.goal ?? GOALS[0]);
    setDiet(plan.dietary_preference ?? DIETS[0]);
    setSaved(true);
    setError(null);
  }

  return (
    <DashboardLayout eyebrow="Fitness" title="AI Diet Planner">
      <form onSubmit={handleGenerate} className="card space-y-5">
        <CharacterControls
          ageGroup={ageGroup}
          gender={gender}
          onAgeGroupChange={setAgeGroup}
          onGenderChange={setGender}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="goal">Goal</label>
            <select id="goal" className="field-input" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOALS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="diet">Dietary preference</label>
            <select id="diet" className="field-input" value={diet} onChange={(e) => setDiet(e.target.value)}>
              {DIETS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="activity">Activity level</label>
            <select id="activity" className="field-input" value={activity} onChange={(e) => setActivity(e.target.value)}>
              {ACTIVITY.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" className="btn-brand" disabled={loading}>
          {loading ? "Generating…" : "Generate my plan"}
        </button>
        {error && <p className="font-body text-[13px] text-rose-deep">{error}</p>}
      </form>

      {result && (
        <div className="card mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Your plan</h2>
            <span className="badge bg-indigo-soft text-indigo-deep">
              ~{result.plan.calorieTarget} kcal/day
            </span>
          </div>
          <p className="mt-2 font-body text-sm text-ink-fog">{result.plan.summary}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(result.plan.meals ?? {}).map(([slot, text]) => (
              <div key={slot} className="rounded-xl border border-ink/5 bg-porcelain p-4">
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">{slot}</p>
                <p className="mt-1 font-body text-sm text-ink">{text}</p>
              </div>
            ))}
          </div>

          {result.plan.hydrationTip && (
            <p className="mt-4 font-body text-[13px] text-ink-fog">💧 {result.plan.hydrationTip}</p>
          )}

          {result.plan.cautions?.length > 0 && (
            <div className="mt-4 rounded-xl bg-rose-soft p-4">
              <p className="font-body text-[13px] font-semibold text-rose-deep">Cautions</p>
              <ul className="mt-1 list-disc pl-5 font-body text-[13px] text-rose-deep">
                {result.plan.cautions.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          <h3 className="mt-6 font-display text-sm font-semibold text-ink">Assigned exercises</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {result.exerciseIds.map((id) => {
              const ex = getExerciseById(id);
              if (!ex) return null;
              return (
                <div key={id} className="flex flex-col items-center gap-1 rounded-xl border border-ink/5 p-3 text-center">
                  <ExerciseFigure exerciseId={id} ageGroup={ageGroup} gender={gender} size={90} showGround={false} />
                  <p className="font-body text-[12px] font-medium text-ink">{ex.name}</p>
                </div>
              );
            })}
          </div>

          <button type="button" className="btn-primary mt-6" onClick={handleSave} disabled={saved}>
            {saved ? "Saved to your plan ✓" : "Save this plan"}
          </button>
          <p className="mt-2 font-body text-[12px] text-ink-fog">
            This is a general-wellness suggestion, not medical advice — check with your
            doctor before making major diet changes, especially with existing conditions.
          </p>
        </div>
      )}

      <button
        type="button"
        className="btn-secondary mt-6"
        onClick={() => setShowExercises((visible) => !visible)}
      >
        {showExercises ? "Hide all exercises" : "View all exercises"}
      </button>

      {showExercises && (
        <section className="mt-6" aria-label="Exercise library">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-ink">Exercise library</h2>
            <p className="mt-1 font-body text-sm text-ink-fog">
              Browse every exercise and open any card for detailed instructions.
            </p>
          </div>
          {CATEGORIES.map((category) => {
            const exercises = EXERCISES.filter((exercise) => exercise.category === category.key);
            return (
              <div key={category.key} className="mb-8">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-ink">{category.label}</h3>
                  <span className="font-body text-[13px] text-ink-fog">{category.blurb}</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {exercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      ageGroup={ageGroup}
                      gender={gender}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {history.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-display text-base font-semibold text-ink">Past plans</h2>
          <ul className="mt-3 divide-y divide-ink/5">
            {history.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="font-body text-sm text-ink">
                    {p.goal} · {p.age_group} · {new Date(p.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-1 font-body text-[12px] text-ink-fog">
                    {p.exercise_ids?.length ?? 0} exercises assigned
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase text-ink-fog">
                    {p.plan_json?.calorieTarget} kcal
                  </span>
                  <button type="button" className="btn-secondary text-xs" onClick={() => openSavedPlan(p)}>
                    View plan
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardLayout>
  );
}
