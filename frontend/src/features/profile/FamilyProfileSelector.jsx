import React, { useState, useEffect } from 'react';
import { Users, User, HeartPulse, ChevronDown } from 'lucide-react';
import { getStoredProfiles, getActiveProfile, setActiveProfileId } from './familyProfileService';

export default function FamilyProfileSelector({ onProfileChange }) {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadProfiles = () => {
    const list = getStoredProfiles();
    const active = getActiveProfile();
    setProfiles(list);
    setActiveProfile(active);
  };

  useEffect(() => {
    loadProfiles();
    window.addEventListener('pillsync_profiles_updated', loadProfiles);
    return () => window.removeEventListener('pillsync_profiles_updated', loadProfiles);
  }, []);

  const handleSelect = (profile) => {
    setActiveProfileId(profile.id);
    setActiveProfile(profile);
    setIsOpen(false);
    if (onProfileChange) {
      onProfileChange(profile);
    }
    window.dispatchEvent(new Event('pillsync_profile_changed'));
  };

  if (!activeProfile) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          border: '1.5px solid #fecdd3',
          backgroundColor: '#FFF0F3',
          color: '#881337',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
          transition: 'all 0.2s ease'
        }}
      >
        <Users size={16} color="#DC143C" />
        <span>Family Profile: {activeProfile.name}</span>
        <span style={{ fontSize: '0.72rem', backgroundColor: '#DC143C', color: 'white', padding: '1px 6px', borderRadius: '10px' }}>
          {activeProfile.relationship}
        </span>
        <ChevronDown size={14} color="#881337" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            width: '260px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #fee2e2',
            boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
            zIndex: 1000,
            overflow: 'hidden',
            padding: '6px 0'
          }}
        >
          <div style={{ padding: '8px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Switch Family Profile
          </div>

          {profiles.map(p => {
            const isSelected = String(p.id) === String(activeProfile.id);
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '10px 16px',
                  border: 'none',
                  backgroundColor: isSelected ? '#FFF0F3' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#DC143C' : '#1e293b',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={14} color={isSelected ? '#DC143C' : '#64748b'} />
                  <span>{p.name}</span>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '6px', backgroundColor: isSelected ? '#DC143C' : '#f1f5f9', color: isSelected ? 'white' : '#64748b' }}>
                  {p.relationship}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
