import { useState } from "react";
import ExerciseFigure from "./ExerciseFigure3D";

export default function ExerciseCard({
  exercise,
  ageGroup,
  gender,
  onAssign,
  assigned,
  completed,
  onToggleComplete,
  completing,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="card flex flex-col items-center gap-3 text-center">
        {exercise.seniorFriendly && (
          <span className="badge self-start bg-mint-soft text-mint-deep">Senior-friendly</span>
        )}
        <ExerciseFigure exerciseId={exercise.id} ageGroup={ageGroup} gender={gender} size={120} />
        <h3 className="font-display text-sm font-semibold text-ink">{exercise.name}</h3>
        <p className="font-body text-[13px] text-ink-fog">{exercise.description}</p>
        <div className="mt-1 flex w-full gap-2">
          <button
            type="button"
            className="btn-secondary flex-1 !py-2 !text-[13px]"
            onClick={() => setOpen(true)}
          >
            How to do it
          </button>
          {onAssign && (
            <button
              type="button"
              className="btn-brand flex-1 !py-2 !text-[13px]"
              onClick={() => onAssign(exercise.id)}
              disabled={assigned}
            >
              {assigned ? "Added" : "Add to plan"}
            </button>
          )}
        </div>
        {onToggleComplete && (
          <button
            type="button"
            onClick={() => onToggleComplete(exercise.id)}
            disabled={completing}
            className={`w-full rounded-full !py-2 !text-[13px] font-body font-semibold transition ${
              completed
                ? "bg-mint-soft text-mint-deep"
                : "border border-ink/10 text-ink-fog hover:bg-porcelain-dim"
            }`}
          >
            {completing ? "Saving…" : completed ? "✓ Completed today" : "Mark complete"}
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="badge bg-indigo-soft text-indigo-deep">{exercise.category}</span>
                <h2 className="mt-2 font-display text-xl font-semibold text-ink">
                  {exercise.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-ink-fog hover:bg-porcelain-dim"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex justify-center">
              <ExerciseFigure
                exerciseId={exercise.id}
                ageGroup={ageGroup}
                gender={gender}
                size={180}
              />
            </div>

            <p className="mt-3 font-body text-sm text-ink-fog">Equipment: {exercise.equipment}</p>

            <h3 className="mt-5 font-display text-sm font-semibold text-ink">How to do it</h3>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 font-body text-sm text-ink">
              {exercise.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>

            <h3 className="mt-5 font-display text-sm font-semibold text-ink">Why it helps</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 font-body text-sm text-ink">
              {exercise.benefits.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>

            {onAssign && (
              <button
                type="button"
                className="btn-brand mt-6 w-full"
                onClick={() => {
                  onAssign(exercise.id);
                  setOpen(false);
                }}
                disabled={assigned}
              >
                {assigned ? "Already in today's plan" : "Add to today's plan"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
