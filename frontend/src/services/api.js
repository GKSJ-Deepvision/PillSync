const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

function getAuthHeaders() {
  const token = localStorage.getItem("pillsync_token");
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export async function loginUser({ email, password, role }) {
  const payload = { email, password };
  if (role) payload.role = role;
  const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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

/* ── User listing (for dropdowns) ── */
export async function fetchAllUsers(roleFilter = "") {
  const url = roleFilter
    ? `${API_BASE_URL}/accounts/users/?role=${roleFilter}`
    : `${API_BASE_URL}/accounts/users/`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error("Failed to load users.");
  return await response.json();
}

/* ── Caregiver–Patient Assignment API ── */
export async function fetchAssignments({ caregiverId, patientId } = {}) {
  const params = new URLSearchParams();
  if (caregiverId) params.set("caregiver_id", caregiverId);
  if (patientId) params.set("patient_id", patientId);
  const url = `${API_BASE_URL}/accounts/assignments/${params.toString() ? "?" + params.toString() : ""}`;
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error("Failed to load assignments.");
  return await response.json();
}

export async function createAssignment({ caregiverId, patientId, note = "" }) {
  const response = await fetch(`${API_BASE_URL}/accounts/assignments/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ caregiver_id: caregiverId, patient_id: patientId, note }),
  });
  const data = await response.json();
  if (!response.ok && response.status !== 200) {
    throw new Error(data.detail || "Failed to create assignment.");
  }
  return data;
}

export async function deleteAssignment(assignmentId) {
  const response = await fetch(`${API_BASE_URL}/accounts/assignments/${assignmentId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to remove assignment.");
  return true;
}

export async function fetchCaregiverPatients(caregiverId) {
  const response = await fetch(
    `${API_BASE_URL}/accounts/caregivers/${caregiverId}/patients/`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to load caregiver's patients.");
  return await response.json();
}

export async function fetchPatientCaregivers(patientId) {
  const response = await fetch(
    `${API_BASE_URL}/accounts/patients/${patientId}/caregivers/`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to load patient's caregivers.");
  return await response.json();
}

/* Medications API */
function mapMed(med) {
  return {
    id: med.id,
    name: med.name,
    dosage: med.dosage,
    stock: med.stock,
    totalStock: med.total_stock,
    frequency: med.frequency,
    diseaseCategory: med.disease_category,
    timesOfDay: med.times_of_day || [],
    foodTiming: med.food_timing || "after_food",
    startDate: med.start_date || "",
    endDate: med.end_date || "",
    timingDetails: med.timing_details || {},
    stockDays: med.stock_days,
    refillThreshold: med.refill_threshold,
    activeIngredient: med.active_ingredient,
    manufacturer: med.manufacturer,
    fdaNdc: med.fda_ndc,
    // Ownership fields
    patientId: med.patient_id ?? null,
    patientName: med.patient_name ?? null,
    caregiverId: med.caregiver_id ?? null,
    caregiverName: med.caregiver_name ?? null,
    // Legacy
    assignedPatientId: med.assigned_patient_id ?? null,
    assignedPatientName: med.assigned_patient_name ?? null,
  };
}

export async function fetchMedications() {
  const response = await fetch(`${API_BASE_URL}/medications/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load medications.");
  const data = await response.json();
  return data.map(mapMed);
}

/**
 * Fetch medications for a specific patient (used by caregivers in patient detail view).
 */
export async function fetchPatientMedications(patientId) {
  // The backend filters by patient FK; we also request only this patient's meds
  const response = await fetch(
    `${API_BASE_URL}/medications/?patient_id=${patientId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to load patient medications.");
  const data = await response.json();
  // Filter client-side as an extra safety layer
  return data.map(mapMed).filter(
    (m) => String(m.patientId) === String(patientId)
  );
}

export async function addMedication(medData) {
  let resolvedPatientId = medData.patientId ?? null;
  if (!resolvedPatientId && medData.assignedPatientId) {
    const parsed = parseInt(medData.assignedPatientId, 10);
    if (!isNaN(parsed)) resolvedPatientId = parsed;
  }

  const payload = {
    name: medData.name,
    dosage: medData.dosage || "500 mg",
    stock: Number(medData.stock) || 30,
    total_stock: Number(medData.totalStock) || 60,
    frequency: medData.frequency || "1 time daily",
    disease_category: medData.diseaseCategory || "General",
    times_of_day: medData.timesOfDay || ["Morning"],
    food_timing: medData.foodTiming || "after_food",
    start_date: medData.startDate || new Date().toISOString().split("T")[0],
    end_date: medData.endDate || null,
    timing_details: medData.timingDetails || {},
    refill_threshold: Number(medData.refillThreshold) || 10,
    active_ingredient: medData.activeIngredient || "",
    manufacturer: medData.manufacturer || "",
    fda_ndc: medData.fdaNdc || "",
    // Ownership
    patient_id: resolvedPatientId,
    caregiver_id: medData.caregiverId ?? null,
    // Legacy
    assigned_patient_id: medData.assignedPatientId
      ? String(medData.assignedPatientId)
      : null,
    assigned_patient_name: medData.assignedPatientName || null,
  };

  const response = await fetch(`${API_BASE_URL}/medications/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Failed to save medication.");
  const med = await response.json();
  return mapMed(med);
}

export async function takeDoseApi(medId) {
  const response = await fetch(
    `${API_BASE_URL}/medications/${medId}/take-dose/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  if (!response.ok) throw new Error("Failed to record dose intake.");
  const med = await response.json();
  return mapMed(med);
}

export async function deleteMedicationApi(medId) {
  const response = await fetch(`${API_BASE_URL}/medications/${medId}/`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete medication.");
  return true;
}

export async function searchFdaDrugs(query) {
  if (!query) return [];
  const response = await fetch(
    `${API_BASE_URL}/medications/fda-search/?q=${encodeURIComponent(query)}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) return [];
  const data = await response.json();
  return data.results || [];
}

/* Reminders API */
export async function fetchReminders() {
  const response = await fetch(`${API_BASE_URL}/reminders/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load reminders.");
  const data = await response.json();
  return data.map((r) => ({
    id: r.id,
    medicationId: r.medication,
    name: r.name,
    dosage: r.dosage || "1 Dose",
    time: r.time,
    period: r.period,
    foodTiming: r.food_timing || "after_food",
    status: r.status,
    disease: r.disease,
  }));
}

export async function updateReminderStatusApi(reminderId, status) {
  const response = await fetch(
    `${API_BASE_URL}/reminders/${reminderId}/status/`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    },
  );
  if (!response.ok) throw new Error("Failed to update reminder status.");
  const r = await response.json();
  return {
    id: r.id,
    medicationId: r.medication,
    name: r.name,
    dosage: r.dosage || "1 Dose",
    time: r.time,
    period: r.period,
    foodTiming: r.food_timing || "after_food",
    status: r.status,
    disease: r.disease,
  };
}

/* Analytics API */
export async function fetchAnalyticsOverview() {
  const response = await fetch(`${API_BASE_URL}/analytics/overview/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load analytics.");
  return await response.json();
}

/* OCR Medicine Recognition API */
export async function scanPrescriptionOcrApi(formDataOrText) {
  let options = {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const headers = getAuthHeaders();

  if (typeof formDataOrText === "string") {
    options = {
      method: "POST",
      headers: { ...headers },
      body: JSON.stringify({ raw_text: formDataOrText }),
      signal: controller.signal,
    };
  } else if (formDataOrText instanceof FormData) {
    // Don't set Content-Type for FormData — browser sets it with boundary
    const { "Content-Type": _ct, ...headersWithoutCt } = headers;
    options = {
      method: "POST",
      headers: headersWithoutCt,
      body: formDataOrText,
      signal: controller.signal,
    };
  } else {
    options = {
      method: "POST",
      headers: { ...headers },
      body: JSON.stringify(formDataOrText),
      signal: controller.signal,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ocr/scan/`, options);
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("OCR Scanning failed.");
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export async function confirmOcrMedicationApi(confirmData) {
  const response = await fetch(`${API_BASE_URL}/ocr/confirm/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(confirmData),
  });
  if (!response.ok) throw new Error("Failed to confirm OCR medication.");
  return await response.json();
}

/* Refill Prediction API */
export async function fetchRefillPredictionsApi(patientId = null) {
  const url =
    patientId && patientId !== "All"
      ? `${API_BASE_URL}/refills/predictions/?patient_id=${encodeURIComponent(patientId)}`
      : `${API_BASE_URL}/refills/predictions/`;
  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch refill predictions.");
  return await response.json();
}

export async function updateStockApi(medicationId, newStock) {
  const response = await fetch(`${API_BASE_URL}/refills/update-stock/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ medication_id: medicationId, new_stock: newStock }),
  });
  if (!response.ok) throw new Error("Failed to update stock.");
  return await response.json();
}

export async function requestRefillApi(
  medicationId,
  quantity = 60,
  notes = "",
) {
  const response = await fetch(`${API_BASE_URL}/refills/request-refill/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ medication_id: medicationId, quantity, notes }),
  });
  if (!response.ok) throw new Error("Failed to place refill order request.");
  return await response.json();
}

/* Adherence Tracking API */
export async function fetchAdherenceMetricsApi() {
  const response = await fetch(`${API_BASE_URL}/adherence/metrics/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch adherence metrics.");
  return await response.json();
}

export async function logAdherenceDoseApi({
  medicationId,
  reminderId,
  status,
  period,
  scheduledTime,
  notes,
}) {
  const response = await fetch(`${API_BASE_URL}/adherence/log/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      medication_id: medicationId,
      reminder_id: reminderId,
      status,
      period,
      scheduled_time: scheduledTime,
      notes,
    }),
  });
  if (!response.ok) throw new Error("Failed to log dose adherence.");
  return await response.json();
}

/* Notifications API */
export async function fetchNotificationsApi() {
  const response = await fetch(`${API_BASE_URL}/notifications/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch notifications.");
  return await response.json();
}

export async function markNotificationReadApi(notificationId) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${notificationId}/read/`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  );
  if (!response.ok) throw new Error("Failed to mark notification as read.");
  return await response.json();
}
