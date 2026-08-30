# Mentor setup checklist

The pipeline enforces everything it can from inside the repository. A few things can
only be set in GitHub's settings — do these once, before the cohort starts.

## 1. Protect `main`

Settings → Branches → Add branch ruleset (or classic branch protection) for `main`:

- [ ] Restrict deletions
- [ ] Block force pushes
- [ ] Restrict updates — allow only the mentor team to push
- [ ] Require a pull request before merging: **off** is fine, since nobody merges;
      the `Branch guard` workflow rejects any pull request that is opened anyway

Without this, an intern who runs `git push origin main` by accident rewrites the
shared skeleton for all 26 branches.

## 2. Add the interns as collaborators

Settings → Collaborators and teams. Give **Write** access — they need to push their
own branches. Write access also lets them push to `main`, which is exactly why step 1
matters.

## 3. Check Actions permissions

Settings → Actions → General:

- [ ] Allow all actions and reusable workflows (the pipeline uses `actions/*` and
      `docker/*` actions)
- [ ] Workflow permissions: **Read repository contents** — the workflows request the
      extra scopes they need per job
- [ ] Allow GitHub Actions to create and approve pull requests: **off**

If this is a private repository, watch the Actions minutes: 26 interns pushing several
times a day will consume them. The pipeline already cancels superseded runs on the same
branch, and skips jobs for areas with no code yet.

## 4. Confirm the roster

[`.github/interns.yml`](../.github/interns.yml) is the source of truth for branch
names, and [INTERN_GUIDE.md](../INTERN_GUIDE.md) repeats it as a table. If you correct
a name, change it in both places — CI rejects any branch not in the roster file.

## 5. Fill in the milestone dates

[INTERN_GUIDE.md § 10](../INTERN_GUIDE.md#10-milestones-and-how-to-submit) has a
placeholder line for calendar deadlines. Replace it with the real dates.

## 6. Watch the cohort

Actions → **Cohort report** → Run workflow (it also runs itself every Monday at
04:00 UTC). The run summary lists every intern's branch, how many commits they are
ahead of `main`, their last CI result, and how long since their last push — with
call-outs for branches that do not exist yet, are failing, or have gone quiet for a
week.

## 7. Reviewing a milestone

Interns open a **Milestone review request** issue with a link to a passing CI run.
To review, check out their branch read-only:

```bash
git fetch origin
git checkout intern/NN-firstname-lastname
```

The CI run summary for that branch already tells you which modules have code, which
have tests, the coverage number, and whether the milestone report was filled in.
