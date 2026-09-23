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
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
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

        payload.emergency_contact_name =
          form.emergency_contact_name;

        payload.emergency_contact_phone =
          form.emergency_contact_phone;

        payload.emergency_contact_relation =
          form.emergency_contact_relation;
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
    <div className="w-full min-h-screen bg-slate-50">
      <div className="w-full px-5 py-6 md:px-8 lg:px-10">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-500 to-teal-500 p-6 md:p-8 mb-6 shadow-lg shadow-violet-100">

          <div className="absolute -right-10 -top-16 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute right-32 -bottom-24 w-56 h-56 rounded-full bg-white/10" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-5">

            {/* Profile icon */}
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <UserIcon className="w-8 h-8 text-white" />
            </div>

            <div>
              <p className="text-violet-100 text-sm font-medium mb-1">
                Account settings
              </p>

              <h1 className="text-2xl md:text-3xl font-bold text-white">
                My Profile
              </h1>

              <p className="text-sm text-violet-50 mt-2">
                Manage your personal information and emergency details.
              </p>
            </div>

            {/* Role */}
            <div className="md:ml-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20 text-white text-sm font-semibold backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                {role === "patient" ? "Patient" : role || "User"}
              </span>
            </div>

          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Profile form */}
          <div className="xl:col-span-2">

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >

              {/* Personal information */}
              <div className="p-6 md:p-7">

                <div className="flex items-center gap-3 mb-6">

                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Personal information
                    </h2>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Keep your basic details up to date.
                    </p>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  {/* Full name */}
                  <label className="block md:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Full name
                    </span>

                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
                    />
                  </label>

                  {/* Phone */}
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Phone number
                    </span>

                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
                    />
                  </label>

                  {/* Date of birth */}
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Date of birth
                    </span>

                    <input
                      type="date"
                      name="date_of_birth"
                      value={form.date_of_birth ?? ""}
                      onChange={handleChange}
                      className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
                    />
                  </label>

                </div>
              </div>

              {/* Patient information */}
              {role === "patient" && (
                <>
                  <div className="border-t border-slate-100" />

                  <div className="p-6 md:p-7">

                    <div className="flex items-center gap-3 mb-6">

                      <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                        <span className="text-lg">❤️</span>
                      </div>

                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Health information
                        </h2>

                        <p className="text-xs text-slate-500 mt-0.5">
                          Information that can help with your medication
                          management.
                        </p>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                      {/* Blood group */}
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          Blood group
                        </span>

                        <input
                          name="blood_group"
                          value={form.blood_group}
                          onChange={handleChange}
                          placeholder="Example: O+"
                          className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
                        />
                      </label>

                      {/* Conditions */}
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          Medical conditions
                        </span>

                        <input
                          name="conditions"
                          value={form.conditions}
                          onChange={handleChange}
                          placeholder="Diabetes, thyroid, etc."
                          className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 transition"
                        />

                        <p className="text-xs text-slate-400 mt-1.5">
                          Separate multiple conditions with commas.
                        </p>
                      </label>

                    </div>
                  </div>

                  {/* Emergency contact */}
                  <div className="border-t border-slate-100" />

                  <div className="p-6 md:p-7">

                    <div className="flex items-center gap-3 mb-6">

                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <span className="text-lg">🚨</span>
                      </div>

                      <div>
                        <h2 className="text-lg font-bold text-slate-900">
                          Emergency contact
                        </h2>

                        <p className="text-xs text-slate-500 mt-0.5">
                          Add someone who can be contacted in an emergency.
                        </p>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                      {/* Contact name */}
                      <label className="block md:col-span-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Contact name
                        </span>

                        <input
                          name="emergency_contact_name"
                          value={form.emergency_contact_name}
                          onChange={handleChange}
                          placeholder="Enter emergency contact name"
                          className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                        />
                      </label>

                      {/* Contact phone */}
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          Contact phone
                        </span>

                        <input
                          type="tel"
                          name="emergency_contact_phone"
                          value={form.emergency_contact_phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                        />
                      </label>

                      {/* Relation */}
                      <label className="block">
                        <span className="text-sm font-semibold text-slate-700">
                          Relation
                        </span>

                        <input
                          name="emergency_contact_relation"
                          value={form.emergency_contact_relation}
                          onChange={handleChange}
                          placeholder="Example: Parent, Spouse"
                          className="mt-2 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition"
                        />
                      </label>

                    </div>
                  </div>
                </>
              )}

              {/* Save section */}
              <div className="border-t border-slate-100 bg-slate-50/70 p-6 md:p-7">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                  <div>
                    {status === "saved" && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-sm font-bold">✓</span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            Profile saved
                          </p>

                          <p className="text-xs text-emerald-600/80">
                            Your information has been updated.
                          </p>
                        </div>
                      </div>
                    )}

                    {status === "error" && (
                      <div className="flex items-center gap-2 text-rose-600">
                        <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
                          <span className="text-sm font-bold">!</span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            Unable to save
                          </p>

                          <p className="text-xs text-rose-600/80">
                            Please try again.
                          </p>
                        </div>
                      </div>
                    )}

                    {!status && (
                      <p className="text-xs text-slate-400">
                        Make sure your information is correct before saving.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={status === "saving"}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-teal-500 hover:from-violet-600 hover:to-teal-600 text-white text-sm font-semibold shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  >
                    {status === "saving" ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        Save profile
                      </>
                    )}
                  </button>

                </div>
              </div>

            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Profile summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

              <div className="flex items-center gap-4">

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {form.full_name
                    ? form.full_name.charAt(0).toUpperCase()
                    : "U"}
                </div>

                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900 truncate">
                    {form.full_name || "Your name"}
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    {role === "patient" ? "PillSync Patient" : "PillSync User"}
                  </p>
                </div>

              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Account role
                  </span>

                  <span className="px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 text-xs font-semibold capitalize">
                    {role || "user"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Profile status
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>

              </div>
            </div>

            {/* Privacy information */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6">

              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-xl">🔒</span>
              </div>

              <h3 className="font-bold text-slate-900">
                Keep your information updated
              </h3>

              <p className="text-sm text-slate-600 mt-2 leading-6">
                Accurate profile and emergency contact information helps
                PillSync provide a more useful medication management
                experience.
              </p>

            </div>

            {/* Health reminder */}
            {role === "patient" && (
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6">

                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <span className="text-xl">💚</span>
                </div>

                <h3 className="font-bold text-slate-900">
                  Your health details
                </h3>

                <p className="text-sm text-slate-600 mt-2 leading-6">
                  Keep your blood group, medical conditions, and emergency
                  contact details current.
                </p>

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}