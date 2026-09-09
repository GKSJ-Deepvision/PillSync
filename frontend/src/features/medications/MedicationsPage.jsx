import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeftIcon, PillIcon, PlusIcon, categoryStyle } from "../../components/icons";

export default function MedicationsPage() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("medications")
      .select("*")
      .eq("patient_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false });
    setMedications(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const deactivate = async (id) => {
    await supabase.from("medications").update({ active: false }).eq("id", id);
    load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50">
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon /> Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="heading text-2xl font-bold text-gray-900">Your medicines</h1>
          <Link
            to="/medications/new"
            className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white pl-3 pr-4 py-2 rounded-full text-sm font-medium flex items-center gap-1.5 shadow-lg shadow-teal-200"
          >
            <PlusIcon /> Add medicine
          </Link>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {!loading && medications.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-teal-200 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center mx-auto mb-3">
              <PillIcon className="w-7 h-7" />
            </div>
            <p className="text-gray-700 font-medium">No medicines yet</p>
            <p className="text-sm text-gray-500 mt-1">Click "Add medicine" to get started.</p>
          </div>
        )}

        <ul className="space-y-3">
          {medications.map((m) => {
            const style = categoryStyle(m.disease_category);
            return (
              <li
                key={m.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-start"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.dot}`}>
                    <PillIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{m.name}</p>
                    <p className="text-sm text-gray-500">
                      {m.dosage} · {m.frequency_per_day}x/day
                      {m.reminder_times?.length > 0 &&
                        ` · ${m.reminder_times.map((t) => t.slice(0, 5)).join(", ")}`}
                    </p>
                    {m.disease_category && (
                      <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                        {m.disease_category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 text-sm shrink-0">
                  <Link to={`/medications/${m.id}/edit`} className="text-teal-600 font-medium">
                    Edit
                  </Link>
                  <button onClick={() => deactivate(m.id)} className="text-rose-500 font-medium">
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
