# Fitness module — setup guide

Adds three new patient-facing pages plus admin visibility:

| Page | Route | What it does |
|---|---|---|
| Diet Planner | `/diet-planner` | Form → Groq-generated diet + exercise plan → saved to Supabase |
| Exercise Library | `/exercises` | 14 exercises across Cardio / Strength / Flexibility / Balance, each with an animated stick-figure demo, filterable by age group + male/female character |
| Progress & Streak | `/progress` | Daily check-in, current/longest streak, 30-day heatmap |

Admin dashboard (`/dashboard` as an admin) now also shows live counts of diet
plans / assignments / check-ins, plus a clearly-labeled **demo-data**
leaderboard and activity feed you can swap for real queries later.

## 1. Configure the Groq key securely

The Groq key must not be stored in `frontend/.env`, a Render static-site
variable, or any `VITE_` variable: frontend variables are included in public
browser code. Set `GROQ_API_KEY` as a secret for the Supabase `diet-ai` Edge
Function. In the Supabase Dashboard, open **Edge Functions → Secrets** and
add the secret there.

If using the Supabase CLI, deploy the function and set the secret for the
project:

```sh
supabase functions deploy diet-ai --project-ref tsmpeiazzersgqwyjntw
supabase secrets set --project-ref tsmpeiazzersgqwyjntw GROQ_API_KEY=<new-rotated-key>
```

If a Groq key was previously placed in a frontend environment variable or
shared publicly, revoke it at Groq and create a replacement before setting the
Edge Function secret.

## 2. Run the new database schema

Supabase Dashboard → SQL Editor → paste and run:

```
docs/database/schema_fitness.sql
```

This adds `diet_plans`, `exercise_assignments`, and `fitness_logs`, all with
Row Level Security matching the pattern already used for `profiles` (own
rows for patients, full read for admins via `is_admin()`, read-only for
linked caregivers via `caregiver_links`).

## 3. Frontend AI response generation

The Diet Planner calls the authenticated `diet-ai` Supabase Edge Function from
`frontend/src/features/fitness/api/dietAi.js`. The function verifies the
signed-in user's JWT, calls Groq using the server-side `GROQ_API_KEY` secret,
and filters exercise IDs against the permitted exercise list. The key never
reaches the browser.

## 4. Frontend

Nothing new to install — it reuses the existing `@supabase/supabase-js`
dependency. New nav items ("Diet Planner", "Exercises", "Progress") were
added to the patient sidebar in `DashboardLayout.jsx`.

## Notes

- The exercise "animations" are hand-built animated SVG stick figures (no
  video/image assets), themed by age group (fixed color palette per age —
  young/middle/old always look the same regardless of the app's own theme
  switcher) and by a male/female silhouette toggle. See
  `frontend/src/features/fitness/lib/exercisePoses.js` to add more exercises
  or adjust an existing motion.
- This is general-wellness content, not medical advice — the Diet Planner
  UI and the AI system prompt both say so, and cautions are generated from
  the patient's existing `profiles.conditions` field.
