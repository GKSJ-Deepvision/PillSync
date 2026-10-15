import { EXERCISES } from "../data/exercisesLibrary";
import { supabase } from "../../../lib/supabaseClient";

const EXERCISE_CATALOG = EXERCISES.map(({ id }) => id);

export async function generateDietPlan({
  ageGroup,
  gender,
  goal,
  dietaryPreference,
  activityLevel,
  conditions,
}) {
  const { data, error } = await supabase.functions.invoke("diet-ai", {
    body: {
      ageGroup,
      gender,
      goal,
      dietaryPreference,
      activityLevel,
      conditions: conditions ?? [],
    },
  });

  if (error) throw new Error(`Diet plan service failed: ${error.message}`);
  if (!data?.plan) throw new Error("Diet plan service returned an empty response.");

  const exerciseIds = (Array.isArray(data.exerciseIds) ? data.exerciseIds : []).filter((id) =>
    EXERCISE_CATALOG.includes(id)
  );

  return { plan: data.plan, exerciseIds };
}
