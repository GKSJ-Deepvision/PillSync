/* eslint-disable no-unused-vars */
let currentPatientData = null;
let currentUserData = null;

async function fetchLiveProfile() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const [userRes, profileRes] = await Promise.allSettled([
      fetch('/api/v1/users/me/', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/v1/profiles/patients/me/', { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const el = (id) => document.getElementById(id);

    if (userRes.status === 'fulfilled' && userRes.value.ok) {
      currentUserData = await userRes.value.json();
      const initial = currentUserData.full_name ? currentUserData.full_name.charAt(0).toUpperCase() : 'U';
      if (el('pAvatar')) el('pAvatar').textContent = initial;
      if (el('pName')) el('pName').textContent = currentUserData.full_name || 'Patient';
      if (el('pEmail')) el('pEmail').textContent = currentUserData.email || '';
      if (el('fPhone-view')) el('fPhone-view').textContent = currentUserData.phone_number || '—';
      if (el('fPhone-input')) el('fPhone-input').value = currentUserData.phone_number || '';
    }

    if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
      currentPatientData = await profileRes.value.json();
      
      // Blood Group
      const bg = currentPatientData.blood_group || '—';
      if (el('fBlood-view')) el('fBlood-view').textContent = bg;
      if (el('fBlood-input')) el('fBlood-input').value = currentPatientData.blood_group || '';

      // Gender
      let gName = '—';
      if (currentPatientData.gender === 'F') gName = 'Female';
      else if (currentPatientData.gender === 'M') gName = 'Male';
      else if (currentPatientData.gender === 'O') gName = 'Other';
      if (el('fGender-view')) el('fGender-view').textContent = gName;
      if (el('fGender-input')) el('fGender-input').value = currentPatientData.gender || 'F';

      // Date of birth & age
      if (currentPatientData.date_of_birth) {
        if (el('fDob-view')) el('fDob-view').textContent = currentPatientData.date_of_birth;
        if (el('fDob-input')) el('fDob-input').value = currentPatientData.date_of_birth;
        const birthYear = new Date(currentPatientData.date_of_birth).getFullYear();
        const age = new Date().getFullYear() - birthYear;
        if (el('fAge-view')) el('fAge-view').textContent = `${age} years`;
        if (el('fAge-input')) el('fAge-input').value = age;
      } else {
        if (el('fDob-view')) el('fDob-view').textContent = '—';
        if (el('fAge-view')) el('fAge-view').textContent = '—';
      }

      // Patient conditions
      if (currentPatientData.patient_conditions && currentPatientData.patient_conditions.length > 0) {
        const condNames = currentPatientData.patient_conditions
          .map((c) => c.condition_name || c.condition)
          .join(', ');
        if (el('fConditions-view')) el('fConditions-view').textContent = condNames;
        if (el('fConditions-input')) el('fConditions-input').value = condNames;
      } else {
        if (el('fConditions-view')) el('fConditions-view').textContent = 'None reported';
        if (el('fConditions-input')) el('fConditions-input').value = '';
      }

      // Emergency Contact
      const emRows = document.getElementById('emergencyDetails');
      if (currentPatientData.emergency_contacts && currentPatientData.emergency_contacts.length > 0) {
        const ec = currentPatientData.emergency_contacts[0];
        if (el('fEmName')) el('fEmName').textContent = ec.name || '—';
        if (el('fEmRel')) el('fEmRel').textContent = ec.relationship_display || ec.relationship || 'Caregiver';
        if (el('fEmPhone')) el('fEmPhone').textContent = ec.phone_number || '—';
      } else {
        if (el('fEmName')) el('fEmName').textContent = 'No emergency contact added';
        if (el('fEmRel')) el('fEmRel').textContent = '—';
        if (el('fEmPhone')) el('fEmPhone').textContent = '—';
      }
    } else {
      // Clean fallback if no patient profile exists
      if (el('fBlood-view')) el('fBlood-view').textContent = '—';
      if (el('fAge-view')) el('fAge-view').textContent = '—';
      if (el('fConditions-view')) el('fConditions-view').textContent = 'None reported';
      if (el('fGender-view')) el('fGender-view').textContent = '—';
      if (el('fDob-view')) el('fDob-view').textContent = '—';
      if (el('fEmName')) el('fEmName').textContent = 'None';
      if (el('fEmRel')) el('fEmRel').textContent = '—';
      if (el('fEmPhone')) el('fEmPhone').textContent = '—';
    }
  } catch (err) {
    console.error('Error fetching live profile:', err);
  }
}

function toggleEdit() {
  ['Phone', 'Blood', 'Conditions'].forEach((f) => {
    const v = document.getElementById(`f${f}-view`);
    const e = document.getElementById(`f${f}-edit`);
    if (v) v.style.display = 'none';
    if (e) e.style.display = 'inline-block';
  });
  const actions = document.getElementById('editActions');
  const btn = document.getElementById('editBtn');
  if (actions) actions.style.display = 'flex';
  if (btn) btn.style.display = 'none';
}

function cancelEdit() {
  fetchLiveProfile();
  ['Phone', 'Blood', 'Conditions'].forEach((f) => {
    const v = document.getElementById(`f${f}-view`);
    const e = document.getElementById(`f${f}-edit`);
    if (v) v.style.display = 'inline-block';
    if (e) e.style.display = 'none';
  });
  const actions = document.getElementById('editActions');
  const btn = document.getElementById('editBtn');
  if (actions) actions.style.display = 'none';
  if (btn) btn.style.display = 'inline-block';
}

async function saveProfile() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  const phone = document.getElementById('fPhone-input')?.value;
  const blood = document.getElementById('fBlood-input')?.value;

  try {
    if (phone) {
      await fetch('/api/v1/users/me/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone_number: phone }),
      });
    }

    if (blood) {
      await fetch('/api/v1/profiles/patients/me/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blood_group: blood }),
      });
    }
  } catch (err) {
    console.error('Error saving profile:', err);
  }

  cancelEdit();
  fetchLiveProfile();
}

document.addEventListener('DOMContentLoaded', fetchLiveProfile);
fetchLiveProfile();

