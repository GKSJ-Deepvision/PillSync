import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProfilePhoto from "../../components/common/ProfilePhoto";
import { useAuth } from "../../context/AuthContext";
import {
  createDoctorSlots,
  deleteDoctorSlot,
  getDoctorProfile,
  indiaDateString,
  listDoctorAppointments,
  listDoctorAvailability,
  updateDoctorAppointment,
} from "./api";

const INITIAL_AVAILABILITY = {
  date: indiaDateString(),
  startTime: "09:00",
  endTime: "12:00",
  slotMinutes: 20,
};

function formatTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function timeParts(value) {
  const [rawHour = "09", minute = "00"] = value.split(":");
  const hour24 = Number(rawHour);
  return {
    hour: String(hour24 % 12 || 12),
    minute,
    period: hour24 < 12 ? "AM" : "PM",
  };
}

function to24HourTime(hour, minute, period) {
  const hour24 = (Number(hour) % 12) + (period === "PM" ? 12 : 0);
  return `${String(hour24).padStart(2, "0")}:${minute}`;
}

function IndiaTimePicker({ label, value, onChange }) {
  const parts = timeParts(value);
  const update = (key, nextValue) => {
    const nextParts = { ...parts, [key]: nextValue };
    onChange(to24HourTime(nextParts.hour, nextParts.minute, nextParts.period));
  };

  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex min-w-0 gap-1">
        <select
          aria-label={`${label} hour`}
          className="field-input min-w-0 flex-1 px-1 py-2 text-center text-[13px]"
          value={parts.hour}
          onChange={(event) => update("hour", event.target.value)}
        >
          {Array.from({ length: 12 }, (_, index) => String(index + 1)).map((hour) => (
            <option key={hour} value={hour}>{hour}</option>
          ))}
        </select>
        <select
          aria-label={`${label} minute`}
          className="field-input min-w-0 flex-1 px-1 py-2 text-center text-[13px]"
          value={parts.minute}
          onChange={(event) => update("minute", event.target.value)}
        >
          {Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0")).map((minute) => (
            <option key={minute} value={minute}>{minute}</option>
          ))}
        </select>
        <select
          aria-label={`${label} AM or PM`}
          className="field-input min-w-0 flex-1 px-1 py-2 text-center text-[13px]"
          value={parts.period}
          onChange={(event) => update("period", event.target.value)}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [form, setForm] = useState(INITIAL_AVAILABILITY);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data: doctorProfile, error } = await getDoctorProfile(user.id);
    setDoctor(doctorProfile);
    if (error || !doctorProfile) {
      setLoading(false);
      return;
    }
    const [appointmentResult, availabilityResult] = await Promise.all([
      listDoctorAppointments(doctorProfile.id),
      listDoctorAvailability(doctorProfile.id),
    ]);
    setAppointments(appointmentResult.data);
    setAvailability(availabilityResult.data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      setNow(Date.now());
      load();
    }, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleAvailabilitySubmit = async (event) => {
    event.preventDefault();
    if (!doctor?.is_active) return;
    setBusy(true);
    setMessage("");
    const { error } = await createDoctorSlots(doctor.id, form);
    setBusy(false);
    if (error) {
      setMessage(
        error.message.toLowerCase().includes("row-level security")
          ? "Availability was rejected. Confirm your doctor listing is active and choose future times."
          : error.message
      );
      return;
    }
    setMessage("Appointment times added.");
    await load();
  };

  const handleStatus = async (appointmentId, status) => {
    setBusyId(appointmentId);
    setMessage("");
    const { error } = await updateDoctorAppointment(appointmentId, status);
    setBusyId("");
    setMessage(error?.message ?? `Appointment marked ${status.replace("_", " ")}.`);
    await load();
  };

  const handleDeleteSlot = async (slotId) => {
    const { error } = await deleteDoctorSlot(slotId);
    setMessage(error?.message ?? "Availability removed.");
    await load();
  };

  if (loading) {
    return (
      <DashboardLayout eyebrow="Doctor workspace" title="Doctor appointments">
        <p className="font-body text-sm text-ink-fog">Loading your doctor workspace…</p>
      </DashboardLayout>
    );
  }

  if (!doctor) {
    return (
      <DashboardLayout eyebrow="Doctor workspace" title="Doctor appointments">
        <section className="max-w-2xl border-l-4 border-amber-400 bg-white px-5 py-5">
          <h2 className="font-display text-base font-semibold text-ink">Listing review pending</h2>
          <p className="mt-2 font-body text-sm text-ink-fog">
            An administrator must verify your clinic details and publish your listing before you can schedule appointments.
          </p>
        </section>
      </DashboardLayout>
    );
  }

  const activeBookings = appointments.filter((appointment) => appointment.status !== "cancelled");
  const queueNow = activeBookings.filter(
    (appointment) =>
      new Date(appointment.starts_at).getTime() <= now &&
      ["booked", "in_progress"].includes(appointment.status)
  );

  return (
    <DashboardLayout eyebrow="Doctor workspace" title={doctor.doctor_name}>
      <div className="space-y-6">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="card">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">Bookings</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">{activeBookings.length}</p>
          </div>
          <div className="card">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">Queue active</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">{queueNow.length}</p>
          </div>
          <div className="card">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">Future slots</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">{availability.length}</p>
          </div>
        </section>

        {!doctor.is_active && (
          <p className="rounded-xl bg-amber-100 px-4 py-3 font-body text-sm text-amber-800">
            Your public listing is paused. Existing appointments remain visible, but patients cannot book new times.
          </p>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.7fr)]">
          <div className="card">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-ink">Appointment queue</h2>
                <p className="mt-1 font-body text-sm text-ink-fog">Patient queue numbers activate at the booked time.</p>
              </div>
              <button type="button" onClick={load} className="btn-secondary px-3 py-2 text-xs">Refresh</button>
            </div>
            {appointments.length === 0 ? (
              <p className="rounded-xl bg-porcelain-dim px-4 py-5 font-body text-sm text-ink-fog">
                No appointments booked yet.
              </p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {appointments.map((appointment) => {
                  const hasStarted = new Date(appointment.starts_at).getTime() <= now;
                  return (
                    <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <ProfilePhoto
                          src={appointment.patient?.avatar_url}
                          name={appointment.patient?.full_name}
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <p className="font-body text-sm font-semibold text-ink">
                            #{appointment.queue_number} · {appointment.patient?.full_name || "Patient"}
                          </p>
                          <p className="mt-1 font-body text-[13px] text-ink-fog">
                            {formatTime(appointment.starts_at)} IST · {appointment.status.replace("_", " ")}
                          </p>
                          {appointment.reason && (
                            <p className="mt-1 font-body text-[13px] text-ink-fog">{appointment.reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {appointment.status === "booked" && hasStarted && (
                          <button
                            type="button"
                            disabled={busyId === appointment.id}
                            onClick={() => handleStatus(appointment.id, "in_progress")}
                            className="btn-primary px-3 py-2 text-xs"
                          >
                            Start visit
                          </button>
                        )}
                        {appointment.status === "in_progress" && (
                          <button
                            type="button"
                            disabled={busyId === appointment.id}
                            onClick={() => handleStatus(appointment.id, "completed")}
                            className="btn-secondary px-3 py-2 text-xs"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="space-y-6">
            <section className="card">
              <h2 className="font-display text-base font-semibold text-ink">Schedule free times</h2>
              <form onSubmit={handleAvailabilitySubmit} className="mt-4 space-y-3">
                <label className="field-label">
                  Date
                  <input
                    required
                    type="date"
                    min={indiaDateString()}
                    className="field-input mt-1"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <IndiaTimePicker
                    label="Start time"
                    value={form.startTime}
                    onChange={(startTime) => setForm({ ...form, startTime })}
                  />
                  <IndiaTimePicker
                    label="End time"
                    value={form.endTime}
                    onChange={(endTime) => setForm({ ...form, endTime })}
                  />
                </div>
                <label className="field-label">
                  Appointment length
                  <select
                    className="field-input mt-1"
                    value={form.slotMinutes}
                    onChange={(event) => setForm({ ...form, slotMinutes: Number(event.target.value) })}
                  >
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </label>
                <button type="submit" disabled={busy || !doctor.is_active} className="btn-primary w-full">
                  {busy ? "Saving…" : "Add available times"}
                </button>
              </form>
            </section>

            <section className="card">
              <h2 className="font-display text-base font-semibold text-ink">Upcoming availability</h2>
              {availability.length === 0 ? (
                <p className="mt-3 font-body text-sm text-ink-fog">No future times scheduled.</p>
              ) : (
                <ul className="mt-3 divide-y divide-ink/5">
                  {availability.map((slot) => {
                    const occupied = slot.appointments?.some((appointment) => appointment.status !== "cancelled");
                    const hasBookingHistory = (slot.appointments?.length ?? 0) > 0;
                    return (
                      <li key={slot.id} className="flex items-center justify-between gap-3 py-3">
                        <div>
                          <p className="font-body text-sm font-medium text-ink">{formatTime(slot.starts_at)} IST</p>
                          <p className="font-body text-xs text-ink-fog">{occupied ? "Booked" : "Free"}</p>
                        </div>
                        {!hasBookingHistory && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="font-body text-xs font-semibold text-rose-deep"
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </section>
        {message && <p className="font-body text-sm text-ink-fog" role="status">{message}</p>}
      </div>
    </DashboardLayout>
  );
}