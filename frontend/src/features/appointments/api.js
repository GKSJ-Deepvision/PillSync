import { supabase } from "../../lib/supabaseClient";

export function indiaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function indiaDateTime(date, time) {
  return new Date(`${date}T${time}:00+05:30`).toISOString();
}

export function isQueueActive(appointment, now = Date.now()) {
  return Boolean(
    appointment &&
      ["booked", "in_progress"].includes(appointment.status) &&
      now >= new Date(appointment.starts_at).getTime()
  );
}

function nextIndiaDate(date) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export async function listApprovedDoctors() {
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("*")
    .eq("is_active", true)
    .order("doctor_name");
  return { data: data ?? [], error };
}

export async function listDoctorAccounts() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("role", "doctor")
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function listDoctorProfiles() {
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("*")
    .order("doctor_name");
  return { data: data ?? [], error };
}

export async function createDoctorProfile(profile) {
  const { data, error } = await supabase.from("doctor_profiles").insert(profile).select().single();
  return { data, error };
}

export async function setDoctorActive(id, isActive) {
  const { data, error } = await supabase
    .from("doctor_profiles")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function getDoctorProfile(profileId) {
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();
  return { data, error };
}

export async function listAvailableSlots(doctorId, date) {
  const start = indiaDateTime(date, "00:00");
  const end = indiaDateTime(nextIndiaDate(date), "00:00");
  const { data, error } = await supabase
    .from("doctor_availability")
    .select("id, doctor_id, starts_at, ends_at")
    .eq("doctor_id", doctorId)
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at");
  return { data: data ?? [], error };
}

export function buildDoctorSlotRows(
  doctorId,
  { date, startTime, endTime, slotMinutes },
  now = Date.now()
) {
  const start = new Date(indiaDateTime(date, startTime));
  const end = new Date(indiaDateTime(date, endTime));
  const interval = Number(slotMinutes) * 60_000;
  const rows = [];

  for (let slotStart = start.getTime(); slotStart + interval <= end.getTime(); slotStart += interval) {
    if (slotStart <= now) continue;
    rows.push({
      doctor_id: doctorId,
      starts_at: new Date(slotStart).toISOString(),
      ends_at: new Date(slotStart + interval).toISOString(),
    });
  }

  return rows;
}

export async function createDoctorSlots(doctorId, schedule) {
  const rows = buildDoctorSlotRows(doctorId, schedule);
  if (!rows.length) {
    return {
      data: [],
      error: new Error("No future appointment times fit this window. Choose a later time or date."),
    };
  }

  const { data, error } = await supabase.from("doctor_availability").insert(rows).select();
  return { data: data ?? [], error };
}

export async function listDoctorAvailability(doctorId) {
  const { data, error } = await supabase
    .from("doctor_availability")
    .select("id, starts_at, ends_at, appointments:doctor_appointments(id, status)")
    .eq("doctor_id", doctorId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at");
  return { data: data ?? [], error };
}

export async function deleteDoctorSlot(slotId) {
  const { error } = await supabase.from("doctor_availability").delete().eq("id", slotId);
  return { error };
}

export function mapPatientAppointments(appointments = []) {
  return appointments.map((appointment) => ({
    ...appointment,
    doctor: {
      doctor_name: appointment.doctor_name,
      avatar_url: appointment.doctor_avatar_url,
      specialization: appointment.specialization,
      hospital_name: appointment.hospital_name,
      address: appointment.address,
    },
  }));
}

export async function listPatientAppointments() {
  const { data, error } = await supabase.rpc("list_patient_appointments");
  return { data: mapPatientAppointments(data ?? []), error };
}

export async function listDoctorAppointments(doctorId) {
  const { data, error } = await supabase
    .from("doctor_appointments")
    .select("*, patient:profiles!doctor_appointments_patient_id_fkey(full_name, phone, avatar_url)")
    .eq("doctor_id", doctorId)
    .order("starts_at");
  return { data: data ?? [], error };
}

export async function bookDoctorSlot(availabilityId, patientId, reason) {
  const { data, error } = await supabase
    .from("doctor_appointments")
    .insert({
      availability_id: availabilityId,
      patient_id: patientId,
      reason: reason.trim() || null,
    });
  return { data, error };
}

export async function cancelPatientAppointment(appointmentId) {
  return supabase.rpc("cancel_doctor_appointment", { appointment_id: appointmentId });
}

export async function updateDoctorAppointment(appointmentId, status) {
  return supabase.rpc("set_doctor_appointment_status", {
    appointment_id: appointmentId,
    next_status: status,
  });
}
