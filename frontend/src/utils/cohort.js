import { isDemoEmail } from '../api/auth';

/**
 * Cohort management helper for PillSync.
 * Determines patient assignment to caregivers and retrieves the active cohort.
 */

export function isPatientAssignedToCaregiver(patient, caregiverUser) {
  if (!caregiverUser) return false;
  const role = (caregiverUser.role || '').toLowerCase();
  if (role === 'admin') return true;
  if (!patient) return false;

  const assigned = String(patient.assignedCaregiver || '')
    .trim()
    .toLowerCase();
  if (!assigned || assigned === 'unassigned') return false;

  const cName = caregiverUser.name ? String(caregiverUser.name).trim().toLowerCase() : '';
  const cEmail = caregiverUser.email ? String(caregiverUser.email).trim().toLowerCase() : '';
  const cUserPart = cEmail ? cEmail.split('@')[0] : '';

  // Match strictly against this caregiver's name, email, or username part
  return (
    (cName && assigned === cName) ||
    (cEmail && assigned === cEmail) ||
    (cUserPart && assigned === cUserPart) ||
    (cName && (assigned.includes(cName) || cName.includes(assigned))) ||
    (cUserPart && (assigned.includes(cUserPart) || cUserPart.includes(assigned)))
  );
}

export function getAllMergedPatients() {
  let allPatients = [];

  // 1. Registered users from database / local storage
  let registeredPatients = [];
  try {
    const rawUsers = localStorage.getItem('pillsync_registered_users');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      if (Array.isArray(users)) {
        registeredPatients = users
          .filter(
            (u) =>
              !isDemoEmail(u.email) &&
              (u.role || 'patient').toLowerCase() === 'patient' &&
              u.assignedCaregiver &&
              u.assignedCaregiver !== 'Unassigned'
          )
          .map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            condition: u.condition || 'General Monitoring',
            age: u.age || 48,
            gender: u.gender || 'Patient',
            adherence: u.adherence || 94,
            prescriptionsCount: u.prescriptionsCount || 1,
            phone: u.phone || '+1 555-0190',
            lastTaken: 'Today',
            assignedCaregiver: u.assignedCaregiver,
            avatar: u.avatar,
          }));
      }
    }
  } catch (err) {
    console.error(err);
  }

  // 2. Read pillsync_assigned_patients
  try {
    const raw = localStorage.getItem('pillsync_assigned_patients');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        allPatients = parsed.filter((p) => !isDemoEmail(p.email));
      }
    }
  } catch (err) {
    console.error(err);
  }

  // Merge map: index by normalized email, name, or id
  const mergedMap = new Map();
  allPatients.forEach((p) => {
    const key = (p.email || p.name || p.id || '').toLowerCase();
    if (key) mergedMap.set(key, p);
  });

  // Registered patients merge: keep exact caregiver assignment
  registeredPatients.forEach((rp) => {
    const key = (rp.email || rp.name || rp.id || '').toLowerCase();
    if (key && mergedMap.has(key)) {
      const existing = mergedMap.get(key);
      mergedMap.set(key, {
        ...existing,
        ...rp,
        assignedCaregiver: existing.assignedCaregiver || rp.assignedCaregiver,
      });
    } else if (key) {
      mergedMap.set(key, rp);
    }
  });

  return Array.from(mergedMap.values());
}

export function getCohortPatients(currentUser) {
  const allPatients = getAllMergedPatients();

  if (!currentUser) return allPatients;
  const role = (currentUser.role || '').toLowerCase();
  if (role === 'admin') return allPatients;
  if (role === 'caregiver') {
    // Strictly filter patients assigned to THIS specific caregiver
    return allPatients.filter((p) => isPatientAssignedToCaregiver(p, currentUser));
  }
  return allPatients;
}

export function getCohortPatientNames(currentUser) {
  const patients = getCohortPatients(currentUser);
  return ['All Patients', ...patients.map((p) => p.name)];
}
