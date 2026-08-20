> ## Stop — pull requests are not part of this workflow
>
> In the PillSync internship **nothing is merged into `main`**. Your branch is your
> submission: push to it, and the CI pipeline reviews it there.
>
> ```bash
> git checkout <intern/NN-your-name>
> git add .
> git commit -m "feat(reminders): add snooze handling"
> git push origin <intern/NN-your-name>
> ```
>
> Then open **Actions** and check the run on your branch.
>
> Close this pull request unless a mentor explicitly asked you to open it.
> If something on `main` needs changing — the skeleton, the roster, the pipeline —
> open an issue instead.
>
> Full workflow: [INTERN_GUIDE.md](../blob/main/INTERN_GUIDE.md)
