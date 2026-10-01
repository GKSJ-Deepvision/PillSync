import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import { getApiErrorMessage } from '../../services/api';

const EditProfile = () => {
  const { updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile({
        phone_number: phone,
        date_of_birth: dob || null,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
      });
      updateUserProfile(updatedUser);
      setSuccess('Profile updated successfully.');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" data-testid="edit-profile-page">
      <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Edit Profile</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Emergency contact name" id="emergency-name" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} disabled={loading} />
            <Input label="Emergency contact phone" id="emergency-phone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} disabled={loading} />
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
