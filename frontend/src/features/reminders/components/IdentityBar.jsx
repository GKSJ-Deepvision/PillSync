import { useEffect, useState } from "react";

const STORAGE_KEY = "pillsync.demo-identity";

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export function IdentityBar({ onChange }) {
  const stored = loadStored();
  const [userId, setUserId] = useState(stored.userId || "");
  const [medicineId, setMedicineId] = useState(stored.medicineId || "");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, medicineId }));
    onChange({ userId: userId.trim(), medicineId: medicineId.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, medicineId]);

  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
      <p className="mb-3 text-xs text-slate-500">
        No login yet (auth is still Milestone 1's not-started item) — paste the IDs of a
        seeded user and medicine to try the reminders API against real data. See{" "}
        <code className="rounded bg-slate-200 px-1">docs/milestones/milestone-2.md</code> for a
        seed snippet.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">User ID</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. 11111111-1111-1111-1111-111111111111"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Medicine ID</label>
          <input
            value={medicineId}
            onChange={(e) => setMedicineId(e.target.value)}
            placeholder="e.g. 22222222-2222-2222-2222-222222222222"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
          />
        </div>
      </div>
    </div>
  );
}
