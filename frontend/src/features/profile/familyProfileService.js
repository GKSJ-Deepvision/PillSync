// Family Profile API Service with REST integration & Local Storage fallback

const STORAGE_KEY = 'pillsync_family_profiles';
const ACTIVE_PROFILE_KEY = 'pillsync_active_profile_id';

const DEFAULT_PROFILES = [
  {
    id: 1,
    name: 'Self (Primary)',
    relationship: 'Self',
    gender: 'Male',
    dob: '1990-05-15',
    phone: '+1 555-0192',
    email: 'patient@pillsync.local',
    medical_conditions: 'Hypertension',
    allergies: 'Penicillin',
    emergency_contact_name: 'Sarah Smith',
    emergency_contact_phone: '+1 555-9988',
    is_primary: true
  },
  {
    id: 2,
    name: 'Eleanor Vance (Spouse)',
    relationship: 'Spouse',
    gender: 'Female',
    dob: '1992-08-22',
    phone: '+1 555-0193',
    email: 'eleanor@pillsync.local',
    medical_conditions: 'Asthma',
    allergies: 'None',
    emergency_contact_name: 'Self',
    emergency_contact_phone: '+1 555-0192',
    is_primary: false
  },
  {
    id: 3,
    name: 'Arthur Smith (Elderly Parent)',
    relationship: 'Parent',
    gender: 'Male',
    dob: '1955-11-03',
    phone: '+1 555-0194',
    email: 'arthur@pillsync.local',
    medical_conditions: 'Diabetes Type 2, Blood Pressure',
    allergies: 'Sulfa Drugs',
    emergency_contact_name: 'Self',
    emergency_contact_phone: '+1 555-0192',
    is_primary: false
  }
];

export const getStoredProfiles = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load profiles from local storage', err);
    return DEFAULT_PROFILES;
  }
};

export const getActiveProfile = () => {
  const profiles = getStoredProfiles();
  const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (activeId) {
    const found = profiles.find(p => String(p.id) === String(activeId));
    if (found) return found;
  }
  return profiles[0] || null;
};

export const setActiveProfileId = (profileId) => {
  localStorage.setItem(ACTIVE_PROFILE_KEY, String(profileId));
};

export const saveProfile = (profileObj) => {
  const profiles = getStoredProfiles();
  if (profileObj.id) {
    const updated = profiles.map(p => p.id === profileObj.id ? { ...p, ...profileObj } : p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return profileObj;
  } else {
    const newProfile = {
      ...profileObj,
      id: Date.now(),
      is_primary: profiles.length === 0
    };
    const updated = [...profiles, newProfile];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newProfile;
  }
};

export const deleteProfile = (profileId) => {
  const profiles = getStoredProfiles();
  const filtered = profiles.filter(p => p.id !== profileId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  if (String(getActiveProfile()?.id) === String(profileId)) {
    if (filtered.length > 0) {
      setActiveProfileId(filtered[0].id);
    }
  }
  return filtered;
};
