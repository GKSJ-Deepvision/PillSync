/* eslint-disable no-unused-vars, no-console */

/**
 * Common user profile loader for all static HTML pages in PillSync.
 * Automatically updates sidebar profile info, topbar greeting (Good morning/afternoon/evening),
 * and profile modals based on the logged-in JWT user session.
 */
function getGreetingPrefix() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else if (hour >= 17 && hour < 22) {
    return "Good evening";
  } else {
    return "Good night";
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
    const response = await fetch('http://localhost:8000/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
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
    const roleCapitalized = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Patient';
    const firstName = user.full_name ? user.full_name.split(' ')[0] : 'User';
    const timeGreeting = getGreetingPrefix();

    // 1. Sidebar Profile Updates
    const sidebarAvatar = document.getElementById('sidebarAvatar') || document.querySelector('.profile-avatar');
    if (sidebarAvatar) sidebarAvatar.textContent = initial;

    const sidebarName = document.getElementById('sidebarName') || document.querySelector('.profile-name');
    if (sidebarName) sidebarName.textContent = user.full_name;

    const sidebarEmail = document.getElementById('sidebarEmail') || document.querySelector('.profile-email');
    if (sidebarEmail) sidebarEmail.textContent = user.email;

    const sidebarRole = document.getElementById('sidebarRole') || document.querySelector('.role-badge');
    if (sidebarRole) sidebarRole.textContent = roleCapitalized;

    // 2. Topbar Greeting Updates
    const topGreeting = document.getElementById('topGreeting') || document.querySelector('.greeting');
    if (topGreeting) {
      // Check if page header is a dashboard greeting or static page title
      if (topGreeting.textContent.includes('Good') || topGreeting.id === 'topGreeting') {
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
