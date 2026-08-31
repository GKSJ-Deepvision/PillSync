import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      setStatus("sent");
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send reset link
        </button>
      </form>
      {status === "sent" && (
        <p className="text-green-600 text-sm">
          Check your email for a reset link.
        </p>
      )}
      {status && status !== "sent" && (
        <p className="text-red-600 text-sm">{status}</p>
      )}
    </div>
  );
}
