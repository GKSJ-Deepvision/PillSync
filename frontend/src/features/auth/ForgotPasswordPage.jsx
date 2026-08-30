import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/layout/AuthLayout";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: resetError } = await sendPasswordReset(email);
    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <AuthLayout
      eyebrow="Password reset"
      title="Reset your password"
      subtitle="We'll email you a secure link to choose a new one."
    >
      {sent ? (
        <div className="card">
          <p className="font-body text-[15px] text-ink">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link
            is on its way.
          </p>
          <Link to="/login" className="btn-primary mt-6 w-full">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="rounded-xl border border-rose/20 bg-rose-soft px-4 py-3 font-body text-sm text-rose-deep">
              {error}
            </div>
          )}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center font-body text-sm text-ink-fog">
        <Link to="/login" className="font-semibold text-ink hover:text-indigo">
          ← Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
