// Supabase Edge Function (Deno runtime): "diet-ai"
//
// Generates an AI diet plan + a list of assigned exercise IDs using Groq's
// chat completions API. The Groq API key is read from an environment
// secret set with `supabase secrets set GROQ_API_KEY=...` — it never
// reaches the browser. Deploy with:
//
//   supabase functions deploy diet-ai
//   supabase secrets set GROQ_API_KEY=your-new-rotated-key
//
// The frontend calls this via supabase.functions.invoke("diet-ai", {...})
// (see src/features/fitness/api/dietAi.js), which automatically attaches
// the signed-in user's JWT — we use that to identify the caller instead of
// trusting a patientId in the request body.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_MODEL = "openai/gpt-oss-20b";

// Keep this in sync with frontend/src/features/fitness/data/exercisesLibrary.js
// so the AI can only ever assign exercises that actually exist and have an
// animation.
const EXERCISE_CATALOG = [
  "brisk_walk", "jumping_jacks", "squats", "lunges", "push_ups", "plank_hold",
  "wall_pushups", "chair_stand_sit", "seated_marching",
  "standing_hamstring_stretch", "cat_cow_stretch", "neck_shoulder_stretch",
  "tree_pose_balance", "single_leg_stand",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!GROQ_API_KEY) {
      return json({ error: "GROQ_API_KEY secret is not set on this Edge Function." }, 500);
    }

    // Verify the caller is a signed-in PillSync user (defense in depth —
    // RLS on the tables the client writes to enforces this too).
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !userData?.user) {
      return json({ error: "Not authenticated." }, 401);
    }

    const { ageGroup, gender, goal, dietaryPreference, activityLevel, conditions } = await req.json();

    if (!["young", "middle", "old"].includes(ageGroup)) {
      return json({ error: "ageGroup must be young, middle, or old." }, 400);
    }

    const systemPrompt = `You are PillSync's diet and exercise planning assistant. \
You design safe, general-wellness diet and exercise plans — you are not a doctor and \
must never contradict a user's actual medical advice. Only ever choose exercise ids \
from this exact list, never invent new ones: ${EXERCISE_CATALOG.join(", ")}. \
For age group "old", strongly prefer senior-friendly, low-impact exercises. \
Respond with ONLY minified JSON matching this shape, no prose, no markdown fences: \
{"calorieTarget":number,"summary":string,"meals":{"breakfast":string,"lunch":string,"dinner":string,"snacks":string},"hydrationTip":string,"cautions":string[],"exerciseIds":string[]} \
"cautions" should reflect any conditions provided (e.g. diabetes -> lower added sugar, hypertension -> lower sodium). \
"exerciseIds" should contain 3-6 ids appropriate for the age group and goal.`;

    const userPrompt = JSON.stringify({
      ageGroup,
      gender,
      goal,
      dietaryPreference,
      activityLevel,
      conditions: conditions ?? [],
    });

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!groqResponse.ok) {
      const text = await groqResponse.text();
      return json({ error: `Groq request failed: ${text}` }, 502);
    }

    const groqData = await groqResponse.json();
    const raw = groqData.choices?.[0]?.message?.content ?? "{}";
    const plan = JSON.parse(raw);

    // Defense in depth: strip any exercise id the model hallucinated outside
    // the catalog before it ever reaches the client or the database.
    const exerciseIds = (plan.exerciseIds ?? []).filter((id: string) => EXERCISE_CATALOG.includes(id));

    return json({ plan, exerciseIds });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
