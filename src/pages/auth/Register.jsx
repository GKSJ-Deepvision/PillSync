import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { Heart, Shield, Users } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(''); // patient, caregiver, admin
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: 'patient',
      title: 'Patient',
      desc: 'Track medications and dosage adherence logs.',
      icon: Heart,
      activeColor: 'border-emerald-500 bg-emerald-50/50 text-emerald-700 ring-2 ring-emerald-500/20',
      inactiveColor: 'border-slate-200 hover:border-slate-350 bg-white text-slate-500 hover:bg-slate-50/30'
    },
    {
      id: 'caregiver',
      title: 'Caregiver',
      desc: 'Link to patients, receive alerts, and verify schedules.',
      icon: Users,
      activeColor: 'border-violet-500 bg-violet-50/50 text-violet-700 ring-2 ring-violet-500/20',
      inactiveColor: 'border-slate-200 hover:border-slate-350 bg-white text-slate-500 hover:bg-slate-50/30'
    },
    {
      id: 'admin',
      title: 'Admin',
      desc: 'Oversee system registry records and logs audit history.',
      icon: Shield,
      activeColor: 'border-rose-500 bg-rose-50/50 text-rose-700 ring-2 ring-rose-500/20',
      inactiveColor: 'border-slate-200 hover:border-slate-350 bg-white text-slate-500 hover:bg-slate-50/30'
    }
  ];

  const validateForm = () => {
    if (!name.trim()) {
      setError('Full Name is required.');
      return false;
    }
    if (!email) {
      setError('Email address is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!role) {
      setError('Please select your user registration role.');
      return false;
    }
    if (!password) {
      setError('Password is required.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await register({ name, email, phone, role, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. The email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-xl p-8 max-w-lg w-full relative">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Create Account</h2>
        <p className="text-xs text-slate-400 mt-1.5">Join PillSync to coordinate intelligent care</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            type="text"
            id="name"
            placeholder="John Doe"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Phone Number"
            type="tel"
            id="phone"
            placeholder="+1 (555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          id="email"
          placeholder="yourname@pillsync.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        {/* Role Selector Card Deck */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-semibold text-slate-600 flex items-center">
            Register As <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  disabled={loading}
                  className={`flex flex-col items-center text-center p-3.5 border rounded-xl transition-all focus:outline-none ${
                    isSelected ? r.activeColor : r.inactiveColor
                  }`}
                  data-testid={`role-btn-${r.id}`}
                >
                  <Icon className="h-5 w-5 mb-2" />
                  <span className="text-xs font-bold block">{r.title}</span>
                  <span className="text-[10px] leading-snug text-slate-400 mt-1 block font-medium">
                    {r.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Password"
            type="password"
            id="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <Input
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            placeholder="••••••••"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          loading={loading}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-8 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-brand-600 hover:text-brand-700 font-bold transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
