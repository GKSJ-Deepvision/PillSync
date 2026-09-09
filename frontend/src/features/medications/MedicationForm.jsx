import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeftIcon } from "../../components/icons";
import { Link } from "react-router-dom";

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
  const { id } = useParams(); // present when editing
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    name: "",
    dosage: "",
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
            reminder_times: (data.reminder_times || []).map((t) => t.slice(0, 5)),
            quantity_on_hand: data.quantity_on_hand ?? "",
          });
        }
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleTimeChange = (index, value) => {
    setForm((f) => {
      const times = [...f.reminder_times];
      times[index] = value;
      return { ...f, reminder_times: times };
    });
  };

  const addTimeSlot = () => {
    setForm((f) => ({ ...f, reminder_times: [...f.reminder_times, "08:00"] }));
  };

  const removeTimeSlot = (index) => {
    setForm((f) => ({
      ...f,
      reminder_times: f.reminder_times.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    const payload = {
      patient_id: user.id,
      name: form.name,
      dosage: form.dosage,
      frequency_per_day: Number(form.frequency_per_day) || form.reminder_times.length,
      reminder_times: form.reminder_times.filter(Boolean),
      disease_category: form.disease_category || null,
      quantity_on_hand: form.quantity_on_hand === "" ? null : Number(form.quantity_on_hand),
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50">
      <div className="max-w-lg mx-auto p-6 space-y-4">
      <Link to="/medications" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon /> Medicines
      </Link>
      <h1 className="heading text-2xl font-bold text-gray-900">
        {isEditing ? "Edit medicine" : "Add medicine"}
      </h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

      <label className="block">
        <span className="text-sm text-gray-600">Medicine name</span>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">Dosage (e.g. 500mg, 1 tablet)</span>
        <input
          name="dosage"
          value={form.dosage}
          onChange={handleChange}
          required
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">Category</span>
        <select
          name="disease_category"
          value={form.disease_category}
          onChange={handleChange}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        >
          <option value="">— none —</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <div>
        <span className="text-sm text-gray-600">Reminder times</span>
        <div className="space-y-2 mt-1">
          {form.reminder_times.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="time"
                value={t}
                onChange={(e) => handleTimeChange(i, e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
              />
              {form.reminder_times.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTimeSlot(i)}
                  className="text-rose-500 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTimeSlot}
            className="text-teal-600 text-sm font-medium"
          >
            + Add another time
          </button>
        </div>
      </div>

      <label className="block">
        <span className="text-sm text-gray-600">Quantity on hand (optional)</span>
        <input
          type="number"
          name="quantity_on_hand"
          value={form.quantity_on_hand}
          onChange={handleChange}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">Notes (optional)</span>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </label>

      <button
        type="submit"
        className="w-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        {isEditing ? "Save changes" : "Add medicine"}
      </button>

      {status === "error" && (
        <p className="text-rose-500 text-sm font-medium">Something went wrong saving this medicine.</p>
      )}
      </form>
      </div>
    </div>
  );
}
