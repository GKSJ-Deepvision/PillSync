import { useState } from "react";
import MedicationAutocomplete from "../../components/common/MedicationAutocomplete";
import DaysOfWeekPicker from "../../components/common/DaysOfWeekPicker";
import { createMedication, updateMedication, replaceSchedules, deleteMedication } from "./api";

const FORMS = ["tablet", "capsule", "syrup", "injection", "drops", "inhaler", "cream", "patch", "other"];

function emptySchedule() {
  return { key: crypto.randomUUID(), label: "Dose", time_of_day: "08:00", dose_quantity: 1, days_of_week: [0, 1, 2, 3, 4, 5, 6] };
}

function toFormState(medication) {
  if (!medication) {
    return {
      name: "",
      generic_name: "",
      strength: "",
      form: "tablet",
      instructions: "",
      stock_quantity: 30,
      low_stock_threshold: 5,
      refill_lead_days: 5,
      schedules: [emptySchedule()],
    };
  }
  return {
    name: medication.name,
    generic_name: medication.generic_name || "",
    strength: medication.strength || "",
    form: medication.form || "tablet",
    instructions: medication.instructions || "",
    stock_quantity: medication.stock_quantity,
    low_stock_threshold: medication.low_stock_threshold,
    refill_lead_days: medication.refill_lead_days,
    schedules: medication.medication_schedules?.length
      ? medication.medication_schedules.map((s) => ({
          key: s.id,
          label: s.label,
          time_of_day: s.time_of_day?.slice(0, 5) ?? "08:00",
          dose_quantity: s.dose_quantity,
          days_of_week: s.days_of_week,
        }))
      : [emptySchedule()],
  };
}

export default function MedicationFormModal({ patientId, medication, onClose, onSaved, onDeleted, actorLabel = "patient" }) {
  const [form, setForm] = useState(() => toFormState(medication));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const isEditing = Boolean(medication);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const updateSchedule = (key, patch) =>
    setForm((f) => ({ ...f, schedules: f.schedules.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));

  const addSchedule = () => setForm((f) => ({ ...f, schedules: [...f.schedules, emptySchedule()] }));
  const removeSchedule = (key) =>
    setForm((f) => ({ ...f, schedules: f.schedules.filter((s) => s.key !== key) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Medicine name is required.");
      return;
    }
    if (!form.schedules.length) {
      setError("Add at least one dosage time.");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      generic_name: form.generic_name.trim() || null,
      strength: form.strength.trim() || null,
      form: form.form,
      instructions: form.instructions.trim() || null,
      stock_quantity: Number(form.stock_quantity) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 0,
      refill_lead_days: Number(form.refill_lead_days) || 0,
    };

    const { data: med, error: medError } = isEditing
      ? await updateMedication(medication.id, payload)
      : await createMedication(patientId, payload);

    if (medError) {
      setError(medError.message);
      setSaving(false);
      return;
    }

    const { error: schedError } = await replaceSchedules(med.id, patientId, form.schedules);
    setSaving(false);

    if (schedError) {
      setError(schedError.message);
      return;
    }

    onSaved();
  };

  const handleDelete = async () => {
    if (!medication) return;
    if (!window.confirm(`Remove ${medication.name} and its full dose history? This can't be undone.`)) return;
    setSaving(true);
    const { error: delError } = await deleteMedication(medication.id);
    setSaving(false);
    if (delError) {
      setError(delError.message);
      return;
    }
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-soft sm:max-w-lg sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">
            {isEditing ? "Edit medicine" : `Add a medicine for ${actorLabel}`}
          </h2>
          <button type="button" onClick={onClose} className="text-ink-fog hover:text-ink" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="field-label">Medicine name</label>
            <MedicationAutocomplete
              value={form.name}
              onChange={(name) => set({ name })}
              onSelectSuggestion={(m) =>
                set({
                  name: m.name,
                  generic_name: m.generic_name,
                  form: m.form,
                  strength: m.common_strengths?.[0] ?? "",
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Strength</label>
              <input
                className="field-input"
                placeholder="e.g. 500 mg"
                value={form.strength}
                onChange={(e) => set({ strength: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Form</label>
              <select className="field-input" value={form.form} onChange={(e) => set({ form: e.target.value })}>
                {FORMS.map((f) => (
                  <option key={f} value={f}>
                    {f[0].toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">Instructions (optional)</label>
            <input
              className="field-input"
              placeholder="e.g. Take with food"
              value={form.instructions}
              onChange={(e) => set({ instructions: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="field-label">In stock</label>
              <input
                type="number"
                min="0"
                className="field-input"
                value={form.stock_quantity}
                onChange={(e) => set({ stock_quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Low-stock at</label>
              <input
                type="number"
                min="0"
                className="field-input"
                value={form.low_stock_threshold}
                onChange={(e) => set({ low_stock_threshold: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Refill buffer (days)</label>
              <input
                type="number"
                min="0"
                className="field-input"
                value={form.refill_lead_days}
                onChange={(e) => set({ refill_lead_days: e.target.value })}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="field-label mb-0">Dosage schedule</label>
              <button
                type="button"
                onClick={addSchedule}
                className="font-body text-[13px] font-semibold"
                style={{ color: "var(--brand-deep)" }}
              >
                + Add time
              </button>
            </div>

            <div className="space-y-3">
              {form.schedules.map((s) => (
                <div key={s.key} className="rounded-xl border border-ink/10 p-3">
                  <div className="mb-2 grid grid-cols-3 gap-2">
                    <input
                      className="field-input py-2 text-[13px]"
                      placeholder="Label"
                      value={s.label}
                      onChange={(e) => updateSchedule(s.key, { label: e.target.value })}
                    />
                    <input
                      type="time"
                      className="field-input py-2 text-[13px]"
                      value={s.time_of_day}
                      onChange={(e) => updateSchedule(s.key, { time_of_day: e.target.value })}
                    />
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      className="field-input py-2 text-[13px]"
                      value={s.dose_quantity}
                      onChange={(e) => updateSchedule(s.key, { dose_quantity: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <DaysOfWeekPicker
                      value={s.days_of_week}
                      onChange={(days_of_week) => updateSchedule(s.key, { days_of_week })}
                    />
                    {form.schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSchedule(s.key)}
                        className="font-body text-[12px] font-medium text-rose"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="font-body text-[13px] text-rose">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            {isEditing ? (
              <button type="button" onClick={handleDelete} disabled={saving} className="font-body text-[13px] font-semibold text-rose">
                Delete medicine
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-brand">
                {saving ? "Saving…" : "Save medicine"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
