import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ProfilePhoto from "../../components/common/ProfilePhoto";
import { useAuth } from "../../context/AuthContext";
import {
  bookDoctorSlot,
  cancelPatientAppointment,
  indiaDateString,
  isQueueActive,
  listApprovedDoctors,
  listAvailableSlots,
  listPatientAppointments,
} from "./api";

function formatAppointmentTime(value) {
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSlotTime(value) {
  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  });
}

export default function DoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(indiaDateString());
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  const loadAppointments = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await listPatientAppointments();
    setAppointments(data);
  }, [user?.id]);

  useEffect(() => {
    listApprovedDoctors().then(({ data }) => {
      setDoctors(data);
      if (data.length) setSelectedDoctor(data[0]);
    });
    loadAppointments();
    const timer = setInterval(() => {
      setNow(Date.now());
      loadAppointments();
    }, 30_000);
    return () => clearInterval(timer);
  }, [loadAppointments, user?.id]);

  useEffect(() => {
    if (!selectedDoctor?.id || !selectedDate) {
      setSlots([]);
      return;
    }
    listAvailableSlots(selectedDoctor.id, selectedDate).then(({ data }) => setSlots(data));
  }, [selectedDoctor?.id, selectedDate]);

  const handleBook = async (slot) => {
    setBusyId(slot.id);
    setMessage("");
    const { error } = await bookDoctorSlot(slot.id, user.id, reason);
    setBusyId("");
    if (error) {
      setMessage(error.message.includes("available") ? error.message : "That time was just booked. Choose another slot.");
      const { data } = await listAvailableSlots(selectedDoctor.id, selectedDate);
      setSlots(data);
      return;
    }
    setMessage("Appointment booked. Your queue number will appear when your appointment begins.");
    setReason("");
    await Promise.all([
      loadAppointments(),
      listAvailableSlots(selectedDoctor.id, selectedDate).then(({ data }) => setSlots(data)),
    ]);
  };

  const handleCancel = async (appointmentId) => {
    setBusyId(appointmentId);
    const { error } = await cancelPatientAppointment(appointmentId);
    setBusyId("");
    setMessage(error?.message ?? "Appointment cancelled.");
    await Promise.all([
      loadAppointments(),
      selectedDoctor
        ? listAvailableSlots(selectedDoctor.id, selectedDate).then(({ data }) => setSlots(data))
        : Promise.resolve(),
    ]);
  };

  return (
    <DashboardLayout eyebrow="Care access" title="Book a doctor">
      <div className="space-y-7">
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Available doctors</h2>
              <p className="mt-1 font-body text-sm text-ink-fog">Verified doctors and their clinic details.</p>
            </div>
            <span className="font-mono text-xs text-ink-fog">{doctors.length} listed</span>
          </div>
          {doctors.length === 0 ? (
            <p className="rounded-xl bg-porcelain-dim px-4 py-5 font-body text-sm text-ink-fog">
              No doctors are accepting appointments yet.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doctor) => (
                <button
                  type="button"
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor)}
                  aria-pressed={selectedDoctor?.id === doctor.id}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    selectedDoctor?.id === doctor.id
                      ? "border-ink bg-white shadow-sm"
                      : "border-ink/10 bg-white/60 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <ProfilePhoto
                      src={doctor.avatar_url}
                      name={doctor.doctor_name}
                      className="h-12 w-12"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-semibold text-ink">
                        {doctor.doctor_name}
                      </span>
                      <span className="mt-1 block font-body text-sm font-medium text-ink-fog">
                        {doctor.specialization}
                      </span>
                    </span>
                  </span>
                  <span className="mt-3 block font-body text-[13px] text-ink-fog">
                    {doctor.experience_years} years experience · {doctor.hospital_name}
                  </span>
                  <span className="mt-1 block font-body text-[13px] text-ink-fog">{doctor.address}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedDoctor && (
          <section className="border-t border-ink/10 pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">Appointment times</p>
                <h2 className="mt-1 font-display text-xl font-semibold text-ink">{selectedDoctor.doctor_name}</h2>
                <p className="mt-1 font-body text-sm text-ink-fog">
                  {selectedDoctor.hospital_name} · {selectedDoctor.address}
                </p>
              </div>
              <label className="font-body text-xs font-semibold text-ink-fog">
                Date
                <input
                  type="date"
                  min={indiaDateString()}
                  className="field-input mt-1"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {slots.length === 0 ? (
                <p className="rounded-lg bg-porcelain-dim px-4 py-3 font-body text-sm text-ink-fog">
                  No free times for this date. Try another day.
                </p>
              ) : (
                slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={busyId === slot.id}
                    onClick={() => handleBook(slot)}
                    className="rounded-lg border border-ink/15 bg-white px-4 py-2.5 font-body text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-porcelain-dim disabled:opacity-50"
                  >
                    {busyId === slot.id ? "Booking…" : formatSlotTime(slot.starts_at)}
                  </button>
                ))
              )}
            </div>
            {slots.length > 0 && (
              <label className="mt-4 block max-w-xl font-body text-xs font-semibold text-ink-fog">
                Reason for visit (optional)
                <input
                  className="field-input mt-1"
                  maxLength={300}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Briefly describe what you need help with"
                />
              </label>
            )}
          </section>
        )}

        {message && <p className="font-body text-sm text-ink-fog" role="status">{message}</p>}

        <section className="border-t border-ink/10 pt-6">
          <h2 className="mb-3 font-display text-base font-semibold text-ink">Your appointments</h2>
          {appointments.length === 0 ? (
            <p className="font-body text-sm text-ink-fog">Your booked appointments will appear here.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {appointments.map((appointment) => {
                const queueActive = isQueueActive(appointment, now);
                const queueVisible =
                  appointment.queue_number != null && now >= new Date(appointment.starts_at).getTime();
                const canCancel = appointment.status === "booked" && !queueActive;
                return (
                  <li key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="flex items-start gap-3">
                      <ProfilePhoto
                        src={appointment.doctor?.avatar_url}
                        name={appointment.doctor?.doctor_name}
                        className="h-11 w-11"
                      />
                      <div>
                        <p className="font-body text-sm font-semibold text-ink">
                          {appointment.doctor?.doctor_name ?? "Doctor"} · {appointment.doctor?.specialization}
                        </p>
                        <p className="mt-1 font-body text-[13px] text-ink-fog">
                          {formatAppointmentTime(appointment.starts_at)} IST · {appointment.doctor?.hospital_name}
                        </p>
                        {appointment.status !== "cancelled" && queueVisible && (
                          <p className="mt-2 font-body text-sm font-semibold text-ink">
                            Queue #{appointment.queue_number} · {queueActive
                              ? appointment.status === "in_progress" ? "Your visit is in progress" : "Queue active"
                              : "Visit completed"}
                          </p>
                        )}
                        {appointment.status !== "cancelled" && !queueVisible && (
                          <p className="mt-2 font-body text-xs text-ink-fog">Queue details appear when your time arrives.</p>
                        )}
                        {appointment.status === "cancelled" && (
                          <p className="mt-2 font-body text-xs font-semibold text-rose-deep">Cancelled</p>
                        )}
                      </div>
                    </div>
                    {canCancel && (
                      <button
                        type="button"
                        disabled={busyId === appointment.id}
                        onClick={() => handleCancel(appointment.id)}
                        className="rounded-lg border border-ink/15 px-3 py-2 font-body text-xs font-semibold text-ink-fog hover:border-rose/40 hover:text-rose-deep disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}