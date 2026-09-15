import { useEffect, useState } from "react";
import { listMedications } from "../medications/api";
import { listDoseHistory } from "../reminders/api";
import { computeAdherence, currentStreak, groupByDay } from "../../lib/adherence";
import { supabase } from "../../lib/supabaseClient";
import MedicationFormModal from "../medications/MedicationFormModal";
import { listPrescriptions } from "../prescriptions/api";
import RefillOutlookCard from "../../components/dashboard/RefillOutlookCard";
import { predictRefillsBatch } from "../refills/mlApi";

function formatDate(value) {
  if (!value) return "Not provided";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function healthStatus(adherence) {
  if (adherence.percentage === null)
    return { label: "No recent data", tone: "bg-ink/10 text-ink-fog" };
  if (adherence.percentage >= 90)
    return { label: "Doing well", tone: "bg-mint-soft text-mint-deep" };
  if (adherence.percentage >= 75)
    return { label: "Stable", tone: "bg-indigo-soft text-indigo-deep" };
  return { label: "Needs attention", tone: "bg-coral-soft text-coral-deep" };
}

export default function PatientDetails({ patient, onBack }) {
  const [details, setDetails] = useState({
    profile: patient,
    medications: [],
    doses: [],
    prescriptions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [refillPredictions, setRefillPredictions] = useState([]);
  const [refillsLoading, setRefillsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadDetails() {
      setLoading(true);
      setError("");
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 45);

      const [profileResult, medicationResult, doseResult, prescriptionResult] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, phone, date_of_birth, blood_group, conditions, emergency_contact_name, emergency_contact_phone, emergency_contact_relation"
          )
          .eq("id", patient.id)
          .single(),
        listMedications(patient.id),
        listDoseHistory(patient.id, { fromDate: fromDate.toISOString() }),
        listPrescriptions(patient.id),
      ]);

      if (!mounted) return;
      if (
        profileResult.error ||
        medicationResult.error ||
        doseResult.error ||
        prescriptionResult.error
      ) {
        setError("Some patient details could not be loaded.");
      }
      const medications = medicationResult.data || [];
      const doses = doseResult.data || [];
      setDetails({
        profile: profileResult.data || patient,
        medications,
        doses,
        prescriptions: prescriptionResult.data || [],
      });
      setLoading(false);

      setRefillsLoading(true);
      const medsWithHistory = medications
        .filter((m) => m.is_active !== false)
        .map((med) => ({
          ...med,
          recent_dose_logs: doses.filter((d) => d.medication_id === med.id),
        }));
      const result = await predictRefillsBatch(medsWithHistory);
      if (mounted) {
        setRefillPredictions(result.predictions);
        setRefillsLoading(false);
      }
    }
    loadDetails();
    return () => {
      mounted = false;
    };
  }, [patient]);

  const adherence = computeAdherence(details.doses);
  const streak = currentStreak(groupByDay(details.doses));
  const status = healthStatus(adherence);
  const activeMedications = details.medications.filter(
    (medication) => medication.is_active !== false
  );

  return (
    <section aria-labelledby="patient-details-title">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 font-body text-sm font-medium text-indigo-deep hover:underline"
      >
        Back to patients
      </button>
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-ink-fog">
              Patient overview
            </p>
            <h2
              id="patient-details-title"
              className="mt-1 font-display text-xl font-semibold text-ink"
            >
              {details.profile?.full_name || "Unnamed patient"}
            </h2>
          </div>
          <span className={`badge ${status.tone}`}>{status.label}</span>
        </div>

        {loading ? (
          <p className="mt-6 font-body text-sm text-ink-fog">Loading patient details...</p>
        ) : (
          <>
            {error && <p className="mt-4 font-body text-sm text-coral-deep">{error}</p>}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="30-day adherence"
                value={adherence.percentage === null ? "-" : `${adherence.percentage}%`}
              />
              <Stat label="Doses taken" value={adherence.taken} />
              <Stat label="Doses missed" value={adherence.missed} />
              <Stat label="Current streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-base font-semibold text-ink">
                  Health information
                </h3>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Date of birth" value={formatDate(details.profile?.date_of_birth)} />
                  <Info
                    label="Blood group"
                    value={details.profile?.blood_group || "Not provided"}
                  />
                  <Info label="Conditions" value={details.profile?.conditions || "None recorded"} />
                  <Info label="Phone" value={details.profile?.phone || "Not provided"} />
                  <Info
                    label="Emergency contact"
                    value={details.profile?.emergency_contact_name || "Not provided"}
                  />
                  <Info
                    label="Emergency phone"
                    value={details.profile?.emergency_contact_phone || "Not provided"}
                  />
                </dl>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-ink">Medicines</h3>
                  <button
                    type="button"
                    onClick={() => setShowMedicationForm(true)}
                    className="btn-brand px-3 py-2 text-xs"
                  >
                    + Add medicine
                  </button>
                </div>
                {activeMedications.length === 0 ? (
                  <p className="mt-3 font-body text-sm text-ink-fog">
                    No active medicines recorded.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {activeMedications.map((medication) => (
                      <li key={medication.id} className="rounded-lg bg-porcelain-dim px-3 py-2">
                        <p className="font-body text-sm font-semibold text-ink">
                          {medication.name}
                        </p>
                        <p className="font-body text-xs text-ink-fog">
                          {[medication.generic_name, medication.strength, medication.form]
                            .filter(Boolean)
                            .join(" | ") || "Details not recorded"}
                        </p>
                        <p className="font-body text-xs text-ink-fog">
                          {medication.instructions || "No instructions recorded"}
                          {medication.stock_quantity !== null &&
                          medication.stock_quantity !== undefined
                            ? ` | ${medication.stock_quantity} in stock`
                            : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-8 border-t border-ink/10 pt-6">
              <RefillOutlookCard
                predictions={refillPredictions}
                loading={refillsLoading}
                linkTo={null}
                title="Refill outlook (AI-adjusted)"
              />
            </div>

            <div className="mt-8 border-t border-ink/10 pt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-base font-semibold text-ink">
                  Prescription images
                </h3>
                <span className="badge bg-indigo-soft text-indigo-deep">
                  {details.prescriptions.length} uploaded
                </span>
              </div>
              {details.prescriptions.length === 0 ? (
                <p className="mt-3 font-body text-sm text-ink-fog">
                  No prescription images uploaded yet.
                </p>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {details.prescriptions.map((prescription) => (
                    <button
                      key={prescription.id}
                      type="button"
                      onClick={() => setSelectedPrescription(prescription)}
                      aria-label={`Open ${prescription.original_filename || "prescription image"}`}
                      title="Open prescription in this tab"
                      className="overflow-hidden rounded-lg border border-ink/10 bg-porcelain-dim text-left transition hover:border-indigo-deep"
                    >
                      <img
                        src={prescription.image_url}
                        alt={prescription.original_filename || "Prescription"}
                        className="h-36 w-full object-cover"
                      />
                      <p className="truncate px-3 py-2 font-body text-xs text-ink-fog">
                        {prescription.original_filename || "Prescription image"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {selectedPrescription && (
                <div className="mt-5 rounded-xl border border-indigo-deep/20 bg-indigo-soft/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-sm font-semibold text-ink">
                        {selectedPrescription.original_filename || "Prescription image"}
                      </p>
                      <p className="font-body text-xs text-ink-fog">Opened in the caregiver view</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPrescription(null)}
                      className="font-body text-xs font-semibold text-indigo-deep hover:underline"
                    >
                      Close
                    </button>
                  </div>
                  <img
                    src={selectedPrescription.image_url}
                    alt={selectedPrescription.original_filename || "Prescription"}
                    className="mt-4 max-h-[70vh] w-full rounded-lg bg-white object-contain"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {showMedicationForm && (
        <MedicationFormModal
          patientId={patient.id}
          onClose={() => setShowMedicationForm(false)}
          onSaved={() => {
            setShowMedicationForm(false);
            window.location.reload();
          }}
          actorLabel={details.profile?.full_name || "patient"}
        />
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-porcelain-dim px-3 py-3">
      <dt className="font-body text-xs text-ink-fog">{label}</dt>
      <dd className="mt-1 font-display text-lg font-semibold text-ink">{value}</dd>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="font-body text-xs text-ink-fog">{label}</dt>
      <dd className="mt-1 font-body text-sm text-ink">{value}</dd>
    </div>
  );
}
