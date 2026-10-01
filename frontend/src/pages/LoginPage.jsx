import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { PillIcon } from "../components/icons";

export default function LoginPage() {
  const { signIn, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("patient");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user } = await signIn({ email, password });

      if (!user?.id) {
        throw new Error("Unable to identify the signed-in account.");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        await signOut();
        throw new Error(
          "Your account profile could not be loaded. Please contact the administrator."
        );
      }

      if (profile.role !== selectedRole) {
        await signOut();
        throw new Error(
          `This account is registered as ${profile.role}, not ${selectedRole}. Please select the correct role.`
        );
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <div className="w-full space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-200">
              <PillIcon className="h-8 w-8" />
            </div>

            <h1 className="heading text-3xl font-bold tracking-tight text-gray-900">
              Welcome to PillSync
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Sign in to manage your medicines and stay on track.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/50 sm:p-7"
          >
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Sign in as
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "patient", label: "Patient" },
                    { value: "caregiver", label: "Caregiver" },
                    { value: "admin", label: "Admin" },
                  ].map((roleOption) => (
                    <button
                      key={roleOption.value}
                      type="button"
                      onClick={() => setSelectedRole(roleOption.value)}
                      className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${
                        selectedRole === roleOption.value
                          ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:border-teal-300 hover:bg-teal-50/50"
                      }`}
                    >
                      {roleOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-teal-200 transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
          >
            Continue with Google
          </button>

          <div className="flex items-center justify-between px-1 text-sm">
            <Link
              to="/forgot-password"
              className="font-semibold text-teal-600 transition hover:text-teal-700"
            >
              Forgot password?
            </Link>

            <Link
              to="/register"
              className="font-semibold text-teal-600 transition hover:text-teal-700"
            >
              Create account
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400">
            Secure medication management with PillSync
          </p>
        </div>
      </div>
    </div>
  );
}
