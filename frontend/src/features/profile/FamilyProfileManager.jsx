import React, { useState, useEffect } from 'react';
import { Users, Plus, UserCheck, Trash2, Edit3, HeartPulse, CheckCircle2 } from 'lucide-react';
import { getStoredProfiles, saveProfile, deleteProfile, getActiveProfile, setActiveProfileId } from './familyProfileService';

export default function FamilyProfileManager() {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Child',
    gender: 'Select Gender',
    dob: '',
    phone: '',
    email: '',
    medical_conditions: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  const refreshData = () => {
    const list = getStoredProfiles();
    const active = getActiveProfile();
    setProfiles(list);
    setActiveProfile(active);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    const payload = {
      ...formData,
      id: editingId || undefined
    };

    saveProfile(payload);
    window.dispatchEvent(new Event('pillsync_profiles_updated'));
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      relationship: 'Child',
      gender: 'Select Gender',
      dob: '',
      phone: '',
      email: '',
      medical_conditions: '',
      allergies: '',
      emergency_contact_name: '',
      emergency_contact_phone: ''
    });
    refreshData();
  };

  const handleStartEdit = (profile) => {
    setEditingId(profile.id);
    setFormData({
      name: profile.name,
      relationship: profile.relationship || 'Child',
      gender: profile.gender || 'Select Gender',
      dob: profile.dob || '',
      phone: profile.phone || '',
      email: profile.email || '',
      medical_conditions: profile.medical_conditions || '',
      allergies: profile.allergies || '',
      emergency_contact_name: profile.emergency_contact_name || '',
      emergency_contact_phone: profile.emergency_contact_phone || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    deleteProfile(id);
    window.dispatchEvent(new Event('pillsync_profiles_updated'));
    refreshData();
  };

  const handleSwitchActive = (id) => {
    setActiveProfileId(id);
    window.dispatchEvent(new Event('pillsync_profiles_updated'));
    window.dispatchEvent(new Event('pillsync_profile_changed'));
    refreshData();
  };

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#DC143C', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} /> Multiple Family Member Patient Profiles
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Manage separate health records, medicine schedules, and intake history for your entire family.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              name: '', relationship: 'Child', gender: 'Select Gender', dob: '', phone: '', email: '',
              medical_conditions: '', allergies: '', emergency_contact_name: '', emergency_contact_phone: ''
            });
            setShowForm(!showForm);
          }}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> {showForm ? 'Cancel' : 'Add Family Profile'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleFormSubmit} style={{ padding: '16px', backgroundColor: '#FFF0F3', borderRadius: '12px', border: '1px solid #FFD6DC', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#881337', fontWeight: 800 }}>
            {editingId ? '✏️ Edit Family Profile' : '➕ Add New Family Member Profile'}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Arthur Smith"
                required
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Relationship *</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option value="Self">Self (Primary)</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent / Elderly</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other Family Member</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option value="Select Gender">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Medical Conditions</label>
              <input
                type="text"
                value={formData.medical_conditions}
                onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                placeholder="e.g. Diabetes, Hypertension"
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Allergies</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Peanuts"
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              {editingId ? 'Save Profile Changes' : 'Save New Member Profile'}
            </button>
          </div>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {profiles.map(p => {
          const isActive = String(p.id) === String(activeProfile?.id);
          return (
            <div
              key={p.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: isActive ? '2px solid #DC143C' : '1px solid #e2e8f0',
                backgroundColor: isActive ? '#FFF0F3' : 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{p.name}</span>
                  <span className="badge-snoozed" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                    {p.relationship}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>🩺 Conditions: {p.medical_conditions || 'None logged'}</span>
                  <span>⚠️ Allergies: {p.allergies || 'None logged'}</span>
                  <span>📞 Emergency: {p.emergency_contact_phone || p.phone || 'Not set'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => handleSwitchActive(p.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isActive ? '#DC143C' : '#e2e8f0',
                    color: isActive ? 'white' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {isActive ? '✓ Active Profile' : 'Switch to Profile'}
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleStartEdit(p)}
                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: '4px' }}
                    title="Edit Member"
                  >
                    <Edit3 size={16} />
                  </button>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Delete Member"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
