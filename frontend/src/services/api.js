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
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile.");
  }

  return await response.json();
}

/* Medications API */
export async function fetchMedications() {
  const response = await fetch(`${API_BASE_URL}/medications/`);
  if (!response.ok) throw new Error("Failed to load medications.");
  const data = await response.json();
  return data.map((med) => ({
    id: med.id,
    name: med.name,
    dosage: med.dosage,
    stock: med.stock,
    totalStock: med.total_stock,
    frequency: med.frequency,
    diseaseCategory: med.disease_category,
    timesOfDay: med.times_of_day || [],
    stockDays: med.stock_days,
    refillThreshold: med.refill_threshold,
    activeIngredient: med.active_ingredient,
    manufacturer: med.manufacturer,
    fdaNdc: med.fda_ndc,
  }));
}

export async function addMedication(medData) {
  const payload = {
    name: medData.name,
    dosage: medData.dosage || "500 mg",
    stock: Number(medData.stock) || 30,
    total_stock: Number(medData.totalStock) || 60,
    frequency: medData.frequency || "1 time daily",
    disease_category: medData.diseaseCategory || "General",
    times_of_day: medData.timesOfDay || ["Morning"],
    refill_threshold: Number(medData.refillThreshold) || 10,
    active_ingredient: medData.activeIngredient || "",
    manufacturer: medData.manufacturer || "",
    fda_ndc: medData.fdaNdc || "",
  };

  const response = await fetch(`${API_BASE_URL}/medications/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Failed to save medication.");
  const med = await response.json();
  return {
    id: med.id,
    name: med.name,
    dosage: med.dosage,
    stock: med.stock,
    totalStock: med.total_stock,
    frequency: med.frequency,
    diseaseCategory: med.disease_category,
    timesOfDay: med.times_of_day || [],
    stockDays: med.stock_days,
    refillThreshold: med.refill_threshold,
    activeIngredient: med.active_ingredient,
    manufacturer: med.manufacturer,
    fdaNdc: med.fda_ndc,
  };
}

export async function takeDoseApi(medId) {
  const response = await fetch(
    `${API_BASE_URL}/medications/${medId}/take-dose/`,
    {
      method: "POST",
    },
  );
  if (!response.ok) throw new Error("Failed to record dose intake.");
  const med = await response.json();
  return {
    id: med.id,
    name: med.name,
    dosage: med.dosage,
    stock: med.stock,
    totalStock: med.total_stock,
    frequency: med.frequency,
    diseaseCategory: med.disease_category,
    timesOfDay: med.times_of_day || [],
    stockDays: med.stock_days,
    refillThreshold: med.refill_threshold,
  };
}

export async function searchFdaDrugs(query) {
  if (!query) return [];
  const response = await fetch(
    `${API_BASE_URL}/medications/fda-search/?q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) return [];
  const data = await response.json();
  return data.results || [];
}

/* Reminders API */
export async function fetchReminders() {
  const response = await fetch(`${API_BASE_URL}/reminders/`);
  if (!response.ok) throw new Error("Failed to load reminders.");
  const data = await response.json();
  return data.map((r) => ({
    id: r.id,
    medicationId: r.medication,
    name: r.name,
    time: r.time,
    period: r.period,
    status: r.status,
    disease: r.disease,
  }));
}

export async function updateReminderStatusApi(reminderId, status) {
  const response = await fetch(
    `${API_BASE_URL}/reminders/${reminderId}/status/`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  if (!response.ok) throw new Error("Failed to update reminder status.");
  const r = await response.json();
  return {
    id: r.id,
    medicationId: r.medication,
    name: r.name,
    time: r.time,
    period: r.period,
    status: r.status,
    disease: r.disease,
  };
}

/* Analytics API */
export async function fetchAnalyticsOverview() {
  const response = await fetch(`${API_BASE_URL}/analytics/overview/`);
  if (!response.ok) throw new Error("Failed to load analytics.");
  return await response.json();
}
