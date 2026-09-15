import { supabase } from "../../lib/supabaseClient";

export async function sendPatientReminder({ caregiverId, patientId, body }) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      recipient_id: patientId,
      patient_id: patientId,
      sender_id: caregiverId,
      title: "Reminder from your caregiver",
      body,
    })
    .select("id, patient_id, sender_id, title, body, created_at, read_at")
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}
