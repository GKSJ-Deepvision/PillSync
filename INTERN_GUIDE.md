# PillSync — Intern Guide

**Read this before you write any code.** It is the complete set of instructions for
working in this repository: how to get your branch, how to commit, what the automated
pipeline checks on every push, what you must never commit, and what each milestone
must contain.

Project: **PillSync — Intelligent Medicine Reminder and Medication Tracking Platform**
Domain: **AI** · Cohort: **26 interns** · Duration: **8 weeks, 4 milestones**

---

## Contents

1. [The one rule that shapes everything](#1-the-one-rule-that-shapes-everything)
2. [Before you start](#2-before-you-start)
3. [Create your branch](#3-create-your-branch)
4. [Your daily workflow](#4-your-daily-workflow)
5. [What CI checks on every push](#5-what-ci-checks-on-every-push)
6. [Run the checks locally before you push](#6-run-the-checks-locally-before-you-push)
7. [Never commit these](#7-never-commit-these)
8. [Where your code goes](#8-where-your-code-goes)
9. [Commit messages](#9-commit-messages)
10. [Milestones and how to submit](#10-milestones-and-how-to-submit)
11. [Getting help](#11-getting-help)
12. [Fixing common CI failures](#12-fixing-common-ci-failures)
13. [Branch roster](#13-branch-roster)

---

## 1. The one rule that shapes everything

**Nothing is merged into `main`. Your branch is your submission.**

All 26 of you are building the same project independently. `main` holds only the
shared skeleton, the CI pipeline and this guide, and mentors maintain it. Your work
lives on your own branch from day one to day fifty-six, and it is reviewed there.

That means:

- **Do not open pull requests.** A pull request into `main` is automatically rejected,
  with a comment explaining why.
- **Do not push to `main`.** Ask a mentor if something on `main` genuinely needs fixing.
- **Do not merge anyone else's branch into yours.** Their work is their submission,
  yours is yours.
- **Push often.** Every push runs the pipeline and gives you feedback. A branch that
  is pushed once, in week eight, has had no feedback for eight weeks.

---

## 2. Before you start

**Accounts and access**

1. A GitHub account, with the email you gave the programme.
2. Accept the collaborator invitation to this repository.
3. Turn on two-factor authentication on GitHub.

**Tools to install**

| Tool | Version | Check with |
|---|---|---|
| Git | 2.40+ | `git --version` |
| Python | 3.11 | `python --version` |
| Node.js | 20 LTS | `node --version` |
| Docker Desktop | current | `docker --version` |
| PostgreSQL | 16 (or use Docker) | `psql --version` |
| Tesseract OCR | 5.x (needed from Milestone 3) | `tesseract --version` |

VS Code with the Python, Pylance, ESLint, Prettier and Tailwind extensions is the
recommended editor. The repository ships an `.editorconfig` that most editors pick
up automatically.

**Set your git identity** so your commits are attributed to you:

```bash
git config --global user.name "Your Full Name"
git config --global user.email "your-github-email@example.com"
```

**Read the specification.** [`docs/pillsync-project-specification.pdf`](docs/pillsync-project-specification.pdf)
is the source of truth for what you are building. Everything in this repository —
folder names, module boundaries, milestone checklists — maps back to it.

---

## 3. Create your branch

Find your branch name in the [roster](#13-branch-roster) below. Use it **exactly** —
CI rejects any branch it does not recognise, and a rejected branch means your work is
not attributed to you.

```bash
git clone https://github.com/GKSJ-Deepvision/PillSync.git
cd PillSync

# Replace with YOUR row from the roster.
git checkout -b intern/07-muthukumaran-k origin/main
git push -u origin intern/07-muthukumaran-k
```

Branching from `origin/main` matters: the CI workflows live on `main`, and GitHub only
runs the workflows that exist on the branch you push. Branch from anywhere else and
you get no pipeline at all.

Confirm it worked: open the **Actions** tab. You should see a `CI` run against your
branch, with a **Branch policy** job that names you.

---

## 4. Your daily workflow

```bash
# 1. Make sure you are on your own branch.
git branch --show-current

# 2. Write code. Run it. Test it.

# 3. Check it the way CI will (see section 6).
cd backend && ruff check . && black . && isort . && pytest && cd ..

# 4. Stage, commit, push.
git add .
git commit -m "feat(reminders): add snooze handling"
git push
```

Then open **Actions**, find your run, and read the summary. Fix anything it reports
before you move on — a red pipeline that stays red for a week is much harder to
untangle than one you fix the same day.

**Occasionally, pick up skeleton updates from `main`:**

```bash
git fetch origin
git merge origin/main       # only for changes mentors made to main
```

This is the one merge you are allowed to do, and it only ever brings shared
infrastructure into your branch — never another intern's work.

---

## 5. What CI checks on every push

Push to your branch and [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs
automatically. Jobs skip themselves when the code they cover does not exist yet, so in
week one you will see most of them marked `skipped` — that is expected, not a failure.

| Job | What it does | Fails when |
|---|---|---|
| **Branch policy** | Matches your branch against the roster and detects what is on it | The branch name is not in `.github/interns.yml` |
| **Repository checks** | File hygiene, secret scan, structure and progress, YAML/JSON syntax | A credential, a junk file, a deleted required folder, or malformed config |
| **Backend** | `ruff` · `black --check` · `isort --check-only` · `manage.py check` · `pytest` with coverage | Lint errors, unformatted code, or a failing test |
| **Frontend** | `npm run lint` · `format:check` · `test` · `build` | A lint error, a failing test, or a build that does not compile |
| **ML / OCR** | `ruff`, notebook output check, `pytest` | Lint errors, an unreadable notebook, or a failing test |
| **Docker** | Builds the backend and frontend images | An image does not build |
| **CI status** | One summary of everything above | Any job above failed |

**Warnings never fail the build.** Missing tests, a large file, a notebook with stored
outputs, coverage under 60% — these are reported so you can act on them, not to block
you. Errors do fail the build: secrets, committed junk, broken code.

**Where to read the results:** Actions → your run → the **Summary** page. Every job
writes a table there: which modules have code, which milestone reports are filled in,
your coverage number, and exactly which file and line any problem is on.

Two other pipelines exist:

- **CD (release readiness)** — you run this one manually from the Actions tab in
  Milestone 4. It re-checks the branch, builds both container images, and can publish
  them to the registry. It never deploys anywhere on your behalf.
- **Cohort report** — a weekly mentor-facing summary across all 26 branches.

---

## 6. Run the checks locally before you push

Ten seconds locally saves a red pipeline and a wasted push.

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements/dev.txt

black .                 # fixes formatting
isort .                 # fixes import order
ruff check . --fix      # fixes what it safely can
pytest                  # runs your tests
```

`black` and `isort` rewrite your files; `ruff check` and `pytest` only report. CI runs
the same tools with `--check`, so if these pass locally they pass in CI.

**Frontend**

```bash
cd frontend
npm install
npm run lint
npm test
npm run build
```

Define `lint`, `format:check`, `test` and `build` in your `package.json`. CI skips any
script you have not defined — and tells you which ones it skipped.

**Everything else** (the checks in the Repository checks job):

```bash
python .github/scripts/check_files.py
python .github/scripts/scan_secrets.py
python .github/scripts/check_structure.py
```

These need nothing installed beyond Python 3.11 and run in about a second.

---

## 7. Never commit these

PillSync is a healthcare application. Two categories of mistake here are not
recoverable by editing a file afterwards.

### Credentials

You will hold real API keys during this project — OpenAI, Firebase, Twilio, SendGrid.
**A key pushed to this repository is compromised the moment it lands**, whether or not
you delete it in the next commit: it stays in git history, and 26 other people plus
anyone with repository access can read it.

Instead:

```python
# Wrong — this is now public.
OPENAI_API_KEY = "sk-proj-abc123..."

# Right.
import os
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
```

Put the real value in `backend/.env` (already git-ignored) and add the *name* with an
empty value to `backend/.env.example` so everyone knows the variable exists.

The secret scanner blocks AWS, OpenAI, Google, Firebase, Twilio, SendGrid, GitHub,
Slack and Stripe keys, private key blocks, JWTs and database URLs with passwords.
If it flags something that genuinely is not a credential, add
`# pragma: allowlist secret` to that line and say why in your commit message.

**If you do push a key:** tell your mentor immediately and rotate it with the provider.
Do not try to quietly delete it — deleting does not remove it from history.

### Patient data

Never commit a real prescription, a real medicine photo belonging to an identifiable
person, or any file containing someone's medical details. Use synthetic samples or
public-domain images, and keep them small, in `ml/data/samples/`.

### Junk

These are rejected automatically:

| Do not commit | Why | Instead |
|---|---|---|
| `node_modules/` | Thousands of files, hundreds of MB | Commit `package.json` + `package-lock.json` |
| `.venv/`, `venv/` | Machine-specific, huge | Commit `requirements/*.txt` |
| `.env` | Contains your real secrets | Commit `.env.example` |
| `*.sqlite3`, `*.db` | Application data, not source | Commit migrations |
| `dist/`, `build/`, `htmlcov/` | Generated output | Let CI build it |
| `__pycache__/`, `*.pyc` | Generated bytecode | Nothing — it is ignored |
| Files over 20 MB | Bloats the repository permanently | Link to external storage |
| Notebooks with stored outputs | Bloat, and can embed prescription images | Clear All Outputs first |

The `.gitignore` on `main` already covers all of these. Do not remove entries from it.

---

## 8. Where your code goes

Keep the folder structure that is already on `main`. Twenty-six branches only stay
reviewable if they all have the same shape — and CI fails if a required folder is
missing.

| Spec module | Backend | Frontend |
|---|---|---|
| 1. Authentication & RBAC | `backend/apps/accounts/` | `frontend/src/features/auth/` |
| 2. Profiles & patients | `backend/apps/profiles/` | `frontend/src/features/profile/` |
| 2 & 7. Medicines, dosage, disease categories | `backend/apps/medications/` | `frontend/src/features/medications/` |
| 3. Prescriptions | `backend/apps/prescriptions/` | — |
| 3. OCR recognition | `backend/apps/ocr/` + `ml/src/ocr/` | `frontend/src/features/ocr/` |
| 4. Smart reminders | `backend/apps/reminders/` | `frontend/src/features/reminders/` |
| 5. Adherence tracking | `backend/apps/adherence/` | `frontend/src/features/adherence/` |
| 6. Refill prediction | `backend/apps/refills/` + `ml/src/refill_prediction/` | `frontend/src/features/refills/` |
| 8. Notifications & alerts | `backend/apps/notifications/` | `frontend/src/features/notifications/` |
| 9. Dashboard & analytics | `backend/apps/analytics/` | `frontend/src/features/analytics/` |

Every one of those folders has a `README.md` listing exactly what belongs in it and
which milestone it is graded in. Read it before you start that module.

Documentation goes in `docs/`: architecture diagrams in `architecture/`, ER diagram in
`database/`, endpoint reference in `api/`, wireframes in `wireframes/`, milestone
reports in `milestones/`, demo material in `demo/`.

You may add files and folders inside this structure. Do not rename or delete the
structure itself.

---

## 9. Commit messages

Use the format `type(scope): what changed`, in the imperative:

```
feat(refills): predict depletion date from dosage history
fix(reminders): stop snooze from skipping the next dose
test(adherence): cover the missed-dose percentage calculation
docs(milestones): fill in the milestone 2 report
chore(backend): pin pytest to 8.3.4
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`.
Scope: the module you touched — `accounts`, `medications`, `ocr`, `reminders`,
`adherence`, `refills`, `notifications`, `analytics`, `frontend`, `backend`.

Commit one logical change at a time. `git commit -m "update"` across forty files tells
a reviewer nothing, and tells *you* nothing when you need to find a regression in
week seven.

---

## 10. Milestones and how to submit

| Milestone | Weeks | What must work |
|---|---|---|
| **1** | 1–2 | Backend initialised · authentication (JWT, OAuth2, sessions, password management) · database schema finalised · frontend set up · role-based access for Patient/Caregiver/Admin · profile management · wireframes |
| **2** | 3–4 | Medicine management · dosage scheduling · reminder system with Taken/Missed/Snooze · medication history · notification workflows integrated |
| **3** | 5–6 | OCR extracting name, dosage, quantity, frequency · refill prediction engine · adherence tracking with percentages and trends · refill and low-stock notifications |
| **4** | 7–8 | Deployed frontend and backend · analytics dashboards · adherence and refill visualisations · testing and validation complete · end-to-end workflow demonstrated |

*Mentors: add the calendar deadline for each milestone here before the cohort starts.*

### How to submit a milestone

1. Push everything to your branch.
2. Confirm the CI run on your branch is **green**.
3. Fill in the report template for that milestone in
   [`docs/milestones/`](docs/milestones/) — replace every `<placeholder>`.
   CI reports a template you have not filled in as "template not filled in".
4. Commit the report and push again.
5. Open a **Milestone review request** issue (Issues → New issue → Milestone review
   request) and link your passing CI run.

### What a milestone review looks at

- Does it run? Can a reviewer follow your instructions and see it work?
- Do the evaluation criteria for that milestone actually function, end to end?
- Are there tests for what you built, and do they pass?
- Is the code readable — clear names, no dead code, no commented-out blocks?
- Is the milestone report honest? A report that claims something works when it does
  not is worse than one that says "not finished".

Partial work, described accurately, reviews better than complete-looking work that
falls over on the first click.

---

## 11. Getting help

**First, help yourself for fifteen minutes.** Read the failing CI job's log — it names
the file and line. Read the README in the folder you are working in. Re-read the
relevant section of the specification.

**Then ask.** Open an issue (Issues → New issue → **I am blocked**) with:

- your branch name,
- what you are trying to do,
- what you already tried and what happened,
- the exact error message or a link to the failing CI run.

Do not paste API keys into an issue. Redact them.

Asking a well-formed question after fifteen minutes is good practice. Staying stuck
for three days is not — being blocked is normal, staying silent about it is not.

---

## 12. Fixing common CI failures

**`Branch 'x' is not in the intern roster`**
Your branch name does not exactly match your roster row. Rename it:

```bash
git branch -m intern/NN-your-correct-name
git push origin -u intern/NN-your-correct-name
git push origin --delete <the-wrong-name>
```

**`Possible <provider> API key committed here`**
A credential is in a tracked file. Remove it, move it to `backend/.env`, read it via
`os.environ`, rotate the key with the provider, and tell your mentor.

**`would reformat <file>` (Black)**
Run `black .` inside `backend/` and commit the result.

**`Imports are incorrectly sorted`**
Run `isort .` inside `backend/` and commit the result.

**`ruff` errors like `F401 imported but unused`**
Run `ruff check . --fix`, then fix by hand whatever it could not fix safely.

**`No tests were collected`**
A warning, not a failure — but it means you have no tests. Add files named `test_*.py`
under `backend/tests/` or `backend/apps/<app>/tests/`.

**`<path> is inside node_modules/`**
You committed installed packages. Remove them from tracking:

```bash
git rm -r --cached frontend/node_modules
git commit -m "chore: stop tracking node_modules"
```

**`Required directory 'x' is missing`**
You deleted or renamed part of the skeleton. Restore it:

```bash
git checkout origin/main -- <path>
```

**Frontend job says a script is "not defined"**
Add `lint`, `format:check`, `test` and `build` to `frontend/package.json`. Until you
do, CI skips those checks.

**The Docker job never runs**
It only starts once there is an app to containerise — `backend/manage.py` (or
`backend/config/main.py`) for the backend, `frontend/package.json` for the frontend.

---

## 13. Branch roster

Use your row exactly. Branch names are lower case, and the number is zero-padded.

| # | Intern | Branch |
|---|---|---|
| 01 | Advala Indhu | `intern/01-advala-indhu` |
| 02 | Dharmana Rohila | `intern/02-dharmana-rohila` |
| 03 | Rajasri Nallamilli | `intern/03-rajasri-nallamilli` |
| 04 | Deepika Duggirala | `intern/04-deepika-duggirala` |
| 05 | Aryan Kumar | `intern/05-aryan-kumar` |
| 06 | Aarthi Gd | `intern/06-aarthi-gd` |
| 07 | Muthukumaran K | `intern/07-muthukumaran-k` |
| 08 | Pallavi Kocherla | `intern/08-pallavi-kocherla` |
| 09 | Jyoti Prangya Patra | `intern/09-jyoti-prangya-patra` |
| 10 | Naga Vaishnavi Padala | `intern/10-naga-vaishnavi-padala` |
| 11 | Jangam Keerthana | `intern/11-jangam-keerthana` |
| 12 | Dushyant Singh Sisodiya | `intern/12-dushyant-singh-sisodiya` |
| 13 | Sujata Behera | `intern/13-sujata-behera` |
| 14 | Karthika Shree S | `intern/14-karthika-shree-s` |
| 15 | Kaviya Sree Rs | `intern/15-kaviya-sree-rs` |
| 16 | Lachigalla Parvathi | `intern/16-lachigalla-parvathi` |
| 17 | Panyala Alekhya Reddy | `intern/17-panyala-alekhya-reddy` |
| 18 | Shivangi Sahu | `intern/18-shivangi-sahu` |
| 19 | Syed Muhammed S R | `intern/19-syed-muhammed-s-r` |
| 20 | Ruchitha Puru | `intern/20-ruchitha-puru` |
| 21 | Yogesh Yadavrao Pagar | `intern/21-yogesh-yadavrao-pagar` |
| 22 | Vemula Purna Vijaya Sai Phani Kumar | `intern/22-vemula-purna-vijaya-sai-phani-kumar` |
| 23 | Swathi S | `intern/23-swathi-s` |
| 24 | Nelakurthi Ashritha Gowthami | `intern/24-nelakurthi-ashritha-gowthami` |
| 25 | Muskan Kumari | `intern/25-muskan-kumari` |
| 26 | Thalla Sri Pradeep | `intern/26-thalla-sri-pradeep` |

If your name is spelled wrong, or you are not listed, open an issue — do not invent a
branch name.

---

## The short version

1. Branch from `origin/main`, using your exact roster name.
2. Never open a pull request. Never push to `main`.
3. Push small commits often; read the CI summary each time.
4. Run `black . && isort . && ruff check . && pytest` before every push.
5. Never commit secrets, patient data, `node_modules/`, `.venv/` or `.env`.
6. Keep the folder structure; put each module where the table says.
7. Fill in the milestone report and open a review request at each milestone.
8. When stuck for more than fifteen minutes, open a **blocked** issue.
