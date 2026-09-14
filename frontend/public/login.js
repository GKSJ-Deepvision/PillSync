/* eslint-disable no-unused-vars, no-console */
let selectedRole = 'patient'; // default
let selectedSignupRole = 'patient';

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
  caregiverField.style.display = role === 'caregiver' ? 'block' : 'none';
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
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      errorMsg.textContent = errorData.detail || 'Login failed.';
      return;
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);

    // The role should ideally come from the backend, but we'll use the selected one for redirect for now.
    if (selectedRole === 'caregiver') {
      window.location.href = 'caregiver-dashboard.html';
    } else if (selectedRole === 'admin') {
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
  if (selectedSignupRole === 'caregiver') {
    const patientEmail = document.getElementById('caregiverPatientEmail').value;
    if (patientEmail === '') {
      errorMsg.textContent = "Please enter the patient's email to link.";
      return;
    }
    // We would link patientEmail here based on further API design, for now we just proceed with role
  }
  errorMsg.textContent = '';

  try {
    const response = await fetch('http://localhost:8000/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: name,
        email: email,
        password: password,
        role: selectedSignupRole,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      errorMsg.textContent = errorData.detail || 'Registration failed.';
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
