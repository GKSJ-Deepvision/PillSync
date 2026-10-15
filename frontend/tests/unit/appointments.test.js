import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/lib/supabaseClient", () => ({ supabase: {} }));

import {
  buildDoctorSlotRows,
  indiaDateString,
  indiaDateTime,
  isQueueActive,
  mapPatientAppointments,
} from "../../src/features/appointments/api";

describe("appointment time helpers", () => {
  it("uses the India calendar date even when UTC is on the previous day", () => {
    expect(indiaDateString(new Date("2026-01-01T20:00:00Z"))).toBe("2026-01-02");
  });

  it("converts an India-local appointment time to UTC", () => {
    expect(indiaDateTime("2026-01-02", "09:00")).toBe("2026-01-02T03:30:00.000Z");
  });

  it("omits elapsed slots from a same-day availability window", () => {
    const rows = buildDoctorSlotRows(
      "doctor-1",
      { date: "2026-01-02", startTime: "09:00", endTime: "10:00", slotMinutes: 20 },
      new Date("2026-01-02T03:50:00Z").getTime()
    );

    expect(rows.map((row) => row.starts_at)).toEqual(["2026-01-02T04:10:00.000Z"]);
  });

  it("activates queue details at appointment time, but not for cancelled bookings", () => {
    const appointment = { starts_at: "2026-01-02T03:30:00.000Z", status: "booked" };
    const start = new Date(appointment.starts_at).getTime();

    expect(isQueueActive(appointment, start - 1)).toBe(false);
    expect(isQueueActive(appointment, start)).toBe(true);
    expect(isQueueActive({ ...appointment, status: "cancelled" }, start)).toBe(false);
    expect(isQueueActive({ ...appointment, status: "completed" }, start)).toBe(false);
  });

  it("maps a doctor photo into the patient's booked appointment", () => {
    const [appointment] = mapPatientAppointments([
      {
        doctor_name: "Dr. Rao",
        doctor_avatar_url: "https://images.example.test/doctor.webp",
        specialization: "Cardiology",
      },
    ]);

    expect(appointment.doctor.avatar_url).toBe("https://images.example.test/doctor.webp");
  });
});