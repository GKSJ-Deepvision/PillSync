import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, phone, date_of_birth, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load users:", error);
        setError(error.message);
      } else {
        setUsers(data ?? []);
      }

      setLoading(false);
    };

    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (filter === "all") return users;
    return users.filter((user) => user.role === filter);
  }, [users, filter]);

  const roleCounts = {
    all: users.length,
    patient: users.filter((user) => user.role === "patient").length,
    caregiver: users.filter((user) => user.role === "caregiver").length,
    admin: users.filter((user) => user.role === "admin").length,
  };

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-sky-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
            Users
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View registered PillSync user profiles.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["all", "All Users"],
            ["patient", "Patients"],
            ["caregiver", "Caregivers"],
            ["admin", "Admins"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-xl border p-4 text-left transition ${
                filter === value
                  ? "border-sky-300 bg-sky-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p className="text-sm font-medium text-slate-500">
                {label}
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? "—" : roleCounts[value]}
              </p>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-900">
              Registered Users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filter === "all"
                ? "All registered profiles"
                : `Showing ${filter} accounts`}
            </p>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Name
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Phone
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date of Birth
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Joined
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {user.full_name || "Unnamed user"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {user.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : user.role === "caregiver"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {user.role || "unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {user.phone || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {user.date_of_birth || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {user.created_at
                          ? new Date(
                              user.created_at
                            ).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          This page is read-only. No user profiles are modified.
        </div>
      </div>
    </div>
  );
}
