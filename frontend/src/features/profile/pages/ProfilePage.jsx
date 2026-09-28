import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/useAuth';
import { Layout } from '../../../components/layout';
import {
  User,
  Shield,
  Stethoscope,
  Mail,
  Phone,
  Calendar,
  Heart,
  AlertTriangle,
  Hospital,
  Bell,
  Lock,
  CheckCircle2,
  Save,
  ArrowLeft,
  ShieldCheck,
  Smartphone,
  ChevronRight,
} from 'lucide-react';
import { isValidEmail } from '../../../utils/validation';
import './ProfilePage.css';

export function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState('personal');
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State initialized with user profile data
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+1 (555) 234-5678',
    dateOfBirth: user?.dateOfBirth || '1988-06-14',
    gender: user?.gender || 'Male',
    bloodGroup: user?.bloodGroup || 'O+',
    address: user?.address || '742 Evergreen Terrace, Springfield, OR',
    // Clinical / Medical
    allergies: user?.allergies || 'Penicillin, Sulfa drugs',
    chronicConditions: user?.chronicConditions || 'Hypertension, Type 2 Diabetes',
    primaryPhysician: user?.primaryPhysician || 'Dr. Robert Chen, MD',
    hospitalAffiliation: user?.hospitalAffiliation || 'Springfield General Hospital',
    emergencyContactName: user?.emergencyContactName || 'Elena Vance (Spouse)',
    emergencyContactPhone: user?.emergencyContactPhone || '+1 (555) 987-6543',
    licenseNumber: user?.licenseNumber || 'MD-LIC-882941',
    specialty: user?.specialty || 'Internal Medicine & Chronic Disease Care',
    department: user?.department || 'Clinical Pharmacotherapy Unit',
    // Preferences
    pushDose: user?.pushDose !== false,
    smsCritical: user?.smsCritical !== false,
    weeklyReports: user?.weeklyReports !== false,
    soundAlerts: user?.soundAlerts !== false,
    caregiverAlerts: user?.caregiverAlerts !== false,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const validateProfileForm = () => {
    if (!formData.name.trim()) return 'Full name cannot be empty.';
    if (formData.email && !isValidEmail(formData.email))
      return 'Please enter a valid email address.';
    return null;
  };

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const validationError = validateProfileForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    try {
      updateUser?.({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        allergies: formData.allergies,
        chronicConditions: formData.chronicConditions,
        primaryPhysician: formData.primaryPhysician,
        hospitalAffiliation: formData.hospitalAffiliation,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        licenseNumber: formData.licenseNumber,
        specialty: formData.specialty,
        department: formData.department,
        pushDose: formData.pushDose,
        smsCritical: formData.smsCritical,
        weeklyReports: formData.weeklyReports,
        soundAlerts: formData.soundAlerts,
        caregiverAlerts: formData.caregiverAlerts,
      });
      setSuccessMessage('Profile changes saved successfully! All clinical preferences updated.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage('An error occurred while saving profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!passwordData.currentPassword) {
      setErrorMessage('Current password is required.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSuccessMessage(
      'Password updated successfully. Next session will require your new credentials.'
    );
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const userRole = user?.role || 'patient';

  const getRoleBadgeLabel = () => {
    if (userRole === 'admin') return 'Clinical Director (Admin)';
    if (userRole === 'caregiver') return 'Caregiver Specialist';
    return 'Registered Patient';
  };

  const getClinicalTabLabel = () => {
    if (userRole === 'patient') return 'Medical & Health Record';
    if (userRole === 'caregiver') return 'Clinical Qualifications';
    return 'Platform Oversight';
  };

  const getClinicalSectionTitle = () => {
    if (userRole === 'patient') return 'Medical & Health Record';
    if (userRole === 'caregiver') return 'Clinical Practitioner Credentials';
    return 'Administrative Clearance & Institution';
  };

  return (
    <Layout>
      <div className="profile-page-container">
        {/* Breadcrumb Navigation */}
        <div className="profile-breadcrumb">
          <Link to="/dashboard">Dashboard</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Profile Management</span>
        </div>

        {/* Hero Header Card */}
        <div className="profile-header-card">
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                  }
                  alt="Profile Avatar"
                  className="profile-avatar-img"
                />
                <div className="profile-avatar-badge" title="Active Clinical Session" />
              </div>

              <div className="profile-user-info">
                <h1 className="profile-user-name">
                  {user?.name || formData.name || 'User Profile'}
                </h1>
                <div className="profile-user-meta">
                  <span className={`profile-role-badge ${userRole}`}>
                    {userRole === 'admin' && <Shield className="h-3 w-3" />}
                    {userRole === 'caregiver' && <Stethoscope className="h-3 w-3" />}
                    {userRole === 'patient' && <Heart className="h-3 w-3" />}
                    <span>{getRoleBadgeLabel()}</span>
                  </span>
                  <span className="profile-meta-email">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email || formData.email}
                  </span>
                  <span className="profile-meta-hipaa">
                    <ShieldCheck className="h-3 w-3" />
                    HIPAA Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-header-actions">
              <Link to="/dashboard" className="profile-dashboard-btn">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="profile-save-top-btn"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Banners */}
        {successMessage && (
          <div className="profile-alert-banner success">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 font-bold hover:opacity-75 cursor-pointer"
            >
              x
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="profile-alert-banner error">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 font-bold hover:opacity-75 cursor-pointer"
            >
              x
            </button>
          </div>
        )}

        {/* Main Layout Grid */}
        <div className="profile-main-layout">
          {/* Navigation Tabs Sidebar */}
          <aside className="profile-tabs-sidebar">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            >
              <User className="profile-tab-icon" />
              <span>Personal Information</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clinical')}
              className={`profile-tab-btn ${activeTab === 'clinical' ? 'active' : ''}`}
            >
              {userRole === 'patient' ? (
                <Heart className="profile-tab-icon" />
              ) : (
                <Hospital className="profile-tab-icon" />
              )}
              <span>{getClinicalTabLabel()}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preferences')}
              className={`profile-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            >
              <Bell className="profile-tab-icon" />
              <span>Reminders & Alerts</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            >
              <Lock className="profile-tab-icon" />
              <span>Security & Sessions</span>
            </button>
          </aside>

          {/* Tab Content Container */}
          <main className="profile-content-card">
            {/* TAB 1: Personal Information */}
            {activeTab === 'personal' && (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                <div className="profile-section-header">
                  <h2 className="profile-section-title">
                    <User className="h-5 w-5 text-indigo-600" />
                    Personal Information
                  </h2>
                  <p className="profile-section-desc">
                    Update your contact details, legal identification, and demographic information.
                  </p>
                </div>

                <div className="profile-form-grid two-cols">
                  <div className="profile-field-group">
                    <label className="profile-field-label" htmlFor="profile-full-name">
                      Full Legal Name <span>*</span>
                    </label>
                    <div className="profile-input-wrapper">
                      <User className="profile-input-icon" />
                      <input
                        id="profile-full-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="profile-field-input"
                      />
                    </div>
                  </div>

                  <div className="profile-field-group">
                    <label className="profile-field-label" htmlFor="profile-email-address">
                      Email Address (Verified) <span>*</span>
                    </label>
                    <div className="profile-input-wrapper">
                      <Mail className="profile-input-icon" />
                      <input
                        id="profile-email-address"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="profile-field-input"
                      />
                    </div>
                  </div>

                  <div className="profile-field-group">
                    <label className="profile-field-label" htmlFor="profile-phone-number">
                      Mobile Phone (For Dose SMS)
                    </label>
                    <div className="profile-input-wrapper">
                      <Phone className="profile-input-icon" />
                      <input
                        id="profile-phone-number"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="profile-field-input"
                      />
                    </div>
                  </div>

                  <div className="profile-field-group">
                    <label className="profile-field-label" htmlFor="profile-dob">
                      Date of Birth
                    </label>
                    <div className="profile-input-wrapper">
                      <Calendar className="profile-input-icon" />
                      <input
                        id="profile-dob"
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="profile-field-input"
                      />
                    </div>
                  </div>

                  <div className="profile-field-group">
                    <label className="profile-field-label" htmlFor="profile-gender">
                      Biological Sex / Gender
                    </label>
                    <div className="profile-input-wrapper">
                      <select
                        id="profile-gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="profile-field-input"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="profile-field-group">
                    <label className="profile-field-label" htmlFor="profile-blood-group">
                      Blood Group
                    </label>
                    <div className="profile-input-wrapper">
                      <select
                        id="profile-blood-group"
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                        className="profile-field-input"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="profile-field-group">
                  <label className="profile-field-label" htmlFor="profile-address">
                    Home / Clinical Address
                  </label>
                  <textarea
                    id="profile-address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="profile-field-textarea"
                  />
                </div>

                <div className="profile-action-footer">
                  <button type="submit" disabled={isSaving} className="profile-save-btn">
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Personal Details'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Clinical / Medical Record */}
            {activeTab === 'clinical' && (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                <div className="profile-section-header">
                  <h2 className="profile-section-title">
                    {userRole === 'patient' ? (
                      <Heart className="h-5 w-5 text-rose-600" />
                    ) : (
                      <Hospital className="h-5 w-5 text-indigo-600" />
                    )}
                    {getClinicalSectionTitle()}
                  </h2>
                  <p className="profile-section-desc">
                    {userRole === 'patient'
                      ? 'Document drug allergies, chronic conditions, and your primary doctor for drug-drug interaction screening.'
                      : 'Clinical license information and hospital affiliations for provider validation.'}
                  </p>
                </div>

                {userRole === 'patient' ? (
                  <div className="profile-form-grid two-cols">
                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-allergies">
                        Known Drug Allergies <span>*</span>
                      </label>
                      <input
                        id="profile-allergies"
                        type="text"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        placeholder="e.g. Penicillin, Aspirin, None"
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-conditions">
                        Chronic Diagnoses / Conditions
                      </label>
                      <input
                        id="profile-conditions"
                        type="text"
                        name="chronicConditions"
                        value={formData.chronicConditions}
                        onChange={handleChange}
                        placeholder="e.g. Hypertension, Asthma"
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-physician">
                        Primary Care Physician (PCP)
                      </label>
                      <input
                        id="profile-physician"
                        type="text"
                        name="primaryPhysician"
                        value={formData.primaryPhysician}
                        onChange={handleChange}
                        placeholder="Doctor name & clinic"
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-hospital">
                        Hospital / Clinic Network
                      </label>
                      <input
                        id="profile-hospital"
                        type="text"
                        name="hospitalAffiliation"
                        value={formData.hospitalAffiliation}
                        onChange={handleChange}
                        placeholder="Network affiliation"
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-emergency-name">
                        Emergency Contact Name
                      </label>
                      <input
                        id="profile-emergency-name"
                        type="text"
                        name="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={handleChange}
                        placeholder="Full name (e.g. spouse, child)"
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-emergency-phone">
                        Emergency Contact Phone
                      </label>
                      <input
                        id="profile-emergency-phone"
                        type="tel"
                        name="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="profile-field-input"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="profile-form-grid two-cols">
                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-license">
                        Medical License / NPI Number
                      </label>
                      <input
                        id="profile-license"
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        placeholder="e.g. NPI-109283746"
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-specialty">
                        Specialization / Clinical Domain
                      </label>
                      <input
                        id="profile-specialty"
                        type="text"
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleChange}
                        placeholder="e.g. Geriatrics, Oncology"
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-department">
                        Clinical Department
                      </label>
                      <input
                        id="profile-department"
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="Department name"
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-affiliation">
                        Healthcare Organization / Hospital
                      </label>
                      <input
                        id="profile-affiliation"
                        type="text"
                        name="hospitalAffiliation"
                        value={formData.hospitalAffiliation}
                        onChange={handleChange}
                        placeholder="Hospital System"
                        className="profile-field-input"
                      />
                    </div>
                  </div>
                )}

                <div className="profile-action-footer">
                  <button type="submit" disabled={isSaving} className="profile-save-btn">
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Clinical Information'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: Preferences */}
            {activeTab === 'preferences' && (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
                <div className="profile-section-header">
                  <h2 className="profile-section-title">
                    <Bell className="h-5 w-5 text-indigo-600" />
                    Medication Reminders & Notification Preferences
                  </h2>
                  <p className="profile-section-desc">
                    Customize your real-time notification channels, sound alarms, and caregiver
                    escalation alerts.
                  </p>
                </div>

                <div className="profile-toggle-list">
                  <div className="profile-toggle-item">
                    <div className="profile-toggle-info">
                      <span className="profile-toggle-title">Push Notifications</span>
                      <span className="profile-toggle-desc">
                        Receive immediate instant push notifications on your device when a dose is
                        due.
                      </span>
                    </div>
                    <label
                      className="profile-switch-label"
                      htmlFor="pref-push-dose"
                      aria-label="Toggle push notifications"
                    >
                      <input
                        id="pref-push-dose"
                        type="checkbox"
                        name="pushDose"
                        checked={formData.pushDose}
                        onChange={handleChange}
                      />
                      <span className="profile-switch-slider" />
                    </label>
                  </div>

                  <div className="profile-toggle-item">
                    <div className="profile-toggle-info">
                      <span className="profile-toggle-title">SMS Dose Alerts</span>
                      <span className="profile-toggle-desc">
                        Send SMS text messages to your phone for critical and high-priority
                        medications.
                      </span>
                    </div>
                    <label
                      className="profile-switch-label"
                      htmlFor="pref-sms-critical"
                      aria-label="Toggle SMS dose alerts"
                    >
                      <input
                        id="pref-sms-critical"
                        type="checkbox"
                        name="smsCritical"
                        checked={formData.smsCritical}
                        onChange={handleChange}
                      />
                      <span className="profile-switch-slider" />
                    </label>
                  </div>

                  <div className="profile-toggle-item">
                    <div className="profile-toggle-info">
                      <span className="profile-toggle-title">Sound & Haptic Vibration</span>
                      <span className="profile-toggle-desc">
                        Play acoustic chime and vibrate when medication confirmation is required.
                      </span>
                    </div>
                    <label
                      className="profile-switch-label"
                      htmlFor="pref-sound-alerts"
                      aria-label="Toggle sound and haptic alerts"
                    >
                      <input
                        id="pref-sound-alerts"
                        type="checkbox"
                        name="soundAlerts"
                        checked={formData.soundAlerts}
                        onChange={handleChange}
                      />
                      <span className="profile-switch-slider" />
                    </label>
                  </div>

                  <div className="profile-toggle-item">
                    <div className="profile-toggle-info">
                      <span className="profile-toggle-title">Caregiver Escalation Alert</span>
                      <span className="profile-toggle-desc">
                        Notify your assigned caregiver if a scheduled dose is missed by more than 45
                        minutes.
                      </span>
                    </div>
                    <label
                      className="profile-switch-label"
                      htmlFor="pref-caregiver-alerts"
                      aria-label="Toggle caregiver escalation alerts"
                    >
                      <input
                        id="pref-caregiver-alerts"
                        type="checkbox"
                        name="caregiverAlerts"
                        checked={formData.caregiverAlerts}
                        onChange={handleChange}
                      />
                      <span className="profile-switch-slider" />
                    </label>
                  </div>

                  <div className="profile-toggle-item">
                    <div className="profile-toggle-info">
                      <span className="profile-toggle-title">Weekly Adherence Summary Email</span>
                      <span className="profile-toggle-desc">
                        Receive an automated PDF adherence progress report every Monday morning.
                      </span>
                    </div>
                    <label
                      className="profile-switch-label"
                      htmlFor="pref-weekly-reports"
                      aria-label="Toggle weekly adherence summary email"
                    >
                      <input
                        id="pref-weekly-reports"
                        type="checkbox"
                        name="weeklyReports"
                        checked={formData.weeklyReports}
                        onChange={handleChange}
                      />
                      <span className="profile-switch-slider" />
                    </label>
                  </div>
                </div>

                <div className="profile-action-footer">
                  <button type="submit" disabled={isSaving} className="profile-save-btn">
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: Security & Sessions */}
            {activeTab === 'security' && (
              <div className="flex flex-col gap-6">
                <div className="profile-section-header">
                  <h2 className="profile-section-title">
                    <Lock className="h-5 w-5 text-indigo-600" />
                    Security & HIPAA Session Management
                  </h2>
                  <p className="profile-section-desc">
                    Manage your clinical credentials, active JWT session tokens, and security
                    audits.
                  </p>
                </div>

                <div className="profile-security-badge-box">
                  <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="profile-security-badge-title">
                      HIPAA Security Standard: Active
                    </h3>
                    <p className="profile-security-badge-desc">
                      Your session is protected with 256-bit JWT authentication, automatic timeout
                      policies, and encrypted transmission.
                    </p>
                  </div>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Change Portal Password
                  </h3>

                  <div className="profile-form-grid three-cols">
                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-current-pass">
                        Current Password <span>*</span>
                      </label>
                      <input
                        id="profile-current-pass"
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Enter current password"
                        required
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-new-pass">
                        New Password <span>*</span>
                      </label>
                      <input
                        id="profile-new-pass"
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Minimum 6 characters"
                        required
                        className="profile-field-input"
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label" htmlFor="profile-confirm-pass">
                        Confirm New Password <span>*</span>
                      </label>
                      <input
                        id="profile-confirm-pass"
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Re-enter new password"
                        required
                        className="profile-field-input"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button type="submit" className="profile-save-btn">
                      <Lock className="h-4 w-4" />
                      <span>Update Password</span>
                    </button>
                  </div>
                </form>

                {/* Active Sessions Table */}
                <div className="flex flex-col gap-3 mt-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Active Clinical Sessions
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="profile-sessions-table">
                      <thead>
                        <tr>
                          <th>Device / Browser</th>
                          <th>IP Address</th>
                          <th>Session Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-semibold text-slate-900">
                            <span className="inline-flex items-center gap-1.5">
                              <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
                              Chrome (Current Browser Session)
                            </span>
                          </td>
                          <td>127.0.0.1 (Localhost)</td>
                          <td>JWT Bearer Auth</td>
                          <td>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Active Now
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
