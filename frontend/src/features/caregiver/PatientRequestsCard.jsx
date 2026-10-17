import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function PatientRequestsCard({ onChange }) {
  const [requests, setRequests] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    supabase.rpc("my_patient_requests").then(({ data, error }) => {
      if (active && !error) setRequests(data ?? []);
    });
    return () => {
      active = false;
    };
  }, []);

  const respond = async (id, accept) => {
    setBusyId(id);
    setMessage("");
    const { error } = await supabase.rpc("respond_caregiver_link", {
      p_link_id: id,
      p_accept: accept,
    });
    if (error) {
      setMessage(error.message || "Could not update the request.");
    } else {
      setRequests((list) => list.filter((r) => r.request_id !== id));
      setMessage(accept ? "Patient linked." : "Request declined.");
      if (onChange) onChange();
    }
    setBusyId(null);
  };

  if (requests.length === 0 && !message) return null;

  return (
    <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50 p-5">
      <h2 className="text-base font-semibold text-slate-900">
        Requests from patients
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Accept to see the patient's medicines and adherence.
      </p>

      <ul className="mt-4 space-y-3">
        {requests.map((r) => (
          <li
            key={r.request_id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold text-slate-900">
                {r.patient_name || "A patient"}
              </p>
              <p className="text-xs text-slate-500">
                Requested {new Date(r.requested_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === r.request_id}
                onClick={() => respond(r.request_id, true)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                Accept
              </button>
              <button
                type="button"
                disabled={busyId === r.request_id}
                onClick={() => respond(r.request_id, false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>

      {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
    </div>
  );
}