const API_BASE_URL = "http://127.0.0.1:8000/api";

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg =
      data.detail ||
      (data.non_field_errors && data.non_field_errors[0]) ||
      "Login failed. Please check your credentials.";
    throw new Error(errorMsg);
  }

  return data;
}

export async function registerUser({ email, password, name, role }) {
  const response = await fetch(`${API_BASE_URL}/accounts/register/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, name, role }),
  });

  const data = await response.json();
  if (!response.ok) {
    let errorMsg = "Registration failed.";
    if (data.email && data.email[0]) {
      errorMsg = data.email[0];
    } else if (data.detail) {
      errorMsg = data.detail;
    }
    throw new Error(errorMsg);
  }

  return data;
}

export async function fetchUserProfile(token) {
  const response = await fetch(`${API_BASE_URL}/accounts/me/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile.");
  }

  return await response.json();
}
