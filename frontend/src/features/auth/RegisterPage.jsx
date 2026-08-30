import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/layout/AuthLayout";

const ROLES = [
  {
    value: "patient",
    label: "Patient",
    blurb: "Track your own doses, conditions and refill dates.",
  },
  {
    value: "caregiver",
    label: "Caregiver",
    blurb: "Watch over medication adherence for someone you care for.",
  },
];

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: "patient" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await signUp(form);
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data?.session) {
      navigate("/dashboard", { replace: true });
    } else {
      // Email confirmation is required by the Supabase project settings.
      setDone(true);
    }
  };

  if (done) {
    return (
      <AuthLayout eyebrow="One step left" title="Check your inbox" subtitle="">
        <div className="card">
          <p className="font-body text-[15px] text-ink">
            We sent a confirmation link to <span className="font-semibold">{form.email}</span>.
            Follow it to activate your account, then sign in.
          </p>
          <Link to="/login" className="btn-primary mt-6 w-full">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      subtitle="Set up in under a minute — no card, no clinic code needed."
    >
      {error && (
        <div className="mb-5 rounded-xl border border-rose/20 bg-rose-soft px-4 py-3 font-body text-sm text-rose-deep">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <span className="field-label">I am a</span>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm({ ...form, role: r.value })}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  form.role === r.value
                    ? "border-indigo bg-indigo-soft"
                    : "border-ink/10 bg-white hover:border-ink/20"
                }`}
              >
                <span className="block font-body text-sm font-semibold text-ink">{r.label}</span>
                <span className="mt-0.5 block font-body text-[12px] text-ink-fog">{r.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className="field-label">
            Full name
          </label>
          <input
            id="fullName"
            required
            autoComplete="name"
            className="field-input"
            placeholder="Jordan Rivera"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="field-input"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            className="field-input"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center font-body text-sm text-ink-fog">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-ink hover:text-indigo">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
