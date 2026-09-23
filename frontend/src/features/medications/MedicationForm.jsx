import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeftIcon } from "../../components/icons";

const CATEGORIES = [
  "Blood Pressure",
  "Diabetes",
  "Thyroid",
  "Antibiotics",
  "Vitamins",
  "Heart",
  "Other",
];

export default function MedicationForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const location = useLocation();
  const prefill = location.state?.prefill;

  const [form, setForm] = useState({
    name: prefill?.name || "",
    dosage: prefill?.dosage || "",
    frequency_per_day: 1,
    reminder_times: ["08:00"],
    disease_category: "",
    quantity_on_hand: "",
    notes: "",
  });

  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isEditing) return;

    supabase
      .from("medications")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            ...data,
            reminder_times: (data.reminder_times || []).map((t) =>
              t.slice(0, 5)
            ),
            quantity_on_hand: data.quantity_on_hand ?? "",
          });
        }
      });
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleTimeChange = (index, value) => {
    setForm((f) => {
      const times = [...f.reminder_times];
      times[index] = value;

      return {
        ...f,
        reminder_times: times,
        frequency_per_day: times.length,
      };
    });
  };

  const addTimeSlot = () => {
    setForm((f) => ({
      ...f,
      reminder_times: [...f.reminder_times, "08:00"],
      frequency_per_day: f.reminder_times.length + 1,
    }));
  };

  const removeTimeSlot = (index) => {
    setForm((f) => {
      const times = f.reminder_times.filter((_, i) => i !== index);

      return {
        ...f,
        reminder_times: times,
        frequency_per_day: times.length,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");

    const payload = {
      patient_id: user.id,
      name: form.name,
      dosage: form.dosage,
      frequency_per_day:
        Number(form.frequency_per_day) || form.reminder_times.length,
      reminder_times: form.reminder_times.filter(Boolean),
      disease_category: form.disease_category || null,
      quantity_on_hand:
        form.quantity_on_hand === ""
          ? null
          : Number(form.quantity_on_hand),
      notes: form.notes || null,
    };

    const query = isEditing
      ? supabase.from("medications").update(payload).eq("id", id)
      : supabase.from("medications").insert(payload);

    const { error } = await query;

    if (error) {
      setStatus("error");
      return;
    }

    navigate("/medications");
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full px-6 py-6 md:px-8 lg:px-10">
        {/* Back */}
        <Link
          to="/medications"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-teal-600 transition-colors mb-6"
        >
          <ArrowLeftIcon />
          Medicines
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {isEditing ? "Edit medicine" : "Add medicine"}
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                {isEditing
                  ? "Update your medicine details and reminders."
                  : "Add a medicine to keep your medication schedule organized."}
              </p>

              {prefill && (
                <p className="text-sm text-violet-600 bg-violet-50 px-3 py-2 rounded-lg mt-2 inline-block">
                  Pre-filled from your scanned label — double-check before saving.
                </p>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-teal-50 border border-teal-100 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-teal-500" />
              <span className="text-sm font-medium text-teal-700">
                Medication details
              </span>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Form */}
          <div className="xl:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8"
            >
              {/* Basic information */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900">
                  Basic information
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enter the medicine name and dosage.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Medicine name */}
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">
                    Medicine name
                  </span>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Paracetamol"
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
                  />
                </label>

                {/* Dosage */}
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    Dosage
                  </span>

                  <input
                    name="dosage"
                    value={form.dosage}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 500mg or 1 tablet"
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
                  />
                </label>

                {/* Category */}
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    Category
                  </span>

                  <select
                    name="disease_category"
                    value={form.disease_category}
                    onChange={handleChange}
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
                  >
                    <option value="">— None —</option>

                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Quantity */}
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    Quantity on hand
                  </span>

                  <input
                    type="number"
                    min="0"
                    name="quantity_on_hand"
                    value={form.quantity_on_hand}
                    onChange={handleChange}
                    placeholder="e.g. 20"
                    className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition"
                  />

                  <p className="text-xs text-gray-400 mt-1.5">
                    Optional
                  </p>
                </label>
              </div>

              {/* Reminder section */}
              <div className="border-t border-gray-100 mt-8 pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Reminder schedule
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Choose when you want to be reminded to take this
                      medicine.
                    </p>
                  </div>

                  <div className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-600">
                    {form.reminder_times.length}{" "}
                    {form.reminder_times.length === 1 ? "reminder" : "reminders"}
                  </div>
                </div>

                <div className="space-y-3">
                  {form.reminder_times.map((time, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                          Reminder {index + 1}
                        </label>

                        <input
                          type="time"
                          value={time}
                          onChange={(e) =>
                            handleTimeChange(index, e.target.value)
                          }
                          className="w-full sm:w-auto border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                        />
                      </div>

                      {form.reminder_times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="self-end mb-1 text-sm font-medium text-rose-500 hover:text-rose-600 px-2 py-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700"
                >
                  <span className="text-lg leading-none">+</span>
                  Add another time
                </button>
              </div>

              {/* Notes */}
              <div className="border-t border-gray-100 mt-8 pt-8">
                <label className="block">
                  <span className="text-lg font-semibold text-gray-900">
                    Notes
                  </span>

                  <p className="text-sm text-gray-500 mt-1 mb-4">
                    Add any additional information about this medicine.
                  </p>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="e.g. Take after food..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 transition resize-none"
                  />
                </label>
              </div>

              {/* Error */}
              {status === "error" && (
                <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                  <p className="text-sm font-medium text-rose-600">
                    Something went wrong while saving this medicine. Please
                    try again.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-100 mt-8 pt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Link
                  to="/medications"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={status === "saving"}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold shadow-sm hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {status === "saving"
                    ? "Saving..."
                    : isEditing
                      ? "Save changes"
                      : "Add medicine"}
                </button>
              </div>
            </form>
          </div>

          {/* Information panel */}
          <div className="space-y-6">
            {/* Quick overview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                <span className="text-xl">💊</span>
              </div>

              <h2 className="text-lg font-semibold text-gray-900">
                Keep your medicine details updated
              </h2>

              <p className="text-sm text-gray-500 mt-2 leading-6">
                Accurate medicine information helps PillSync organize your
                reminders and medication history.
              </p>

              <div className="mt-6 space-y-4">
                <InfoItem
                  title="Medicine name"
                  text="Use the name shown on the prescription or package."
                />

                <InfoItem
                  title="Dosage"
                  text="Include the strength or amount, such as 500mg or 1 tablet."
                />

                <InfoItem
                  title="Reminder times"
                  text="Add each time you normally take the medicine."
                />

                <InfoItem
                  title="Quantity"
                  text="Keep the current quantity updated for refill tracking."
                />
              </div>
            </div>

            {/* Reminder summary */}
            <div className="bg-teal-50 rounded-2xl border border-teal-100 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                Reminder summary
              </p>

              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {form.reminder_times.length}
                </span>

                <span className="text-sm text-gray-500 mb-1">
                  {form.reminder_times.length === 1
                    ? "dose per day"
                    : "doses per day"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {form.reminder_times.map((time, index) => (
                  <span
                    key={`${time}-${index}`}
                    className="px-3 py-1.5 rounded-lg bg-white border border-teal-100 text-sm font-medium text-teal-700"
                  >
                    {time || "--:--"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ title, text }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1.5 w-2 h-2 rounded-full bg-teal-500 shrink-0" />

      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-1 leading-5">{text}</p>
      </div>
    </div>
  );
}