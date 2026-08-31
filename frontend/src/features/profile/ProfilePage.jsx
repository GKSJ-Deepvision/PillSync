import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const { profile, role, updateProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    date_of_birth: profile?.date_of_birth ?? "",
    blood_group: profile?.blood_group ?? "",
    conditions: (profile?.conditions ?? []).join(", "),
    emergency_contact_name: profile?.emergency_contact_name ?? "",
    emergency_contact_phone: profile?.emergency_contact_phone ?? "",
    emergency_contact_relation: profile?.emergency_contact_relation ?? "",
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    try {
      const payload = {
        full_name: form.full_name,
        phone: form.phone,
        date_of_birth: form.date_of_birth || null,
      };
      if (role === "patient") {
        payload.blood_group = form.blood_group;
        payload.conditions = form.conditions
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
        payload.emergency_contact_name = form.emergency_contact_name;
        payload.emergency_contact_phone = form.emergency_contact_phone;
        payload.emergency_contact_relation = form.emergency_contact_relation;
      }
      await updateProfile(payload);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>

      <label className="block">
        <span className="text-sm text-gray-600">Full name</span>
        <input
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">Phone</span>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">Date of birth</span>
        <input
          type="date"
          name="date_of_birth"
          value={form.date_of_birth ?? ""}
          onChange={handleChange}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>

      {role === "patient" && (
        <>
          <label className="block">
            <span className="text-sm text-gray-600">Blood group</span>
            <input
              name="blood_group"
              value={form.blood_group}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">
              Conditions (comma-separated)
            </span>
            <input
              name="conditions"
              value={form.conditions}
              onChange={handleChange}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <fieldset className="border rounded p-3 space-y-3">
            <legend className="text-sm text-gray-600 px-1">
              Emergency contact
            </legend>
            <input
              name="emergency_contact_name"
              placeholder="Name"
              value={form.emergency_contact_name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
            <input
              name="emergency_contact_phone"
              placeholder="Phone"
              value={form.emergency_contact_phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
            <input
              name="emergency_contact_relation"
              placeholder="Relation"
              value={form.emergency_contact_relation}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </fieldset>
        </>
      )}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Save profile
      </button>

      {status === "saved" && (
        <p className="text-green-600 text-sm">Profile saved.</p>
      )}
      {status === "error" && (
        <p className="text-red-600 text-sm">
          Something went wrong saving your profile.
        </p>
      )}
    </form>
  );
}
