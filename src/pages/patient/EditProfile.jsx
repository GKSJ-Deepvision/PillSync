import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';

const EditProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [address, setAddress] = useState(user?.address || '');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile(user.id, {
        name,
        phone,
        dob,
        address
      });
      updateUserProfile(updatedUser);
      setSuccess('Profile updated successfully.');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" data-testid="edit-profile-page">
      <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Edit Profile</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              id="phone"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />

            <Input
              label="Date of Birth"
              type="date"
              id="dob"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col space-y-1.5 w-full">
            <label htmlFor="address" className="text-xs font-semibold text-slate-600">
              Residential Address
            </label>
            <textarea
              id="address"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
              placeholder="123 Health Ave, San Francisco, CA 94102"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm transition-all focus:outline-none focus:border-brand-500 focus:ring focus:ring-brand-100 focus:ring-opacity-40 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          <ErrorMessage message={error} onDismiss={() => setError('')} />
          
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-xs font-medium animate-fade-in" data-testid="success-banner">
              {success}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => navigate('/profile')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditProfile;
