import { supabase } from "../../lib/supabaseClient";

/** All medications for a patient, each with its dosage schedules attached. */
export async function listMedications(patientId) {
  const { data, error } = await supabase
    .from("medications")
    .select("*, medication_schedules(*)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function createMedication(patientId, medication) {
  const { data, error } = await supabase
    .from("medications")
    .insert({ ...medication, patient_id: patientId })
    .select()
    .single();
  return { data, error };
}

export async function updateMedication(id, updates) {
  const { data, error } = await supabase
    .from("medications")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteMedication(id) {
  const { error } = await supabase.from("medications").delete().eq("id", id);
  return { error };
}

/** Replaces all schedules for a medication with the given list (simplest
 * way to keep the "add/edit medication" form's schedule editor in sync
 * without diffing rows client-side). */
export async function replaceSchedules(medicationId, patientId, schedules) {
  const { error: deleteError } = await supabase
    .from("medication_schedules")
    .delete()
    .eq("medication_id", medicationId);
  if (deleteError) return { error: deleteError };

  if (!schedules.length) return { data: [] };

  const rows = schedules.map((s) => ({
    medication_id: medicationId,
    patient_id: patientId,
    label: s.label || "Dose",
    time_of_day: s.time_of_day,
    dose_quantity: s.dose_quantity,
    days_of_week: s.days_of_week,
    is_active: true,
  }));

  const { data, error } = await supabase.from("medication_schedules").insert(rows).select();
  return { data, error };
}

export async function adjustStock(id, delta) {
  const { data: current, error: readError } = await supabase
    .from("medications")
    .select("stock_quantity")
    .eq("id", id)
    .single();
  if (readError) return { error: readError };

  const nextStock = Math.max(0, Number(current.stock_quantity) + delta);
  const { data, error } = await supabase
    .from("medications")
    .update({ stock_quantity: nextStock })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}
