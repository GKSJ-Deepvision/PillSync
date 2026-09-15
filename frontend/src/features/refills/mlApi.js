/**
 * Client for the Module 6 (AI Refill Prediction Engine) backend
 * (`backend/apps/refills`). Talks to `${VITE_API_BASE_URL}/v1/refills/...`.
 *
 * Every function degrades gracefully to the local rule-based formula in
 * `lib/refillPrediction.js` if the backend is unreachable (e.g. running the
 * frontend without the Python service up yet) — the UI should never go
 * blank just because the ML service is down, it should just say so.
 */
import { predictRefill as predictRefillLocally } from "../../lib/refillPrediction";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(
  /\/$/,
  ""
);
const REFILLS_BASE = `${API_BASE}/v1/refills`;

function medicationToPayload(med) {
  return {
    id: med.id,
    name: med.name,
    form: med.form,
    therapeutic_class: med.therapeutic_class ?? null,
    stock_quantity: Number(med.stock_quantity || 0),
    low_stock_threshold: Number(med.low_stock_threshold ?? 5),
    refill_lead_days: Number(med.refill_lead_days ?? 5),
  };
}

function schedulesToPayload(schedules = []) {
  return schedules
    .filter((s) => s.is_active)
    .map((s) => ({
      dose_quantity: Number(s.dose_quantity || 1),
      days_of_week: s.days_of_week?.length ? s.days_of_week : [0, 1, 2, 3, 4, 5, 6],
      is_active: true,
    }));
}

function doseLogsToPayload(doseLogs = []) {
  return doseLogs
    .filter((d) => d.status === "taken" || d.status === "missed")
    .map((d) => ({
      scheduled_for: d.scheduled_for,
      status: d.status,
      dose_quantity: Number(d.dose_quantity || 1),
    }));
}

/** Local fallback shaped like the API response, so callers don't need two code paths. */
function fallbackPrediction(med, schedules) {
  const local = predictRefillLocally({
    stockQuantity: med.stock_quantity,
    schedules: schedules.filter((s) => s.is_active),
    refillLeadDays: med.refill_lead_days,
  });
  return {
    medication_id: med.id,
    medication_name: med.name,
    prescribed_daily_dose: local.dailyDose,
    predicted_adherence_rate: 1,
    adjusted_daily_dose: local.dailyDose,
    stock_quantity: Number(med.stock_quantity || 0),
    days_remaining: local.daysRemaining,
    depletion_date: local.depletionDate ? local.depletionDate.toISOString() : null,
    refill_by_date: local.refillByDate ? local.refillByDate.toISOString() : null,
    stock_status: local.status,
    adherence_risk: "insufficient-data",
    confidence: 0,
    model_version: "offline-fallback",
  };
}

async function postJSON(path, body) {
  const response = await fetch(`${REFILLS_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Refill prediction API error (${response.status})`);
  return response.json();
}

/** One medication -> one ML-backed prediction, with local fallback. */
export async function predictRefillML(medication, schedules = [], doseLogs = []) {
  try {
    return await postJSON("/predict", {
      medication: medicationToPayload(medication),
      schedules: schedulesToPayload(schedules),
      dose_logs: doseLogsToPayload(doseLogs),
    });
  } catch {
    return fallbackPrediction(medication, schedules);
  }
}

/** A patient's medications -> predictions + summary, sorted soonest-first by the API. */
export async function predictRefillsBatch(medications = []) {
  const cases = medications.map((med) => ({
    medication: medicationToPayload(med),
    schedules: schedulesToPayload(med.medication_schedules ?? []),
    dose_logs: doseLogsToPayload(med.recent_dose_logs ?? []),
  }));
  try {
    return await postJSON("/predict/batch", { cases });
  } catch {
    const predictions = medications
      .map((med) => fallbackPrediction(med, med.medication_schedules ?? []))
      .sort((a, b) => (a.days_remaining ?? Infinity) - (b.days_remaining ?? Infinity));
    return {
      predictions,
      summary: {
        total: predictions.length,
        urgent_count: predictions.filter((p) => ["empty", "low"].includes(p.stock_status)).length,
        adherence_watch_count: 0,
      },
    };
  }
}

/**
 * Multiple patients (caregiver view) -> per-patient predictions + summary,
 * ranked most-urgent-first by the API.
 * `patients` = [{ patientId, patientName, medications, doseLogsByMedication }]
 */
export async function predictRefillsForCaregiver(patients = []) {
  const payload = {
    patients: patients.map((p) => ({
      patient_id: p.patientId,
      patient_name: p.patientName,
      cases: (p.medications ?? []).map((med) => ({
        medication: medicationToPayload(med),
        schedules: schedulesToPayload(med.medication_schedules ?? []),
        dose_logs: doseLogsToPayload(
          p.doseLogsByMedication?.[med.id] ?? med.recent_dose_logs ?? []
        ),
      })),
    })),
  };
  try {
    return await postJSON("/predict/caregiver", payload);
  } catch {
    const results = await Promise.all(
      patients.map(async (p) => {
        const batch = await predictRefillsBatch(p.medications ?? []);
        return { patient_id: p.patientId, patient_name: p.patientName, ...batch };
      })
    );
    results.sort((a, b) => b.summary.urgent_count - a.summary.urgent_count);
    return {
      patients: results,
      urgent_total: results.reduce((sum, r) => sum + r.summary.urgent_count, 0),
    };
  }
}

export const REFILL_STATUS_LABEL = {
  "no-schedule": "No active schedule",
  empty: "Out of stock",
  low: "Refill soon",
  ok: "Stocked",
};

export const ADHERENCE_RISK_LABEL = {
  "insufficient-data": "Not enough history yet",
  stable: "Adherence stable",
  watch: "Adherence slipping",
  declining: "Adherence declining",
};
