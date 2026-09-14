let selectedRole = "patient"; // default
let selectedSignupRole = "patient";

function selectRole(role, btn) {
  selectedRole = role;
  document.querySelectorAll("#loginView .role-tab").forEach(tab => tab.classList.remove("active"));
  btn.classList.add("active");
}

function selectSignupRole(role, btn) {
  selectedSignupRole = role;
  document.querySelectorAll("#signupView .role-tab").forEach(tab => tab.classList.remove("active"));
  btn.classList.add("active");

  const caregiverField = document.getElementById("caregiverPatientEmail");
  caregiverField.style.display = (role === "caregiver") ? "block" : "none";
}

function showView(viewId) {
  document.getElementById("loginView").style.display = "none";
  document.getElementById("signupView").style.display = "none";
  document.getElementById("forgotView").style.display = "none";
  document.getElementById(viewId).style.display = "block";
}

function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMsg = document.getElementById("errorMsg");

  if (email === "" || password === "") {
    errorMsg.textContent = "Please fill in both fields.";
    return;
  }

  errorMsg.textContent = "";
  console.log("Attempting login with:", email, password, "as role:", selectedRole);

  if (selectedRole === "caregiver") {
    window.location.href = "caregiver-dashboard.html";
  } else if (selectedRole === "admin") {
    window.location.href = "admin-dashboard.html";
  } else {
    window.location.href = "dashboard.html";
  }
}

function handleSignup() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("signupConfirm").value;
  const errorMsg = document.getElementById("signupError");

  if (name === "" || email === "" || password === "") {
    errorMsg.textContent = "Please fill in all fields.";
    return;
  }
  if (password !== confirm) {
    errorMsg.textContent = "Passwords do not match.";
    return;
  }
  if (selectedSignupRole === "caregiver") {
    const patientEmail = document.getElementById("caregiverPatientEmail").value;
    if (patientEmail === "") {
      errorMsg.textContent = "Please enter the patient's email to link.";
      return;
    }
  }
  errorMsg.textContent = "";
  console.log("Signing up:", name, email, password, "as role:", selectedSignupRole);
}

function handleForgotPassword() {
  const email = document.getElementById("forgotEmail").value;
  const errorMsg = document.getElementById("forgotError");

  if (email === "") {
    errorMsg.textContent = "Please enter your email.";
    return;
  }
  errorMsg.textContent = "";
  alert("If this email exists, a reset link has been sent.");
}