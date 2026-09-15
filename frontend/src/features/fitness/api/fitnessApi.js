import { supabase } from "../../../lib/supabaseClient";

/** Diet plans ------------------------------------------------------------ */

export async function saveDietPlan({
  patientId,
  ageGroup,
  gender,
  goal,
  dietaryPreference,
  plan,
  exerciseIds,
}) {
  return supabase
    .from("diet_plans")
    .insert({
      patient_id: patientId,
      age_group: ageGroup,
      gender,
      goal,
      dietary_preference: dietaryPreference,
      plan_json: plan,
      exercise_ids: exerciseIds,
    })
    .select()
    .single();
}

export async function listDietPlans(patientId, limit = 5) {
  return supabase
    .from("diet_plans")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

/** Exercise assignments ---------------------------------------------------- */

export async function assignExercises(
  patientId,
  exerciseIds,
  { ageGroup, assignedBy = "ai" } = {}
) {
  const rows = exerciseIds.map((exerciseId) => ({
    patient_id: patientId,
    exercise_id: exerciseId,
    age_group: ageGroup,
    assigned_by: assignedBy,
  }));
  return supabase
    .from("exercise_assignments")
    .upsert(rows, { onConflict: "patient_id,exercise_id,assigned_date" })
    .select();
}

export async function listTodayAssignments(patientId) {
  const today = new Date().toLocaleDateString("en-CA");
  return supabase
    .from("exercise_assignments")
    .select("*")
    .eq("patient_id", patientId)
    .eq("assigned_date", today);
}

/** Daily fitness logs (progress + streak source of truth) ------------------ */

export async function upsertTodayLog(patientId, { completedExerciseIds, dietFollowed, notes }) {
  const today = new Date().toLocaleDateString("en-CA");
  return supabase
    .from("fitness_logs")
    .upsert(
      {
        patient_id: patientId,
        log_date: today,
        completed_exercise_ids: completedExerciseIds,
        diet_followed: dietFollowed,
        notes: notes ?? null,
      },
      { onConflict: "patient_id,log_date" }
    )
    .select()
    .single();
}

/** Reads (or lazily creates) today's log row, then flips a single exercise
 * id in/out of `completed_exercise_ids` and saves it — this is what a
 * "Mark complete" button on an individual exercise card calls, as opposed
 * to the bulk "Save today's progress" flow on the Progress & Streak page. */
export async function toggleTodayExerciseCompletion(patientId, exerciseId) {
  const today = new Date().toLocaleDateString("en-CA");

  const { data: existing, error: fetchError } = await supabase
    .from("fitness_logs")
    .select("*")
    .eq("patient_id", patientId)
    .eq("log_date", today)
    .maybeSingle();
  if (fetchError) return { data: null, error: fetchError };

  const current = existing?.completed_exercise_ids ?? [];
  const nowCompleted = current.includes(exerciseId);
  const completedExerciseIds = nowCompleted
    ? current.filter((id) => id !== exerciseId)
    : [...current, exerciseId];

  const { data, error } = await supabase
    .from("fitness_logs")
    .upsert(
      {
        patient_id: patientId,
        log_date: today,
        completed_exercise_ids: completedExerciseIds,
        diet_followed: existing?.diet_followed ?? false,
        notes: existing?.notes ?? null,
      },
      { onConflict: "patient_id,log_date" }
    )
    .select()
    .single();

  return { data, error, completed: !nowCompleted };
}

export async function listRecentLogs(patientId, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return supabase
    .from("fitness_logs")
    .select("*")
    .eq("patient_id", patientId)
    .gte("log_date", since.toLocaleDateString("en-CA"))
    .order("log_date", { ascending: false });
}
