import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import DoseRing, { WINDOWS } from "../components/common/DoseRing";
import TodayReminders, { useTodayDoses } from "../components/dashboard/TodayReminders";
import RefillOutlookCard from "../components/dashboard/RefillOutlookCard";
import { useAuth } from "../context/AuthContext";
import { timeOfDayGreeting } from "../utils/greeting";
import { supabase } from "../lib/supabaseClient";
import { listMedications } from "../features/medications/api";
import { listDoseHistory } from "../features/reminders/api";
import { predictRefillsBatch } from "../features/refills/mlApi";
import MessageInbox from "../components/dashboard/MessageInbox";

/** Maps a dose's clock time to one of the Dose Ring's four windows so the
 * ring's "taken" arcs reflect real dose_logs instead of a static demo. */
function windowForTime(iso) {
  const hour = new Date(iso).getHours();
  if (hour < 11) return "dawn";
  if (hour < 16) return "midday";
  if (hour < 21) return "dusk";
  return "night";
}

export default function PatientDashboard() {
  const { profile, user } = useAuth();
  const { label } = timeOfDayGreeting();
  const { doses } = useTodayDoses(user?.id);
  const [messages, setMessages] = useState([]);
  const [refillPredictions, setRefillPredictions] = useState([]);
  const [refillsLoading, setRefillsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return undefined;
    let mounted = true;
    (async () => {
      setRefillsLoading(true);
      const { data: meds } = await listMedications(user.id);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 45);
      const { data: history } = await listDoseHistory(user.id, { fromDate: fromDate.toISOString() });
      const medsWithHistory = meds.map((med) => ({
        ...med,
        recent_dose_logs: history.filter((log) => log.medication_id === med.id),
      }));
      const result = await predictRefillsBatch(medsWithHistory);
      if (mounted) {
        setRefillPredictions(result.predictions);
        setRefillsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;
    let mounted = true;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, created_at")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (mounted) setMessages(data || []);
    };
    loadMessages();
    const channel = supabase
      .channel(`patient-notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          setMessages((current) => [payload.new, ...current].slice(0, 5));
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

  const firstName = (profile?.full_name || "there").split(" ")[0];

  const taken = {};
  WINDOWS.forEach((w) => {
    taken[w.key] = doses.some((d) => windowForTime(d.scheduled_for) === w.key && d.status === "taken");
  });

  const takenCount = doses.filter((d) => d.status === "taken").length;

  return (
    <DashboardLayout eyebrow="Patient" title={`${label}, ${firstName}`}>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="lg:col-span-2">
          <MessageInbox messages={messages} title="Messages from your care team" emptyText="Your caregiver messages will appear here." />
        </div>
        {/* Dose Summary */}
        <div className="card flex flex-col items-center gap-4 text-center">
          <DoseRing size={180} taken={taken} />

          <div>
            <p className="font-display text-2xl font-semibold text-ink">
              {takenCount} / {doses.length}
            </p>
            <p className="font-body text-[13px] text-ink-fog">doses logged today</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Today's reminders */}
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Today&apos;s doses</h2>
              <Link to="/medications" className="font-body text-[13px] font-semibold" style={{ color: "var(--brand-deep)" }}>
                Manage medicines →
              </Link>
            </div>
            <TodayReminders patientId={user?.id} />
          </div>

          {/* AI-backed refill outlook */}
          <RefillOutlookCard predictions={refillPredictions} loading={refillsLoading} linkTo="/refills" title="Refill outlook" />

          {/* Feature quick links */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link to="/history" className="rounded-2xl border border-ink/15 bg-white/60 p-4 transition-colors hover:bg-white">
              <h3 className="font-display text-sm font-semibold text-ink">Medication history</h3>
              <p className="mt-1 font-body text-[13px] text-ink-fog">Every dose you&apos;ve taken or missed.</p>
            </Link>

            <Link to="/refills" className="rounded-2xl border border-ink/15 bg-white/60 p-4 transition-colors hover:bg-white">
              <h3 className="font-display text-sm font-semibold text-ink">Stock & refills</h3>
              <p className="mt-1 font-body text-[13px] text-ink-fog">Predicted refill dates for every medicine.</p>
            </Link>

            <Link to="/adherence" className="rounded-2xl border border-ink/15 bg-white/60 p-4 transition-colors hover:bg-white">
              <h3 className="font-display text-sm font-semibold text-ink">Adherence dashboard</h3>
              <p className="mt-1 font-body text-[13px] text-ink-fog">Your streak and daily trend.</p>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
