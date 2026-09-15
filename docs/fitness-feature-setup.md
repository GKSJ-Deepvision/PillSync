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

## 1. Configure the Groq key

Create or update `frontend/.env` with a rotated Groq key:

```
VITE_GROQ_API_KEY=your-new-rotated-key
VITE_GROQ_MODEL=openai/gpt-oss-20b
```

This key is intentionally used by the browser and is included in the frontend
bundle. Use a restricted, rate-limited key, never a service-role key, and rotate
it if it is exposed. Never commit `frontend/.env`.

## 2. Run the new database schema

Supabase Dashboard → SQL Editor → paste and run:

```
docs/database/schema_fitness.sql
```

This adds `diet_plans`, `exercise_assignments`, and `fitness_logs`, all with
Row Level Security matching the pattern already used for `profiles` (own
rows for patients, full read for admins via `is_admin()`, read-only for
linked caregivers via `caregiver_links`).

## 3. Frontend Groq response generation

The Diet Planner calls Groq directly from `frontend/src/features/fitness/api/dietAi.js`.
It sends the user's planner selections, requests JSON output, parses the returned
plan, filters exercise IDs against the local exercise library, and returns
`{ plan, exerciseIds }` to the page.

The previous `supabase/functions/diet-ai` proxy remains in the repository for
reference, but it is no longer used by the frontend.

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
