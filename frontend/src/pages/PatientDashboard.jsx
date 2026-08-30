import DashboardLayout from "../components/layout/DashboardLayout";
import DoseRing, { WINDOWS } from "../components/common/DoseRing";
import { useAuth } from "../context/AuthContext";
import { timeOfDayGreeting } from "../utils/greeting";

export default function PatientDashboard() {
  const { profile } = useAuth();
  const { label, window: currentWindow } = timeOfDayGreeting();

  const firstName = (profile?.full_name || "there").split(" ")[0];

  const taken = {
    dawn: currentWindow !== "dawn" && currentWindow !== "night",
  };

  return (
    <DashboardLayout
      eyebrow="Patient"
      title={`${label}, ${firstName}`}
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">

        {/* Dose Summary */}
        <div className="card flex flex-col items-center gap-4 text-center">
          <DoseRing
            size={180}
            taken={taken}
          />

          <div>
            <p className="font-display text-2xl font-semibold text-ink">
              0 / 4
            </p>

            <p className="font-body text-[13px] text-ink-fog">
              doses logged today
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">

          {/* Profile Information */}
          <div className="card">

            <h2 className="font-display text-base font-semibold text-ink">
              Your profile
            </h2>

            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">

              {/* Role */}
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                  Role
                </dt>

                <dd className="mt-1 font-body text-sm font-semibold text-ink">
                  Patient
                </dd>
              </div>

              {/* Blood Group */}
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                  Blood group
                </dt>

                <dd className="mt-1 font-body text-sm font-semibold text-ink">
                  {profile?.blood_group || "Not set"}
                </dd>
              </div>

              {/* Emergency Contact */}
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                  Emergency contact
                </dt>

                <dd className="mt-1 font-body text-sm font-semibold text-ink">
                  {profile?.emergency_contact_name || "Not set"}
                </dd>
              </div>

              {/* Conditions */}
              <div>
                <dt className="font-mono text-[11px] uppercase tracking-wide text-ink-fog">
                  Conditions
                </dt>

                <dd className="mt-1 font-body text-sm font-semibold text-ink">
                  {profile?.conditions?.length
                    ? profile.conditions.join(", ")
                    : "None added"}
                </dd>
              </div>

            </dl>

            {/* Profile Link */}
            <a
              href="/profile"
              className="mt-5 inline-block font-body text-[13px] font-semibold text-indigo hover:text-indigo-deep"
            >
              Complete your profile →
            </a>

          </div>

          {/* Feature Cards */}
          <div className="grid gap-4 sm:grid-cols-3">

            {/* Medications */}
            <div className="rounded-2xl border border-ink/15 bg-white/60 p-4">

              <h3 className="font-display text-sm font-semibold text-ink">
                Medications
              </h3>

              <p className="mt-1 font-body text-[13px] text-ink-fog">
                Add medicines and dosage schedules.
              </p>

            </div>

            {/* Smart Reminders */}
            <div className="rounded-2xl border border-ink/15 bg-white/60 p-4">

              <h3 className="font-display text-sm font-semibold text-ink">
                Smart reminders
              </h3>

              <p className="mt-1 font-body text-[13px] text-ink-fog">
                Morning, afternoon and night reminders.
              </p>

            </div>

            {/* Refill Prediction */}
            <div className="rounded-2xl border border-ink/15 bg-white/60 p-4">

              <h3 className="font-display text-sm font-semibold text-ink">
                Refill prediction
              </h3>

              <p className="mt-1 font-body text-[13px] text-ink-fog">
                AI-estimated days until refill.
              </p>

            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}