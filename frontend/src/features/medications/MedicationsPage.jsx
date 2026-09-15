import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { listMedications } from "./api";
import MedicationFormModal from "./MedicationFormModal";
import { predictRefill, REFILL_STATUS_LABEL } from "../../lib/refillPrediction";

const STATUS_DOT = {
  ok: "#22D3A6",
  low: "#F59E0B",
  empty: "#E23F58",
  "no-schedule": "#7C879C",
};

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${ampm}`;
}

export default function MedicationsPage() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMedication, setModalMedication] = useState(undefined); // undefined = closed, null = new

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await listMedications(user.id);
    setMedications(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const closeModal = () => setModalMedication(undefined);
  const handleSaved = () => {
    closeModal();
    refresh();
  };

  return (
    <DashboardLayout eyebrow="Medicine management" title="Your medicines">
      <div className="mb-6 flex items-center justify-between">
        <p className="max-w-md font-body text-sm text-ink-fog">
          Add every medicine you take, its strength, and when you take it. PillSync builds your
          reminders and refill alerts from this list automatically.
        </p>
        <button type="button" onClick={() => setModalMedication(null)} className="btn-brand shrink-0">
          + Add medicine
        </button>
      </div>

      {loading ? (
        <p className="font-body text-sm text-ink-fog">Loading your medicines…</p>
      ) : medications.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-display text-base font-semibold text-ink">No medicines yet</p>
          <p className="max-w-sm font-body text-sm text-ink-fog">
            Add your first medicine to start getting reminders, dose tracking and refill alerts.
          </p>
          <button type="button" onClick={() => setModalMedication(null)} className="btn-brand mt-2">
            + Add your first medicine
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {medications.map((med) => {
            const prediction = predictRefill({
              stockQuantity: med.stock_quantity,
              schedules: med.medication_schedules?.filter((s) => s.is_active) ?? [],
              refillLeadDays: med.refill_lead_days,
            });
            return (
              <button
                key={med.id}
                type="button"
                onClick={() => setModalMedication(med)}
                className="card flex flex-col items-start gap-3 text-left transition-transform hover:-translate-y-0.5"
              >
                <div className="flex w-full items-start justify-between">
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink">{med.name}</h3>
                    <p className="font-body text-[12px] text-ink-fog">
                      {[med.strength, med.form].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_DOT[prediction.status] }}
                    title={REFILL_STATUS_LABEL[prediction.status]}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(med.medication_schedules ?? [])
                    .slice()
                    .sort((a, b) => a.time_of_day.localeCompare(b.time_of_day))
                    .map((s) => (
                      <span key={s.id} className="chip">
                        {formatTime(s.time_of_day)} · {s.dose_quantity}
                      </span>
                    ))}
                </div>

                <div className="mt-auto flex w-full items-center justify-between border-t border-ink/5 pt-3">
                  <span className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                    {med.stock_quantity} in stock
                  </span>
                  <span className="font-body text-[12px] font-semibold" style={{ color: "var(--brand-deep)" }}>
                    {REFILL_STATUS_LABEL[prediction.status]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {modalMedication !== undefined && (
        <MedicationFormModal
          patientId={user.id}
          medication={modalMedication}
          onClose={closeModal}
          onSaved={handleSaved}
          onDeleted={handleSaved}
        />
      )}
    </DashboardLayout>
  );
}
