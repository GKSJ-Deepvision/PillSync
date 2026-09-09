import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PillIcon } from "../components/icons";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-200">
            <PillIcon className="w-7 h-7" />
          </div>
          <h1 className="heading text-2xl font-bold text-gray-900">PillSync</h1>
          <p className="text-sm text-gray-500">Sign in to manage your medicines</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
            required
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            Sign in
          </button>
        </form>

        <button
          onClick={signInWithGoogle}
          className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 shadow-sm"
        >
          Continue with Google
        </button>

        <div className="flex justify-between text-sm px-1">
          <Link to="/forgot-password" className="text-teal-600 font-medium">
            Forgot password?
          </Link>
          <Link to="/register" className="text-teal-600 font-medium">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
