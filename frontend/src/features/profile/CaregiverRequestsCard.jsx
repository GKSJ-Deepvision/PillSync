import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";

async function fetchSentCount(userId) {
  const { count } = await supabase
    .from("caregiver_links")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", userId)
    .eq("status", "pending")
    .eq("requested_by", userId);
  return count ?? 0;
}

export default function CaregiverRequestsCard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [sentCount, setSentCount] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [caregiverEmail, setCaregiverEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [addIsError, setAddIsError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase.rpc("my_caregiver_requests").then(({ data, error }) => {
      if (active && !error) setRequests(data ?? []);
    });
    fetchSentCount(user.id).then((n) => {
      if (active) setSentCount(n);
    });
    return () => {
      active = false;
    };
  }, [user]);

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
      setMessage(
        accept
          ? "Caregiver linked. They can now see your medicines and adherence."
          : "Request declined."
      );
    }
    setBusyId(null);
  };

  const handleAddCaregiver = async (event) => {
    event.preventDefault();
    setAdding(true);
    setAddMessage("");
    setAddIsError(false);

    const { error } = await supabase.rpc("patient_request_caregiver", {
      p_caregiver_email: caregiverEmail.trim(),
    });

    if (error) {
      setAddIsError(true);
      setAddMessage(error.message || "Could not send the request.");
    } else {
      setAddMessage(
        "Request sent. If a caregiver account exists for that email, they can accept it from their My Patients page."
      );
      setCaregiverEmail("");
      setSentCount(await fetchSentCount(user.id));
    }
    setAdding(false);
  };

  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-6">
      <h3 className="font-bold text-slate-900">Your caregivers</h3>
      <p className="mt-1 text-sm text-slate-600">
        A caregiver can see your medicines and adherence only after you both agree.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setShowAdd((v) => !v);
            setAddMessage("");
          }}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
        >
          + Add caregiver
        </button>
        {sentCount > 0 && (
          <span className="text-sm text-slate-500">
            {sentCount} request{sentCount === 1 ? "" : "s"} waiting for the caregiver
          </span>
        )}
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddCaregiver}
          className="mt-4 rounded-xl border border-slate-200 bg-white p-4"
        >
          <p className="text-sm text-slate-600">
            Enter the email the caregiver used to register.
          </p>
          <input
            type="email"
            required
            value={caregiverEmail}
            onChange={(e) => setCaregiverEmail(e.target.value)}
            placeholder="caregiver@example.com"
            className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={adding}
            className="mt-3 rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {adding ? "Sending..." : "Send request"}
          </button>
          {addMessage && (
            <p className={`mt-3 text-sm ${addIsError ? "text-red-600" : "text-emerald-700"}`}>
              {addMessage}
            </p>
          )}
        </form>
      )}

      {requests.length > 0 && (
        <ul className="mt-5 space-y-3">
          {requests.map((r) => (
            <li
              key={r.request_id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Request from a caregiver
              </p>
              <p className="font-semibold text-slate-900">
                {r.caregiver_name || "A caregiver"}
              </p>
              <p className="text-xs text-slate-500">
                Requested {new Date(r.requested_at).toLocaleDateString()}
              </p>
              <div className="mt-3 flex gap-2">
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
      )}

      {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
    </div>
  );
}