/**
 * Common user profile loader for all static HTML pages in PillSync.
 * Automatically updates sidebar profile info, topbar greeting (Good morning/afternoon/evening),
 * and profile modals based on the logged-in JWT user session.
 */
function getGreetingPrefix() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    return 'Good evening';
  } else {
    return 'Good night';
  }
}

async function loadUserProfileHeader() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    // If not logged in and on a protected page, redirect to login
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = 'login.html';
    }
    return null;
  }

  try {
    const response = await fetch('/api/v1/users/me/', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = 'login.html';
      }
      return null;
    }

    const user = await response.json();
    const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
    // Use role_display from backend (e.g. "Patient") or format the uppercase role value
    const roleCapitalized =
      user.role_display ||
      (user.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
        : 'Patient');
    const firstName = user.full_name ? user.full_name.split(' ')[0] : 'User';
    const timeGreeting = getGreetingPrefix();

    // 1. Sidebar Profile Updates (both full profile card and mini card)
    const sidebarAvatar =
      document.getElementById('sidebarAvatar') ||
      document.querySelector('.profile-avatar') ||
      document.querySelector('.mini-avatar:not(.mini-avatar-alt)');
    if (sidebarAvatar) sidebarAvatar.textContent = initial;

    const sidebarName =
      document.getElementById('sidebarName') ||
      document.querySelector('.profile-name') ||
      document.querySelector('.mini-name');
    if (sidebarName) sidebarName.textContent = user.full_name;

    const sidebarEmail =
      document.getElementById('sidebarEmail') || document.querySelector('.profile-email');
    if (sidebarEmail) sidebarEmail.textContent = user.email;

    const sidebarRole =
      document.getElementById('sidebarRole') || document.querySelector('.role-badge');
    if (sidebarRole) sidebarRole.textContent = roleCapitalized;

    const miniSub = document.querySelector('.mini-sub');
    if (miniSub) miniSub.textContent = `${roleCapitalized} · View profile`;

    // 2. Topbar Greeting Updates
    const topGreeting =
      document.getElementById('topGreeting') || document.querySelector('.greeting');
    if (topGreeting) {
      if (
        topGreeting.textContent.includes('Good') ||
        topGreeting.id === 'topGreeting' ||
        topGreeting.textContent.includes('Isha')
      ) {
        topGreeting.textContent = `${timeGreeting}, ${firstName}`;
      }
    }

    // 3. Profile Modal Updates (if modal exists on page)
    const modalAvatar = document.getElementById('modalAvatar');
    if (modalAvatar) modalAvatar.textContent = initial;

    const modalName = document.getElementById('modalName');
    if (modalName) modalName.textContent = user.full_name;

    const modalEmail = document.getElementById('modalEmail');
    if (modalEmail) modalEmail.textContent = user.email;

    const modalRole = document.getElementById('modalRole');
    if (modalRole) modalRole.textContent = roleCapitalized;

    const modalPhone = document.getElementById('modalPhone');
    if (modalPhone) modalPhone.textContent = user.phone_number || '+91 98765 43210';

    // Set dynamic user name for chat
    window.CHAT_ME = user.full_name;

    // Fetch patient profile details for modal & caregiver
    try {
      const pRes = await fetch('/api/v1/profiles/patients/me/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (pRes.ok) {
        const p = await pRes.json();
        const el = (id) => document.getElementById(id);
        if (p.blood_group && el('modalBlood')) el('modalBlood').textContent = p.blood_group;
        if (p.date_of_birth && el('modalAge')) {
          const age = new Date().getFullYear() - new Date(p.date_of_birth).getFullYear();
          el('modalAge').textContent = age;
        }
        if (p.patient_conditions && p.patient_conditions.length > 0 && el('modalConditions')) {
          el('modalConditions').innerHTML = p.patient_conditions
            .map((c) => `<span class="condition-tag">${c.condition_name || c.condition}</span>`)
            .join(' ');
        }
        if (p.emergency_contacts && p.emergency_contacts.length > 0) {
          const ec = p.emergency_contacts[0];
          if (el('modalEmName')) el('modalEmName').textContent = ec.name;
          if (el('modalEmRel')) el('modalEmRel').textContent = ec.relationship_display || ec.relationship;
          if (el('modalEmPhone')) el('modalEmPhone').textContent = ec.phone_number;
          if (el('caregiverName')) el('caregiverName').textContent = ec.name;
        }
      }
    } catch (_pErr) {
      // Ignore if no patient profile
    }

    return user;
  } catch (err) {
    console.error('Error fetching current user session:', err);
    return null;
  }
}

// Load user info immediately and on events
loadUserProfileHeader();
document.addEventListener('DOMContentLoaded', loadUserProfileHeader);
window.addEventListener('load', loadUserProfileHeader);
