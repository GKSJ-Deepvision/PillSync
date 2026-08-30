import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const { profile, role, updateProfile, user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    blood_group: "",
    conditions: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
  });
  const [status, setStatus] = useState({ type: null, message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      date_of_birth: profile.date_of_birth || "",
      blood_group: profile.blood_group || "",
      conditions: (profile.conditions || []).join(", "),
      emergency_contact_name: profile.emergency_contact_name || "",
      emergency_contact_phone: profile.emergency_contact_phone || "",
      emergency_contact_relation: profile.emergency_contact_relation || "",
    });
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: null, message: "" });

    const updates = {
      full_name: form.full_name,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
      blood_group: form.blood_group || null,
      conditions: form.conditions
        ? form.conditions.split(",").map((c) => c.trim()).filter(Boolean)
        : [],
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      emergency_contact_relation: form.emergency_contact_relation || null,
    };

    const { error } = await updateProfile(updates);
    setSaving(false);
    setStatus(
      error
        ? { type: "error", message: error.message }
        : { type: "success", message: "Profile saved." }
    );
  };

  return (
    <DashboardLayout eyebrow="Account" title="My profile">
      <div className="max-w-2xl">
        <div className="card mb-6 flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-ink-fog">Signed in as</p>
            <p className="font-body text-[15px] font-semibold text-ink">{user?.email}</p>
          </div>
          <span className="badge bg-indigo-soft text-indigo-deep">{role}</span>
        </div>

        {status.type && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 font-body text-sm ${
              status.type === "success"
                ? "border-mint/30 bg-mint-soft text-mint-deep"
                : "border-rose/20 bg-rose-soft text-rose-deep"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Basic details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="full_name">Full name</label>
                <input
                  id="full_name"
                  className="field-input"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  className="field-input"
                  placeholder="+1 555 000 1234"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="field-label" htmlFor="dob">Date of birth</label>
                <input
                  id="dob"
                  type="date"
                  className="field-input"
                  value={form.date_of_birth || ""}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                />
              </div>
              {role === "patient" && (
                <div>
                  <label className="field-label" htmlFor="blood_group">Blood group</label>
                  <input
                    id="blood_group"
                    className="field-input"
                    placeholder="O+"
                    value={form.blood_group}
                    onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          {role === "patient" && (
            <div className="border-t border-ink/5 pt-5">
              <h2 className="font-display text-base font-semibold text-ink">Conditions</h2>
              <p className="mt-1 font-body text-[13px] text-ink-fog">
                Comma-separated — e.g. hypertension, type 2 diabetes, thyroid.
              </p>
              <input
                className="field-input mt-3"
                placeholder="hypertension, type 2 diabetes"
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              />
            </div>
          )}

          {role === "patient" && (
            <div className="border-t border-ink/5 pt-5">
              <h2 className="font-display text-base font-semibold text-ink">Emergency contact</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="field-label" htmlFor="ec_name">Name</label>
                  <input
                    id="ec_name"
                    className="field-input"
                    value={form.emergency_contact_name}
                    onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="ec_phone">Phone</label>
                  <input
                    id="ec_phone"
                    className="field-input"
                    value={form.emergency_contact_phone}
                    onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="ec_relation">Relation</label>
                  <input
                    id="ec_relation"
                    className="field-input"
                    placeholder="Spouse"
                    value={form.emergency_contact_relation}
                    onChange={(e) => setForm({ ...form, emergency_contact_relation: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end border-t border-ink/5 pt-5">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
