import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ patient: 0, caregiver: 0, admin: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("role")
      .then(({ data }) => {
        if (!data) return;
        const next = { patient: 0, caregiver: 0, admin: 0 };
        data.forEach((row) => {
          next[row.role] = (next[row.role] ?? 0) + 1;
        });
        setCounts(next);
      });

    supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecent(data ?? []));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Admin overview</h1>
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(counts).map(([role, count]) => (
          <div key={role} className="border rounded p-4 text-center">
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-sm text-gray-600 capitalize">{role}s</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="font-medium mb-2">Newest accounts</h2>
        <ul className="space-y-1">
          {recent.map((r) => (
            <li key={r.id} className="text-sm border-b py-1">
              {r.full_name} — {r.role}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
