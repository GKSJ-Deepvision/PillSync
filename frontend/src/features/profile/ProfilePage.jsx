import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserIcon } from "../../components/icons";

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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-teal-50">
      <div className="max-w-lg mx-auto p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-violet-200">
          <UserIcon className="w-6 h-6" />
        </div>
        <h1 className="heading text-2xl font-bold text-gray-900">Profile</h1>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

      <label className="block">
        <span className="text-sm text-gray-600">Full name</span>
        <input
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">Phone</span>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </label>

      <label className="block">
        <span className="text-sm text-gray-600">Date of birth</span>
        <input
          type="date"
          name="date_of_birth"
          value={form.date_of_birth ?? ""}
          onChange={handleChange}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
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
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
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
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </label>

          <fieldset className="border border-gray-200 rounded-lg p-3 space-y-3">
            <legend className="text-sm text-gray-600 px-1">
              Emergency contact
            </legend>
            <input
              name="emergency_contact_name"
              placeholder="Name"
              value={form.emergency_contact_name}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            <input
              name="emergency_contact_phone"
              placeholder="Phone"
              value={form.emergency_contact_phone}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            <input
              name="emergency_contact_relation"
              placeholder="Relation"
              value={form.emergency_contact_relation}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </fieldset>
        </>
      )}

      <button
        type="submit"
        className="w-full bg-gradient-to-br from-violet-500 to-teal-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow"
      >
        Save profile
      </button>

      {status === "saved" && (
        <p className="text-emerald-600 text-sm font-medium">Profile saved.</p>
      )}
      {status === "error" && (
        <p className="text-red-600 text-sm">
          Something went wrong saving your profile.
        </p>
      )}
      </form>
      </div>
    </div>
  );
}
