import { supabase } from "../../lib/supabaseClient";

function localDateStr(d = new Date()) {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
}

/**
 * Makes sure a `dose_logs` row exists for every active schedule that's due
 * today (idempotent — relies on the `unique(schedule_id, scheduled_for)`
 * constraint, so calling this on every app load is safe and is how doses
 * "appear" without a server-side cron job).
 */
export async function ensureTodayDoseLogs(patientId) {
  const { data: schedules, error } = await supabase
    .from("medication_schedules")
    .select("*, medications!inner(id, name, is_active, patient_id)")
    .eq("patient_id", patientId)
    .eq("is_active", true);

  if (error) return { error };

  const now = new Date();
  const dow = now.getDay();
  const todayStr = localDateStr(now);

  const dueToday = (schedules ?? []).filter(
    (s) => s.medications.is_active && (s.days_of_week ?? []).includes(dow)
  );

  if (!dueToday.length) return { data: [] };

  const rows = dueToday.map((s) => {
    const [h, m] = s.time_of_day.split(":");
    const scheduledFor = new Date(`${todayStr}T${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`);
    return {
      schedule_id: s.id,
      medication_id: s.medication_id,
      patient_id: patientId,
      scheduled_for: scheduledFor.toISOString(),
      dose_quantity: s.dose_quantity,
    };
  });

  const { data, error: upsertError } = await supabase
    .from("dose_logs")
    .upsert(rows, { onConflict: "schedule_id,scheduled_for", ignoreDuplicates: true })
    .select();

  return { data: data ?? [], error: upsertError };
}

/** Any dose still "pending" more than `graceMinutes` after its scheduled
 * time is auto-flipped to "missed" — otherwise a patient who never opens
 * the app that day would have doses stuck pending forever. */
export async function autoMarkMissed(patientId, graceMinutes = 60) {
  const cutoff = new Date(Date.now() - graceMinutes * 60000).toISOString();
  const { data, error } = await supabase
    .from("dose_logs")
    .update({ status: "missed" })
    .eq("patient_id", patientId)
    .in("status", ["pending", "snoozed"])
    .lt("scheduled_for", cutoff)
    .select();
  return { data: data ?? [], error };
}

export async function listTodayDoses(patientId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("dose_logs")
    .select("*, medications(name, form, strength, color)")
    .eq("patient_id", patientId)
    .gte("scheduled_for", start.toISOString())
    .lte("scheduled_for", end.toISOString())
    .order("scheduled_for", { ascending: true });

  return { data: data ?? [], error };
}

export async function listDoseHistory(patientId, { fromDate, toDate, medicationId, status } = {}) {
  let query = supabase
    .from("dose_logs")
    .select("*, medications(name, form, strength, color)")
    .eq("patient_id", patientId)
    .order("scheduled_for", { ascending: false });

  if (fromDate) query = query.gte("scheduled_for", fromDate);
  if (toDate) query = query.lte("scheduled_for", toDate);
  if (medicationId) query = query.eq("medication_id", medicationId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

export async function markDoseTaken(id) {
  const { data, error } = await supabase
    .from("dose_logs")
    .update({ status: "taken", taken_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function markDoseMissed(id) {
  const { data, error } = await supabase
    .from("dose_logs")
    .update({ status: "missed" })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function snoozeDose(id, minutes = 15) {
  const snoozeUntil = new Date(Date.now() + minutes * 60000);
  const { data, error } = await supabase
    .from("dose_logs")
    .update({
      status: "snoozed",
      snooze_until: snoozeUntil.toISOString(),
      scheduled_for: snoozeUntil.toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}
