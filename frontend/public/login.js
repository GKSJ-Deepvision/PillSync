/* eslint-disable no-unused-vars, no-console */
let selectedRole = 'PATIENT'; // default
let selectedSignupRole = 'PATIENT';

function selectRole(role, btn) {
  selectedRole = role;
  document
    .querySelectorAll('#loginView .role-tab')
    .forEach((tab) => tab.classList.remove('active'));
  btn.classList.add('active');
}

function selectSignupRole(role, btn) {
  selectedSignupRole = role;
  document
    .querySelectorAll('#signupView .role-tab')
    .forEach((tab) => tab.classList.remove('active'));
  btn.classList.add('active');

  const caregiverField = document.getElementById('caregiverPatientEmail');
  caregiverField.style.display = role === 'CAREGIVER' ? 'block' : 'none';
}

function showView(viewId) {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('signupView').style.display = 'none';
  document.getElementById('forgotView').style.display = 'none';
  document.getElementById(viewId).style.display = 'block';
}

async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');

  if (email === '' || password === '') {
    errorMsg.textContent = 'Please fill in both fields.';
    return;
  }

  errorMsg.textContent = '';
  console.log('Attempting login with:', email, 'as role:', selectedRole);

  try {
    const response = await fetch('/api/v1/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      errorMsg.textContent = errorData.detail || errorData?.error?.message || 'Login failed.';
      return;
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access);
    if (data.refresh) localStorage.setItem('refresh_token', data.refresh);

    // Fetch the real user role from the backend, then redirect accordingly.
    try {
      const meRes = await fetch('/api/v1/users/me/', {
        headers: { Authorization: `Bearer ${data.access}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        const role = (me.role || '').toUpperCase();
        if (role === 'CAREGIVER') {
          window.location.href = 'caregiver-dashboard.html';
        } else if (role === 'ADMIN') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
        return;
      }
    } catch (_) {
      /* fall through to UI-based redirect */
    }

    // Fallback: use the UI-selected role
    if (selectedRole === 'CAREGIVER') {
      window.location.href = 'caregiver-dashboard.html';
    } else if (selectedRole === 'ADMIN') {
      window.location.href = 'admin-dashboard.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    console.error('Error during login:', error);
    errorMsg.textContent = 'An error occurred during login.';
  }
}

async function handleSignup() {
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupConfirm').value;
  const errorMsg = document.getElementById('signupError');

  if (name === '' || email === '' || password === '') {
    errorMsg.textContent = 'Please fill in all fields.';
    return;
  }
  if (password !== confirm) {
    errorMsg.textContent = 'Passwords do not match.';
    return;
  }
  if (selectedSignupRole === 'CAREGIVER') {
    const patientEmail = document.getElementById('caregiverPatientEmail').value;
    if (patientEmail === '') {
      errorMsg.textContent = "Please enter the patient's email to link.";
      return;
    }
    // We would link patientEmail here based on further API design, for now we just proceed with role
  }
  errorMsg.textContent = '';

  try {
    const response = await fetch('/api/v1/auth/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: name,
        email: email,
        password: password,
        password_confirm: confirm,
        role: selectedSignupRole,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Backend returns { error: { message, details } } for validation errors
      const details = errorData?.error?.details;
      if (details) {
        const firstError = Object.values(details)[0];
        errorMsg.textContent = Array.isArray(firstError) ? firstError[0] : firstError;
      } else {
        errorMsg.textContent =
          errorData.detail || errorData?.error?.message || 'Registration failed.';
      }
      return;
    }

    alert('Registration successful! You can now log in.');
    showView('loginView');
  } catch (error) {
    console.error('Error during registration:', error);
    errorMsg.textContent = 'An error occurred during registration.';
  }
}

function handleForgotPassword() {
  const email = document.getElementById('forgotEmail').value;
  const errorMsg = document.getElementById('forgotError');

  if (email === '') {
    errorMsg.textContent = 'Please enter your email.';
    return;
  }
  errorMsg.textContent = '';
  alert('If this email exists, a reset link has been sent.');
}
