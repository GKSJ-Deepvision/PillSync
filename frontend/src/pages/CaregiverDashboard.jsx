import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { timeOfDayGreeting } from "../utils/greeting";
import PatientDetails from "../features/caregiver/PatientDetails";
import { sendPatientReminder } from "../features/notifications/api";
import { listMedications } from "../features/medications/api";
import { listDoseHistory } from "../features/reminders/api";
import { predictRefillsForCaregiver } from "../features/refills/mlApi";
import MessageInbox from "../components/dashboard/MessageInbox";

export default function CaregiverDashboard() {
  const { profile, user } = useAuth();
  const { label } = timeOfDayGreeting();
  const firstName = (profile?.full_name || "there").split(" ")[0];

  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [refillsByPatient, setRefillsByPatient] = useState([]);
  const [refillsLoading, setRefillsLoading] = useState(true);

  const openMessageComposer = (patient, key) => {
    setMessageTarget({ key, patientId: patient.id, patientName: patient.full_name || "patient" });
    setMessageBody("Please remember to take your medicine.");
  };

  useEffect(() => {
    let mounted = true;
    async function loadLinks() {
      const { data, error } = await supabase
        .from("caregiver_links")
        .select("id, status, patient:patient_id(id, full_name)")
        .eq("caregiver_id", user.id)
        .eq("status", "accepted");
      if (mounted) {
        if (!error) setLinks(data || []);
        setLoading(false);
      }
    }
    if (user?.id) loadLinks();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!links.length) {
      setRefillsLoading(false);
      return undefined;
    }
    let mounted = true;
    (async () => {
      setRefillsLoading(true);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 45);

      const patients = await Promise.all(
        links.map(async (link) => {
          const patientId = link.patient?.id;
          if (!patientId) return null;
          const [{ data: meds }, { data: history }] = await Promise.all([
            listMedications(patientId),
            listDoseHistory(patientId, { fromDate: fromDate.toISOString() }),
          ]);
          return {
            patientId,
            patientName: link.patient?.full_name,
            medications: (meds || []).filter((m) => m.is_active !== false),
            doseLogsByMedication: Object.fromEntries(
              (meds || []).map((med) => [med.id, (history || []).filter((h) => h.medication_id === med.id)])
            ),
          };
        })
      );

      const result = await predictRefillsForCaregiver(patients.filter(Boolean));
      if (mounted) {
        setRefillsByPatient(result.patients);
        setRefillsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [links]);

  useEffect(() => {
    if (!user?.id) return undefined;
    let mounted = true;
    const loadNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, patient_id, title, body, image_url, created_at, read_at")
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(10);
      if (mounted) setNotifications(data || []);
    };
    loadNotifications();
    const channel = supabase
      .channel(`caregiver-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          setNotifications((current) => [payload.new, ...current].slice(0, 10));
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(payload.new.title, { body: payload.new.body });
          }
        }
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <DashboardLayout eyebrow="Caregiver" title={`${label}, ${firstName}`}>
      {selectedPatient ? (
        <PatientDetails
          patient={selectedPatient}
          onBack={() => setSelectedPatient(null)}
        />
      ) : (
        <>
        <MessageInbox
          messages={notifications}
          title="Messages"
          emptyText="Missed-dose alerts and patient messages will appear here."
        />
        {!refillsLoading && refillsByPatient.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Refill priority (AI-adjusted)</h2>
              {refillsByPatient.reduce((sum, p) => sum + p.summary.urgent_count, 0) > 0 && (
                <span className="badge bg-coral-soft text-coral-deep">
                  {refillsByPatient.reduce((sum, p) => sum + p.summary.urgent_count, 0)} refills needed soon
                </span>
              )}
            </div>
            <ul className="mt-3 divide-y divide-ink/5">
              {refillsByPatient
                .filter((p) => p.summary.urgent_count > 0 || p.summary.adherence_watch_count > 0)
                .slice(0, 5)
                .map((p) => (
                  <li key={p.patient_id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="font-body text-sm font-semibold text-ink">{p.patient_name || "Patient"}</p>
                      <p className="font-body text-xs text-ink-fog">
                        {p.predictions
                          .filter((pr) => pr.stock_status === "low" || pr.stock_status === "empty")
                          .map((pr) => pr.medication_name)
                          .filter(Boolean)
                          .join(", ") || "Adherence needs attention"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary py-1.5 text-[12px]"
                      onClick={() => setSelectedPatient({ id: p.patient_id, full_name: p.patient_name })}
                    >
                      View
                    </button>
                  </li>
                ))}
              {refillsByPatient.every((p) => p.summary.urgent_count === 0 && p.summary.adherence_watch_count === 0) && (
                <li className="py-3">
                  <span className="badge bg-mint-soft text-mint-deep">All linked patients are stocked and adherent</span>
                </li>
              )}
            </ul>
          </div>
        )}
        <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Linked patients</h2>
          <span className="badge bg-indigo-soft text-indigo-deep">{links.length} linked</span>
        </div>

        {loading ? (
          <p className="mt-4 font-body text-sm text-ink-fog">Loading…</p>
        ) : links.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-porcelain-dim px-5 py-8 text-center">
            <p className="font-body text-sm text-ink-fog">
              No patients linked yet. Ask the patient to share their PillSync email with
              an admin, who can connect your accounts from{" "}
              <span className="font-mono">caregiver_links</span>.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-ink/5">
            {links.map((link) => (
              <li key={link.id} className="py-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-2 py-3 text-left transition hover:bg-porcelain-dim"
                  onClick={() => setSelectedPatient(link.patient)}
                >
                  <span className="font-body text-sm font-medium text-ink">
                  {link.patient?.full_name || "Unnamed patient"}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="badge bg-mint-soft text-mint-deep">{link.status}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="rounded-lg bg-indigo-soft px-2 py-1 font-body text-xs font-semibold text-indigo-deep hover:bg-indigo-deep hover:text-white"
                      onClick={(event) => {
                        event.stopPropagation();
                        openMessageComposer(link.patient, link.patient.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          openMessageComposer(link.patient, link.patient.id);
                        }
                      }}
                    >
                      Push message
                    </span>
                    <span aria-hidden="true" className="text-ink-fog">View</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        </div>
        {messageTarget && (
          <form
            className="mt-5 rounded-xl border border-indigo-deep/20 bg-indigo-soft/30 p-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!messageBody.trim()) return;
              setSendingMessage(true);
              const { data, error } = await sendPatientReminder({
                caregiverId: user.id,
                patientId: messageTarget.patientId,
                body: messageBody.trim(),
              });
              setSendingMessage(false);
              if (error) window.alert(error.message);
              else {
                if (data) setNotifications((current) => [data, ...current].slice(0, 10));
                setMessageTarget(null);
                setMessageBody("");
              }
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <label className="field-label mb-0" htmlFor="caregiver-message">Message to {messageTarget.patientName}</label>
              <button type="button" onClick={() => setMessageTarget(null)} className="font-body text-xs text-ink-fog">Cancel</button>
            </div>
            <textarea
              id="caregiver-message"
              className="field-input mt-2 min-h-20 resize-y"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              maxLength={500}
              autoFocus
            />
            <button type="submit" disabled={sendingMessage} className="btn-brand mt-3 px-3 py-2 text-xs">
              {sendingMessage ? "Sending..." : "Send message"}
            </button>
          </form>
        )}
        </>
      )}

    </DashboardLayout>
  );
}
