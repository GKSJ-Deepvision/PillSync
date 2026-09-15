import { useState } from "react";
import { CreateReminderForm } from "../features/reminders/components/CreateReminderForm";
import { IdentityBar } from "../features/reminders/components/IdentityBar";
import { ReminderCard } from "../features/reminders/components/ReminderCard";
import { useReminders } from "../features/reminders/hooks/useReminders";

export function RemindersPage() {
  const [identity, setIdentity] = useState({ userId: "", medicineId: "" });
  const { reminders, loading, error, refetch } = useReminders({
    userId: identity.userId,
    medicineId: identity.medicineId,
  });

  const hasIdentity = Boolean(identity.userId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">PillSync — Reminders</h1>
        <p className="text-sm text-slate-500">
          Milestone 2 demo: reminder scheduling + Taken / Missed / Snooze actions.
        </p>
      </header>

      <div className="mb-6">
        <IdentityBar onChange={setIdentity} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Reminders {hasIdentity && `(${reminders.length})`}
            </h2>
            {hasIdentity && (
              <button
                onClick={refetch}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Refresh
              </button>
            )}
          </div>

          {!hasIdentity && (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Enter a User ID above to see their reminders.
            </p>
          )}

          {hasIdentity && loading && <p className="text-sm text-slate-500">Loading…</p>}
          {hasIdentity && error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</p>
          )}
          {hasIdentity && !loading && !error && reminders.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              No reminders yet for this user{identity.medicineId ? " and medicine" : ""}. Create one →
            </p>
          )}

          <div className="space-y-3">
            {reminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} onChanged={refetch} />
            ))}
          </div>
        </section>

        <section>
          <CreateReminderForm
            userId={identity.userId}
            medicineId={identity.medicineId}
            onCreated={refetch}
          />
        </section>
      </div>
    </div>
  );
}
