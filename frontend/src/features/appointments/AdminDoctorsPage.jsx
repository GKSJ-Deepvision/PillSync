import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import ProfilePhoto from "../../components/common/ProfilePhoto";
import {
  createDoctorProfile,
  listDoctorAccounts,
  listDoctorProfiles,
  setDoctorActive,
} from "./api";

const EMPTY_FORM = {
  profile_id: "",
  doctor_name: "",
  experience_years: "",
  specialization: "",
  hospital_name: "",
  address: "",
};

export default function AdminDoctorsPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [accountResult, doctorResult] = await Promise.all([
      listDoctorAccounts(),
      listDoctorProfiles(),
    ]);
    setAccounts(accountResult.data);
    setDoctors(doctorResult.data);
    if (accountResult.error || doctorResult.error) {
      setMessage(accountResult.error?.message ?? doctorResult.error?.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingAccounts = accounts.filter(
    (account) => !doctors.some((doctor) => doctor.profile_id === account.id)
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const { error } = await createDoctorProfile({
      ...form,
      experience_years: Number(form.experience_years),
      created_by: user.id,
      is_active: true,
    });
    setBusy(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setForm(EMPTY_FORM);
    setMessage("Doctor listing is live and available for appointments.");
    await load();
  };

  const toggleDoctor = async (doctor) => {
    setMessage("");
    const { error } = await setDoctorActive(doctor.id, !doctor.is_active);
    if (error) {
      setMessage(error.message);
      return;
    }
    await load();
  };

  return (
    <DashboardLayout eyebrow="Directory administration" title="Doctor listings">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <section className="card">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Verified doctors</h2>
              <p className="mt-1 font-body text-sm text-ink-fog">
                Only active listings appear in patient search.
              </p>
            </div>
            <span className="badge bg-mint-soft text-mint-deep">{doctors.filter((d) => d.is_active).length} bookable</span>
          </div>

          {doctors.length === 0 ? (
            <p className="rounded-xl bg-porcelain-dim px-4 py-5 font-body text-sm text-ink-fog">
              No doctor listings yet.
            </p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {doctors.map((doctor) => (
                <li key={doctor.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProfilePhoto
                      src={doctor.avatar_url}
                      name={doctor.doctor_name}
                      className="h-10 w-10"
                    />
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold text-ink">{doctor.doctor_name}</p>
                      <p className="mt-1 font-body text-[13px] text-ink-fog">
                        {doctor.specialization} · {doctor.experience_years} years
                      </p>
                      <p className="font-body text-[13px] text-ink-fog">
                        {doctor.hospital_name} · {doctor.address}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleDoctor(doctor)}
                    className={`rounded-lg px-3 py-2 font-body text-xs font-semibold ${
                      doctor.is_active
                        ? "bg-rose-soft text-rose-deep"
                        : "bg-mint-soft text-mint-deep"
                    }`}
                  >
                    {doctor.is_active ? "Unpublish" : "Publish"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card h-fit">
          <h2 className="font-display text-base font-semibold text-ink">Add a doctor</h2>
          <p className="mt-1 font-body text-sm text-ink-fog">
            The doctor must first create an account and select Doctor at registration.
          </p>
          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            <label className="field-label">
              Doctor account
              <select
                required
                className="field-input mt-1"
                value={form.profile_id}
                onChange={(event) => setForm({ ...form, profile_id: event.target.value })}
              >
                <option value="">Select account</option>
                {pendingAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.full_name || "Unnamed doctor"}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Doctor name
              <input
                required
                className="field-input mt-1"
                value={form.doctor_name}
                onChange={(event) => setForm({ ...form, doctor_name: event.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="field-label">
                Years of experience
                <input
                  required
                  type="number"
                  min="0"
                  className="field-input mt-1"
                  value={form.experience_years}
                  onChange={(event) => setForm({ ...form, experience_years: event.target.value })}
                />
              </label>
              <label className="field-label">
                Specialization
                <input
                  required
                  className="field-input mt-1"
                  value={form.specialization}
                  onChange={(event) => setForm({ ...form, specialization: event.target.value })}
                />
              </label>
            </div>
            <label className="field-label">
              Hospital or clinic
              <input
                required
                className="field-input mt-1"
                value={form.hospital_name}
                onChange={(event) => setForm({ ...form, hospital_name: event.target.value })}
              />
            </label>
            <label className="field-label">
              Address
              <textarea
                required
                rows="2"
                className="field-input mt-1 resize-y"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />
            </label>
            <button type="submit" disabled={busy || pendingAccounts.length === 0} className="btn-primary w-full">
              {busy ? "Publishing…" : "Add doctor listing"}
            </button>
          </form>
          {pendingAccounts.length === 0 && (
            <p className="mt-3 font-body text-xs text-ink-fog">No unlisted doctor accounts are waiting.</p>
          )}
          {message && <p className="mt-3 font-body text-sm text-ink-fog">{message}</p>}
        </section>
      </div>
    </DashboardLayout>
  );
}