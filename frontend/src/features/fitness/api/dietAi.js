import { EXERCISES } from "../data/exercisesLibrary";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-20b";
const EXERCISE_CATALOG = EXERCISES.map(({ id }) => id);

const SYSTEM_PROMPT = `You are PillSync's diet and exercise planning assistant. \
You design safe, general-wellness diet and exercise plans - you are not a doctor and \
must never contradict a user's actual medical advice. Only ever choose exercise ids \
from this exact list, never invent new ones: ${EXERCISE_CATALOG.join(", ")}. \
For age group "old", strongly prefer senior-friendly, low-impact exercises. \
Respond with ONLY minified JSON matching this shape, no prose, no markdown fences: \
{"calorieTarget":number,"summary":string,"meals":{"breakfast":string,"lunch":string,"dinner":string,"snacks":string},"hydrationTip":string,"cautions":string[],"exerciseIds":string[]} \
"cautions" should reflect any conditions provided (e.g. diabetes -> lower added sugar, hypertension -> lower sodium). \
"exerciseIds" should contain 3-6 ids appropriate for the age group and goal.`;

/**
 * Asks Groq's diet/exercise planner for a plan from the frontend environment.
 * The returned shape stays compatible with the Diet Planner page.
 */
export async function generateDietPlan({
  ageGroup,
  gender,
  goal,
  dietaryPreference,
  activityLevel,
  conditions,
}) {
  if (!GROQ_API_KEY) {
    throw new Error("VITE_GROQ_API_KEY is missing. Add it to frontend/.env and restart Vite.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            ageGroup,
            gender,
            goal,
            dietaryPreference,
            activityLevel,
            conditions: conditions ?? [],
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const rawPlan = data.choices?.[0]?.message?.content;
  if (!rawPlan) throw new Error("Groq returned an empty response.");

  const plan = JSON.parse(rawPlan);
  const exerciseIds = (Array.isArray(plan.exerciseIds) ? plan.exerciseIds : []).filter((id) =>
    EXERCISE_CATALOG.includes(id)
  );

  return { plan, exerciseIds };
}
