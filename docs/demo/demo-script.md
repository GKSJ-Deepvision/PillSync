# Demo script

**Milestone 4 deliverable — end-to-end medication workflow, demonstrated.**

About ten minutes. It follows one patient from a photograph of a prescription to a
refill reminder reaching her daughter, then shows what a caregiver and an
administrator see. Everything runs locally on seeded, invented data — no real
patient information anywhere.

## Set up (two minutes, once)

```bash
# Terminal 1 - the API with a month of demo history (own database, port 8010)
python backend/scripts/run_demo.py

# Terminal 2 - the app, pointed at that API
cd frontend && npm run dev:demo        # http://localhost:5173
```

`run_demo.py` creates `demo.sqlite3` (git-ignored), migrates, loads the medicine
catalogue and seeds four accounts. Sign in with any of them; the password for all
four is `demo-pillsync-2026` (printed the first time the data is seeded; it is for this local demo
only — `seed_demo` refuses to run with `DEBUG` off).

| Account | Who | What they show |
|---|---|---|
| `asha.rao@pillsync.example` | Patient | Steady but forgets the evening statin; one medicine about to run out |
| `ravi.kumar@pillsync.example` | Patient | Struggling: about two-thirds adherence, low stock |
| `meera.rao@pillsync.example` | Caregiver | Looks after both |
| `admin.demo@pillsync.example` | Administrator | Platform analytics |

To start again from a clean slate: `python backend/scripts/run_demo.py --fresh`.

**Tesseract note.** Photo scanning needs the Tesseract program (it is in the backend
Docker image). Without it, the *Type or paste* tab does everything the photo path
does after the reading step, and the demo below uses it so it works on any laptop.

## The story

### 1. Sign in as Asha — the dashboard (1 min)
*Screenshot: [`01-dashboard.jpg`](screenshots/01-dashboard.jpg)*

- Point out today's doses, the current streak, and **"Refills needing attention: 1"**.
- The 30-day chart: green taken, red missed. "Look at the pattern — the misses are not
  random."
- Scroll to *Running low*: Amlong, about 4 days.

**Say:** everything here is computed from the same rows that drove her reminders.

### 2. Scan a prescription (3 min)
*Screenshot: [`04-scan-review.jpg`](screenshots/04-scan-review.jpg)*

Sidebar → **Scan a prescription** → *Type or paste* tab. Paste:

```
Dr. Meera Iyer
City Care Clinic
Date: 12/03/2026
Rx
1. Tab Metformn 500 mg 1-0-1 x 30 days
2. Tab Paracetamol 650 mg SOS
3. Tab Amlodipine 5 mg 0-0-1 x 30 days
```

Click **Find the medicines**. Talking points, in order:

- Three medicines and the doctor and date were found. "Nothing is added until she
  presses the button at the bottom."
- **"Metformn" — a typo — was matched to Metformin and corrected.** Show the
  *Matched:* badge and the "Read as:" line with the original.
- **Paracetamol matched to Acetaminophen** (its US name) but stays "Paracetamol" on
  her list — the name she recognises.
- **SOS was understood as "only when needed"**, so no reminders are scheduled.
- The yellow notes are the app **showing its assumptions**: "Quantity worked out as
  60 (2 on each of 30 dosing days), not printed on the page."
- "Add to my medicines" is **greyed out** — Paracetamol needs a unit count. Type `20`
  into *Units you have* for it, click *Save changes*, and the button enables.
- Edit one field (change Amlodipine's course to 14 days), and note the button
  disables again until saved: "unsaved edits can't be added by accident."
- Click **Add to my medicines**.

**If you have Tesseract:** use *Take a photo / Choose an image file* with any
prescription-like image. Then say what is on the slide: rendered text reads at 100%,
a page tilted a few degrees stays high, a badly degraded page finds few medicines —
*and the app then only suggests, never applies, matches.*

### 3. Refills (2 min)
*Screenshot: [`02-refills.jpg`](screenshots/02-refills.jpg)*

Sidebar → **Refills**. Open **Amlong**.

- "Your Amlong is expected to finish in 4 days" — the message the specification asks for.
- The chart: stock falling to zero, with **Refill by** and **Runs out** marked.
- "Uses per day: 1 (scheduled 1)", "High confidence — learned from 14 recorded doses":
  the forecast blends the prescribed schedule with what she actually took.
- Click **I collected a refill (+60)**. The status turns green and the warning clears.

**Say:** the accuracy of this is measured, and the honest number is on the next screen.

### 4. Adherence (1 min)
*Screenshot: [`03-adherence.jpg`](screenshots/03-adherence.jpg)*

Sidebar → **Adherence**.

- Rings: 87% overall, 100% on time. Streak, perfect days, trend "Improving".
- Scroll to *What the pattern says*: **"Most misses happen at night."** Show the
  time-of-day bars. "This is what she can take to her doctor."
- Bottom: **Download as CSV**.

### 5. The caregiver (1 min)
*Screenshot: [`05-caregiver-monitoring.jpg`](screenshots/05-caregiver-monitoring.jpg)*

Sign out; sign in as **Meera**.

- *People I look after* ranks patients by who needs a call first, **with the reasons**
  ("Adherence is 67% this week"; "A refill is due soon").
- "She does not open six dashboards; she is told who to phone."

### 6. The administrator (1 min)
*Screenshot: [`06-admin-analytics.jpg`](screenshots/06-admin-analytics.jpg)*

Sign in as **admin.demo**. **Platform analytics**: users, usage, reminder delivery,
scanning volume and success, refill status, forecast accuracy, and API latency
percentiles at the bottom.

## What to say about the limits (30 seconds — do not skip)

- It runs and is tested in the production topology, but **is not deployed to a live
  server**; that needs a hosting account.
- **Reminders reach the console, not a phone**, until push/SMS/email credentials are
  set — the delivery pipeline is tested, actual delivery is not.
- **Accuracy figures are from synthetic prescriptions and simulated patients**; they
  show the methods work, not what real users would see.
- **Handwriting is not supported.**
- It **reminds and tracks; it does not check drug interactions** and is not a medical device.

## If something goes wrong

| Symptom | Fix |
|---|---|
| Blank page or "Could not reach the server" | Is `run_demo.py` still running? The app proxies to port 8010 |
| Sign-in fails | Use `--fresh` and the password above |
| "Tesseract is not installed" on a photo | Use the *Type or paste* tab, or run the backend from Docker |
| Dashboard shows nothing for today | The demo seeds doses from today; run `--fresh` after midnight |

## Recording it

The steps above were run end to end against the seeded data and the screenshots in
[`screenshots/`](screenshots) are from that run. No video was recorded; screen-recording
the sequence takes about ten minutes and this script is the narration.
